# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

This repo currently contains a single app, nested at `army-tracker-project/army-tracker/`. All commands below must be run from that directory:

```
cd army-tracker-project/army-tracker
```

The Android app is built with [Capacitor](https://capacitorjs.com), which wraps this same web app in a native shell. Its generated native project lives at `army-tracker-project/army-tracker/android/` (Capacitor's standard convention — inside the web project, not a sibling of it). `android-twa/` at the repo root is the **previous** Android packaging (a Bubblewrap TWA that just pointed Chrome at the GitHub Pages deploy) — it's left in place but no longer the active path, since it holds the release signing keystore (`android-twa/android.keystore`); don't touch or delete it without being asked.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — production build for GitHub Pages (outputs to `dist/`; the deploy workflow passes `--base=/WarhammerGameCompanion/` on top of this)
- `npm run cap:build` — production build for the Android app: builds with `base=/` (Capacitor serves from a fixed local origin, no GH Pages subpath) and runs `npx cap sync android` to copy the bundle into the native project. Finish the native build/install from there via Android Studio (`npx cap open android`) or `cd android && ./gradlew assembleDebug` — both require a local JDK + Android SDK.
- `npm run preview` — preview the production build locally

There is no test suite, linter, or type checker configured in this project.

### Android release pipeline

`.github/workflows/release-android.yml` builds, signs, and publishes a new Android release automatically whenever relevant app source lands on `main` (path-filtered — data-only syncs don't trigger it, see below) or on manual `workflow_dispatch`. Each release is tagged `android-build-<n>`, where `n` is `github.run_number` used directly as the Android `versionCode` (passed via `-PVERSION_CODE`/`-PVERSION_NAME` Gradle properties — see `android/app/build.gradle`'s `defaultConfig`/`signingConfigs.release`).

Signing uses a dedicated persistent keystore (`army-tracker-project/army-tracker/android/release.keystore`, **gitignored, never committed** — same handling as `android-twa/android.keystore`). Its passwords live in `android/release-signing.env.local` (also gitignored) for local release builds, and as encrypted repo secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) for CI. Losing this keystore means future releases can no longer update apps built from earlier ones — back it up.

To build a signed release locally: `cd android && source release-signing.env.local && ./gradlew assembleRelease -PRELEASE_STORE_FILE="$(pwd)/release.keystore" -PRELEASE_STORE_PASSWORD="$ANDROID_KEYSTORE_PASSWORD" -PRELEASE_KEY_ALIAS="$ANDROID_KEY_ALIAS" -PRELEASE_KEY_PASSWORD="$ANDROID_KEY_PASSWORD" -PVERSION_CODE=<n> -PVERSION_NAME="<x.y>"`.

## Architecture

Army Tracker is a mobile-first React + Vite + Tailwind v4 app for building and viewing a Warhammer 40k army roster. The entire UI lives in one file, `src/App.jsx`, which contains:

- **`CATALOG`** — a hardcoded array of unit datasheets (stats, ranged/melee weapons, abilities, keywords) shaped roughly like BSData/Munitorum Field Manual data. Values are illustrative sample data, not authoritative game values — the comment at the top of the file notes a "live version" would pull current numbers from `wh40k-11e`/the Munitorum Field Manual, but that integration doesn't exist here.
- **View components**, switched on in the top-level `App` component based on state (no router):
  - `Roster` — grid of unit tiles for the current army, with points total and army rename.
  - `Datasheet` — full-screen detail view for a single unit instance (stats, weapons, abilities, keywords, model count stepper, photo).
  - `AddSheet` — bottom-sheet modal for searching `CATALOG` and adding a unit instance to the roster.
- Units added to an army are **instances** of a `CATALOG` entry (spread-copied with a fresh `instId` from `uid()`), distinct from the catalog template itself. `unitPoints`/`armyPoints` compute point costs from `models`/`blockSize`/`pointsPerBlock`.

### Persistence (`src/storage.js`)

The app is designed to run inside Claude's artifact sandbox, where a `window.storage` key-value API (`get`/`set`/`delete`/`list`, async, string values only) is injected by the host environment. `src/storage.js` is a **dev-only shim**: if `window.storage` isn't already present (i.e. running via `npm run dev` outside the sandbox), it installs a localStorage-backed polyfill under this file, namespaced with a `wh:` prefix. `main.jsx` imports this shim before mounting `App`, so app code can always call `window.storage.*` unconditionally.

Persistence keys used by the app:
- `army:main` — the current army (JSON), saved with unit photos stripped out (photos are large data URLs and stored separately so the main record stays small).
- `photo:<instId>` — a per-unit photo, stored as a base64 data URL. Photos are downscaled/compressed client-side (`compressImage`, canvas-based, max 500px / JPEG quality 0.75) before being saved, since localStorage has a ~5MB total quota. A comment in `storage.js` flags IndexedDB as the eventual fix for larger collections.

### Army sharing (`src/lib/shareArmy.js`)

Exports/imports a single army as a standalone JSON file — a one-shot "send this list to someone else," not live sync (there's no backend). `shareArmy(armyId)` strips per-unit fields that are local in-game/device state (`photo`, `woundsRemaining`, `customEffects`, `leaderInstId` — the same fields `duplicateUnit` in `App.jsx` already resets for the same reason) and hands the rest to the native Share sheet (`@capacitor/share` + `@capacitor/filesystem`, writing to the cache dir) when running as the Capacitor app, falling back to the Web Share API or a plain file download when running in a browser (e.g. `npm run dev`). `parseArmyImport`/`importArmy` do the reverse, regenerating `instId`s via `uid()` on import to avoid colliding with the receiving device's own data. UI: the share icon on each army row and the import entry point live in `ArmyList.jsx`/`ImportArmySheet.jsx`.

### Keeping the native app current (`src/lib/remoteData.js`, `src/lib/appUpdate.js`)

Two separate on-open checks, both gated on `Capacitor.isNativePlatform()` (no-ops on the web/PWA build, which is already served fresh):

- **Rules data** (`remoteData.js`) — the catalog/detachments/stratagems/dispositions JSON bundled into the APK is frozen at build time, but `scripts/sync-data.mjs` keeps the GitHub Pages deploy current independently (weekly, `.github/workflows/sync-data.yml`). On each native app open, `App.jsx`'s boot effect compares the live deploy's `meta.json` `syncedAt` against what's loaded; if newer, it pulls the rest down, caches it via `window.storage` (so it survives to the next launch even offline), and feeds it through the existing `checkForDataUpdate`/`updateNotice` banner. The cache is read transparently by `fetchCatalog()`/`fetchDetachments()`/`fetchStratagems()`/`fetchDispositions()` themselves (via `getCachedRemote()`), so components that fetch independently of `App.jsx`'s boot sequence — e.g. `GameTracker.jsx` calling `fetchDispositions()` — pick up cached fresher data too, no wiring needed on their end.
- **App binary** (`appUpdate.js`) — checks the GitHub Releases API for a newer `android-build-*` tag than the installed `versionCode` (see the release pipeline above) and, if found, shows a banner to download and install it. This can only ever prompt the system installer, never silently self-update — Android requires a user tap for any app outside the Play Store.

### Styling

Tailwind v4 utility classes are combined with inline `style` props for the dark, poster-like "Codex" aesthetic (near-black background, faction accent colors via `FACTION_ACCENT`, condensed display font for headers). Fonts (`Oswald`, `IBM Plex Sans`) are loaded via a Google Fonts `@import` injected in a `<style>` tag inside `App`, not in `index.css`.
