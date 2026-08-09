// Checks whether a newer signed Android build has been published to GitHub
// Releases (see .github/workflows/release-android.yml, which tags each
// release "android-build-<n>", n being the monotonically increasing
// versionCode) and, if so, offers to download and install it.
//
// Native only — there's no "install an update" concept for the web/PWA
// build. And even natively this can only ever prompt the system installer,
// never silently replace the running app: Android requires a user tap for
// any app not distributed via the Play Store, no way around that.

import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { FileOpener } from "@capacitor-community/file-opener";

const RELEASES_URL = "https://api.github.com/repos/wtanne20/WarhammerGameCompanion/releases";
const BUILD_TAG_RE = /^android-build-(\d+)$/;

// { versionCode, downloadUrl } for the newest published release newer than
// what's installed, or null if unreachable, already current, or not
// running as the native app. Releases are returned newest-created-first, so
// the first android-build-* tag found is authoritative — if it's not newer
// than what's installed, none of the older ones will be either.
export async function checkForAppUpdate() {
  if (!Capacitor.isNativePlatform()) return null;

  const info = await CapacitorApp.getInfo();
  const installedCode = parseInt(info.build, 10);

  let releases;
  try {
    const res = await fetch(RELEASES_URL);
    if (!res.ok) return null;
    releases = await res.json();
  } catch {
    return null;
  }

  const latest = releases.find((r) => BUILD_TAG_RE.test(r.tag_name));
  if (!latest) return null;
  const versionCode = parseInt(BUILD_TAG_RE.exec(latest.tag_name)[1], 10);
  if (!(versionCode > installedCode)) return null;

  const asset = latest.assets?.find((a) => a.name.endsWith(".apk"));
  if (!asset) return null;
  return { versionCode, downloadUrl: asset.browser_download_url };
}

// Downloads the update APK and hands it to the system installer (which the
// user still has to confirm). Throws on failure — caller decides how to
// surface that.
//
// Installing an update doesn't restart the app that triggered it — Android
// replaces the APK on disk, but this process keeps running with the OLD
// code already loaded in memory (the WebView doesn't reload itself just
// because the files under it changed). Left alone, tapping back into the
// app after installing would show the same stale version until the next
// full cold start. Closing our own process right after handing off to the
// installer forces that: the installer's own "Open"/re-launch (or the user
// tapping the icon again) then starts a genuinely fresh process that loads
// the new build.
export async function downloadAndInstallUpdate(downloadUrl) {
  const { uri } = await Filesystem.getUri({ path: "army-tracker-update.apk", directory: Directory.Cache });
  await FileTransfer.downloadFile({ url: downloadUrl, path: uri });
  await FileOpener.open({ filePath: uri, contentType: "application/vnd.android.package-archive" });
  await CapacitorApp.exitApp();
}
