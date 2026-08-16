// A single persistent scratchpad for the current game (command points,
// primary objective points, secondary objectives and their scores,
// freeform notes). Deliberately not scoped to an army — you reset it per
// game, same as you would flip to a fresh sheet of paper at the table.
//
// missionSystem picks the primary-mission ruleset — see lib/primary.js and
// lib/dispositions.js:
//   "eternal-war"       — the base rulebook's symmetric 3-mission system
//                          (primaryMissionId / opponentPrimaryMissionId),
//                          verified against wahapedia's 11e matched-play page.
//   "force-disposition" — the Chapter Approved 2026-2027 deck bundled with
//                          the Armageddon box (dispositionId /
//                          opponentDispositionId, resolved to an asymmetric
//                          mission via the matchup table). This is the
//                          system actually used at the table this app was
//                          built for, so it's the default.
//
// secondaryMode picks between two ways of tracking secondaries — see
// lib/secondaries.js for the sourcing/accuracy notes on each:
//   "fixed"    — secondarySelections: [{ name, scored }], up to
//                SECONDARY_SELECT_COUNT (3) objectives picked before the
//                battle and never swapped. This is the system verified
//                against wahapedia's 11e matched-play page.
//   "tactical" — tacticalHand: [{ name, scored }] currently held (up to
//                TACTICAL_HAND_SIZE), tacticalDiscarded: [{ name, scored }]
//                cards drawn earlier and then discarded (their scored VP
//                still counts, they just can't be redrawn or scored
//                further). Not verified against an 11e source when playing
//                Eternal War secondaries — see lib/secondaries.js. The
//                Force Disposition secondary deck (lib/dispositions.js) is
//                natively drawn/discarded per its own source data, so
//                Tactical mode is the accurate default there.
// Either mode works with either missionSystem's secondary deck — the deck
// just changes which cards are available to pick/draw.

import { DEFAULT_PRIMARY_MISSION_ID } from "./primary.js";

const KEY = "game-tracker";

export const MISSION_SYSTEMS = { ETERNAL_WAR: "eternal-war", FORCE_DISPOSITION: "force-disposition" };
export const SECONDARY_MODES = { FIXED: "fixed", TACTICAL: "tactical" };

// GameTracker.jsx currently only reads/writes cp, primaryVp, secondaryVp,
// and notes — the rest (missionSystem, dispositions, secondary
// selections/tactical hand) belong to the fuller mission-tracking UI that's
// been temporarily stripped out of the component (not ready for use yet).
// Kept here so that UI can be reinstated later without a data migration.
export const DEFAULT_TRACKER = {
  missionSystem: MISSION_SYSTEMS.FORCE_DISPOSITION,
  cp: 1, primaryMissionId: DEFAULT_PRIMARY_MISSION_ID, opponentPrimaryMissionId: null, primaryVp: 0,
  dispositionId: null, opponentDispositionId: null,
  secondaryMode: SECONDARY_MODES.FIXED,
  secondarySelections: [],
  tacticalHand: [], tacticalDiscarded: [],
  secondaryVp: 0,
  notes: "",
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
