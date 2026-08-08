// Keeps the native (Capacitor) app's rules data current without needing a
// new APK build every time Wahapedia/40kdc-data changes. The catalog/
// detachments/stratagems/dispositions JSON bundled into the APK is frozen
// at build time, but scripts/sync-data.mjs already keeps the GitHub Pages
// deploy fresh (weekly, see .github/workflows/sync-data.yml) — so on native
// platforms this fetches that same live data on each app open and, if it's
// newer than what's currently loaded, swaps it in and caches it via
// window.storage so the next launch starts from the fresher copy even
// offline. The web/PWA build doesn't need this: it's already served fresh
// on every visit.

const REMOTE_BASE = "https://wtanne20.github.io/WarhammerGameCompanion";
const CACHE_PREFIX = "remote-data:";

const FILES = {
  catalog: "catalog.json",
  detachments: "detachments.json",
  stratagems: "stratagems.json",
  dispositions: "dispositions.json",
};

async function readCache(key) {
  try {
    const res = await window.storage.get(CACHE_PREFIX + key);
    return res && res.value ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  try {
    await window.storage.set(CACHE_PREFIX + key, JSON.stringify(value));
  } catch { /* best effort */ }
}

// Exported so the individual fetchCatalog()/fetchDetachments()/
// fetchStratagems()/fetchDispositions() functions (in catalog.js/
// detachments.js/stratagems.js/dispositions.js — some of which, like
// dispositions, are fetched lazily by their own component rather than
// through App.jsx's boot sequence) can each prefer a previously-cached
// remote pull over the APK-bundled copy, without needing to know anything
// about Capacitor. On web this is always a harmless no-op: nothing ever
// writes these keys there (see refreshDataFromRemote's native gating in
// App.jsx), so the cache lookup just returns null and callers fall through
// to their normal bundled fetch.
export async function getCachedRemote(key) {
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
    await Promise.all([
      writeCache("meta", remoteMeta),
      ...entries.map(([key, value]) => writeCache(key, value)),
    ]);
    return remoteMeta;
  } catch {
    return null;
  }
}
