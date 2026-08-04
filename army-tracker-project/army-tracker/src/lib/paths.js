// Vite's configured `base` (e.g. "/army-tracker/" for a GitHub Pages
// project site, "/" in dev/preview) — every root-absolute asset path under
// public/ (data/*.json, icons/*) needs this prefix, or it 404s once the app
// is served from a subpath instead of the domain root.
export function withBase(path) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path}`;
}
