import { useRef, useState } from "react";
import { ChevronLeft, Trash2, Shield, Swords, Loader2, Camera } from "lucide-react";
import { factionAccent, unitPoints, currentWounds, maxWounds, compositionOption, selectedWeapons } from "../lib/catalog.js";
import { compressImage } from "../lib/image.js";
import { useCloseOnBack } from "../lib/useCloseOnBack.js";
import { Placeholder, SectionLabel, WeaponTable, StatBlock, Counter, STAT_ORDER, STAT_LABELS } from "./shared.jsx";
import EffectsPanel from "./EffectsPanel.jsx";
import WeaponSelector from "./WeaponSelector.jsx";
import PhotoSourceSheet from "./PhotoSourceSheet.jsx";
import ImageSearch from "./ImageSearch.jsx";
import PasteImageUrlSheet from "./PasteImageUrlSheet.jsx";

export default function Datasheet({
  unit, armyUnits, detachment, editing = true, onBack, onRemove, onComposition, onPhoto, onWounds,
  onSetLeader, onSetEnhancement, onAddCustomEffect, onRemoveCustomEffect, onToggleWeapon,
}) {
  const accent = factionAccent(unit.faction);
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  // "source" (take/library/online/url chooser), "search" (online image
  // search), or "url" (paste an image URL) — kept as one piece of state,
  // with a single history entry for the whole flow, so switching between
  // sub-views doesn't push/pop history and a back gesture from any of them
  // always lands straight back on the sheet.
  const [photoFlow, setPhotoFlow] = useState(null);
  const primaryModel = unit.models && unit.models[0];
  const wounds = currentWounds(unit);
  const wMax = maxWounds(unit);
  const selectedComposition = compositionOption(unit);
  const weapons = selectedWeapons(unit);

  useCloseOnBack(!!photoFlow, () => setPhotoFlow(null));

  const pickPhotoFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try { const url = await compressImage(file); await onPhoto(url); } catch { /* bad file */ }
    setBusy(false);
    e.target.value = "";
  };

  const pickOnlineImage = async (dataUrl) => {
    setPhotoFlow(null);
    setBusy(true);
    try { await onPhoto(dataUrl); } finally { setBusy(false); }
  };

  return (
    <div className="pb-10 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 border-b" style={{ background: "var(--wh-bg)", borderColor: "var(--wh-border)" }}>
        <button onClick={onBack} className="p-2 active:opacity-60" style={{ color: "var(--wh-muted)" }}><ChevronLeft size={22} /></button>
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-lg leading-none truncate">{unit.name}</div>
          <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{unit.faction} · {unit.role}</div>
        </div>
        <div className="font-display text-xl tnum px-1" style={{ color: "var(--wh-accent-gold)" }}>{unitPoints(unit)}</div>
        {editing && <button onClick={onRemove} className="p-2 active:opacity-60" style={{ color: "var(--wh-muted)" }}><Trash2 size={18} /></button>}
      </header>

      <div className="relative w-full overflow-hidden" style={{ background: "var(--wh-surface)", aspectRatio: "16 / 10" }}>
        {unit.photo ? (
          <img src={unit.photo} alt={unit.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (<Placeholder unit={unit} big />)}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pickPhotoFile} className="hidden" />
        <input ref={libraryRef} type="file" accept="image/*" onChange={pickPhotoFile} className="hidden" />
        <button onClick={() => setPhotoFlow("source")} disabled={busy}
          className="absolute flex items-center gap-1.5 font-display uppercase tracking-widest fs11 active:opacity-80"
          style={{ bottom: 12, right: 12, padding: "8px 12px", background: "rgba(15,17,21,0.85)", color: "var(--wh-text)" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {unit.photo ? "Change photo" : "Add photo"}
        </button>
      </div>

      {photoFlow === "source" && (
        <PhotoSourceSheet
          onClose={() => setPhotoFlow(null)}
          onTakePhoto={() => { setPhotoFlow(null); cameraRef.current && cameraRef.current.click(); }}
          onChooseLibrary={() => { setPhotoFlow(null); libraryRef.current && libraryRef.current.click(); }}
          onFindOnline={() => setPhotoFlow("search")}
          onPasteUrl={() => setPhotoFlow("url")}
        />
      )}
      {photoFlow === "search" && (
        <ImageSearch unitName={unit.name} onClose={() => setPhotoFlow(null)} onPick={pickOnlineImage} />
      )}
      {photoFlow === "url" && (
        <PasteImageUrlSheet onClose={() => setPhotoFlow(null)} onPick={pickOnlineImage} />
      )}

      {unit.legend && (
        <div className="px-3 pt-4">
          <p className="fs11 italic" style={{ color: "var(--wh-muted)" }}>{unit.legend}</p>
        </div>
      )}

      {primaryModel && (
        <div className="px-3 pt-4">
          <StatBlock accent={accent} columns={2}
            stats={STAT_ORDER.map((k) => ({ label: STAT_LABELS[k], value: primaryModel[k] }))} />
        </div>
      )}

      <div className="px-3 pt-4">
        <Counter label="Wounds remaining" value={wounds} max={wMax} suffix={` / ${wMax}`}
          onChange={(n) => onWounds(unit.instId, n)} />
      </div>

      <EffectsPanel unit={unit} armyUnits={armyUnits} detachment={detachment} accent={accent} editing={editing}
        onSetLeader={onSetLeader} onSetEnhancement={onSetEnhancement}
        onAddCustomEffect={onAddCustomEffect} onRemoveCustomEffect={onRemoveCustomEffect} />

      {unit.composition && unit.composition.length > 0 && (
        <div className="px-3 pt-4">
          <div className="px-4 py-3" style={{ background: "var(--wh-surface)" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Composition</span>
              {unit.compositionText && <span className="fs10 text-right" style={{ color: "var(--wh-dim)" }}>{unit.compositionText}</span>}
            </div>
            {editing && unit.composition.length > 1 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {unit.composition.map((opt, i) => {
                  const active = i === unit.compositionIndex;
                  return (
                    <button key={i} onClick={() => onComposition(i)} className="text-left px-3 py-2"
                      style={{ background: active ? accent : "var(--wh-surface-alt)", color: active ? "var(--wh-text)" : "var(--wh-text-body)" }}>
                      <div className="font-display text-sm leading-none">{opt.description}</div>
                      <div className="fs10 tnum mt-1" style={{ color: active ? "rgba(232,226,212,0.8)" : "var(--wh-muted)" }}>{opt.points} pts</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <span className="font-display text-lg">{selectedComposition.description}</span>
                <span className="font-display text-lg tnum" style={{ color: "var(--wh-accent-gold)" }}>{selectedComposition.points} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && <WeaponSelector unit={unit} accent={accent} onToggle={(category, name) => onToggleWeapon(unit.instId, category, name)} />}

      <WeaponTable title="Ranged weapons" icon={<Swords size={13} />} weapons={weapons.ranged} ranged accent={accent} />
      <WeaponTable title="Melee weapons" icon={<Swords size={13} />} weapons={weapons.melee} accent={accent} />

      {unit.abilities && unit.abilities.length > 0 && (
        <section className="px-3 pt-5">
          <SectionLabel icon={<Shield size={13} />} accent={accent}>Abilities</SectionLabel>
          <div className="mt-2 space-y-px">
            {unit.abilities.map((ab, i) => (
              <div key={i} className="px-4 py-3" style={{ background: "var(--wh-surface)" }}>
                <span className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{ab.name}.</span>{" "}
                <span style={{ color: "var(--wh-text-body)", whiteSpace: "pre-line" }}>{ab.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-3 pt-5">
        <SectionLabel accent={accent}>Keywords</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {unit.keywords.map((k) => (<span key={k} className="fs10 uppercase tracking-widest px-2 py-1" style={{ background: "var(--wh-surface)", color: "var(--wh-muted)" }}>{k}</span>))}
        </div>
      </section>
    </div>
  );
}
