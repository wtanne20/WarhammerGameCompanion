import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Loader2, Shield, X } from "lucide-react";
import { uid } from "./lib/id.js";
import { fetchCatalog, armyPoints, refreshUnits } from "./lib/catalog.js";
import {
  loadArmyIndex, createArmy, deleteArmy, loadArmy, saveArmy,
  setUnitPhoto, deleteUnitPhoto, getActiveArmyId, setActiveArmyId, refreshAllArmies,
} from "./lib/armies.js";
import { checkForDataUpdate } from "./lib/updateNotice.js";
import { refreshDataFromRemote } from "./lib/remoteData.js";
import { checkForAppUpdate, downloadAndInstallUpdate } from "./lib/appUpdate.js";
import { shareArmy, importArmy } from "./lib/shareArmy.js";
import { loadOwned, saveOwned } from "./lib/collection.js";
import { fetchDetachments, detachmentsForFaction } from "./lib/detachments.js";
import { fetchStratagems } from "./lib/stratagems.js";
import { fetchIconManifest } from "./lib/icons.js";
import { useCloseOnBack } from "./lib/useCloseOnBack.js";
import { useMediaQuery } from "./lib/useMediaQuery.js";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ArmyList from "./components/ArmyList.jsx";
import Roster from "./components/Roster.jsx";
import Datasheet from "./components/Datasheet.jsx";
import AddSheet from "./components/AddSheet.jsx";
import ImportArmySheet from "./components/ImportArmySheet.jsx";
import FactionPicker from "./components/FactionPicker.jsx";
import DetachmentPicker from "./components/DetachmentPicker.jsx";
import IconPicker from "./components/IconPicker.jsx";
import GameTracker from "./components/GameTracker.jsx";
import MyUnits from "./components/MyUnits.jsx";

const fontCss = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  .font-display { font-family: 'Oswald', sans-serif; }
  .font-body { font-family: 'IBM Plex Sans', sans-serif; }
  .tnum { font-variant-numeric: tabular-nums; }
  .fs9 { font-size: 9px; } .fs10 { font-size: 10px; } .fs11 { font-size: 11px; } .fs15 { font-size: 15px; }
  * { -webkit-tap-highlight-color: transparent; }
  input, textarea { font-family: inherit; }
