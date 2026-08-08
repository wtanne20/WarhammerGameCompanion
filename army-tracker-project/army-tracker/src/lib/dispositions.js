// The real Chapter Approved 2026-2027 mission deck (the one bundled with
// the Armageddon launch box) — sourced from 40kdc-data's core files, not
// Wahapedia (which doesn't have it — see scripts/sync-data.mjs). Force
// Dispositions are 11th edition's asymmetric primary-mission system: each
// player picks one of 5 dispositions, and the (yours, opponent's) pairing
// resolves to one specific mission with its own bespoke scoring text.
//
// One accuracy caveat worth keeping in mind: the 5 disposition names/blurbs
// themselves are still tagged "pre-launch-provisional" in the source data
// (unlike the mission/matchup/secondary-card data, tagged "launch") — the
// pairing-to-mission mapping and mission text are the confirmed part.

import { withBase } from "./paths.js";
import { getCachedRemote } from "./remoteData.js";

export async function fetchDispositions() {
  const cached = await getCachedRemote("dispositions");
  if (cached) return cached;
  const res = await fetch(withBase("/data/dispositions.json"));
  if (!res.ok) throw new Error("Failed to load Force Disposition data.");
  return res.json();
}

export function matchupFor(data, dispositionId, opponentDispositionId) {
  if (!data || !dispositionId || !opponentDispositionId) return null;
  return data.matchups.find(
    (m) => m.disposition === dispositionId && m.opponent_disposition === opponentDispositionId
  ) || null;
}

export function missionFor(data, missionId) {
  if (!data || !missionId) return null;
  return data.missions.find((m) => m.id === missionId) || null;
}

export function primaryCardFor(data, missionId) {
  if (!data || !missionId) return null;
  return data.cards.find((c) => c.id === missionId && c.card_type === "primary") || null;
}

// The Chapter Approved 2026-2027 secondary deck, reshaped to the same
// {name, category, type, description} shape src/lib/secondaries.js's
// Eternal War deck uses, so the same Fixed/Tactical picker UI works for
// either. This deck has no card categories (it's drawn, not fixed-picked
// with a one-per-category rule) — category is left undefined, which the
// picker/drawer already treat as "no constraint".
export function dispositionSecondaryDeck(data) {
  if (!data) return [];
  return data.cards
    .filter((c) => c.card_type === "secondary")
    .map((c) => ({ name: c.name, category: undefined, type: "Chapter Approved 2026-2027", description: c.text }));
}
