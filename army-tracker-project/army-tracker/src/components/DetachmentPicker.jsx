import { useState, useMemo } from "react";
import { X } from "lucide-react";

export default function DetachmentPicker({ detachments, onClose, onPick }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () => (query ? detachments.filter((d) => d.name.toLowerCase().includes(query)) : detachments),
    [detachments, query]
  );

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Choose a detachment</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search detachments…"
              className="w-full outline-none py-3 px-3 text-sm" style={{ background: "#1E2228", color: "#E8E2D4" }} />
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2">
          {results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>No detachments match "{q}"</div>
          )}
          {results.map((d) => (
            <button key={d.id} onClick={() => onPick(d.id)} className="w-full text-left px-4 py-3 active:opacity-80" style={{ background: "#1E2228" }}>
              <div className="font-display uppercase tracking-wide text-base">{d.name}</div>
              <div className="fs11 uppercase tracking-widest mt-1" style={{ color: "#8B929E" }}>
                {d.abilities.length} rule{d.abilities.length !== 1 ? "s" : ""}{d.enhancements.length ? ` · ${d.enhancements.length} enhancements` : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
