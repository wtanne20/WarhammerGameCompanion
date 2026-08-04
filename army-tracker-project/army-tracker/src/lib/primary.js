// Primary Objective types for the 11th edition Eternal War mission pack.
// Verified against wahapedia.ru/wh40k11ed/the-rules/matched-play/ (rulebook
// dated June 2026).
//
// This is a much smaller list than 10th edition's Chapter Approved system,
// which had a large deck of freely-mixable Primary Objective cards (this
// app previously modelled ~15 of them). 11th edition ties exactly one of
// three Primary Objectives to each named mission, based on battle size:
// Combat Patrol, Incursion and Strike Force missions all use Take and Hold;
// Onslaught missions use either Unified Advance or Domination depending on
// which specific mission you're playing. There's no longer an
// "Attacker/Defender" asymmetric format in the core Eternal War pack, so
// both players in a normal game use the same Primary Objective — the
// You/Opponent comparison in the Game Tracker is still useful for casual or
// house-ruled asymmetric play, but in a standard game both sides should
// pick the same one.
export const PRIMARY_MISSIONS = [
  {
    id: "take-and-hold",
    format: "Combat Patrol · Incursion · Strike Force",
    name: "Take and Hold",
    description:
      "At the end of each player's Command phase, the player whose turn it is scores 5VP for each of these they satisfy (max 15VP): control 1+ objective markers; control 2+ objective markers; control more objective markers than their opponent. Can't be scored in the first battle round.",
  },
  {
    id: "unified-advance",
    format: "Onslaught",
    name: "Unified Advance",
    description:
      "Used in the Lines of Battle mission. At the end of each player's Command phase, the player whose turn it is scores 5VP for each of these they satisfy (max 15VP): control 1+ objective markers; control an 'A' marker and a 'C' marker; control an 'A', a 'B', and a 'C' marker. Can't be scored in the first battle round.",
  },
  {
    id: "domination",
    format: "Onslaught",
    name: "Domination",
    description:
      "Used in the All-out War and Pathway to Glory missions. At the end of each player's Command phase, the player whose turn it is scores 5VP for each of these they satisfy (max 15VP): control 2+ objective markers; control 3+ objective markers; control more objective markers than their opponent. Can't be scored in the first battle round.",
  },
];

export const DEFAULT_PRIMARY_MISSION_ID = "take-and-hold";
