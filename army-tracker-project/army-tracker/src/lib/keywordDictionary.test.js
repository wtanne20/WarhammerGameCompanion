import { describe, it, expect } from "vitest";
import { buildKeywordDictionary } from "./keywordDictionary.js";

// The catalog normally supplies the core-ability definitions (indexed from
// each unit's type:"Core" abilities); a minimal entry exercises that path.
const CATALOG = [
  {
    id: "u1", name: "Test Unit", faction: "X",
    abilities: [
      { name: "Feel No Pain 5+", type: "Core", text: "Mighty heroes fight at the forefront of battle.This ability always takes the form Feel No Pain 5+. Each time this model would be destroyed, roll a D6: on a 5+ it survives with 1 Wound instead." },
      { name: "Deep Strike", type: "Core", text: "This unit can arrive from reserves during the Deployment phase." },
    ],
  },
];

describe("buildKeywordDictionary", () => {
  const dict = buildKeywordDictionary(CATALOG);
  const byName = (name) => dict.find((e) => e.name.toUpperCase() === name.toUpperCase());

  it("includes unit keywords from the verified rule set", () => {
    expect(byName("FLY")).toMatchObject({ category: "Unit keyword" });
    expect(byName("INFANTRY").text).toContain("Hidden");
  });

  it("includes game terms", () => {
    const bs = byName("Battle-shock");
    expect(bs).toMatchObject({ category: "Game term" });
    expect(bs.text).toBeTruthy();
  });

  it("includes core abilities from the catalog, with values stripped to the base rule", () => {
    const fnp = byName("Feel No Pain");
    expect(fnp).toMatchObject({ category: "Core ability", params: true });
    expect(fnp.text).not.toContain("forefront of battle"); // flavor sentence dropped
    expect(byName("Deep Strike").category).toBe("Core ability");
  });

  it("includes weapon abilities from the verified glossary", () => {
    const twin = byName("TWIN-LINKED");
    expect(twin).toMatchObject({ category: "Weapon ability" });
    expect(twin.text).toContain("re-roll the Wound roll");
    // Parameterized abilities are listed once, flagged as value-varying.
    expect(byName("RAPID FIRE").params).toBe(true);
  });

  it("has no duplicate names (case-insensitive) and is sorted alphabetically", () => {
    const names = dict.map((e) => e.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    // localeCompare sort in the builder vs plain sort: compare as sets of
    // adjacent pairs instead to avoid locale-ordering false positives.
    expect(dict.map((e) => e.name)).toEqual(
      [...dict].sort((a, b) => a.name.localeCompare(b.name)).map((e) => e.name)
    );
  });

  it("every entry has non-empty definition text", () => {
    for (const e of dict) expect(e.text.trim().length).toBeGreaterThan(0);
  });

  it("works with an empty catalog (core abilities just absent)", () => {
    const d = buildKeywordDictionary([]);
    expect(d.some((e) => e.category === "Unit keyword")).toBe(true);
    expect(d.some((e) => e.name.toUpperCase() === "FEEL NO PAIN")).toBe(false);
  });
});
