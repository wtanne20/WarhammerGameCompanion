// Quick-reference glossary for the bracketed weapon-ability keywords shown
// on a unit's ranged/melee profiles. Verified against Wahapedia's 11th
// edition core rules reference (wahapedia.ru/wh40k11ed/the-rules/core-rules/,
// section 24 "Core Abilities" — rulebook dated June 2026), condensed for a
// tooltip rather than quoted verbatim. "Anti-<keyword>" is handled specially
// since the mechanic is identical regardless of which keyword follows
// "Anti-". Anything not in this list (a handful of flavor-named unique
// weapon rules like "bubblechukka") is left as non-interactive plain text
// rather than guessing at a definition.
//
// Note: as of this edition, Wahapedia's live datasheet/wargear export still
// uses 10th-edition-era terminology throughout (e.g. every weapon that will
// eventually read [CLOSE-QUARTERS] still reads [PISTOL] today, and
// [CLEAVE]/keyword-restricted abilities like "[LETHAL HITS: VEHICLE]" don't
// appear at all yet) — those entries are included below for when the data
// catches up, but won't show as chips on any current unit.
const GLOSSARY = {
  ASSAULT: "Lets a unit that made an Advance move this turn still shoot — but only with its Assault weapons.",
  BLAST: (v) =>
    `Add ${v ? v.toUpperCase() : "1"} additional attack dice to this weapon for every 5 models (rounded down) in the target unit.`,
  CLEAVE: (v) =>
    `If this weapon's attacks all target a single unit, add ${v ? v.toUpperCase() : "the listed value"} additional attack dice for every 5 models (rounded down) in that unit.`,
  "CLOSE-QUARTERS":
    "This weapon can still be used even while its bearer's unit is engaged with the enemy — but while shooting this way, only Close-Quarters weapons can be selected, and only the engaged enemy unit can be targeted. (Functionally identical to, and gradually replacing, Pistol.)",
  "DEVASTATING WOUNDS":
    "A Critical Wound scored with this weapon skips normal damage entirely — it inflicts mortal wounds equal to the weapon's Damage instead (capped at destroying one model per Critical Wound).",
  "EXTRA ATTACKS":
    "When the bearer fights, it attacks with every Extra Attacks weapon it has, plus one other melee weapon.",
  HAZARDOUS:
    "After the unit attacks, roll a D6 for each Hazardous weapon that was used — on a 1-2, the unit suffers 1 mortal wound (3 instead if every model in the unit is a Monster/Vehicle).",
  HEAVY:
    "Add 1 to this weapon's Hit roll (while shooting) if the bearer's unit is unengaged, wasn't set up on the battlefield this turn, and hasn't moved more than 3\" this turn.",
  "IGNORES COVER": "Targets of this weapon don't get the benefit of cover.",
  "INDIRECT FIRE":
    "This weapon can target units it can't see. The target gets the benefit of cover, hit rolls can't be re-rolled, and an unmodified hit roll of 1-5 fails (1-3 instead if the shooting unit Remained Stationary and a friendly unit can see the target).",
  LANCE: "Add 1 to this weapon's Wound roll if the bearer made a Charge move this turn.",
  "LETHAL HITS":
    "You can choose for a Critical Hit made with this weapon to automatically wound the target — but doing so skips the Wound roll entirely, so it can't also become a Critical Wound.",
  MELTA: (v) => `Add ${v ? v.toUpperCase() : "the listed value"} to this weapon's Damage when it targets a unit within half range.`,
  "ONE SHOT": "This weapon can only be selected to attack with once per battle.",
  PISTOL:
    "This weapon can still be shot even while its bearer's unit is within Engagement Range of the enemy — but only Pistols can be selected, and only the engaged enemy unit can be targeted. (Being phased out in favor of the identical Close-Quarters ability.)",
  PRECISION:
    "Wounds from this weapon against an Attached unit can be allocated straight to a visible CHARACTER inside it, instead of the Bodyguard.",
  PSYCHIC: "Attacks made with this weapon can ignore any modifiers to its Ballistic/Weapon Skill or to the Hit roll.",
  "RAPID FIRE": (v) => `Add ${v ? v.toUpperCase() : "the listed value"} extra attack dice when this weapon targets a unit within half range.`,
  "SUSTAINED HITS": (v) => `A Critical Hit made with this weapon scores ${v ? v.toUpperCase() : "extra"} additional automatic hits on the target.`,
  TORRENT: "Attacks made with this weapon automatically hit the target — no Hit roll needed.",
  "TWIN-LINKED": "You can re-roll the Wound roll for attacks made with this weapon.",
};

function titleCase(s) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Splits a trailing value token ("4+", "1", "d3", "d6+3") off the end of a
// label, e.g. "anti-infantry 4+" -> { base: "anti-infantry", value: "4+" }.
function splitValue(label) {
  const m = label.match(/^(.*?)\s+([dD]?\d[\w+]*)$/);
  if (m) return { base: m[1].trim(), value: m[2].trim() };
  return { base: label.trim(), value: null };
}

export function describeWeaponAbility(label) {
  const { base, value } = splitValue(label);
  const upperBase = base.toUpperCase();
  if (upperBase.startsWith("ANTI-")) {
    const target = titleCase(upperBase.slice(5).replace(/-/g, " "));
    const threshold = value ? value.toUpperCase() : "X+";
    return `Against ${target} models, a Critical Wound is automatically scored on any unmodified Wound roll of ${threshold}.`;
  }
  const entry = GLOSSARY[upperBase];
  if (!entry) return null;
  return typeof entry === "function" ? entry(value) : entry;
}

// Turns a weapon's comma-joined ability string ("anti-infantry 4+,
// devastating wounds, rapid fire 1") into individual chips.
export function parseWeaponAbilities(kw) {
  if (!kw || kw === "—") return [];
  return kw
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((label) => ({ label, description: describeWeaponAbility(label) }));
}
