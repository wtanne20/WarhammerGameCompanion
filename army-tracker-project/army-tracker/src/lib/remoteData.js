// Keeps the native (Capacitor) app's rules data current without needing a
// new APK build every time Wahapedia/40kdc-data changes. The catalog/
// detachments/stratagems/dispositions JSON bundled into the APK is frozen
// at build time, but scripts/sync-data.mjs already keeps the GitHub Pages
// deploy fresh (weekly, see .github/workflows/sync-data.yml) — so on native
// platforms this fetches that same live data on each app open and, if it's
// newer than what's currently loaded, swaps it in and caches it so the
// next launch starts from the fresher copy even offline. The web/PWA build
// doesn't need this: it's already served fresh on every visit.
//
// The cache lives in app-private files (@capacitor/filesystem), not
// window.storage: on native that's the WebView's localStorage, capped at
// ~5MB, and catalog.json alone is over that — writes failed silently, which
// left an older cached copy in place that then shadowed even a newer APK's
// bundled data. A cached copy is only used when it's newer than what this
// APK bundles, so installing a new build always starts from at least its
// own data.

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { withBase } from "./paths.js";

const REMOTE_BASE = "https://wtanne20.github.io/WarhammerGameCompanion";
const CACHE_DIR = "remote-data";
const LEGACY_CACHE_PREFIX = "remote-data:";

const FILES = {
  catalog: "catalog.json",
  detachments: "detachments.json",
  stratagems: "stratagems.json",
  dispositions: "dispositions.json",
};

async function readCache(key) {
  try {
    const res = await Filesystem.readFile({ path: `${CACHE_DIR}/${key}.json`, directory: Directory.Data, encoding: "utf8" });
    return JSON.parse(res.data);
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  await Filesystem.writeFile({
    path: `${CACHE_DIR}/${key}.json`, data: JSON.stringify(value),
    directory: Directory.Data, encoding: "utf8", recursive: true,
  });
}

// Earlier builds cached into window.storage; drop those copies so they stop
// eating the localStorage quota that army photos share.
let legacyCleared = false;
async function clearLegacyCache() {
  if (legacyCleared) return;
  legacyCleared = true;
  try {
    for (const key of ["meta", ...Object.keys(FILES)]) await window.storage.delete(LEGACY_CACHE_PREFIX + key);
  } catch { /* best effort */ }
}

// Whether the cached remote pull is newer than this APK's bundled data
// (compared on meta.json's ISO `syncedAt`). Memoized per cache generation —
// reset whenever refreshDataFromRemote writes a new one.
let cacheUsable = null;
function isCacheUsable() {
  if (!cacheUsable) {
    cacheUsable = (async () => {
      await clearLegacyCache();
      const cachedMeta = await readCache("meta");
      if (!cachedMeta?.syncedAt) return false;
      try {
        const res = await fetch(withBase("/data/meta.json"));
        const bundledMeta = res.ok ? await res.json() : null;
        return !bundledMeta?.syncedAt || cachedMeta.syncedAt > bundledMeta.syncedAt;
      } catch {
        return true;
      }
    })();
  }
  return cacheUsable;
}

// Exported so the individual fetchCatalog()/fetchDetachments()/
// fetchStratagems()/fetchDispositions() functions (in catalog.js/
// detachments.js/stratagems.js/dispositions.js — some of which, like
// dispositions, are fetched lazily by their own component rather than
// through App.jsx's boot sequence) can each prefer a previously-cached
// remote pull over the APK-bundled copy, without needing to know anything
// about Capacitor. Always null on web, which is served fresh anyway.
export async function getCachedRemote(key) {
  if (!Capacitor.isNativePlatform()) return null;
  if (!(await isCacheUsable())) return null;
  return readCache(key);
}

async function fetchRemoteJson(fileName) {
  const res = await fetch(`${REMOTE_BASE}/data/${fileName}`);
  if (!res.ok) throw new Error(`Remote fetch failed for ${fileName}`);
  return res.json();
}

// Checks whether the live GitHub Pages data is newer than `currentMeta`; if
// so, pulls it all down, caches it (so fetchCatalog()/etc. pick it up via
// getCachedRemote() from here on), and returns the fresh meta for the
// caller to feed into checkForDataUpdate()'s existing "data updated" notice.
// Returns null if unreachable (offline) or already up to date — safe to
// call on every app open without its own "should I bother" check upstream.
export async function refreshDataFromRemote(currentMeta) {
  let remoteMeta;
  try {
    remoteMeta = await fetchRemoteJson("meta.json");
  } catch {
    return null;
  }
  if (!remoteMeta?.syncedAt || remoteMeta.syncedAt === currentMeta?.syncedAt) return null;

  try {
    const entries = await Promise.all(
      Object.entries(FILES).map(async ([key, fileName]) => [key, await fetchRemoteJson(fileName)])
    );
    // Data files first, meta last: meta is what marks the cache as complete
    // and current, so a failed or interrupted write never leaves a new meta
    // pointing at old data.
    for (const [key, value] of entries) await writeCache(key, value);
    await writeCache("meta", remoteMeta);
    cacheUsable = null;
    return remoteMeta;
  } catch {
    return null;
  }
}
