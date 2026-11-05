import { describe, it, expect } from "vitest";
import {
  unitPoints,
  armyPoints,
  cheapestPoints,
  compositionOption,
  unitModels,
  maxWounds,
  modelWounds,
  currentWounds,
  refreshUnits,
} from "./catalog.js";

// ---------------------------------------------------------------------------
// Fixtures
//
// These are hand-written, synthetic units. They deliberately do NOT depend on
// the live catalog data (public/data/catalog.json), which changes every time
// `npm run sync-data` runs. The point of this suite is to pin down the
// *algorithm* — the points math and the model/wound derivation — so a change
// to the logic fails loudly, while a routine data refresh (new points, new
// units) does not.
// ---------------------------------------------------------------------------

// A squad with a distinct leader profile and a fixed composition.
const INTERCESSORS = {
  id: "intercessors",
  name: "Intercessor Squad",
  faction: "Adeptus Astartes",
  compositionIndex: 1,
  composition: [
    { description: "5 models", points: 85 },
    { description: "10 models", points: 170 },
  ],
  compositionText: "1 Intercessor Sergeant model, 4-9 Intercessor models",
  models: [
    { name: "Intercessor", W: "2" },
    { name: "Intercessor Sergeant", W: "3" },
  ],
};

// A single-model character: no composition text to parse, one profile.
const CHARACTER = {
  id: "grimnar",
  name: "Logan Grimnar",
  faction: "Adeptus Astartes",
  compositionIndex: 0,
  composition: [{ description: "1 model", points: 150 }],
  compositionText: "1 Logan Grimnar model",
  models: [{ name: "Logan Grimnar", W: "8" }],
};

// A unit whose composition text can't be matched to its model profiles —
// this exercises the "N copies of the first profile" fallback path.
const UNPARSEABLE = {
  id: "mystery",
  name: "Mystery Unit",
  faction: "Unknown",
  compositionIndex: 0,
  composition: [{ description: "3 models", points: 60 }],
  compositionText: "one weird thing, two other things",
  models: [{ name: "Weird Model", W: "4" }],
};

describe("compositionOption", () => {
  it("returns the option at compositionIndex", () => {
    expect(compositionOption(INTERCESSORS)).toEqual({ description: "10 models", points: 170 });
  });

  it("falls back to the first option when compositionIndex is out of range", () => {
    const u = { ...INTERCESSORS, compositionIndex: 99 };
    expect(compositionOption(u)).toEqual({ description: "5 models", points: 85 });
  });

  it("returns undefined when there is no composition", () => {
    expect(compositionOption({ id: "x", models: [] })).toBeUndefined();
  });
});

describe("unitPoints / armyPoints / cheapestPoints", () => {
  it("uses the selected composition's points", () => {
    expect(unitPoints(INTERCESSORS)).toBe(170);
    expect(unitPoints({ ...INTERCESSORS, compositionIndex: 0 })).toBe(85);
  });

  it("adds the frozen enhancement points on top", () => {
    expect(unitPoints({ ...INTERCESSORS, enhancementPoints: 25 })).toBe(195);
    // A unit with no enhancement at all still totals correctly.
    expect(unitPoints(CHARACTER)).toBe(150);
  });

  it("treats a missing enhancement as 0", () => {
    expect(unitPoints({ ...INTERCESSORS, enhancementPoints: undefined })).toBe(170);
  });

  it("sums the army's unit points", () => {
    const army = { units: [INTERCESSORS, { ...CHARACTER, instId: "c" }] };
    expect(armyPoints(army)).toBe(170 + 150);
  });

  it("returns 0 for an empty army", () => {
    expect(armyPoints({ units: [] })).toBe(0);
  });

  it("cheapestPoints is the minimum across all composition options", () => {
    expect(cheapestPoints(INTERCESSORS)).toBe(85);
    expect(cheapestPoints(CHARACTER)).toBe(150);
  });
});

describe("unitModels (composition-text parsing)", () => {
  it("splits a mixed squad into the right count of each profile", () => {
    // 10 models total, text says "1 Sergeant, 4-9 Intercessors" -> 1 + 9.
    const models = unitModels(INTERCESSORS);
    expect(models).toHaveLength(10);
    const sergeants = models.filter((m) => m.name === "Intercessor Sergeant");
    const troopers = models.filter((m) => m.name === "Intercessor");
    expect(sergeants).toHaveLength(1);
    expect(troopers).toHaveLength(9);
  });

  it("assigns each model the Wounds of its own profile", () => {
    const models = unitModels(INTERCESSORS);
    expect(models.find((m) => m.name === "Intercessor Sergeant").W).toBe(3);
    expect(models.find((m) => m.name === "Intercessor").W).toBe(2);
  });

  it("respects a single-model character", () => {
    const models = unitModels(CHARACTER);
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({ name: "Logan Grimnar", W: 8 });
  });

  it("falls back to N copies of the first profile when the text is unparseable", () => {
    const models = unitModels(UNPARSEABLE);
    expect(models).toHaveLength(3);
    expect(models.every((m) => m.name === "Weird Model" && m.W === 4)).toBe(true);
  });
});

