import { useRef, useState } from "react";
import { ChevronLeft, Trash2, Shield, Swords, Loader2, Camera } from "lucide-react";
import { factionAccent, unitPoints, currentWounds, maxWounds, compositionOption, selectedWeapons } from "../lib/catalog.js";
import { compressImage } from "../lib/image.js";
import { Placeholder, SectionLabel, WeaponTable, StatBlock, Counter, STAT_ORDER, STAT_LABELS } from "./shared.jsx";
import EffectsPanel from "./EffectsPanel.jsx";
import WeaponSelector from "./WeaponSelector.jsx";

export default function Datasheet({
  unit, armyUnits, detachment, editing = true, onBack, onRemove, onComposition, onPhoto, onWounds,
  onSetLeader, onSetEnhancement, onAddCustomEffect, onRemoveCustomEffect, onToggleWeapon,
}) {
  const accent = factionAccent(unit.faction);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const primaryModel = unit.models && unit.models[0];
  const wounds = currentWounds(unit);
  const wMax = maxWounds(unit);
  const selectedComposition = compositionOption(unit);
  const weapons = selectedWeapons(unit);

  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try { const url = await compressImage(file); await onPhoto(url); } catch { /* bad file */ }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div className="pb-10 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 border-b" style={{ background: "#14161A", borderColor: "#2A2E36" }}>
        <button onClick={onBack} className="p-2 active:opacity-60" style={{ color: "#8B929E" }}><ChevronLeft size={22} /></button>
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-lg leading-none truncate">{unit.name}</div>
          <div className="fs10 uppercase tracking-widest" style={{ color: "#8B929E" }}>{unit.faction} · {unit.role}</div>
        </div>
        <div className="font-display text-xl tnum px-1" style={{ color: "#B8925A" }}>{unitPoints(unit)}</div>
        {editing && <button onClick={onRemove} className="p-2 active:opacity-60" style={{ color: "#8B929E" }}><Trash2 size={18} /></button>}
      </header>

      <div className="relative w-full overflow-hidden" style={{ background: "#1E2228", aspectRatio: "16 / 10" }}>
        {unit.photo ? (
          <img src={unit.photo} alt={unit.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (<Placeholder unit={unit} big />)}
        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        <button onClick={() => fileRef.current && fileRef.current.click()}
          className="absolute flex items-center gap-1.5 font-display uppercase tracking-widest fs11 active:opacity-80"
          style={{ bottom: 12, right: 12, padding: "8px 12px", background: "rgba(15,17,21,0.85)", color: "#E8E2D4" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {unit.photo ? "Change photo" : "Add photo"}
        </button>
      </div>

      {unit.legend && (
        <div className="px-3 pt-4">
          <p className="fs11 italic" style={{ color: "#8B929E" }}>{unit.legend}</p>
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
          <div className="px-4 py-3" style={{ background: "#1E2228" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Composition</span>
              {unit.compositionText && <span className="fs10 text-right" style={{ color: "#6B7280" }}>{unit.compositionText}</span>}
            </div>
            {editing && unit.composition.length > 1 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {unit.composition.map((opt, i) => {
                  const active = i === unit.compositionIndex;
                  return (
                    <button key={i} onClick={() => onComposition(i)} className="text-left px-3 py-2"
                      style={{ background: active ? accent : "#0F1115", color: active ? "#E8E2D4" : "#C5C9D0" }}>
                      <div className="font-display text-sm leading-none">{opt.description}</div>
                      <div className="fs10 tnum mt-1" style={{ color: active ? "rgba(232,226,212,0.8)" : "#8B929E" }}>{opt.points} pts</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <span className="font-display text-lg">{selectedComposition.description}</span>
                <span className="font-display text-lg tnum" style={{ color: "#B8925A" }}>{selectedComposition.points} pts</span>
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
              <div key={i} className="px-4 py-3" style={{ background: "#1E2228" }}>
                <span className="font-semibold" style={{ color: "#B8925A" }}>{ab.name}.</span>{" "}
                <span style={{ color: "#C5C9D0", whiteSpace: "pre-line" }}>{ab.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-3 pt-5">
        <SectionLabel accent={accent}>Keywords</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {unit.keywords.map((k) => (<span key={k} className="fs10 uppercase tracking-widest px-2 py-1" style={{ background: "#1E2228", color: "#8B929E" }}>{k}</span>))}
        </div>
      </section>
    </div>
  );
}
