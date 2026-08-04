// The 18 core (faction-agnostic) Secondary Objectives from the 11th edition
// Eternal War mission pack. Verified against
// wahapedia.ru/wh40k11ed/the-rules/matched-play/ (rulebook dated June 2026),
// grouped by the game's own subcategories (you can't select two from the
// same category). Text is cleaned up (stray spacing from HTML extraction)
// but otherwise as close to verbatim as practical.
//
// This replaces 10th edition's larger "Tactical" deck-drawn system: in 11th
// edition each player secretly selects exactly 3 secondary objectives
// before the battle (not drawn/redrawn during play), and each can score up
// to 15VP over the course of the game. A handful of faction-restricted
// secondaries (e.g. Slay the Heretic, requiring Adeptus Ministorum units)
// exist alongside these but aren't modelled here, same as the rest of the
// app not tracking faction-specific rules text beyond datasheets/detachments.
export const SECONDARY_MISSIONS = [
  { name: "Assassinate", category: "Purge the Enemy", type: "End Game", description: "Score 3 victory points at the end of the battle for each enemy CHARACTER model that is destroyed." },
  { name: "Bring It Down", category: "Purge the Enemy", type: "End Game", description: "Score 2 victory points at the end of the battle for each enemy MONSTER or VEHICLE model with a Wounds characteristic of 10 or less that is destroyed, and 3 victory points for each enemy MONSTER or VEHICLE model with a Wounds characteristic of 11 or more that is destroyed." },
  { name: "Titan Slayers", category: "Purge the Enemy", type: "End Game", description: "Score 10 victory points at the end of the battle if one enemy TITANIC model is destroyed, or 15 victory points if two or more enemy TITANIC models are destroyed." },
  { name: "Slay The Warlord", category: "Purge the Enemy", type: "End Game", description: "Score 6 victory points at the end of the battle if the enemy WARLORD is destroyed." },
  { name: "Thin Their Ranks", category: "No Mercy, No Respite", type: "End Game", description: "Keep a tally of kill points; each time an enemy model is destroyed, add 1 (add 10 instead if it had a Wounds characteristic of 10 or more). A resurrected model can add to the tally again if destroyed again. At the end of the battle, divide your tally by 10 and round down for your victory points." },
  { name: "Attrition", category: "No Mercy, No Respite", type: "Progressive", description: "Score 4 victory points at the end of the battle round if more enemy units than friendly units were destroyed this battle round." },
  { name: "While We Stand, We Fight", category: "No Mercy, No Respite", type: "End Game", description: "Before the battle, identify your army's three highest-points-value units (or all of them, if you have three or fewer) and note them on your roster. Score 5VP for each that's still on the battlefield at the end of the battle." },
  { name: "First Strike", category: "No Mercy, No Respite", type: "End Game", description: "Score 5 victory points at the end of the battle if any enemy units were destroyed in the first battle round, and score an additional 3 victory points if more enemy units than friendly units were destroyed in the first battle round." },
  { name: "Engage On All Fronts", category: "Battlefield Supremacy", type: "Progressive", description: "Score 2 victory points at the end of your turn if you have one or more units from your army wholly within three different table quarters (all more than 6\" from the centre). Score 3 victory points instead if you have units in all four quarters." },
  { name: "Linebreaker", category: "Battlefield Supremacy", type: "Progressive", description: "Score 4 victory points at the end of your turn if two or more units from your army (excluding Aircraft) are wholly within your opponent's deployment zone." },
  { name: "Domination", category: "Battlefield Supremacy", type: "Progressive", description: "Score 3 victory points if you control more than half the total number of objective markers on the battlefield at the end of your turn." },
  { name: "Defend The Shrine", category: "Battlefield Supremacy", type: "Progressive and End Game", description: "After deployment, your opponent picks an objective marker outside their deployment zone to be the Sacred Shrine. Score 3VP at the end of your turn and 3VP at the end of the battle while you control it; lose 3VP (min 0) at the end of the battle if your opponent controls it instead." },
  { name: "Investigate Sites", category: "Shadow Operations", type: "Progressive", description: "Score 3 victory points each time a unit from your army successfully completes the Investigate Site action: one Infantry unit (excluding Characters) can start it at the end of your Movement phase if it's within 6\" of the battlefield centre with no enemy units (excluding Aircraft) within 6\"; it completes at the end of your turn." },
  { name: "Repair Teleport Homer", category: "Shadow Operations", type: "Progressive", description: "Score 5 victory points each time a unit from your army successfully completes the Repair Teleport Homer action: one Infantry unit can start it at the end of your Movement phase if wholly within your opponent's deployment zone; it completes at the end of your next Command phase if the unit is still there." },
  { name: "Raise The Banners High", category: "Shadow Operations", type: "Progressive and End Game", description: "Infantry units can perform the Raise Banners action on an objective marker at the end of your Movement phase (no enemy units in range), completing at the end of your turn. Score 1VP at the end of each of your Command phases, and 1VP at the end of the battle, for each objective marker with one of your banners raised on it." },
  { name: "Mental Interrogation", category: "Warpcraft", type: "Progressive", description: "Score 3 victory points each time you successfully complete the Mental Interrogation psychic action (Warp Charge 4): one Psyker Character can attempt it in your Psychic phase if within 18\" of any enemy Character." },
  { name: "Psychic Ritual", category: "Warpcraft", type: "End Game", description: "Score 15 victory points at the end of the battle if any unit from your army successfully completed the Psychic Ritual psychic action (Warp Charge 3, one Psyker Character within 6\" of the battlefield centre) 3 times during the battle." },
  { name: "Abhor The Witch", category: "Warpcraft", type: "End Game", description: "You can't select this if your army includes any Psyker units. Score 5 victory points at the end of the battle for each enemy Psyker Character destroyed, and 3 for every other enemy Psyker destroyed." },
];

// Each player secretly selects exactly 3 of these before the battle, no two
// from the same category (enforced by the picker UI). Each can score up to
// 15VP over the course of the game.
export const SECONDARY_SELECT_COUNT = 3;
export const SECONDARY_VP_CAP = 15;
