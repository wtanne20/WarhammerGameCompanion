// A single persistent scratchpad for the current game (command points,
// primary objective points, a hand of drawn Secondary Mission cards,
// freeform notes). Deliberately not scoped to an army — you reset it per
// game, same as you would flip to a fresh sheet of paper at the table.
//
// secondaryHand: [{ id, name, scored }] — up to SECONDARY_HAND_SIZE active cards.
// secondaryDiscarded: [{ id, name, scored }] — achieved/discarded this game.

import { DEFAULT_PRIMARY_MISSION_ID } from "./primary.js";

const KEY = "game-tracker";

export const DEFAULT_TRACKER = {
  cp: 1, primaryMissionId: DEFAULT_PRIMARY_MISSION_ID, opponentPrimaryMissionId: null, primaryVp: 0,
  secondaryHand: [], secondaryDiscarded: [], notes: "",
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
