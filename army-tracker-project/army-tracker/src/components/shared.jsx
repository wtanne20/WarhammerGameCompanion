import { Fragment, useEffect, useState } from "react";
import { Link2, Copy, Trash2, X } from "lucide-react";
import { factionAccent, unitPoints, compositionOption, currentWounds, maxWounds, modelWounds } from "../lib/catalog.js";
import { parseWeaponAbilities } from "../lib/weaponAbilities.js";
import { showRule, onShowRule, lookupRule, tokenizeRulesText, STAT_RULES } from "../lib/rules.js";
import { useCloseOnBack } from "../lib/useCloseOnBack.js";

export const STAT_ORDER = ["M", "T", "Sv", "W", "Ld", "OC"];
export const STAT_LABELS = {
  M: "Movement", T: "Toughness", Sv: "Save", W: "Wounds", Ld: "Leadership", OC: "Objective Control",
};

// Datasheets print skills and invulnerable saves as "3+"; the data stores
// some as bare numbers ("3", invSv "4"). "-"/"N/A"/null mean "none".
const NO_VALUE = new Set(["", "-", "N/A", "null", "undefined"]);
export function formatSkill(v) {
  const s = String(v ?? "").trim();
  if (s === "N/A") return s;
  if (NO_VALUE.has(s)) return "–";
  return /^\d+$/.test(s) ? `${s}+` : s;
}
export function formatInvuln(v) {
  const s = String(v ?? "").trim();
  if (NO_VALUE.has(s)) return null;
  return s.replace(/^(\d+)(\+)?/, "$1+");
}

