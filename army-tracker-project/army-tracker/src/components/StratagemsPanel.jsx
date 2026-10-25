import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { stratagemsForDetachment } from "../lib/stratagems.js";
import { AbilityText } from "./shared.jsx";

export function StratagemRow({ s, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--wh-surface-alt)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:opacity-80">
        <span className="fs10 tnum shrink-0 px-1.5 py-0.5" style={{ background: accent, color: "var(--wh-text)" }}>{s.cpCost}CP</span>
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{s.name}</div>
          <div className="fs9 uppercase tracking-widest mt-0.5" style={{ color: "var(--wh-muted)" }}>
            {s.phase}{s.turn ? ` · ${s.turn}` : ""}
          </div>
        </div>
        <ChevronDown size={15} style={{ color: "var(--wh-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 text-sm" style={{ color: "var(--wh-text-body)" }}>
          {s.legend && <p className="italic mb-2" style={{ color: "var(--wh-muted)" }}>{s.legend}</p>}
          <div><AbilityText text={s.text} accent={accent} /></div>
        </div>
      )}
    </div>
  );
}

// Mid-game the question is "what can I use right now?", so the list can be
// narrowed to one phase and to whose turn it is. "Any phase" and "Either
// player's turn" stratagems match every filter.
const PHASES = ["Command", "Movement", "Shooting", "Charge", "Fight"];
const TURNS = [{ id: null, label: "Any turn" }, { id: "your", label: "My turn" }, { id: "opponent", label: "Their turn" }];
export const inPhase = (s, phase) => !phase || /any phase/i.test(s.phase || "") || (s.phase || "").includes(phase);
export const inTurn = (s, turn) => {
  if (!turn) return true;
  const t = (s.turn || "").toLowerCase();
  if (!t || t.startsWith("either")) return true;
  return turn === "your" ? t.startsWith("your") : t.startsWith("opponent");
};

function FilterChips({ options, value, onChange, accent }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.id || "all"} onClick={() => onChange(o.id)}
          className="fs10 uppercase tracking-widest px-2.5 py-1.5 active:opacity-70"
          style={{ background: value === o.id ? accent : "var(--wh-surface-alt)", color: value === o.id ? "var(--wh-text)" : "var(--wh-text-body)" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StratagemFilters({ phase, setPhase, turn, setTurn, accent }) {
  return (
    <div className="space-y-1.5">
      <FilterChips accent={accent} value={phase} onChange={setPhase}
        options={[{ id: null, label: "All phases" }, ...PHASES.map((p) => ({ id: p, label: p }))]} />
      <FilterChips accent={accent} value={turn} onChange={setTurn} options={TURNS} />
    </div>
  );
}

function StratagemGroup({ title, list, empty, accent }) {
  return (
    <div>
      <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--wh-dim)" }}>{title}</div>
      {list.length > 0 ? (
        <div className="space-y-px">
          {list.map((s) => (<StratagemRow key={s.id} s={s} accent={accent} />))}
        </div>
      ) : (
        <p className="fs11 px-1" style={{ color: "var(--wh-dim)" }}>{empty}</p>
      )}
    </div>
  );
}

// Stratagems the army can use: the core ones plus those of every detachment
// it has taken (an 11e army can field several).
export default function StratagemsPanel({ stratagems, detachments = [], accent }) {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState(null);
  const [turn, setTurn] = useState(null);
  if (!stratagems) return null;
  const show = (list) => list.filter((s) => inPhase(s, phase) && inTurn(s, turn));
  const groups = detachments.map((d) => ({ d, all: stratagemsForDetachment(stratagems, d.id) }));
  const detachmentCount = groups.reduce((n, g) => n + g.all.length, 0);

  return (
    <div style={{ background: "var(--wh-surface)" }}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 active:opacity-80">
        <div>
          <span className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Stratagems</span>
          <span className="fs10 tnum ml-1" style={{ color: "var(--wh-dim)" }}>
            ({stratagems.core.length}{detachmentCount ? ` + ${detachmentCount}` : ""})
          </span>
        </div>
        {expanded ? <ChevronDown size={18} style={{ color: "var(--wh-muted)" }} /> : <ChevronRight size={18} style={{ color: "var(--wh-muted)" }} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-4">
          <div className="px-1"><StratagemFilters phase={phase} setPhase={setPhase} turn={turn} setTurn={setTurn} accent={accent} /></div>
          {groups.length === 0 && (
            <p className="fs11 px-1" style={{ color: "var(--wh-dim)" }}>Choose a detachment to see its stratagems here.</p>
          )}
          {groups.map(({ d, all }) => (
            <StratagemGroup key={d.id} title={d.name} list={show(all)} accent={accent}
              empty={all.length ? "None right now." : "This detachment has no listed stratagems."} />
          ))}
          <StratagemGroup title="Core stratagems" list={show(stratagems.core)} empty="None right now." accent={accent} />
        </div>
      )}
    </div>
  );
}
