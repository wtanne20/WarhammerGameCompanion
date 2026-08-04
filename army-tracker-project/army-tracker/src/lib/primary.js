// Primary Mission types from the current core missions (source:
// wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/). Unlike
// detachment rules, these aren't tied to your faction/army — they're a
// property of which mission you're playing, picked once per game.
//
// Confidence note: "Take and Hold" was checked with its own dedicated
// fetch and its numbers cross-referenced twice. The other ~14 came back in
// one summarized pass covering all of them at once, so treat their
// descriptions as a looser approximation — good enough to remind you how a
// mission scores, but worth confirming exact breakpoints against the actual
// mission card if it matters for the game.
export const PRIMARY_MISSIONS = [
  {
    id: "take-and-hold",
    format: "Strike Force / Incursion",
    name: "Take and Hold",
    description:
      "At the end of the Command phase of each of your turns (or the end of your turn if it's the fifth battle round and you're going second), score 5VP for each objective marker you control, up to a maximum of 15VP that turn. No primary VP is scored in the first battle round.",
  },
  {
    id: "linchpin",
    format: "Strike Force / Incursion",
    name: "Linchpin",
    description:
      "Heavily rewards holding the centre objective. If you don't control it, score 3VP for each objective marker you control. If you do control it, score 3VP for the centre plus 5VP for each other objective you control.",
  },
  {
    id: "burden-of-trust",
    format: "Strike Force / Incursion",
    name: "Burden of Trust",
    description:
      "You and your opponent each nominate objectives to \"guard.\" Score 4VP for each objective marker you control outside your own deployment zone, plus 2VP for each enemy unit guarding an objective you control.",
  },
  {
    id: "terraform",
    format: "Strike Force / Incursion",
    name: "Terraform",
    description:
      "Units can complete an action to terraform an objective marker. Score 4VP for each objective you control, plus 1VP for each marker you've terraformed so far.",
  },
  {
    id: "purge-the-foe",
    format: "Strike Force / Incursion",
    name: "Purge the Foe",
    description:
      "Combat-focused. Score 4VP if you destroyed one or more enemy units this turn, plus another 4VP if you destroyed more enemy units than you lost friendly units.",
  },
  {
    id: "scorched-earth",
    format: "Strike Force / Incursion",
    name: "Scorched Earth",
    description:
      "Units can complete an action to burn an objective marker. Score 5VP for burning one in No Man's Land, 10VP for burning one in your opponent's deployment zone, plus 5VP for each objective marker you still control.",
  },
  {
    id: "unexploded-ordnance",
    format: "Strike Force / Incursion",
    name: "Unexploded Ordnance",
    description:
      "A hazardous objective marker drifts toward your opponent's territory over the course of the game. Score 8VP if it's wholly within their deployment zone, 5VP if within 6\" of it, or 2VP if within 12\".",
  },
  {
    id: "hidden-supplies",
    format: "Strike Force / Incursion",
    name: "Hidden Supplies",
    description:
      "Objectives outside deployment zones become more valuable. Score 5VP for each objective marker you control outside deployment zones, with escalating bonuses the longer you hold them.",
  },
  {
    id: "the-ritual",
    format: "Strike Force / Incursion",
    name: "The Ritual",
    description:
      "Units can establish new objective markers in No Man's Land. Score 5VP for each No Man's Land objective marker you control, including any you've established yourself.",
  },
  {
    id: "supply-drop",
    format: "Strike Force / Incursion",
    name: "Supply Drop",
    description:
      "Objective markers appear partway through the game and grow more valuable as it goes on: roughly 5VP per controlled marker in rounds 2-3, 8VP in round 4, and 15VP in round 5.",
  },
  {
    id: "syphoned-power",
    format: "Asymmetric War",
    name: "Syphoned Power",
    description:
      "Attacker/Defender mission. The Attacker syphons VP from objective markers (2-5VP depending on location) while the Defender starts the game with 50VP that decreases as objectives are syphoned.",
  },
  {
    id: "establish-control",
    format: "Asymmetric War",
    name: "Establish Control",
    description:
      "Attacker/Defender version of Linchpin — similar centre-objective-focused scoring, positioned asymmetrically between the two sides.",
  },
  {
    id: "uneven-ground",
    format: "Asymmetric War",
    name: "Uneven Ground",
    description:
      "Objectives are worth more the deeper into enemy territory you hold them: 2VP for one in your own deployment zone, 4VP in No Man's Land, 6VP in your opponent's deployment zone.",
  },
  {
    id: "denied-resources",
    format: "Asymmetric War",
    name: "Denied Resources",
    description:
      "Attacker/Defender mission. The Defender can remove objective markers to deny them (worth 7-16VP), while the Attacker scores 3-8VP per zone for whichever objectives it controls.",
  },
  {
    id: "hold-out",
    format: "Asymmetric War",
    name: "Hold Out",
    description:
      "Standard 5VP-per-controlled-objective scoring, the same shape as Take and Hold, used in an Attacker/Defender scenario.",
  },
];

export const DEFAULT_PRIMARY_MISSION_ID = "take-and-hold";