export function formatSyncDate(meta) {
  if (!meta?.lastUpdate) return null;
  const d = new Date(meta.lastUpdate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return meta.lastUpdate;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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

// Wounds for the whole unit as one number you nudge with − / +, with the
// models drawn underneath so you can see what that total means on the
// table: damage fills one model at a time, so "7 damage on three 3-wound
// models" reads as two models gone and one on 2 wounds.
export function WoundTracker({ unit, onChange }) {
  const total = currentWounds(unit);
  const max = maxWounds(unit);
  const models = modelWounds(unit);
  const alive = models.filter((m) => m.remaining > 0).length;
  const step = (d) => onChange(Math.max(0, Math.min(max, total + d)));
  const btn = "font-display text-2xl w-12 h-12 flex items-center justify-center active:opacity-70";
  return (
    <div className="px-4 py-3" style={{ background: "var(--wh-surface)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Wounds</div>
          {models.length > 1 && (
            <div className="fs12 mt-0.5 tnum" style={{ color: alive < models.length ? "#D98C4A" : "var(--wh-text-body)" }}>
              {alive} of {models.length} models left
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => step(-1)} className={btn} style={{ background: "var(--wh-surface-alt)", color: "var(--wh-text)" }}>–</button>
          <span className="font-display text-3xl tnum text-center leading-none" style={{ minWidth: 72, color: total < max ? "#D98C4A" : "var(--wh-text)" }}>
            {total}<span className="text-lg" style={{ color: "var(--wh-muted)" }}> / {max}</span>
          </span>
          <button onClick={() => step(1)} className={btn} style={{ background: "var(--wh-surface-alt)", color: "var(--wh-text)" }}>+</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {models.map((m, i) => {
          const dead = m.remaining === 0;
          const hurt = !dead && m.remaining < m.W;
          return (
            <div key={i} className="px-1.5 py-1 flex flex-col items-center" title={m.name}
              style={{ background: "var(--wh-surface-alt)", opacity: dead ? 0.35 : 1, outline: hurt ? "1px solid #D98C4A" : "none", minWidth: 34 }}>
              {m.W <= 6 ? (
                <div className="flex gap-0.5">
                  {Array.from({ length: m.W }, (_, j) => (
                    <span key={j} style={{ width: 6, height: 12, background: j < m.remaining ? (hurt ? "#D98C4A" : "var(--wh-accent-gold)") : "var(--wh-border)" }} />
                  ))}
                </div>
              ) : (
                <div className="fs12 font-semibold tnum leading-none py-0.5" style={{ color: hurt ? "#D98C4A" : "var(--wh-text)" }}>{m.remaining}/{m.W}</div>
              )}
              <span className="fs9 uppercase mt-0.5 leading-none" style={{ color: "var(--wh-muted)" }}>{dead ? "✕" : `${m.remaining}W`}</span>
            </div>
          );
        })}
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

// Bottom sheet that shows a rule's explanation. Mounted once (in App); any
// tappable term anywhere calls showRule() from lib/rules.js to open it.
export function RuleSheet() {
  const [rule, setRule] = useState(null);
  useEffect(() => onShowRule(setRule), []);
  useCloseOnBack(!!rule, () => setRule(null));
  if (!rule) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setRule(null)}>
      <div className="w-full max-w-xl px-5 pt-4 pb-8 overflow-y-auto" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--wh-bg)", borderTop: "2px solid var(--wh-accent-gold)", maxHeight: "70vh", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display uppercase tracking-wide text-lg leading-tight" style={{ color: "var(--wh-accent-gold)" }}>{rule.title}</h3>
          <button onClick={() => setRule(null)} className="p-1 -mr-1 active:opacity-60" style={{ color: "var(--wh-muted)" }}><X size={20} /></button>
        </div>
        <div className="mt-2 text-base leading-relaxed"><AbilityText text={rule.text} /></div>
      </div>
    </div>
  );
}

// A term that opens its rule when tapped. Dotted underline marks it as
// tappable; terms with no rule render as plain text.
export function RuleTerm({ term, rule, children, className, style }) {
  const r = rule || lookupRule(term);
  if (!r) return <span className={className} style={style}>{children || term}</span>;
  return (
    <button onClick={(e) => { e.stopPropagation(); showRule(r); }}
      className={`underline decoration-dotted underline-offset-2 active:opacity-60 ${className || ""}`} style={style}>
      {children || term}
    </button>
  );
}

// Each bracketed ability on a weapon (e.g. "[TORRENT]") becomes its own
// small chip; tapping one that has a rule (see lib/weaponAbilities.js)
// opens it in the rule sheet. Unrecognized ones (unique flavor-named weapon
// rules) still display, just dimmed and not tappable.
export function WeaponAbilityChips({ kw }) {
  const abilities = parseWeaponAbilities(kw);
  if (abilities.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {abilities.map((a) => (
        <button key={a.label} disabled={!a.description}
          onClick={() => showRule({ title: a.label.toUpperCase(), text: a.description })}
          className="fs11 uppercase tracking-wider px-2 py-0.5 active:opacity-70"
          style={{
            background: "var(--wh-surface-alt)",
            color: a.description ? "var(--wh-text)" : "var(--wh-dim)",
            borderBottom: a.description ? "1px dotted var(--wh-accent-gold)" : "1px solid transparent",
          }}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// Rules prose (unit abilities, detachment rules, enhancements, stratagems).
// Any rule it mentions — "[SUSTAINED HITS 1]", or a core ability written
// plainly like "Deep Strike" — is tappable, and the numbers that matter
// ("+1", "6\"", "4+", "D3", "1CP") are bolded so they stand out from the
// prose. Lines written in all caps (sub-rule names like "ASSAULT DOCTRINE")
// render as small headings.
export function AbilityText({ text, className }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <span className={className} style={{ color: "var(--wh-text-body)", whiteSpace: "pre-line" }}>
      {lines.map((line, li) => {
        const heading = /^[A-Z0-9’' \-:!,]{4,}$/.test(line.trim()) && /[A-Z]{3}/.test(line);
        const content = heading ? (
          <span className="block font-semibold uppercase tracking-wide fs12 mt-2" style={{ color: "var(--wh-text)" }}>{line.trim()}</span>
        ) : tokenizeRulesText(line).map((t, i) => {
          if (t.rule) return <RuleTerm key={i} rule={t.rule} className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{t.text}</RuleTerm>;
          if (t.num) return <strong key={i} className="tnum" style={{ color: "var(--wh-text)" }}>{t.text}</strong>;
          return t.text;
        });
        return <Fragment key={li}>{content}{!heading && li < lines.length - 1 && "\n"}</Fragment>;
      })}
    </span>
  );
}

function StatHeader({ k, label, style, className }) {
  return (
    <button onClick={() => STAT_RULES[k] && showRule(STAT_RULES[k])} className={`w-full active:opacity-70 ${className || ""}`} style={style}>
      {label || k}
    </button>
  );
}

// Characteristic profiles as a datasheet-style row (M T SV W LD OC, plus the
// invulnerable save when any profile has one). Units whose models differ
// (a sergeant, a mixed squad) get one row per distinct profile. Tapping a
// column header explains that characteristic.
export function ProfileStats({ models, accent }) {
  if (!models || models.length === 0) return null;
  const distinct = models.filter((m, i) =>
    models.findIndex((o) => STAT_ORDER.every((k) => o[k] === m[k]) && o.invSv === m.invSv) === i);
  const showInv = distinct.some((m) => formatInvuln(m.invSv));
  const cols = STAT_ORDER.length + (showInv ? 1 : 0);
  return (
    <div className="space-y-2">
      {distinct.map((m, i) => (
        <div key={i}>
          {distinct.length > 1 && <div className="fs12 font-semibold mb-1" style={{ color: "var(--wh-text-body)" }}>{m.name}</div>}
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {STAT_ORDER.map((k) => (
              <div key={k} className="text-center" style={{ background: "var(--wh-surface-alt)" }}>
                <StatHeader k={k} className="fs11 font-semibold uppercase py-0.5" style={{ background: accent, color: "var(--wh-text)" }} />
                <div className="font-display text-2xl py-1.5 tnum leading-none" style={{ color: "var(--wh-text)" }}>{m[k]}</div>
              </div>
            ))}
            {showInv && (
              <div className="text-center" style={{ background: "var(--wh-surface-alt)" }}>
                <StatHeader k="Inv" className="fs11 font-semibold uppercase py-0.5" style={{ background: "var(--wh-accent-gold)", color: "var(--wh-bg)" }} />
                <div className="font-display text-2xl py-1.5 tnum leading-none" style={{ color: "var(--wh-accent-gold)" }}>{formatInvuln(m.invSv) || "–"}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Weapons as a compact datasheet table: column headers once (tap one to
// see what it means), then each weapon as its name over one row of
// numbers, with ability chips under that. Rows alternate shades so a
// weapon's numbers are easy to track across. In loadout mode
// (onToggle set) every profile shows with a checkbox, and unchecked ones
// are dimmed.
const WEAPON_COLS = "minmax(0,1.3fr) repeat(5, minmax(0,1fr))";
export function WeaponTable({ title, weapons, ranged, icon, accent, isCarried, onToggle }) {
  if (!weapons || weapons.length === 0) return null;
  const headers = ["Range", "A", ranged ? "BS" : "WS", "S", "AP", "D"];
  return (
    <section className="px-3 pt-5">
      <SectionLabel icon={icon} accent={accent}>{title}</SectionLabel>
      <div className="mt-2">
        <div className="grid px-3 text-center fs11 font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: WEAPON_COLS, background: accent, color: "var(--wh-text)" }}>
          {headers.map((h) => <StatHeader key={h} k={h} className="py-1.5" />)}
        </div>
        {weapons.map((w, i) => {
          const carried = !onToggle || isCarried(w.name);
          return (
            <div key={w.name + i} className="px-3 py-2.5"
              style={{ background: i % 2 ? "var(--wh-surface-alt)" : "var(--wh-surface)", opacity: carried ? 1 : 0.45 }}>
              {onToggle ? (
                <label className="flex items-center gap-2 font-semibold fs15 leading-snug">
                  <input type="checkbox" checked={carried} onChange={() => onToggle(w.name)} className="w-4 h-4 shrink-0" />
                  {w.name}
                </label>
              ) : (
                <div className="font-semibold fs15 leading-snug" style={{ color: "var(--wh-text)" }}>{w.name}</div>
              )}
              <div className="grid mt-1.5 text-center font-display text-xl tnum leading-none"
                style={{ gridTemplateColumns: WEAPON_COLS, color: "var(--wh-text)" }}>
                {[w.range, w.A, formatSkill(w.skill), w.S, w.AP, w.D].map((v, j) => <div key={j}>{v}</div>)}
              </div>
              <WeaponAbilityChips kw={w.kw} />
            </div>
          );
        })}
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
  const destroyed = wounds === 0;
  const models = modelWounds(unit);
  const modelsLeft = models.filter((m) => m.remaining > 0).length;
  const primaryModel = unit.models && unit.models[0];
  const leader = unit.leaderInstId ? armyUnits.find((u) => u.instId === unit.leaderInstId) : null;
  const leading = armyUnits.find((u) => u.leaderInstId === unit.instId);

  return (
    <div className="w-full flex items-stretch overflow-hidden" style={{ background: selected ? "var(--wh-surface-selected)" : "var(--wh-surface)" }}>
      <button onClick={onClick} className="flex-1 min-w-0 flex items-stretch text-left active:opacity-80 transition-opacity"
        style={destroyed ? { opacity: 0.55 } : undefined}>
        <div style={{ width: 4, background: selected ? "var(--wh-accent)" : accent, flexShrink: 0 }} />
        <div className="relative shrink-0 overflow-hidden" style={{ width: 72, filter: destroyed ? "grayscale(1)" : undefined }}>
          {unit.photo ? (
            <img src={unit.photo} alt={unit.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (<Placeholder unit={unit} />)}
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display uppercase tracking-wide text-sm leading-tight truncate"
                style={destroyed ? { textDecoration: "line-through", textDecorationThickness: 2 } : undefined}>{unit.name}</div>
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
            </div>
          </div>
          {primaryModel && (
            <div className="mt-1.5">
              <StatBlock compact accent={accent} columns={formatInvuln(primaryModel.invSv) ? 7 : 6}
                stats={[
                  ...STAT_ORDER.map((k) => ({ label: k, value: primaryModel[k] })),
                  ...(formatInvuln(primaryModel.invSv) ? [{ label: "Inv", value: formatInvuln(primaryModel.invSv) }] : []),
                ]} />
            </div>
          )}
          {destroyed ? (
            <div className="mt-1.5 fs11 font-semibold uppercase tracking-widest" style={{ color: "#C97B7B" }}>✕ Destroyed</div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              {/* One segment per model, sized by its Wounds and filled by
                  what it has left, so a hurt squad reads at a glance. */}
              <div className="flex-1 flex gap-px" style={{ height: 6 }}>
                {models.map((m, i) => (
                  <div key={i} className="relative overflow-hidden" style={{ flex: m.W, background: "var(--wh-border)" }}>
                    <div className="absolute inset-y-0 left-0" style={{ width: `${(m.remaining / m.W) * 100}%`, background: damaged ? "#D98C4A" : "var(--wh-accent-gold)" }} />
                  </div>
                ))}
              </div>
              <span className="fs10 tnum shrink-0" style={{ color: damaged ? "#D98C4A" : "var(--wh-muted)" }}>
                {wounds}/{wMax} W{models.length > 1 ? ` · ${modelsLeft}/${models.length} models` : ""}
              </span>
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
