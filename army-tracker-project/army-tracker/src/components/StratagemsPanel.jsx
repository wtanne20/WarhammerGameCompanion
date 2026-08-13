import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { stratagemsForDetachment } from "../lib/stratagems.js";
import { AbilityText } from "./shared.jsx";

function StratagemRow({ s, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--wh-surface-alt)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:opacity-80">
        <span className="fs10 tnum shrink-0 px-1.5 py-0.5" style={{ background: accent, color: "var(--wh-text)" }}>{s.cpCost}CP</span>
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{s.name}</div>
          <div className="fs9 uppercase tracking-widest mt-0.5" style={{ color: "var(--wh-muted)" }}>{s.category} · {s.phase}</div>
        </div>
        <ChevronDown size={15} style={{ color: "var(--wh-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 fs11" style={{ color: "var(--wh-text-body)" }}>
          {s.legend && <p className="italic mb-2" style={{ color: "var(--wh-muted)" }}>{s.legend}</p>}
          <div><AbilityText text={s.text} accent={accent} /></div>
        </div>
      )}
    </div>
  );
}

export default function StratagemsPanel({ stratagems, detachmentId, accent }) {
  const [expanded, setExpanded] = useState(false);
  if (!stratagems) return null;
  const unique = stratagemsForDetachment(stratagems, detachmentId);

  return (
    <div style={{ background: "var(--wh-surface)" }}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 active:opacity-80">
        <div>
          <span className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Stratagems</span>
          <span className="fs10 tnum ml-1" style={{ color: "var(--wh-dim)" }}>
            ({stratagems.core.length}{unique.length ? ` + ${unique.length}` : ""})
          </span>
        </div>
        {expanded ? <ChevronDown size={18} style={{ color: "var(--wh-muted)" }} /> : <ChevronRight size={18} style={{ color: "var(--wh-muted)" }} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-4">
          <div>
            <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--wh-dim)" }}>Generic stratagems</div>
            <div className="space-y-px">
              {stratagems.core.map((s) => (<StratagemRow key={s.id} s={s} accent={accent} />))}
            </div>
          </div>
          <div>
            <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--wh-dim)" }}>Unique stratagems</div>
            {unique.length > 0 ? (
              <div className="space-y-px">
                {unique.map((s) => (<StratagemRow key={s.id} s={s} accent={accent} />))}
              </div>
            ) : (
              <p className="fs11 px-1" style={{ color: "var(--wh-dim)" }}>
                {detachmentId ? "This detachment has no listed stratagems." : "Choose a detachment to see its stratagems here."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
