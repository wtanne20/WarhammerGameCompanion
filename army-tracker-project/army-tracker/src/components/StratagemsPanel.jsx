import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { stratagemsForDetachment } from "../lib/stratagems.js";

function StratagemRow({ s, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#0F1115" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:opacity-80">
        <span className="fs10 tnum shrink-0 px-1.5 py-0.5" style={{ background: accent, color: "#E8E2D4" }}>{s.cpCost}CP</span>
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{s.name}</div>
          <div className="fs9 uppercase tracking-widest mt-0.5" style={{ color: "#8B929E" }}>{s.category} · {s.phase}</div>
        </div>
        <ChevronDown size={15} style={{ color: "#8B929E", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 fs11" style={{ color: "#C5C9D0" }}>
          {s.legend && <p className="italic mb-2" style={{ color: "#8B929E" }}>{s.legend}</p>}
          <p style={{ whiteSpace: "pre-line" }}>{s.text}</p>
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
    <div style={{ background: "#1E2228" }}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 active:opacity-80">
        <div>
          <span className="fs10 uppercase tracking-widest" style={{ color: "#8B929E" }}>Stratagems</span>
          <span className="fs10 tnum ml-1" style={{ color: "#6B7280" }}>
            ({stratagems.core.length}{unique.length ? ` + ${unique.length}` : ""})
          </span>
        </div>
        {expanded ? <ChevronDown size={18} style={{ color: "#8B929E" }} /> : <ChevronRight size={18} style={{ color: "#8B929E" }} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-4">
          <div>
            <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "#6B7280" }}>Generic stratagems</div>
            <div className="space-y-px">
              {stratagems.core.map((s) => (<StratagemRow key={s.id} s={s} accent={accent} />))}
            </div>
          </div>
          <div>
            <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "#6B7280" }}>Unique stratagems</div>
            {unique.length > 0 ? (
              <div className="space-y-px">
                {unique.map((s) => (<StratagemRow key={s.id} s={s} accent={accent} />))}
              </div>
            ) : (
              <p className="fs11 px-1" style={{ color: "#6B7280" }}>
                {detachmentId ? "This detachment has no listed stratagems." : "Choose a detachment to see its stratagems here."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
