// A single persistent scratchpad for the current game (command points,
// primary objective points, the 3 secretly-selected Secondary Objectives
// and their scores, freeform notes). Deliberately not scoped to an army —
// you reset it per game, same as you would flip to a fresh sheet of paper
// at the table.
//
// secondarySelections: [{ name, scored }] — up to SECONDARY_SELECT_COUNT
// (3) objectives picked before the battle (11th edition dropped 10th
// edition's draw/discard "Tactical" deck system in favor of a fixed
// pre-battle selection — see lib/secondaries.js).

import { DEFAULT_PRIMARY_MISSION_ID } from "./primary.js";

const KEY = "game-tracker";

export const DEFAULT_TRACKER = {
  cp: 1, primaryMissionId: DEFAULT_PRIMARY_MISSION_ID, opponentPrimaryMissionId: null, primaryVp: 0,
  secondarySelections: [], notes: "",
};

export async function loadTracker() {
  try {
    const res = await window.storage.get(KEY);
    return res && res.value ? { ...DEFAULT_TRACKER, ...JSON.parse(res.value) } : { ...DEFAULT_TRACKER };
  } catch {
    return { ...DEFAULT_TRACKER };
  }
}

export async function saveTracker(state) {
  await window.storage.set(KEY, JSON.stringify(state));
}
