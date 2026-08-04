# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

This repo currently contains a single app, nested at `army-tracker-project/army-tracker/`. All commands below must be run from that directory:

```
cd army-tracker-project/army-tracker
```

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — preview the production build locally

There is no test suite, linter, or type checker configured in this project.

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

### Styling

Tailwind v4 utility classes are combined with inline `style` props for the dark, poster-like "Codex" aesthetic (near-black background, faction accent colors via `FACTION_ACCENT`, condensed display font for headers). Fonts (`Oswald`, `IBM Plex Sans`) are loaded via a Google Fonts `@import` injected in a `<style>` tag inside `App`, not in `index.css`.
