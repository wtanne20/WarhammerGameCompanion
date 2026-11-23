// Assembles the keyword dictionary shown on the Rules tab (see
// components/KeywordDictionary.jsx). Every definition here is text the app
// already verifies and uses elsewhere — nothing is newly written:
//   core abilities   -> indexed from the catalog itself (indexCatalogRules)
//   unit keywords    -> KEYWORD_RULES (rules.js), condensed from the 11e core rules
//   weapon abilities -> GLOSSARY (weaponAbilities.js), verified against
//                       Wahapedia's 11e core-rules reference
//   game terms       -> GAME_TERMS (rules.js)
// Keywords with no verified definition are deliberately NOT listed here —
// same "don't guess at rules" policy as the rest of the app.

import { KEYWORD_RULES, GAME_TERMS, coreAbilityRule, indexCatalogRules } from "./rules.js";
import { describeWeaponAbility } from "./weaponAbilities.js";

const norm = (s) => (s || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// The GLOSSARY in weaponAbilities.js is private, so probe the known labels
// (base form only — parameterized variants share the same definition) and
// keep whatever resolves. Labels that don't resolve are dropped silently,
// so a future glossary change can't break this.
const WEAPON_LABELS = [
  "assault", "blast", "cleave", "close-quarters", "devastating wounds",
  "extra attacks", "hazardous", "heavy", "ignores cover", "indirect fire",
  "lance", "lethal hits", "melta", "one shot", "pistol", "precision",
  "psychic", "rapid fire", "sustained hits", "torrent", "twin-linked",
];
const WEAPON_PARAMETRIC = new Set(["blast", "cleave", "melta", "rapid fire", "sustained hits"]);

export function buildKeywordDictionary(catalog) {
  // Core abilities are defined by the catalog itself; (re)indexing is cheap
  // and idempotent, so this works standalone too.
  indexCatalogRules(catalog);

  const entries = new Map(); // normalized name -> entry (first verified text wins)
  const add = (display, text, category, params = false) => {
    if (!text) return;
    const key = norm(display);
    if (!key) return;
    const existing = entries.get(key);
    if (existing) { if (params) existing.params = true; return; }
    entries.set(key, { name: display, text, category, params });
  };

  for (const [name, text] of Object.entries(KEYWORD_RULES)) add(name, text, "Unit keyword");
  for (const t of GAME_TERMS) add(t.title, t.text, "Game term");

  const seenCore = new Set();
  for (const u of catalog || []) {
    for (const a of u.abilities || []) {
      if (a.type !== "Core" || !a.name) continue;
      const rule = coreAbilityRule(a.name);
      if (!rule) continue;
      const key = norm(rule.title);
      if (seenCore.has(key)) continue;
      seenCore.add(key);
      // "Feel No Pain 5+" etc. share one base rule; the value is a variant.
      add(rule.title, rule.text, "Core ability", a.name !== rule.title);
    }
  }

  for (const label of WEAPON_LABELS) {
    const text = describeWeaponAbility(label);
    if (text) add(label.toUpperCase(), text, "Weapon ability", WEAPON_PARAMETRIC.has(label));
  }

  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}
