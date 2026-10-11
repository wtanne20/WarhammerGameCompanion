// The "how to play" quick reference on the Rules tab. Condensed from the
// 11th-edition core rules (Wahapedia's core-rules page, sections 01-13, and
// rules appendix); a few points Wahapedia's page text doesn't carry yet
// (Benefit of Cover, core stratagems, Fly) come from reviewer write-ups of
// the rulebook and are marked "check rulebook" where the exact wording
// couldn't be confirmed. Text goes through AbilityText, so [BRACKETED]
// weapon abilities, core abilities and game terms are tappable.

export const TURN_ORDER = ["Command", "Movement", "Shooting", "Charge", "Fight"];

export const RULE_SECTIONS = [
  {
    id: "overview",
    title: "The game",
    summary: "5 battle rounds. Each round, both players take a full turn of 5 phases.",
    points: [
      "A turn is: Command → Movement → Shooting → Charge → Fight. Then your opponent takes theirs.",
      "Score victory points from your primary and secondary missions. Most VP after 5 battle rounds wins.",
      "Key distances: Engagement Range 2\", objective range 3\", unit coherency 2\" (and all within 9\"), arriving from reserves more than 8\" from enemies.",
    ],
  },
  {
    id: "command",
    title: "1 · Command",
    summary: "Both players gain 1CP, then test Battle-shock.",
    points: [
      "Both players gain 1CP.",
      "Battle-shock: every unit of yours that is Battle-shocked or at half-strength rolls 2D6. Equal to or above its Ld passes (and recovers); below is Battle-shocked.",
      "Battle-shocked units have OC \"-\", can't be targeted by stratagems, and can't do actions. They stay shocked until they pass.",
      "Use any \"in your Command phase\" abilities (e.g. Combat Doctrines).",
    ],
  },
  {
    id: "movement",
    title: "2 · Movement",
    summary: "Each unit picks one: stay still, move, Advance, or Fall Back.",
    points: [
      "Remain Stationary: don't move.",
      "Normal move: up to M\". Can't start engaged or end within Engagement Range.",
      "Advance: M\" + D6\". That unit can't charge this turn and can only shoot [ASSAULT] weapons.",
      "Fall Back: only if engaged. Move up to M\" and end out of Engagement Range. Can't shoot or charge this turn. A Battle-shocked unit makes a hazard roll for each model.",
      "Turning models in place is free. At the end of the phase, units in reserves can arrive (more than 8\" from enemies).",
    ],
  },
  {
    id: "shooting",
    title: "3 · Shooting",
    summary: "Pick a unit, pick targets in range and visible, roll attacks.",
    points: [
      "Each model shoots each of its ranged weapons. Targets must be visible and within the weapon's Range.",
      "Engaged units can only shoot [CLOSE-QUARTERS] weapons at the unit they're fighting. Monsters and Vehicles can shoot anyway, at -1 to hit.",
      "Units that Advanced only shoot [ASSAULT] weapons. Units that Fell Back can't shoot.",
      "[INDIRECT FIRE] can target units it can't see, but only hits on a 6 (4+ if the unit stayed still and a friendly unit can see the target).",
      "Units in cover give attackers -1 to hit (check rulebook). Hidden Infantry in terrain can only be targeted from within 15\".",
    ],
  },
  {
    id: "charge",
    title: "4 · Charge",
    summary: "Roll 2D6, then charge enemies within 12\" and within that roll.",
    points: [
      "Eligible: within 12\" of an enemy, not engaged, didn't Advance or Fall Back.",
      "Roll 2D6 first, then pick targets within 12\" and within the distance rolled. You can decline after rolling.",
      "Every model must end closer to a target, and the unit must end within Engagement Range of every target and no other enemy.",
      "Units that charged get Fights First this turn.",
    ],
  },
  {
    id: "fight",
    title: "5 · Fight",
    summary: "Pile in 3\", fight (chargers first), then consolidate 3\".",
    points: [
      "Pile In: every engaged unit (and anything that charged) can move up to 3\" toward the enemy, active player first.",
      "Fight: units with Fights First go first, players alternating starting with the player whose turn it is. Then everything else, alternating.",
      "Every model in an engaged unit attacks with one melee weapon (plus any [EXTRA ATTACKS] weapons).",
      "Consolidate: after all fights, each unit can move up to 3\" to stay in a fight, join a new one, or reach an objective.",
    ],
  },
  {
    id: "attacks",
    title: "Making attacks",
    summary: "Hit → Wound → Save → Damage.",
    points: [
      "1. Hit: roll a D6 per attack (the A number). Equal to or above BS (shooting) or WS (melee) hits. A 6 always hits (Critical Hit); a 1 always fails.",
      "2. Wound: roll a D6 per hit. Compare the weapon's S to the target's T:\n• S double T or more: 2+\n• S more than T: 3+\n• S equals T: 4+\n• S less than T: 5+\n• S half T or less: 6+",
      "A 6 always wounds (Critical Wound); a 1 always fails.",
      "3. Save: the defender rolls a D6 per wound. Subtract the AP from the roll, then compare with Sv. An invulnerable save ignores AP — use whichever is better.",
      "4. Damage: each failed save removes D wounds from one model. Extra damage doesn't carry over to the next model. Feel No Pain rolls happen here.",
      "Modifiers to hit and wound rolls never go beyond +1 or -1. A dice can only be re-rolled once.",
    ],
  },
  {
    id: "objectives",
    title: "Objectives",
    summary: "Add up OC within 3\"; the higher total controls it.",
    points: [
      "Each player totals the OC of their models within 3\" of the objective (most objectives are now terrain areas — models inside the area count).",
      "Higher total controls it. Battle-shocked units add nothing.",
      "Your mission tells you when and how many VP each objective scores.",
    ],
  },
  {
    id: "stratagems",
    title: "Stratagems",
    summary: "Spend CP for a one-off boost. Each stratagem once per phase.",
    points: [
      "Each stratagem can be used once per phase, and a unit can only be targeted by one stratagem per phase.",
      "Core stratagems (check rulebook for full text):\n• Command Re-roll (1CP): re-roll one roll.\n• Fire Overwatch (1CP): shoot at an enemy that just moved, hitting only on 6s.\n• Rapid Ingress (1CP): bring a reserve unit in during the opponent's turn.\n• Heroic Intervention (1CP): counter-charge an enemy that charged nearby.\n• Counter-offensive (2CP): fight next after an enemy unit fights.\n• Insane Bravery (1CP): pass a failed Battle-shock test.\n• Grenade, Go to Ground, Smokescreen, Epic Challenge, Crushing Impact (1CP each).",
      "Your detachment's own stratagems are on the Roster screen, filtered by phase.",
    ],
  },
];
