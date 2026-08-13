// Builds public/data/catalog.json (and friends) from two sources:
//
//   - @alpaca-software/40kdc-data ("40kdc") — an actively-maintained,
//     properly-licensed (CC BY 4.0) community dataset. Used for every
//     NUMERIC/structural fact: stats, points, weapon numbers, keywords,
//     composition options, leader-attachment eligibility, and the
//     Chapter Approved 2026-2027 Force Disposition mission data. 40kdc
//     deliberately does NOT store rules prose (see its README's "IP
//     Stance" table) — ability text is a structured DSL only.
//   - Wahapedia (wahapedia.ru/wh40k11ed) — still the source for every
//     piece of actual PROSE TEXT: unit ability text, wargear-option rule
//     text, detachment rules, enhancements, and stratagems. Verified
//     against this source earlier in the project; no reason to risk that
//     on unproven DSL-generated text.
//
// 40kdc's dataset is smaller (~1100 units) than Wahapedia's full export
// (~1700), so any unit 40kdc doesn't have yet falls back to the old
// all-Wahapedia record instead of just disappearing from the catalog.
//
// Re-run whenever you want fresher data: npm run sync-data
//
// Per 40kdc-data's LICENSE-TOOLS, any public deployment shipping this
// package must credit "Powered by 40kdc-data" + link to
// https://40kdc.alpacasoft.dev in a user-accessible location — see the
// footer credit in src/components/ArmyList.jsx.

import { mkdir, writeFile } from "node:fs/promises";
import { Dataset } from "@alpaca-software/40kdc-data";

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

