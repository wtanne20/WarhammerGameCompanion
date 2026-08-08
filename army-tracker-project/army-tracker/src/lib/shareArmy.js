// Exporting/importing an army as a standalone JSON file, so one person can
// hand a list to another without any server — the native Share sheet (or a
// browser download when running outside the native app) does the actual
// transport. Deliberately no live sync: this is a one-shot copy, matching
// what was asked for ("just export/send a list to someone else").

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { uid } from "./id.js";
import { loadArmy, createArmy, saveArmy } from "./armies.js";

const KIND = "army-tracker-army";
const VERSION = 1;

function slugify(name) {
  return (name || "army").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "") || "army";
}

// Per-unit fields that are this device's in-game/local state rather than
// part of "the list" — same fields duplicateUnit() already resets for a
// fresh copy within one army, for the same reason.
function stripUnit(u) {
  const { photo, woundsRemaining, customEffects, leaderInstId, ...rest } = u;
  return rest;
}

export async function armyExportPayload(armyId) {
  const army = await loadArmy(armyId);
  if (!army) throw new Error("Army not found.");
  return {
    kind: KIND,
    version: VERSION,
    army: {
      name: army.name,
      faction: army.faction,
      icon: army.icon,
      detachmentId: army.detachmentId,
      units: army.units.map(stripUnit),
    },
  };
}

export async function shareArmy(armyId) {
  const payload = await armyExportPayload(armyId);
  const json = JSON.stringify(payload, null, 2);
  const fileName = `${slugify(payload.army.name)}.armytracker.json`;

  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: "utf8" });
    await Share.share({ title: payload.army.name, dialogTitle: "Share army list", url: written.uri });
    return;
  }

  if (navigator.share) {
    const file = new File([json], fileName, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: payload.army.name });
      return;
    }
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseArmyImport(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("That doesn't look like a valid army file.");
  }
  if (!payload || payload.kind !== KIND || !payload.army) {
    throw new Error("That file isn't an Army Tracker export.");
  }
  return payload.army;
}

export async function importArmy(armyData) {
  const created = await createArmy(armyData.name, armyData.faction ?? null);
  const army = {
    ...created,
    icon: armyData.icon,
    detachmentId: armyData.detachmentId,
    units: (armyData.units || []).map((u) => ({ ...u, instId: uid() })),
  };
  await saveArmy(army);
  return army;
}