describe("wounds math", () => {
  it("maxWounds is the sum of every model's Wounds", () => {
    // 1 x 3W sergeant + 9 x 2W troopers = 21.
    expect(maxWounds(INTERCESSORS)).toBe(3 + 9 * 2);
    expect(maxWounds(CHARACTER)).toBe(8);
  });

  it("currentWounds defaults to max when nothing is tracked", () => {
    expect(currentWounds(INTERCESSORS)).toBe(maxWounds(INTERCESSORS));
  });

  it("currentWounds clamps a stored value to the max", () => {
    expect(currentWounds({ ...INTERCESSORS, woundsRemaining: 999 })).toBe(maxWounds(INTERCESSORS));
    expect(currentWounds({ ...INTERCESSORS, woundsRemaining: 5 })).toBe(5);
  });

  it("modelWounds spreads damage from the back of the list", () => {
    const max = maxWounds(INTERCESSORS); // 21
    // Take 2 damage: the last trooper (2W) drops to 0, no one else is touched.
    const models = modelWounds({ ...INTERCESSORS, woundsRemaining: max - 2 });
    expect(models).toHaveLength(10);
    const dead = models.filter((m) => m.remaining === 0);
    expect(dead).toHaveLength(1);
    expect(dead[0].name).toBe("Intercessor"); // a trooper, not the sergeant
    // The sergeant is still at full wounds.
    expect(models.find((m) => m.name === "Intercessor Sergeant").remaining).toBe(3);
  });

  it("modelWounds can kill multiple models and wound the next one", () => {
    const max = maxWounds(INTERCESSORS); // 21
    // Take 5 damage: back-to-front -> 2W, 2W, then 1 into the next 2W trooper.
    const models = modelWounds({ ...INTERCESSORS, woundsRemaining: max - 5 });
    const remaining = models.reduce((s, m) => s + m.remaining, 0);
    expect(remaining).toBe(max - 5);
    expect(models.filter((m) => m.remaining === 0)).toHaveLength(2);
    expect(models.some((m) => m.remaining === 1)).toBe(true);
  });

  it("a fully destroyed unit has zero remaining wounds across all models", () => {
    const models = modelWounds({ ...INTERCESSORS, woundsRemaining: 0 });
    expect(models.every((m) => m.remaining === 0)).toBe(true);
  });
});

describe("refreshUnits (re-merging a stored army onto the current catalog)", () => {
  const FRESH = {
    id: "intercessors",
    name: "Intercessor Squad",
    faction: "Adeptus Astartes",
    composition: [
      { description: "5 models", points: 90 }, // points changed upstream
      { description: "10 models", points: 180 },
    ],
    compositionText: "1 Intercessor Sergeant model, 4-9 Intercessor models",
    models: [{ name: "Intercessor", W: "2" }, { name: "Intercessor Sergeant", W: "3" }],
  };

  it("keeps instance fields while adopting fresh catalog data", () => {
    const stored = {
      id: "intercessors",
      name: "Intercessor Squad",
      instId: "inst-1",
      compositionIndex: 1,
      woundsRemaining: 12,
      customEffects: [{ id: "e1", text: "battle-shocked" }],
      enhancementPoints: 25,
    };
    const [out] = refreshUnits([stored], [FRESH]);
    // Fresh data adopted:
    expect(out.composition[1].points).toBe(180);
    // Instance state preserved:
    expect(out.instId).toBe("inst-1");
    expect(out.compositionIndex).toBe(1);
    expect(out.woundsRemaining).toBe(12);
    expect(out.customEffects).toEqual([{ id: "e1", text: "battle-shocked" }]);
    expect(out.enhancementPoints).toBe(25);
  });

  it("clamps compositionIndex when the catalog now has fewer options", () => {
    const fewer = { ...FRESH, composition: [{ description: "5 models", points: 90 }] };
    const stored = { id: "intercessors", name: "Intercessor Squad", instId: "i", compositionIndex: 5 };
    const [out] = refreshUnits([stored], [fewer]);
    expect(out.compositionIndex).toBe(0);
  });

  it("falls back to a name match when the id changed upstream", () => {
    const renamed = { ...FRESH, id: "intercessors-v2" };
    const stored = { id: "intercessors", name: "Intercessor Squad", instId: "i", compositionIndex: 0 };
    const [out] = refreshUnits([stored], [renamed]);
    expect(out.id).toBe("intercessors-v2"); // id healed to the current one
    expect(out.instId).toBe("i");
  });

  it("leaves a genuinely-gone unit untouched rather than dropping it", () => {
    const stored = { id: "gone", name: "Deleted Upstream", instId: "i", compositionIndex: 0 };
    const [out] = refreshUnits([stored], [FRESH]);
    expect(out).toBe(stored);
  });
});
