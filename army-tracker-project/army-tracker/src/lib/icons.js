import { withBase } from "./paths.js";

export async function fetchIconManifest() {
  const res = await fetch(withBase("/icons/manifest.json"));
  if (!res.ok) return [];
  return res.json();
}

// Manifest paths (and army.icon values copied from them) are always stored
// root-relative (e.g. "/icons/wh40k/...") regardless of hosting — withBase()
// is applied wherever one is actually used as a fetch/img src.
export const isLibraryIcon = (icon) => typeof icon === "string" && icon.startsWith("/icons/");
