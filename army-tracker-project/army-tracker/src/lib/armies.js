// Multi-army persistence on top of the window.storage key/value API
// (see src/storage.js). Schema:
//   armies:index      -> [{ id, name, faction, icon, points, unitCount }, ...]  (cheap to load for a list screen)
//   army:<id>         -> { id, name, faction, units: [...] }  (units never carry `photo` on disk, see saveArmy)
//   photo:<instId>    -> data URL, stored separately since it's large
//   active-army       -> the id of the army the Units/Game Tracker tabs currently show
//
// The index carries a denormalized points/unitCount snapshot (kept in sync
// by saveArmy) so the army list screen never has to load every army's full
// unit list (and every unit's photo) just to show totals. `faction` is fixed
// at creation (a GW army list doesn't change factions) so it isn't re-synced.
//
// loadArmyIndex() transparently migrates the old single-army schema
// (a lone "army:main" key) into this shape the first time it's called;
// migrated armies get faction: null (unknown) and callers handle that
// gracefully (neutral icon, unfiltered unit search).

import { uid } from "./id.js";
import { armyPoints } from "./catalog.js";

const INDEX_KEY = "armies:index";
const ACTIVE_KEY = "active-army";
const armyKey = (id) => `army:${id}`;
const photoKey = (instId) => `photo:${instId}`;

async function readJson(key, fallback) {
  try {
    const res = await window.storage.get(key);
    return res && res.value ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await window.storage.set(key, JSON.stringify(value));
}

export async function loadArmyIndex() {
  const existing = await readJson(INDEX_KEY, null);
  if (existing) return existing;

  const legacy = await readJson("army:main", null);
  if (legacy) {
    const index = [{ id: legacy.id, name: legacy.name, faction: legacy.faction ?? null, points: armyPoints(legacy), unitCount: legacy.units.length }];
    await writeJson(armyKey(legacy.id), legacy);
    await writeJson(INDEX_KEY, index);
    try { await window.storage.delete("army:main"); } catch { /* best effort */ }
    return index;
  }

  const index = [];
  await writeJson(INDEX_KEY, index);
  return index;
}

export async function createArmy(name, faction) {
  const army = { id: uid(), name, faction, units: [] };
  const index = await loadArmyIndex();
  index.push({ id: army.id, name: army.name, faction, points: 0, unitCount: 0 });
  await writeJson(INDEX_KEY, index);
  await writeJson(armyKey(army.id), army);
  return army;
}

export async function deleteArmy(id) {
  const army = await loadArmy(id);
  const index = (await loadArmyIndex()).filter((a) => a.id !== id);
  await writeJson(INDEX_KEY, index);
  try { await window.storage.delete(armyKey(id)); } catch { /* best effort */ }
  if ((await getActiveArmyId()) === id) await setActiveArmyId(null);
  await Promise.all((army?.units || []).map((u) => deleteUnitPhoto(u.instId)));
}

export async function loadArmy(id) {
  const army = await readJson(armyKey(id), null);
  if (!army) return null;
  await Promise.all(
    army.units.map(async (u) => {
      try {
        const p = await window.storage.get(photoKey(u.instId));
        if (p && p.value) u.photo = p.value;
      } catch { /* no photo yet */ }
    })
  );
  return army;
}

export async function saveArmy(army) {
  const slim = { ...army, units: army.units.map(({ photo, ...rest }) => rest) };
  await writeJson(armyKey(army.id), slim);

  const index = await loadArmyIndex();
  const entry = index.find((a) => a.id === army.id);
  const points = armyPoints(army);
  if (entry && (entry.name !== army.name || entry.points !== points || entry.unitCount !== army.units.length || entry.icon !== army.icon)) {
    entry.name = army.name;
    entry.points = points;
    entry.unitCount = army.units.length;
    entry.icon = army.icon;
    await writeJson(INDEX_KEY, index);
  }
}

export async function getActiveArmyId() {
  try {
    const res = await window.storage.get(ACTIVE_KEY);
    return res && res.value ? res.value : null;
  } catch {
    return null;
  }
}

export async function setActiveArmyId(id) {
  try {
    if (id) await window.storage.set(ACTIVE_KEY, id);
    else await window.storage.delete(ACTIVE_KEY);
  } catch { /* best effort */ }
}

export async function setUnitPhoto(instId, dataUrl) {
  await window.storage.set(photoKey(instId), dataUrl);
}

export async function deleteUnitPhoto(instId) {
  try { await window.storage.delete(photoKey(instId)); } catch { /* best effort */ }
}
