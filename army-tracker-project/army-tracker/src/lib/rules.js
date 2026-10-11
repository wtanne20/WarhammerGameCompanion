import { describeWeaponAbility } from "./weaponAbilities.js";

// One place to look up "what does this mean?" for anything tappable in the
// app: weapon abilities ([ASSAULT], [ANTI-INFANTRY 4+]…), core unit
// abilities (Deep Strike, Feel No Pain 5+…), characteristics (M, T, AP…)
// and the unit keywords that carry a rule of their own (FLY, CHARACTER…).
// Every lookup returns { title, text } or null — null means "no rule to
// show", and callers render the term as plain text.

// ---- popup bus -----------------------------------------------------------
// RuleSheet (mounted once in App) subscribes; anything can call showRule.
const listeners = new Set();
export function showRule(rule) {
  if (rule) listeners.forEach((fn) => fn(rule));
}
export function onShowRule(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- characteristics -----------------------------------------------------
export const STAT_RULES = {
  M: { title: "Movement (M)", text: "How far, in inches, models in this unit can move when making a Normal move." },
  T: { title: "Toughness (T)", text: "How resilient the model is. Compared against an attack's Strength to work out the Wound roll needed." },
  Sv: { title: "Save (Sv)", text: "Roll this or higher on a D6 to stop a wound. The attack's AP is applied to the roll first." },
  W: { title: "Wounds (W)", text: "How much damage a model can take before it's destroyed." },
  Ld: { title: "Leadership (Ld)", text: "Used for Battle-shock tests: roll 2D6, and the test is passed if the result is equal to or higher than this value." },
  OC: { title: "Objective Control (OC)", text: "Add up the OC of your models within range of an objective marker; whichever player has the higher total controls it." },
  Inv: { title: "Invulnerable save", text: "A save that AP never modifies. When saving, use either this or the normal Save (after AP), whichever is better." },
  Range: { title: "Range", text: "How far the weapon can shoot, in inches. Melee weapons can only attack enemies within Engagement Range." },
  A: { title: "Attacks (A)", text: "How many attacks the weapon makes each time it's used — one Hit roll per attack." },
  BS: { title: "Ballistic Skill (BS)", text: "The Hit roll needed with this ranged weapon. An unmodified 6 always hits (a Critical Hit); an unmodified 1 always fails." },
  WS: { title: "Weapon Skill (WS)", text: "The Hit roll needed with this melee weapon. An unmodified 6 always hits (a Critical Hit); an unmodified 1 always fails." },
  S: {
    title: "Strength (S)",
    text: "Compared with the target's Toughness to find the Wound roll needed:\n• S is double T or more: 2+\n• S is greater than T: 3+\n• S equals T: 4+\n• S is less than T: 5+\n• S is half T or less: 6+",
  },
  AP: { title: "Armour Penetration (AP)", text: "Worsens the target's saving throw by this amount — e.g. AP -2 turns a 3+ save into a 5+. Doesn't affect invulnerable saves." },
  D: { title: "Damage (D)", text: "How many wounds each unsaved attack inflicts on the model it's allocated to. Excess damage is lost when that model dies." },
};

// ---- unit keywords with a rule of their own ------------------------------
// Condensed from the 11th-edition core rules (Wahapedia, plus reviewer
// write-ups for sections Wahapedia's page text doesn't carry yet). Keywords
// whose 11e effect couldn't be confirmed (BATTLELINE, MOUNTED, WALKER…)
// are left out rather than guessed. Keys are upper case.
export const KEYWORD_RULES = {
  CHARACTER: "A leader model. When saves are allocated, each CHARACTER is its own group and takes hits after the rest of its unit. PRECISION attacks can target it directly.",
  "EPIC HERO": "A unique named character — your army can only include one of it.",
  INFANTRY: "Foot soldiers. In light or dense terrain, an INFANTRY unit that hasn't shot this turn or last turn is Hidden: enemies can only target it from within 15\". Can use the Go to Ground stratagem.",
  BEASTS: "Can be Hidden in terrain like INFANTRY: if it hasn't shot this turn or last turn, enemies can only target it from within 15\".",
  SWARM: "Can be Hidden in terrain like INFANTRY: if it hasn't shot this turn or last turn, enemies can only target it from within 15\".",
  VEHICLE: "Can shoot while engaged with the enemy, at -1 to hit (no penalty for Close-Quarters attacks at the engaged unit). Suffers 3 mortal wounds instead of 1 from a failed hazard roll. Can use the Crushing Impact stratagem after charging.",
  MONSTER: "Can shoot while engaged with the enemy, at -1 to hit (no penalty for Close-Quarters attacks at the engaged unit). Suffers 3 mortal wounds instead of 1 from a failed hazard roll. Can use the Crushing Impact stratagem after charging.",
  FLY: "Can move over models and terrain, at the cost of -2\" to its maximum move (and -2\" to its maximum charge).",
  TITANIC: "A huge model. Can't be targeted by Fire Overwatch.",
  TOWERING: "Counts as being on higher ground, so it gets Plunging Fire (+1 to hit with ranged attacks).",
  TRANSPORT: "Other units can embark if every model is within 3\" after moving. Disembarking units are set up within 3\" of it.",
  "DEDICATED TRANSPORT": "Must start the battle with a unit embarked inside it, or it's destroyed.",
  GRENADES: "Can use the Grenade stratagem: pick a visible enemy within 8\", roll 6D6, and each 6 inflicts 1 mortal wound.",
  SMOKE: "Can use the Smokescreen stratagem: the unit gets the Benefit of Cover and Stealth.",
  PSYKER: "Can use psychic abilities (not the same one more than once per phase). [PSYCHIC] attacks ignore modifiers to the hit roll and BS/WS.",
};

// ---- game terms mentioned in rules prose ---------------------------------
// Matched case-insensitively in prose ("…if this unit is Battle-shocked…").
const GAME_TERMS = [
  { match: "battle-?shock(?:ed|s)?(?: tests?| rolls?)?", title: "Battle-shock", text: "In your Command phase, each unit that is already Battle-shocked or at/below half-strength rolls 2D6. Equal to or above its Ld: passed (no longer shocked). Below: Battle-shocked.\n\nWhile Battle-shocked, the unit's OC becomes \"-\" (it can't control objectives), it can't be targeted by stratagems, it can't do actions, and if it Falls Back every model makes a hazard roll. It stays shocked until it passes a later test." },
  { match: "engagement range", title: "Engagement Range", text: "Within 2\" horizontally and 5\" vertically of an enemy model. A unit in Engagement Range is engaged: it can't make Normal moves or Advance, and can only shoot Close-Quarters weapons (Monsters and Vehicles can shoot at -1 to hit)." },
  { match: "critical hits?", title: "Critical Hit", text: "An unmodified Hit roll of 6. Always hits, and triggers abilities like [LETHAL HITS] and [SUSTAINED HITS]." },
  { match: "critical wounds?", title: "Critical Wound", text: "An unmodified Wound roll of 6. Always wounds, and triggers abilities like [DEVASTATING WOUNDS] and [ANTI-]." },
  { match: "mortal wounds?", title: "Mortal wounds", text: "Damage that skips the Hit, Wound and save rolls. Each mortal wound removes 1 wound from a model, wounded non-Characters first and Characters last. Feel No Pain still works against them." },
  { match: "hazard rolls?", title: "Hazard roll", text: "Roll a D6: on a 1-2 the unit suffers 1 mortal wound (3 if every model in it is a MONSTER or VEHICLE)." },
  { match: "benefit of cover", title: "Benefit of Cover", text: "Ranged attacks against a unit in cover get -1 to hit. (11th edition changed this from +1 to the save; confirm in the rulebook.)" },
  { match: "(?:unit )?coherency", title: "Unit Coherency", text: "Every model must be within 2\" horizontally (5\" vertically) of at least one other model in its unit, and within 9\" of every model in the unit. Models out of coherency at the end of a turn are removed." },
  { match: "half-strength", title: "Half-strength", text: "A unit is at half-strength when it has half or fewer of its starting models left (single models: half or fewer of their wounds). At half-strength it takes Battle-shock tests." },
];

function gameTerm(text) {
  return GAME_TERMS.find((t) => new RegExp(`^(?:${t.match})$`, "i").test(text)) || null;
}

// ---- core abilities, indexed from the catalog ----------------------------
// Wahapedia ships the core-rules text of each core ability on every
// datasheet that has it (type "Core"), so the catalog itself is the
// glossary — no hand-written copy to drift out of date. Values in the name
// ("Feel No Pain 5+", "Scouts 6\"", "Deadly Demise D3") are stripped to get
// the base rule, and the leading flavor sentence ("Mighty heroes fight at
// the forefront of battle.") is dropped.
const coreAbilities = new Map();
const VALUE_SUFFIX = /\s+(?:\d*D\d+(?:\+\d+)?|\d+\+?|\d+")(?:\s*\(.*\))?$/i;

export function coreAbilityBase(name) {
  return name.replace(/\s*\(.*\)$/, "").replace(VALUE_SUFFIX, "").trim();
}

function dropFlavor(text) {
  const m = text.match(/^[^.\n]*\.(?=[A-Z])/);
  return m ? text.slice(m[0].length) : text;
}

export function indexCatalogRules(units) {
  coreAbilities.clear();
  for (const u of units || []) {
    for (const a of u.abilities || []) {
      if (a.type !== "Core" || !a.text) continue;
      const base = coreAbilityBase(a.name);
      if (!coreAbilities.has(base.toLowerCase())) coreAbilities.set(base.toLowerCase(), { title: base, text: dropFlavor(a.text) });
    }
  }
  proseTermPattern = null;
}

export function coreAbilityRule(name) {
  return coreAbilities.get(coreAbilityBase(name).toLowerCase()) || null;
}

// ---- general lookup ------------------------------------------------------
export function lookupRule(term) {
  if (!term) return null;
  const clean = term.replace(/^\[|\]$/g, "").trim();
  const weapon = describeWeaponAbility(clean);
  if (weapon) return { title: clean.toUpperCase(), text: weapon };
  const core = coreAbilityRule(clean);
  if (core) return { title: clean, text: core.text };
  const kw = KEYWORD_RULES[clean.toUpperCase()];
  if (kw) return { title: clean.toUpperCase(), text: kw };
  const game = gameTerm(clean);
  if (game) return { title: game.title, text: game.text };
  return null;
}

// ---- prose tokenizer -----------------------------------------------------
// Splits rules prose into segments: { text } for plain text, { text, rule }
// for a tappable term, { text, num: true } for a number worth highlighting
// ("+1", "6\"", "4+", "D3", "1CP", "-1 AP"). Bracketed terms are matched
// first, then core-ability names written plainly in prose ("…has the Deep
// Strike ability"). "Leader"/"Support" are left out of prose matching —
// "leader unit" reads as a plain word far more often than the rule name.
const PROSE_SKIP = new Set(["leader", "support", "damaged"]);
let proseTermPattern = null;

function termPattern() {
  if (proseTermPattern !== null) return proseTermPattern;
  const names = [...coreAbilities.values()].map((r) => r.title).filter((n) => !PROSE_SKIP.has(n.toLowerCase()));
  names.sort((a, b) => b.length - a.length);
  const core = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const alternatives = [
    ...core.map((n) => `${n}\\b(?:\\s+(?:\\d*D\\d+(?:\\+\\d+)?|\\d+\\+?|\\d+"))?`),
    ...GAME_TERMS.map((t) => `(?:${t.match})\\b`),
  ];
  proseTermPattern = new RegExp(`\\b(?:${alternatives.join("|")})`, "gi");
  return proseTermPattern;
}

const NUM = /(?<![\w])(?:[+-]\d+(?:"|\s*CP)?|\d+(?:\+|"|\s*CP\b|\s+mortal wounds?)|\d*D\d+(?:\+\d+)?)(?![\w])/gi;

function splitNumbers(text, out) {
  let last = 0;
  for (const m of text.matchAll(NUM)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], num: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
}

function splitTerms(text, out) {
  const re = termPattern();
  if (!re) return splitNumbers(text, out);
  let last = 0;
  re.lastIndex = 0;
  for (const m of text.matchAll(re)) {
    const rule = lookupRule(m[0]);
    if (!rule) continue;
    if (m.index > last) splitNumbers(text.slice(last, m.index), out);
    out.push({ text: m[0], rule });
    last = m.index + m[0].length;
  }
  if (last < text.length) splitNumbers(text.slice(last), out);
}

export function tokenizeRulesText(text) {
  const out = [];
  if (!text) return out;
  for (const part of text.split(/(\[[^\]]+\])/g)) {
    if (!part) continue;
    const m = part.match(/^\[([^\]]+)\]$/);
    if (m) {
      const rule = lookupRule(m[1]);
      out.push(rule ? { text: part, rule } : { text: part });
    } else {
      splitTerms(part, out);
    }
  }
  return out;
}
