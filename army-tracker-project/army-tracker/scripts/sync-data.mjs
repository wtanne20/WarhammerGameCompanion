// Fetches Wahapedia's current 40k datasheet export and converts it into the
// flat catalog.json/meta.json shape src/lib/catalog.js expects.
//
// Runs in Node (not the browser), so Wahapedia's missing CORS headers don't
// apply here. Re-run this whenever you want fresher data:
//   npm run sync-data

import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://wahapedia.ru/wh40k11ed";
const OUT_DIR = new URL("../public/data/", import.meta.url);

const FILES = [
  "Datasheets",
  "Datasheets_models",
  "Datasheets_models_cost",
  "Datasheets_wargear",
  "Datasheets_abilities",
  "Datasheets_keywords",
  "Datasheets_unit_composition",
  "Datasheets_options",
  "Datasheets_leader",
  "Factions",
  "Abilities",
  "Detachment_abilities",
  "Enhancements",
  "Stratagems",
  "Last_update",
];

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split("|").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split("|");
    const row = {};
    header.forEach((key, i) => { row[key] = (cells[i] ?? "").trim(); });
    return row;
  });
}

async function fetchCsv(name) {
  const res = await fetch(`${BASE}/${name}.csv`);
  if (!res.ok) throw new Error(`Failed to fetch ${name}.csv: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

function stripHtml(input) {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)>/gi, "")
    .replace(/<(p|tr|div)[ >]/gi, "\n$&")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Detachment/enhancement rule text wraps real game keywords like
// <span class="kwb">ADEPTUS</span> — a much stronger signal for matching a
// rule against a unit's own keywords than scanning arbitrary English. Must
// run on the raw HTML before stripHtml removes the tags. Multi-word
// keywords (e.g. "Adeptus Astartes") are marked up as consecutive
// same-class spans, one word each — merge adjacent runs back into a single
// phrase so this lines up with how catalog.json stores unit keywords.
function extractKeywords(input) {
  if (!input) return [];
  const found = new Set();
  const runRegex = /(?:<span class="kwb">[^<]+<\/span>\s*)+/g;
  const wordRegex = /<span class="kwb">([^<]+)<\/span>/g;
  for (const run of input.matchAll(runRegex)) {
    const words = [...run[0].matchAll(wordRegex)].map((m) => m[1].trim());
    found.add(words.join(" ").toUpperCase());
  }
  return [...found];
}

// Known transcription typos in the upstream data vs. the official rulebook spelling.
const NAME_FIXES = {
  "Abaddon The Despoiler": "Abaddon the Despoiler",
};

// Stratagems.csv's `type` column is "<Detachment name> – <category>
// Stratagem" (e.g. "Shield Host – Wargear Stratagem") for detachment
// stratagems, or "Core – <category> Stratagem" for the universal ones. The
// detachment name itself is redundant with the row's own detachment/
// detachment_id columns, so only the trailing category is worth keeping.
function stratagemCategory(type) {
  if (!type) return "Stratagem";
  const last = type.split(/[–—]/).pop().trim();
  return last.replace(/\s*Stratagem$/i, "").trim() || "Stratagem";
}

// The leading portion of `type` before the dash is the detachment name for
// detachment stratagems, or literally "Core" for the ~11 universal ones
// every army gets regardless of detachment. ("Boarding Actions" rows are a
// separate, unrelated game mode's stratagem pool — not the core rules — and
// are naturally excluded since they're grouped under neither "Core" nor a
// real detachment_id.)
function stratagemGroupName(type) {
  return (type || "").split(/[–—]/)[0].trim();
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row[key])) map.set(row[key], []);
    map.get(row[key]).push(row);
  }
  return map;
}

const byLine = (a, b) => Number(a.line) - Number(b.line);

async function main() {
  console.log("Fetching Wahapedia data...");
  const [
    datasheets, models, modelsCost, wargear, abilityLinks,
    keywords, unitComposition, options, leaderPairs, factions, abilities,
    detachmentAbilities, enhancements, stratagems, lastUpdate,
  ] = await Promise.all(FILES.map(fetchCsv));

  const factionNames = new Map(factions.map((f) => [f.id, f.name]));
  const abilityLib = new Map(abilities.map((a) => [a.id, a]));

  const modelsByDs = groupBy(models, "datasheet_id");
  const costByDs = groupBy(modelsCost, "datasheet_id");
  const wargearByDs = groupBy(wargear, "datasheet_id");
  const abilitiesByDs = groupBy(abilityLinks, "datasheet_id");
  const keywordsByDs = groupBy(keywords, "datasheet_id");
  const compositionByDs = groupBy(unitComposition, "datasheet_id");
  const optionsByDs = groupBy(options, "datasheet_id");

  const canLeadByDs = new Map(); // leader_id -> [attached_id...]
  const canBeLedByDs = new Map(); // attached_id -> [leader_id...]
  for (const { leader_id, attached_id } of leaderPairs) {
    if (!canLeadByDs.has(leader_id)) canLeadByDs.set(leader_id, []);
    canLeadByDs.get(leader_id).push(attached_id);
    if (!canBeLedByDs.has(attached_id)) canBeLedByDs.set(attached_id, []);
    canBeLedByDs.get(attached_id).push(leader_id);
  }

  const catalog = datasheets
    .filter((d) => d.virtual !== "true")
    .map((d) => {
      const dsModels = (modelsByDs.get(d.id) || []).sort(byLine).map((m) => ({
        name: m.name,
        M: m.M, T: m.T, Sv: m.Sv, invSv: m.inv_sv || null,
        W: m.W, Ld: m.Ld, OC: m.OC,
        baseSize: m.base_size || null,
      }));

      const composition = (costByDs.get(d.id) || [])
        .sort(byLine)
        .map((c) => ({ description: c.description, points: Number(c.cost) || 0 }));

      const weapons = (wargearByDs.get(d.id) || [])
        .filter((w) => w.type === "Ranged" || w.type === "Melee")
        .map((w) => ({
          name: w.name,
          range: w.range === "Melee" ? "Melee" : `${w.range}"`,
          A: w.A, skill: w.BS_WS, S: w.S, AP: w.AP, D: w.D,
          kw: stripHtml(w.description),
          ranged: w.type === "Ranged",
        }));

      const dsAbilities = (abilitiesByDs.get(d.id) || [])
        .map((a) => {
          const lib = a.ability_id ? abilityLib.get(a.ability_id) : null;
          return {
            name: lib ? lib.name : a.name,
            text: stripHtml(lib ? lib.description : a.description),
            type: a.type,
          };
        })
        .filter((a) => a.name);

      const dsKeywords = (keywordsByDs.get(d.id) || []).map((k) => k.keyword).filter(Boolean);

      const compositionText = (compositionByDs.get(d.id) || [])
        .sort(byLine)
        .map((c) => c.description)
        .join(", ");

      const wargearOptions = (optionsByDs.get(d.id) || [])
        .sort(byLine)
        .map((o) => stripHtml(o.description))
        .filter(Boolean);

      return {
        id: d.id,
        name: NAME_FIXES[d.name] || d.name,
        faction: factionNames.get(d.faction_id) || d.faction_id,
        role: d.role,
        legend: stripHtml(d.legend),
        models: dsModels,
        compositionText,
        composition,
        ranged: weapons.filter((w) => w.ranged).map(({ ranged, ...w }) => w),
        melee: weapons.filter((w) => !w.ranged).map(({ ranged, ...w }) => w),
        abilities: dsAbilities,
        keywords: dsKeywords,
        wargearOptions,
        canLead: canLeadByDs.get(d.id) || [],
        canBeLedBy: canBeLedByDs.get(d.id) || [],
      };
    })
    .filter((u) => u.composition.length > 0);

  const enhancementsByDetachment = groupBy(enhancements, "detachment_id");
  const detachmentRows = groupBy(detachmentAbilities, "detachment_id");
  const detachments = [...detachmentRows.entries()].map(([detachmentId, rows]) => ({
    id: detachmentId,
    faction: factionNames.get(rows[0].faction_id) || rows[0].faction_id,
    name: rows[0].detachment,
    abilities: rows.map((r) => ({
      name: r.name,
      legend: stripHtml(r.legend),
      text: stripHtml(r.description),
      matchKeywords: extractKeywords(r.description),
    })),
    enhancements: (enhancementsByDetachment.get(detachmentId) || []).map((e) => ({
      id: e.id,
      name: e.name,
      points: Number(e.cost) || 0,
      legend: stripHtml(e.legend),
      text: stripHtml(e.description),
      matchKeywords: extractKeywords(e.description),
    })),
  }));

  const toStratagem = (r) => ({
    id: r.id,
    name: r.name,
    category: stratagemCategory(r.type),
    cpCost: Number(r.cp_cost) || 0,
    phase: r.phase,
    turn: r.turn,
    legend: stripHtml(r.legend),
    text: stripHtml(r.description),
  });
  const coreStratagems = stratagems.filter((r) => stratagemGroupName(r.type) === "Core").map(toStratagem);
  const stratagemsByDetachment = {};
  for (const r of stratagems) {
    if (!r.detachment_id) continue;
    (stratagemsByDetachment[r.detachment_id] ||= []).push(toStratagem(r));
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(new URL("catalog.json", OUT_DIR), JSON.stringify(catalog));
  await writeFile(new URL("detachments.json", OUT_DIR), JSON.stringify(detachments));
  await writeFile(
    new URL("stratagems.json", OUT_DIR),
    JSON.stringify({ core: coreStratagems, byDetachment: stratagemsByDetachment })
  );
  await writeFile(
    new URL("meta.json", OUT_DIR),
    JSON.stringify(
      {
        source: "wahapedia.ru/wh40k11ed",
        lastUpdate: lastUpdate[0]?.last_update || null,
        syncedAt: new Date().toISOString(),
        unitCount: catalog.length,
      },
      null,
      2
    )
  );

  console.log(`Wrote ${catalog.length} units to public/data/catalog.json`);
  console.log(`Wrote ${detachments.length} detachments to public/data/detachments.json`);
  console.log(`Wrote ${coreStratagems.length} core + ${Object.keys(stratagemsByDetachment).length} detachments' stratagems to public/data/stratagems.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
