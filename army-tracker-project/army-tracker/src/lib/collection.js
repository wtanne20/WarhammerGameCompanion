// How many of each catalog unit the user owns physically — independent of
// any army list. Used to speed up list building (see the "owned only"
// filter in AddSheet) and browsable/editable via the My Units tab.
// A missing entry means zero; entries are removed once their count hits
// zero rather than kept around at 0, so `owned.has(id)` stays a valid
// "own at least one" check anywhere that only cares about presence.

const KEY = "owned-units";

export async function loadOwned() {
  try {
    const res = await window.storage.get(KEY);
    if (!res || !res.value) return new Map();
    const parsed = JSON.parse(res.value);
    // Migrate the older format (a flat array of ids, each implicitly qty 1).
    if (parsed.length > 0 && !Array.isArray(parsed[0])) {
      return new Map(parsed.map((id) => [id, 1]));
    }
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

export async function saveOwned(owned) {
  await window.storage.set(KEY, JSON.stringify([...owned.entries()]));
}

// Per-owned-unit photo (a "library" image for a unit you own), stored by
// catalog id — separate from the per-instance photo in armies.js
// (photo:<instId>). When an owned unit is added to a list, its instance
// starts with this photo (see App.jsx addUnit), and cloning a unit carries
// the instance photo forward. Same compressed data-URL format as instance
// photos, so it shares the same localStorage budget.
const ownedPhotoKey = (catalogId) => `owned-photo:${catalogId}`;

export async function getOwnedPhoto(catalogId) {
  try {
    const res = await window.storage.get(ownedPhotoKey(catalogId));
    return res && res.value ? res.value : null;
  } catch {
    return null;
  }
}

export async function setOwnedPhoto(catalogId, dataUrl) {
  await window.storage.set(ownedPhotoKey(catalogId), dataUrl);
}

export async function deleteOwnedPhoto(catalogId) {
  try { await window.storage.delete(ownedPhotoKey(catalogId)); } catch { /* best effort */ }
}

// Photos for a set of owned units, as a Map(catalogId -> dataUrl). Missing
// photos are simply absent from the map.
export async function loadOwnedPhotos(catalogIds) {
  const out = new Map();
  await Promise.all((catalogIds || []).map(async (id) => {
    try {
      const res = await window.storage.get(ownedPhotoKey(id));
      if (res && res.value) out.set(id, res.value);
    } catch { /* no photo for this one */ }
  }));
  return out;
}