// A handful of core-rules library abilities (Scouts, Feel No Pain, Deadly
// Demise, Firing Deck) are written as a generic template with a literal "X"
// placeholder ("This ability always takes the form Scouts X\""), and each
// datasheet's own row in Datasheets_abilities.csv carries the real value in
// its `parameter` column (e.g. "6\"") — Wahapedia's own datasheet pages
// splice these together (shown as "SCOUTS 6\""), but this CSV export keeps
// them separate, so it's redone here. Only touches text that actually
// contains the placeholder, so an unrelated non-empty `parameter` on some
// other ability (seen once, on a Faction ability that doesn't use this
// template) is safely ignored rather than mangling its name.
const ABILITY_PARAMETER_PLACEHOLDER = /\bX["+]?/g;
function fillAbilityParameter(name, text, parameter) {
  if (!parameter || !text.match(ABILITY_PARAMETER_PLACEHOLDER)) return { name, text };
  return { name: `${name} ${parameter}`, text: text.replace(ABILITY_PARAMETER_PLACEHOLDER, parameter) };
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

// Wahapedia files every Space Marines unit/detachment under the single
// faction name "Space Marines"; 40kdc-data files the shared (non-chapter-
// specific) datasheet roster under "Adeptus Astartes" instead — same army,
// different label. Left unreconciled, a Wahapedia-fallback unit (a Legend
// or named character 40kdc hasn't authored yet, e.g. Logan Grimnar) would
// show up as a second, non-overlapping "Space Marines" faction next to the
// real "Adeptus Astartes" one in the faction picker. Normalize fallback
// units to 40kdc's naming so they merge into the one army.
const FACTION_FIXES = {
  "Space Marines": "Adeptus Astartes",
  "Imperial Agents": "Agents of the Imperium",
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

// Matching key between the two sources — diacritic/punctuation-insensitive,
// same spirit as 40kdc's own Collection.find().
function normalizeName(s) {
  return (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildWahapediaCatalog({
  datasheets, modelsByDs, costByDs, wargearByDs, abilitiesByDs, keywordsByDs,
  compositionByDs, optionsByDs, factionNames, abilityLib, canLeadByDs, canBeLedByDs,
}) {
  return datasheets
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
          const { name, text } = fillAbilityParameter(
            lib ? lib.name : a.name,
            stripHtml(lib ? lib.description : a.description),
            a.parameter
          );
          return { name, text, type: a.type };
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
        faction: FACTION_FIXES[factionNames.get(d.faction_id)] || factionNames.get(d.faction_id) || d.faction_id,
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
}

// --- 40kdc-data side ---------------------------------------------------

const ROLE_MAP = {
  character: "Characters",
  "epic-hero": "Characters",
  "dedicated-transport": "Dedicated Transports",
  battleline: "Battleline",
};

function formatBaseSize(b) {
  if (!b) return null;
  if (b.shape === "round") return `${b.diameter}mm`;
  if (b.shape === "oval") return `${b.width}x${b.length}mm`;
  return null;
}

// "Anti-Vehicle 4+", "Sustained Hits 1", "Twin-linked" — reconstructed as
// plain comma-list labels (lowercased; parseWeaponAbilities upper-cases on
// display) from 40kdc's structured per-profile keyword+parameters, since
// that's the format src/lib/weaponAbilities.js already parses.
function formatWeaponKeywordLabel(keywordView, parameters) {
  const p = parameters || {};
  if (keywordView.id === "anti") return `anti-${(p.target_keyword || "").toLowerCase()} ${p.threshold}+`;
  if (p.value != null) return `${keywordView.name.toLowerCase()} ${p.value}`;
  return keywordView.name.toLowerCase();
}

// 40kdc models a weapon like "Guardian spear" as ONE record with multiple
// profiles (a "Ranged" profile and a "Melee" profile) rather than Wahapedia's
// two separate rows — so this walks profiles, not weapon records, splitting
// each into our flat ranged/melee row shape by which stat (BS vs WS) the
// profile carries.
function weaponRowsFor(unitView) {
  const rows = [];
  for (const weapon of unitView.weapons) {
    weapon.raw.profiles.forEach((profile, i) => {
      const isRanged = profile.stats.BS !== undefined;
      const isMelee = profile.stats.WS !== undefined;
      if (!isRanged && !isMelee) return;
      const genericProfileName = profile.name === "Ranged" || profile.name === "Melee";
      const kw = weapon.keywordsAt(i)
        .map(({ keyword, parameters }) => formatWeaponKeywordLabel(keyword, parameters))
        .join(", ");
      rows.push({
        name: genericProfileName ? weapon.name : profile.name,
        range: profile.range === "Melee" ? "Melee" : `${profile.range}"`,
        A: profile.stats.A, skill: profile.stats.BS ?? profile.stats.WS,
        S: profile.stats.S, AP: profile.stats.AP, D: profile.stats.D,
        kw,
        ranged: isRanged,
      });
    });
  }
  return rows;
}

// Composition options (e.g. "4 models" @170pts vs "5 models" @215pts) come
// from the first-copy pricing tier of 40kdc's `points` array — a tier with
// no unit_count_min applies to every copy (the common case); tiers that do
// set it are multi-buy discounts for fielding several copies of the same
// unit, not a block-size choice within one instance, so only tiers covering
// army-copy #1 count here. `models_max` (present for GW block-priced tiers,
// e.g. Venatari Custodians at 4-6 models for one flat cost) becomes a
// range in the description; maxWounds() only reads the leading number, so
// it lands on the cheapest/smallest size in the range — the same kind of
// approximation already accepted for mixed-profile squads.
function compositionFor(unitView) {
  const tiers = (unitView.raw.points || []).filter((p) => (p.unit_count_min ?? 1) <= 1);
  const byModelCount = new Map();
  for (const t of tiers) if (!byModelCount.has(t.models)) byModelCount.set(t.models, t);
  return [...byModelCount.values()]
    .sort((a, b) => a.models - b.models)
    .map((t) => ({
      description: t.models_max && t.models_max !== t.models
        ? `${t.models}-${t.models_max} models`
        : `${t.models} model${t.models === 1 ? "" : "s"}`,
      points: t.cost,
    }));
}

function build40kdcCatalog(ds, textByName) {
  const catalog = [];
  for (const u of ds.units.all) {
    const composition = compositionFor(u);
    if (composition.length === 0) continue; // the couple of units 40kdc hasn't priced yet
    const weapons = weaponRowsFor(u);
    const enrichment = textByName.get(normalizeName(u.name)) || {};
    catalog.push({
      id: u.id,
      name: u.name,
      faction: (u.faction && u.faction.name) || u.raw.faction_id,
      role: ROLE_MAP[u.raw.role] || "Other",
      legend: enrichment.legend || "",
      models: (u.raw.profiles || []).map((p) => ({
        name: p.name, M: p.M, T: p.T, Sv: p.Sv, invSv: p.invuln_sv ?? null,
        W: p.W, Ld: p.Ld, OC: p.OC, baseSize: formatBaseSize(u.raw.base_size_mm),
      })),
      compositionText: composition.map((c) => c.description).join(", "),
      composition,
      ranged: weapons.filter((w) => w.ranged).map(({ ranged, ...w }) => w),
      melee: weapons.filter((w) => !w.ranged).map(({ ranged, ...w }) => w),
      abilities: enrichment.abilities || [],
      keywords: [...(u.raw.keywords || []), ...(u.raw.faction_keywords || [])],
      wargearOptions: enrichment.wargearOptions || [],
      canLead: ds.bodyguardsAttachableFrom(u.id).map((x) => x.id),
      canBeLedBy: ds.leadersAttachableTo(u.id).map((x) => x.id),
    });
  }
  return catalog;
}

async function main() {
  console.log("Fetching Wahapedia data (rules/ability/stratagem text)...");
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

  const wahapediaCatalog = buildWahapediaCatalog({
    datasheets, modelsByDs, costByDs, wargearByDs, abilitiesByDs, keywordsByDs,
    compositionByDs, optionsByDs, factionNames, abilityLib, canLeadByDs, canBeLedByDs,
  });

  console.log("Loading 40kdc-data (stats/points/weapons/keywords/missions)...");
  const ds = Dataset.embedded();

  const textByName = new Map(
    wahapediaCatalog.map((u) => [normalizeName(u.name), {
      legend: u.legend, abilities: u.abilities, wargearOptions: u.wargearOptions,
    }])
  );
  const catalog40kdc = build40kdcCatalog(ds, textByName);

  const covered = new Set(catalog40kdc.map((u) => normalizeName(u.name)));
  const fallback = wahapediaCatalog.filter((u) => !covered.has(normalizeName(u.name)));
  const catalog = [...catalog40kdc, ...fallback];

  const enhancementsByDetachment = groupBy(enhancements, "detachment_id");
  const detachmentRows = groupBy(detachmentAbilities, "detachment_id");
  const detachments = [...detachmentRows.entries()].map(([detachmentId, rows]) => ({
    id: detachmentId,
    faction: FACTION_FIXES[factionNames.get(rows[0].faction_id)] || factionNames.get(rows[0].faction_id) || rows[0].faction_id,
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

  // Enhancement points and stratagem CP costs are numeric facts (same class
  // as unit points, unlike ability/rule prose), so freshen them from 40kdc
  // where a name match exists within the same detachment — matched against
  // wahapedia's own numbers on 2026-08-05, this found 67 enhancements
  // (~9%) and 3 stratagems whose costs had genuinely drifted (wahapedia's
  // export not yet reflecting an errata/dataslate 40kdc already has). Text
  // (name/legend/description) always stays wahapedia's; only the number
  // changes, and only when a match is found — no match means no change.
  const kdcDetachmentByName = new Map(ds.detachments.all.map((d) => [normalizeName(d.name), d]));
  let freshenedEnhancements = 0;
  let freshenedStratagems = 0;

  for (const detachment of detachments) {
    const kdcDet = kdcDetachmentByName.get(normalizeName(detachment.name));
    if (!kdcDet) continue;

    const kdcEnhByName = new Map(
      kdcDet.enhancement_ids.map((id) => ds.enhancements.get(id)).filter(Boolean).map((e) => [normalizeName(e.name), e])
    );
    for (const e of detachment.enhancements) {
      const match = kdcEnhByName.get(normalizeName(e.name));
      if (match && match.cost !== e.points) { e.points = match.cost; freshenedEnhancements++; }
    }

    const kdcStratByName = new Map(
      kdcDet.stratagem_ids.map((id) => ds.stratagems.get(id)).filter(Boolean).map((s) => [normalizeName(s.name), s])
    );
    for (const s of stratagemsByDetachment[detachment.id] || []) {
      const match = kdcStratByName.get(normalizeName(s.name));
      if (match && match.cp_cost !== s.cpCost) { s.cpCost = match.cp_cost; freshenedStratagems++; }
    }
  }
  const kdcCoreStratByName = new Map(
    ds.stratagems.all.filter((s) => !s.detachment_id).map((s) => [normalizeName(s.name), s])
  );
  for (const s of coreStratagems) {
    const match = kdcCoreStratByName.get(normalizeName(s.name));
    if (match && match.cp_cost !== s.cpCost) { s.cpCost = match.cp_cost; freshenedStratagems++; }
  }

  // Chapter Approved 2026-2027 / Force Disposition mission data — real
  // prose text included (unlike per-unit abilities), sourced entirely from
  // 40kdc-data's core (non-enrichment) files.
  const dispositionData = {
    dispositions: ds.forceDispositions.all,
    missions: ds.missions.all,
    matchups: ds.missionMatchups.all,
    cards: ds.missionCards.all,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(new URL("catalog.json", OUT_DIR), JSON.stringify(catalog));
  await writeFile(new URL("detachments.json", OUT_DIR), JSON.stringify(detachments));
  await writeFile(
    new URL("stratagems.json", OUT_DIR),
    JSON.stringify({ core: coreStratagems, byDetachment: stratagemsByDetachment })
  );
  await writeFile(new URL("dispositions.json", OUT_DIR), JSON.stringify(dispositionData));
  await writeFile(
    new URL("meta.json", OUT_DIR),
    JSON.stringify(
      {
        source: "40kdc-data (stats/points/weapons) + wahapedia.ru/wh40k11ed (rules text)",
        lastUpdate: lastUpdate[0]?.last_update || null,
        syncedAt: new Date().toISOString(),
        unitCount: catalog.length,
        unitCount40kdc: catalog40kdc.length,
        unitCountWahapediaFallback: fallback.length,
      },
      null,
      2
    )
  );

  console.log(`Wrote ${catalog.length} units to public/data/catalog.json (${catalog40kdc.length} from 40kdc-data, ${fallback.length} Wahapedia-only fallback)`);
  console.log(`Wrote ${detachments.length} detachments to public/data/detachments.json (${freshenedEnhancements} enhancement costs freshened from 40kdc-data)`);
  console.log(`Wrote ${coreStratagems.length} core + ${Object.keys(stratagemsByDetachment).length} detachments' stratagems to public/data/stratagems.json (${freshenedStratagems} CP costs freshened from 40kdc-data)`);
  console.log(`Wrote ${dispositionData.dispositions.length} dispositions, ${dispositionData.missions.length} missions, ${dispositionData.cards.length} mission cards to public/data/dispositions.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
