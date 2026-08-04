// Quick-reference glossary for the bracketed weapon-ability keywords shown
// on a unit's ranged/melee profiles (10th edition core rules). Condensed for
// a tooltip rather than quoted verbatim from the rulebook. "Anti-<keyword>"
// is handled specially since the mechanic is identical regardless of which
// keyword follows "Anti-". Anything not in this list (a handful of
// flavor-named unique weapon rules like "bubblechukka") is left as
// non-interactive plain text rather than guessing at a definition.
const GLOSSARY = {
  ASSAULT: "A unit that Advanced this turn can still shoot with this weapon.",
  BLAST: "Add 1 to the number of attacks made with this weapon for every full 5 models in the target unit.",
  "DEVASTATING WOUNDS":
    "A Critical Wound scored with this weapon can't be saved against, not even with an invulnerable save — it deals mortal wounds equal to the weapon's Damage instead of normal damage.",
  "EXTRA ATTACKS":
    "When the bearer fights, it attacks with every Extra Attacks weapon it has, plus one other melee weapon. Nothing can add extra attacks with this weapon unless it names the weapon specifically.",
  HAZARDOUS:
    "After the unit attacks with this weapon, roll a D6 for it — on a 1, a model in the unit (preferring one that's already lost wounds) suffers 3 mortal wounds.",
  HEAVY: "Add 1 to this weapon's Hit roll if the bearer's unit Remained Stationary this turn.",
  "IGNORES COVER": "Targets of this weapon don't get the benefit of cover.",
  "INDIRECT FIRE": "This weapon can target units it can't see, at a penalty to hit and other restrictions.",
  LANCE: "Add 1 to this weapon's Wound roll if the bearer made a Charge move this turn.",
  "LETHAL HITS": "A Critical Hit made with this weapon automatically wounds the target — no Wound roll needed.",
  MELTA: (v) => `Add ${v ? v.toUpperCase() : "the listed value"} to this weapon's Damage when it targets a unit within half range.`,
  "ONE SHOT": "This weapon can only be selected to shoot with once per battle.",
  PISTOL:
    "This weapon can still be shot even while its bearer's unit is within Engagement Range of the enemy — but only the enemy unit it's engaged with can be targeted.",
  PRECISION:
    "Wounds from this weapon against an Attached unit can be allocated straight to a visible CHARACTER inside it, instead of the Bodyguard.",
  "RAPID FIRE": (v) => `Add ${v ? v.toUpperCase() : "the listed value"} to this weapon's Attacks when it targets a unit within half range.`,
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
