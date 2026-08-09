import { useState } from "react";
import { Link2, Copy, Trash2 } from "lucide-react";
import { factionAccent, unitPoints, compositionOption, currentWounds, maxWounds } from "../lib/catalog.js";
import { parseWeaponAbilities } from "../lib/weaponAbilities.js";

export const STAT_ORDER = ["M", "T", "Sv", "W", "Ld", "OC"];
export const STAT_LABELS = {
  M: "Movement", T: "Toughness", Sv: "Save", W: "Wounds", Ld: "Leadership", OC: "Objective Control",
};

export function formatSyncDate(meta) {
  if (!meta?.lastUpdate) return null;
  const d = new Date(meta.lastUpdate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return meta.lastUpdate;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function weaponLabels(ranged) {
  return ["Range", "Attacks", ranged ? "Ballistic Skill" : "Weapon Skill", "Strength", "Armour Penetration", "Damage"];
}

export function Counter({ label, value, onChange, min = 0, max = Infinity, suffix }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--wh-surface)" }}>
      <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{label}</span>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="font-display text-xl w-9 h-9 flex items-center justify-center" style={{ background: "var(--wh-surface-alt)", color: "var(--wh-text)" }}>–</button>
        <span className="font-display text-2xl tnum text-center" style={{ minWidth: 40 }}>{value}{suffix || ""}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="font-display text-xl w-9 h-9 flex items-center justify-center" style={{ background: "var(--wh-surface-alt)", color: "var(--wh-text)" }}>+</button>
      </div>
    </div>
  );
}

export function StatBlock({ stats, accent, columns = 2, compact = false }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {stats.map(({ label, value }, i) => (
        <div key={label + i} className="text-center overflow-hidden" style={{ background: "var(--wh-surface-alt)" }}>
          <div className={compact ? "fs9 font-semibold uppercase leading-tight py-0.5" : "fs10 font-semibold uppercase tracking-wider py-1 px-1 leading-tight"} style={{ background: accent, color: "var(--wh-text)" }}>{label}</div>
          <div className={compact ? "font-display text-sm py-1 tnum leading-none" : "font-display text-lg py-2 tnum leading-none"}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export function Placeholder({ unit, big }) {
  const accent = factionAccent(unit.faction);
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(150deg, ${accent}, var(--wh-surface-alt) 85%)` }}>
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
      <h2 className="font-display uppercase tracking-widest text-xs" style={{ color: "var(--wh-muted)" }}>{children}</h2>
      <div className="flex-1 h-px" style={{ background: "var(--wh-border)" }} />
    </div>
  );
}

// Each bracketed ability on a weapon (e.g. "[TORRENT]") becomes its own
// small tappable chip; tapping one that matches the core-rules glossary
// (see lib/weaponAbilities.js) expands a plain-language description below
// the chip row. Unrecognized ones (unique flavor-named weapon rules) still
// display, just without a description.
function WeaponAbilityChips({ kw, accent }) {
  const [openLabel, setOpenLabel] = useState(null);
  const abilities = parseWeaponAbilities(kw);
  if (abilities.length === 0) return null;
  const open = abilities.find((a) => a.label === openLabel);

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {abilities.map((a) => (
          <button key={a.label} onClick={() => a.description && setOpenLabel(openLabel === a.label ? null : a.label)}
            disabled={!a.description}
            className="fs10 uppercase tracking-widest px-2 py-1 active:opacity-70"
            style={{
              background: openLabel === a.label ? accent : "var(--wh-surface-alt)",
              color: openLabel === a.label ? "var(--wh-text)" : a.description ? "var(--wh-text-body)" : "var(--wh-dim)",
            }}>
            {a.label}
          </button>
        ))}
      </div>
      {open && (
        <div className="fs11 mt-2 px-3 py-2" style={{ background: "var(--wh-surface-alt)", color: "var(--wh-text-body)" }}>
          <span className="font-semibold uppercase" style={{ color: "var(--wh-accent-gold)" }}>{open.label}</span> — {open.description}
        </div>
      )}
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
          <div key={i} className="px-3 py-3" style={{ background: "var(--wh-surface)" }}>
            <div className="font-semibold fs15 mb-2">{w.name}</div>
            <StatBlock accent={accent} columns={2}
              stats={[w.range, w.A, w.skill, w.S, w.AP, w.D].map((value, j) => ({ label: labels[j], value }))} />
            <WeaponAbilityChips kw={w.kw} accent={accent} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function UnitTile({ unit, armyUnits = [], selected = false, editing = false, onClick, onDuplicate, onDelete }) {
  const accent = factionAccent(unit.faction);
  const opt = compositionOption(unit);
  const wounds = currentWounds(unit);
  const wMax = maxWounds(unit);
  const damaged = wounds < wMax;
  const primaryModel = unit.models && unit.models[0];
  const leader = unit.leaderInstId ? armyUnits.find((u) => u.instId === unit.leaderInstId) : null;
  const leading = armyUnits.find((u) => u.leaderInstId === unit.instId);

  return (
    <div className="w-full flex items-stretch overflow-hidden" style={{ background: selected ? "var(--wh-surface-selected)" : "var(--wh-surface)" }}>
      <button onClick={onClick} className="flex-1 min-w-0 flex items-stretch text-left active:opacity-80 transition-opacity">
        <div style={{ width: 4, background: selected ? "var(--wh-accent)" : accent, flexShrink: 0 }} />
        <div className="relative shrink-0 overflow-hidden" style={{ width: 72 }}>
          {unit.photo ? (
            <img src={unit.photo} alt={unit.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (<Placeholder unit={unit} />)}
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{unit.name}</div>
              <div className="fs9 uppercase tracking-widest mt-0.5" style={{ color: "var(--wh-muted)" }}>
                {unit.faction}{opt ? ` · ${opt.description}` : ""}
              </div>
              {(leader || leading) && (
                <div className="flex items-center gap-1 fs9 uppercase tracking-widest mt-0.5" style={{ color: "var(--wh-accent-gold)" }}>
                  <Link2 size={10} />
                  {leader ? `Led by ${leader.name}` : `Leading ${leading.name}`}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-sm tnum" style={{ color: "var(--wh-accent-gold)" }}>{unitPoints(unit)}</div>
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
      {editing && (
        <div className="flex flex-col shrink-0" style={{ width: 40, borderLeft: "1px solid var(--wh-bg)" }}>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate && onDuplicate(); }}
            className="flex-1 flex items-center justify-center active:opacity-70" title="Duplicate unit" style={{ color: "var(--wh-muted)" }}>
            <Copy size={15} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
            className="flex-1 flex items-center justify-center active:opacity-70 border-t" title="Delete unit"
            style={{ color: "#C97B7B", borderColor: "var(--wh-bg)" }}>
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
