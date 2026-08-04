import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { factionAccent } from "../lib/catalog.js";

export default function FactionPicker({ factions, onClose, onPick }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () => (query ? factions.filter((f) => f.toLowerCase().includes(query)) : factions),
    [factions, query]
  );

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Choose a faction</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search factions…"
              className="w-full outline-none py-3 px-3 text-sm" style={{ background: "#1E2228", color: "#E8E2D4" }} />
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2">
          {results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>No factions match "{q}"</div>
          )}
          {results.map((f) => {
            const accent = factionAccent(f);
            return (
              <button key={f} onClick={() => onPick(f)} className="w-full text-left flex items-center gap-3 px-4 py-3 active:opacity-80" style={{ background: "#1E2228" }}>
                <div className="shrink-0 flex items-center justify-center font-display uppercase text-sm"
                  style={{ width: 32, height: 32, background: accent, color: "#E8E2D4" }}>
                  {f.charAt(0)}
                </div>
                <span className="font-display uppercase tracking-wide text-base">{f}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