`;

const dataUpdatedMessage = (refreshedArmyCount) =>
  refreshedArmyCount > 0
    ? `Rules data updated — ${refreshedArmyCount} arm${refreshedArmyCount === 1 ? "y" : "ies"} refreshed automatically.`
    : "Rules data updated.";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [meta, setMeta] = useState(null);
  const [armies, setArmies] = useState([]);
  const [tab, setTab] = useState("armies");
  const [activeArmyId, setActiveArmyIdState] = useState(null);
  const [army, setArmy] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [creatingArmy, setCreatingArmy] = useState(false);
  const [importingArmy, setImportingArmy] = useState(false);
  const [owned, setOwned] = useState(new Map());
  const [detachments, setDetachments] = useState([]);
  const [pickingDetachment, setPickingDetachment] = useState(false);
  const [stratagems, setStratagems] = useState(null);
  const [icons, setIcons] = useState([]);
  const [pickingIcon, setPickingIcon] = useState(false);
  const [updateNotice, setUpdateNotice] = useState(null);
  const [appUpdate, setAppUpdate] = useState(null);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  // Landscape tablets (and wide-enough rotated phones) get a two-pane
  // roster + datasheet split view instead of the datasheet taking over the
  // whole screen. Portrait/narrow layout below this breakpoint is untouched.
  const isWide = useMediaQuery("(min-width: 768px)");

  // Each full-screen/overlay view closes on the device back gesture instead
  // of exiting the app.
  useCloseOnBack(!!selectedUnitId, () => setSelectedUnitId(null));
  useCloseOnBack(adding, () => setAdding(false));
  useCloseOnBack(creatingArmy, () => setCreatingArmy(false));
  useCloseOnBack(importingArmy, () => setImportingArmy(false));
  useCloseOnBack(pickingDetachment, () => setPickingDetachment(false));
  useCloseOnBack(pickingIcon, () => setPickingIcon(false));

  const factions = useMemo(() => [...new Set(catalog.map((c) => c.faction))].sort(), [catalog]);
  const detachment = useMemo(
    () => (army?.detachmentId ? detachments.find((d) => d.id === army.detachmentId) : null) || null,
    [army, detachments]
  );

  useEffect(() => {
    (async () => {
      let units = [];
      let metaData = null;
      try {
        const res = await fetchCatalog();
        units = res.units;
        metaData = res.meta;
        setCatalog(units);
        setMeta(res.meta);
      } catch (err) {
        setCatalogError(err.message);
      }
      try {
        setDetachments(await fetchDetachments());
      } catch { /* detachment features degrade gracefully without this */ }
      try {
        setStratagems(await fetchStratagems());
      } catch { /* stratagems section just won't render without this */ }
      try {
        setIcons(await fetchIconManifest());
      } catch { /* icon library just won't have results; upload still works */ }

      // Refresh every stored army against the fresh catalog — not just
      // whichever one ends up active below — so a data sync (updated
      // stats, points, or rules) reaches all of them without the user
      // having to open each one manually.
      const refreshedArmyCount = units.length ? await refreshAllArmies(units) : 0;

      const index = await loadArmyIndex();
      setArmies(index);
      const activeId = await getActiveArmyId();
      if (activeId && index.some((a) => a.id === activeId)) {
        setActiveArmyIdState(activeId);
        const loaded = await loadArmy(activeId);
        setArmy({ ...loaded, units: refreshUnits(loaded.units, units) });
      }
      setOwned(await loadOwned());

      if (metaData && (await checkForDataUpdate(metaData))) {
        setUpdateNotice(dataUpdatedMessage(refreshedArmyCount));
      }

      setLoading(false);
      checkForAppUpdate().then(setAppUpdate).catch(() => {});

      // Native only, and only after first paint: the bundled/cached data
      // above might already be behind whatever scripts/sync-data.mjs has
      // since published to GitHub Pages (this APK's copy is frozen at build
      // time). Check that live source and, if it's newer, swap it in for
      // this session too — not blocking startup on a network round trip.
      if (Capacitor.isNativePlatform()) {
        const remoteMeta = await refreshDataFromRemote(metaData);
        if (remoteMeta) {
          const [freshCatalog, freshDetachments, freshStratagems] = await Promise.all([
            fetchCatalog(),
            fetchDetachments().catch(() => null),
            fetchStratagems().catch(() => null),
          ]);
          setCatalog(freshCatalog.units);
          setMeta(freshCatalog.meta);
          if (freshDetachments) setDetachments(freshDetachments);
          if (freshStratagems) setStratagems(freshStratagems);
          const refreshedCount = await refreshAllArmies(freshCatalog.units);
          setArmy((a) => (a ? { ...a, units: refreshUnits(a.units, freshCatalog.units) } : a));
          if (await checkForDataUpdate(freshCatalog.meta)) {
            setUpdateNotice(dataUpdatedMessage(refreshedCount));
          }
        }
      }
    })();
  }, []);

  const setOwnedQty = (catalogId, qty) => {
    setOwned((prev) => {
      const next = new Map(prev);
      if (qty > 0) next.set(catalogId, qty);
      else next.delete(catalogId);
      saveOwned(next);
      return next;
    });
  };

  useEffect(() => {
    if (!army) return;
    (async () => {
      await saveArmy(army);
      const points = armyPoints(army);
      setArmies((prev) => prev.map((a) => (a.id === army.id ? { ...a, name: army.name, icon: army.icon, points, unitCount: army.units.length } : a)));
    })();
  }, [army]);

  const openArmy = async (id) => {
    const loaded = await loadArmy(id);
    setArmy({ ...loaded, units: refreshUnits(loaded.units, catalog) });
    setActiveArmyIdState(id);
    await setActiveArmyId(id);
    setTab("units");
  };
  const pickFaction = async (faction) => {
    const created = await createArmy(faction, faction);
    setArmies((prev) => [...prev, { id: created.id, name: created.name, faction, points: 0, unitCount: 0 }]);
    setArmy(created);
    setActiveArmyIdState(created.id);
    await setActiveArmyId(created.id);
    setCreatingArmy(false);
    setTab("units");
  };
  const removeArmy = (id) => {
    setConfirmDialog({
      message: "Delete this army? This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteArmy(id);
        setArmies((prev) => prev.filter((a) => a.id !== id));
        if (id === activeArmyId) {
          setArmy(null);
          setActiveArmyIdState(null);
        }
      },
    });
  };

  const handleShareArmy = async (id) => {
    try {
      await shareArmy(id);
    } catch (err) {
      console.error("Failed to share army", err);
    }
  };
  const handleImportArmy = async (armyData) => {
    const created = await importArmy(armyData);
    setArmies((prev) => [
      ...prev,
      { id: created.id, name: created.name, faction: created.faction, icon: created.icon, points: armyPoints(created), unitCount: created.units.length },
    ]);
    setImportingArmy(false);
  };

  const handleInstallUpdate = async () => {
    if (!appUpdate) return;
    setInstallingUpdate(true);
    try {
      await downloadAndInstallUpdate(appUpdate.downloadUrl);
    } catch (err) {
      console.error("Failed to download/install update", err);
    } finally {
      setInstallingUpdate(false);
    }
  };

  const addUnit = (cat) => {
    setArmy((a) => ({ ...a, units: [...a.units, { ...cat, instId: uid(), compositionIndex: 0 }] }));
  };
  const removeUnit = (instId) => {
    setArmy((a) => ({ ...a, units: a.units.filter((u) => u.instId !== instId) }));
    deleteUnitPhoto(instId);
    setSelectedUnitId((cur) => (cur === instId ? null : cur));
  };
  const duplicateUnit = (instId) => {
    setArmy((a) => {
      const index = a.units.findIndex((u) => u.instId === instId);
      if (index === -1) return a;
      const copy = { ...a.units[index], instId: uid(), leaderInstId: undefined, photo: undefined, woundsRemaining: undefined, customEffects: [] };
      const units = [...a.units];
      units.splice(index + 1, 0, copy);
      return { ...a, units };
    });
  };
  const setComposition = (instId, index) => {
    setArmy((a) => ({ ...a, units: a.units.map((u) => (u.instId === instId ? { ...u, compositionIndex: index } : u)) }));
  };
  const setPhoto = async (instId, dataUrl) => {
    setArmy((a) => ({ ...a, units: a.units.map((u) => (u.instId === instId ? { ...u, photo: dataUrl } : u)) }));
    await setUnitPhoto(instId, dataUrl);
  };

  const setMode = (mode) => {
    setArmy((a) => ({ ...a, mode }));
  };
  const pickIcon = (icon) => {
    setArmy((a) => ({ ...a, icon }));
    setPickingIcon(false);
  };
  const pickDetachment = (id) => {
    setArmy((a) => ({ ...a, detachmentId: id }));
    setPickingDetachment(false);
  };
  const resetGame = () => {
    setConfirmDialog({
      message: "Reset wounds and effects for every unit in this army?",
      confirmLabel: "Reset",
      onConfirm: () => {
        setArmy((a) => ({ ...a, units: a.units.map((u) => ({ ...u, woundsRemaining: undefined, customEffects: [] })) }));
        setConfirmDialog(null);
      },
    });
  };
  const setWounds = (instId, n) => {
    setArmy((a) => ({ ...a, units: a.units.map((u) => (u.instId === instId ? { ...u, woundsRemaining: n } : u)) }));
  };
  const setLeader = (followerInstId, leaderInstId) => {
    setArmy((a) => ({
      ...a,
      units: a.units.map((u) => {
        if (u.instId === followerInstId) return { ...u, leaderInstId };
        if (leaderInstId && u.leaderInstId === leaderInstId) return { ...u, leaderInstId: null };
        return u;
      }),
    }));
  };
  const setEnhancement = (instId, enhancementId) => {
    setArmy((a) => ({ ...a, units: a.units.map((u) => (u.instId === instId ? { ...u, enhancementId } : u)) }));
  };
  const addCustomEffect = (instId, text) => {
    setArmy((a) => ({
      ...a,
      units: a.units.map((u) => (u.instId === instId ? { ...u, customEffects: [...(u.customEffects || []), { id: uid(), text }] } : u)),
    }));
  };
  const removeCustomEffect = (instId, effectId) => {
    setArmy((a) => ({
      ...a,
      units: a.units.map((u) => (u.instId === instId ? { ...u, customEffects: (u.customEffects || []).filter((e) => e.id !== effectId) } : u)),
    }));
  };
  const toggleWeapon = (instId, category, name) => {
    setArmy((a) => ({
      ...a,
      units: a.units.map((u) => {
        if (u.instId !== instId) return u;
        const current = u.weaponSelection || { ranged: u.ranged.map((w) => w.name), melee: u.melee.map((w) => w.name) };
        const list = current[category];
        const nextList = list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
        return { ...u, weaponSelection: { ...current, [category]: nextList } };
      }),
    }));
  };

  if (loading) {
    return (
      <div className="font-body min-h-screen flex items-center justify-center" style={{ background: "#14161A", color: "#8B929E" }}>
        <style>{fontCss}</style>
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  const selectedUnit = army && army.units.find((u) => u.instId === selectedUnitId);

  return (
    <div className="font-body min-h-screen" style={{ background: "#14161A", color: "#E8E2D4" }}>
      <style>{fontCss}</style>
      {catalogError && (
        <div className="px-4 py-2 fs11 text-center" style={{ background: "#3A1414", color: "#E8B4B4" }}>
          Couldn't load the unit catalog ({catalogError}). Run <code>npm run sync-data</code> and reload.
        </div>
      )}
      {updateNotice && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 fs11 text-center" style={{ background: "#2A2413", color: "#D9C48A" }}>
          <span>{updateNotice}</span>
          <button onClick={() => setUpdateNotice(null)} className="shrink-0 active:opacity-70" style={{ color: "#D9C48A" }}><X size={14} /></button>
        </div>
      )}
      {appUpdate && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 fs11 text-center" style={{ background: "#132A1F", color: "#8AD9A8" }}>
          <span>App update available.</span>
          <button onClick={handleInstallUpdate} disabled={installingUpdate}
            className="shrink-0 px-3 py-1 uppercase tracking-widest active:opacity-70 disabled:opacity-50"
            style={{ background: "#1F5C3A", color: "#E8E2D4" }}>
            {installingUpdate ? "Downloading…" : "Update"}
          </button>
          <button onClick={() => setAppUpdate(null)} className="shrink-0 active:opacity-70" style={{ color: "#8AD9A8" }}><X size={14} /></button>
        </div>
      )}

      {selectedUnit && !isWide ? (
        <Datasheet unit={selectedUnit} armyUnits={army.units} detachment={detachment} editing={(army.mode || "edit") === "edit"}
          onBack={() => setSelectedUnitId(null)}
          onRemove={() => removeUnit(selectedUnit.instId)}
          onComposition={(index) => setComposition(selectedUnit.instId, index)}
          onPhoto={(url) => setPhoto(selectedUnit.instId, url)}
          onWounds={setWounds}
          onSetLeader={setLeader}
          onSetEnhancement={setEnhancement}
          onAddCustomEffect={addCustomEffect}
          onRemoveCustomEffect={removeCustomEffect}
          onToggleWeapon={toggleWeapon} />
      ) : (
        <>
          {tab === "my-units" && (
            <MyUnits catalog={catalog} owned={owned} onSetQty={setOwnedQty} />
          )}

          {tab === "armies" && (
            <ArmyList armies={armies} meta={meta} activeArmyId={activeArmyId}
              onSelect={openArmy} onCreate={() => setCreatingArmy(true)} onDelete={removeArmy}
              onShare={handleShareArmy} onImport={() => setImportingArmy(true)} />
          )}

          {tab === "units" && (
            army ? (
              isWide ? (
                <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
                  <div className="overflow-y-auto shrink-0" style={{ width: 400, borderRight: "1px solid #2A2E36" }}>
                    <Roster army={army} detachment={detachment} stratagems={stratagems}
                      onRename={(name) => setArmy((a) => ({ ...a, name }))}
                      onSelect={setSelectedUnitId}
                      onAdd={() => setAdding(true)}
                      onOpenDetachmentPicker={() => setPickingDetachment(true)}
                      onResetGame={resetGame}
                      onSetMode={setMode}
                      onOpenIconPicker={() => setPickingIcon(true)}
                      selectedUnitId={selectedUnitId}
                      fixedAddButton={false}
                      onDuplicateUnit={duplicateUnit}
                      onDeleteUnit={removeUnit} />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {selectedUnit ? (
                      <Datasheet unit={selectedUnit} armyUnits={army.units} detachment={detachment} editing={(army.mode || "edit") === "edit"}
                        onBack={() => setSelectedUnitId(null)}
                        onRemove={() => removeUnit(selectedUnit.instId)}
                        onComposition={(index) => setComposition(selectedUnit.instId, index)}
                        onPhoto={(url) => setPhoto(selectedUnit.instId, url)}
                        onWounds={setWounds}
                        onSetLeader={setLeader}
                        onSetEnhancement={setEnhancement}
                        onAddCustomEffect={addCustomEffect}
                        onRemoveCustomEffect={removeCustomEffect}
                        onToggleWeapon={toggleWeapon} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6" style={{ color: "#6B7280" }}>
                        <Shield size={28} className="mb-3" style={{ color: "#2A2E36" }} />
                        <p className="font-display uppercase tracking-wide text-base" style={{ color: "#8B929E" }}>Select a unit</p>
                        <p className="text-sm mt-1">Its datasheet will open here.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Roster army={army} detachment={detachment} stratagems={stratagems}
                  onRename={(name) => setArmy((a) => ({ ...a, name }))}
                  onSelect={setSelectedUnitId}
                  onAdd={() => setAdding(true)}
                  onOpenDetachmentPicker={() => setPickingDetachment(true)}
                  onResetGame={resetGame}
                  onSetMode={setMode}
                  onOpenIconPicker={() => setPickingIcon(true)}
                  onDuplicateUnit={duplicateUnit}
                  onDeleteUnit={removeUnit} />
              )
            ) : (
              <div className="pb-24 px-6 pt-24 text-center max-w-xl mx-auto" style={{ color: "#8B929E" }}>
                <Shield size={28} className="mx-auto mb-3" style={{ color: "#2A2E36" }} />
                <p className="font-display uppercase tracking-wide text-lg" style={{ color: "#E8E2D4" }}>No army selected</p>
                <p className="text-sm mt-1 mb-5">Pick or start an army to see its units here.</p>
                <button onClick={() => setTab("armies")} className="px-5 py-3 font-display uppercase tracking-widest text-sm"
                  style={{ background: "#8E1D22", color: "#E8E2D4" }}>Go to Armies</button>
              </div>
            )
          )}

          {tab === "tracker" && <GameTracker />}

          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}

      {adding && army && <AddSheet catalog={catalog} faction={army.faction} owned={owned} onClose={() => setAdding(false)} onPick={addUnit} />}
      {creatingArmy && <FactionPicker factions={factions} onClose={() => setCreatingArmy(false)} onPick={pickFaction} />}
      {importingArmy && <ImportArmySheet onClose={() => setImportingArmy(false)} onImport={handleImportArmy} />}
      {pickingDetachment && army && (
        <DetachmentPicker detachments={detachmentsForFaction(detachments, army.faction)}
          onClose={() => setPickingDetachment(false)} onPick={pickDetachment} />
      )}
      {pickingIcon && army && (
        <IconPicker icons={icons} onClose={() => setPickingIcon(false)} onPick={pickIcon} />
      )}
      <ConfirmDialog open={!!confirmDialog} message={confirmDialog?.message} confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger} onConfirm={() => confirmDialog?.onConfirm()} onCancel={() => setConfirmDialog(null)} />
    </div>
  );
}
