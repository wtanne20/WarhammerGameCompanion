import { Link2 } from "lucide-react";
import { factionAccent, unitPoints, compositionOption, currentWounds, maxWounds } from "../lib/catalog.js";

export const STAT_ORDER = ["M", "T", "Sv", "W", "Ld", "OC"];
export const STAT_LABELS = {
  M: "Movement", T: "Toughness", Sv: "Save", W: "Wounds", Ld: "Leadership", OC: "Objective Control",
};

export function weaponLabels(ranged) {
  return ["Range", "Attacks", ranged ? "Ballistic Skill" : "Weapon Skill", "Strength", "Armour Penetration", "Damage"];
}

export function Counter({ label, value, onChange, min = 0, max = Infinity, suffix }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ background: "#1E2228" }}>
      <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>{label}</span>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="font-display text-xl w-9 h-9 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>–</button>
        <span className="font-display text-2xl tnum text-center" style={{ minWidth: 40 }}>{value}{suffix || ""}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="font-display text-xl w-9 h-9 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>+</button>
      </div>
    </div>
  );
}

export function StatBlock({ stats, accent, columns = 2, compact = false }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {stats.map(({ label, value }, i) => (
        <div key={label + i} className="text-center overflow-hidden" style={{ background: "#0F1115" }}>
          <div className={compact ? "fs9 font-semibold uppercase leading-tight py-0.5" : "fs10 font-semibold uppercase tracking-wider py-1 px-1 leading-tight"} style={{ background: accent, color: "#E8E2D4" }}>{label}</div>
          <div className={compact ? "font-display text-sm py-1 tnum leading-none" : "font-display text-lg py-2 tnum leading-none"}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export function Placeholder({ unit, big }) {
  const accent = factionAccent(unit.faction);
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(150deg, ${accent}, #0F1115 85%)` }}>
      <span className="font-display uppercase leading-none select-none" style={{ fontSize: big ? 120 : 56, color: "rgba(232,226,212,0.14)" }}>
        {unit.name.charAt(0)}
      </span>
    </div>
  );
}

export function SectionLabel({ children, icon, accent }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span style={{ color: accent }}>{icon}</span>}
      <h2 className="font-display uppercase tracking-widest text-xs" style={{ color: "#8B929E" }}>{children}</h2>
      <div className="flex-1 h-px" style={{ background: "#2A2E36" }} />
    </div>
  );
}

export function WeaponTable({ title, weapons, ranged, icon, accent }) {
  if (!weapons || weapons.length === 0) return null;
  const labels = weaponLabels(ranged);
  return (
    <section className="px-3 pt-5">
      <SectionLabel icon={icon} accent={accent}>{title}</SectionLabel>
      <div className="mt-2 space-y-2">
        {weapons.map((w, i) => (
          <div key={i} className="px-3 py-3" style={{ background: "#1E2228" }}>
            <div className="font-semibold fs15 mb-2">{w.name}</div>
            <StatBlock accent={accent} columns={2}
              stats={[w.range, w.A, w.skill, w.S, w.AP, w.D].map((value, j) => ({ label: labels[j], value }))} />
            {w.kw && w.kw !== "—" && (<div className="fs11 italic mt-2" style={{ color: "#8B929E", whiteSpace: "pre-line" }}>[{w.kw}]</div>)}
          </div>
        ))}
      </div>
    </section>
  );
}

export function UnitTile({ unit, armyUnits = [], onClick }) {
  const accent = factionAccent(unit.faction);
  const opt = compositionOption(unit);
  const wounds = currentWounds(unit);
  const wMax = maxWounds(unit);
  const damaged = wounds < wMax;
  const primaryModel = unit.models && unit.models[0];
  const leader = unit.leaderInstId ? armyUnits.find((u) => u.instId === unit.leaderInstId) : null;
  const leading = armyUnits.find((u) => u.leaderInstId === unit.instId);

  return (
    <button onClick={onClick} className="w-full flex items-stretch overflow-hidden text-left active:opacity-80 transition-opacity" style={{ background: "#1E2228" }}>
      <div style={{ width: 4, background: accent, flexShrink: 0 }} />
      <div className="relative shrink-0 overflow-hidden" style={{ width: 72 }}>
        {unit.photo ? (
          <img src={unit.photo} alt={unit.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (<Placeholder unit={unit} />)}
      </div>
      <div className="flex-1 min-w-0 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{unit.name}</div>
            <div className="fs9 uppercase tracking-widest mt-0.5" style={{ color: "#8B929E" }}>
              {unit.faction}{opt ? ` · ${opt.description}` : ""}
            </div>
            {(leader || leading) && (
              <div className="flex items-center gap-1 fs9 uppercase tracking-widest mt-0.5" style={{ color: "#B8925A" }}>
                <Link2 size={10} />
                {leader ? `Led by ${leader.name}` : `Leading ${leading.name}`}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-sm tnum" style={{ color: "#B8925A" }}>{unitPoints(unit)}</div>
            {damaged && <div className="fs9 tnum mt-0.5" style={{ color: "#D98C4A" }}>{wounds}/{wMax} W</div>}
          </div>
        </div>
        {primaryModel && (
          <div className="mt-1.5">
            <StatBlock compact accent={accent} columns={6}
              stats={STAT_ORDER.map((k) => ({ label: k, value: primaryModel[k] }))} />
          </div>
        )}
      </div>
    </button>
  );
}
