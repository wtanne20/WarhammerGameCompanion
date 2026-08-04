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
