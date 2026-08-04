// The 19 core Tactical Secondary Missions from the current mission pack
// (source: wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/,
// "Chapter Approved 2025-26" — Wahapedia is the same source the rest of the
// app's data comes from). Descriptions are paraphrased in full detail
// (VP values, Fixed vs Tactical differences where they exist) but are still
// paraphrases, not the verbatim card text, and were gathered via a couple of
// fetches that didn't always perfectly agree on every number — treat these
// as a strong reminder of how each card scores, but check the actual card
// at the table if a specific VP breakpoint matters. Re-check this list
// against Wahapedia if GW publishes a newer Chapter Approved; there's no
// CSV export for mission rules the way there is for datasheets, so this is
// hand-transcribed.
export const SECONDARY_MISSIONS = [
  { name: "Behind Enemy Lines", description: "Score 3VP if one unit from your army (excluding Aircraft and Battle-shocked units) is wholly within your opponent's deployment zone at the end of your turn, or 4VP if two or more such units are." },
  { name: "Storm Hostile Objective", description: "Score 4VP if you control one or more objective markers that your opponent controlled at the start of the turn. From round 2 on, you can also score if your opponent controlled no objectives at turn start and you now hold newly-captured ones." },
  { name: "Engage on All Fronts", description: "Score based on how many of the battlefield's four quarters you have a unit (excluding Aircraft and Battle-shocked) wholly within, at least 6\" from the centre: 1VP for two quarters, 2VP for three, 4VP for all four." },
  { name: "Establish Locus", description: "Complete the Establish Locus action with a unit either within 6\" of the battlefield centre (2VP) or in your opponent's deployment zone (4VP)." },
  { name: "Cleanse", description: "Score for cleansing two or more objective markers outside your own deployment zone this turn — 4VP as a Fixed mission, 5VP as a Tactical mission." },
  { name: "Assassination", description: "Fixed: 4VP for each destroyed enemy Character with 4 or more Wounds, 3VP for each with fewer. Tactical: 5VP if you destroy any enemy Character this turn (or if you wipe out every enemy Character, also 5VP)." },
  { name: "No Prisoners", description: "Score 2VP each time you destroy an enemy unit this turn, up to 5VP total per turn. Works the same as Fixed or Tactical, but can't be taken as a Fixed mission in tournament play." },
  { name: "Cull the Horde", description: "Score 5VP for destroying an enemy Infantry unit with a starting strength of 13 or more models (Fixed: per unit destroyed; Tactical: for destroying one or more such units this turn)." },
  { name: "Bring It Down", description: "Fixed: 2VP per destroyed enemy Monster or Vehicle, plus 2VP more if it had 15+ starting Wounds, plus another 2VP if it had 20+. Tactical: flat 4VP if you destroy any Monster or Vehicle this turn." },
  { name: "Defend Stronghold", description: "From round 2 on, score 3VP at the end of your opponent's turn (or at the end of the battle) if you control one or more objective markers within your own deployment zone." },
  { name: "Marked for Death", description: "Your opponent nominates three of your units as Alpha targets; you nominate one enemy unit as your Gamma target. Score 5VP if an Alpha target is destroyed this turn, or 2VP if only your Gamma target is destroyed with no Alpha." },
  { name: "Secure No Man's Land", description: "Score 2VP if you control one objective marker in No Man's Land (the contested middle of the table), or 5VP if you control two or more." },
  { name: "Sabotage", description: "Complete the Sabotage action with a unit inside a terrain feature outside your own deployment zone — 3VP normally, or 6VP if that terrain is inside your opponent's deployment zone." },
  { name: "Area Denial", description: "Score 2VP if you have units (excluding Aircraft/Battle-shocked) within 3\" of the battlefield centre with no enemy units within 3\", or 5VP if there are no enemy units within 6\" of the centre." },
  { name: "Recover Assets", description: "Complete the Recover Assets action with units in two or more different zones (your deployment zone, No Man's Land, your opponent's zone) — 3VP for two, 5VP for three or more." },
  { name: "A Tempting Target", description: "Your opponent nominates one No Man's Land objective marker as your Tempting Target. Score 5VP any turn you control it." },
  { name: "Extend Battle Lines", description: "Score 4VP if you control objective markers in both your own deployment zone and No Man's Land at once, or 2VP just for controlling any No Man's Land objective." },
  { name: "Overwhelming Force", description: "Fixed-only mission. Score 3VP each time you destroy an enemy unit that started the turn within range of an objective marker, up to a 5VP cap per turn." },
  { name: "Display of Might", description: "From round 2 on, score 4VP at the end of your turn if more of your units are wholly within No Man's Land than your opponent's are." },
];

// Tactical mission rules: draw 2 to start, redraw up to 2 whenever below
// that in your Command phase, discard (achieved) once you've scored 1+ VP
// from a card.
export const SECONDARY_HAND_SIZE = 2;
