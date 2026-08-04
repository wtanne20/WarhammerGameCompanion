import { useState, useMemo } from "react";
import { X } from "lucide-react";

export default function PrimaryMissionPicker({ missions, onClose, onPick, title = "Choose a primary mission" }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () => (query ? missions.filter((m) => m.name.toLowerCase().includes(query)) : missions),
    [missions, query]
  );

  const groups = useMemo(() => {
    const byFormat = new Map();
    for (const m of results) {
      if (!byFormat.has(m.format)) byFormat.set(m.format, []);
      byFormat.get(m.format).push(m);
    }
    return [...byFormat.entries()];
  }, [results]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">{title}</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search primary missions…"
              className="w-full outline-none py-3 px-3 text-sm" style={{ background: "#1E2228", color: "#E8E2D4" }} />
          </div>
        </div>

        <div className="px-4 pb-6 space-y-4">
          {results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>No missions match "{q}"</div>
          )}
          {groups.map(([format, missionsInFormat]) => (
            <div key={format}>
              <div className="fs10 uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>{format}</div>
              <div className="space-y-2">
                {missionsInFormat.map((m) => (
                  <button key={m.id} onClick={() => onPick(m.id)} className="w-full text-left px-4 py-3 active:opacity-80" style={{ background: "#1E2228" }}>
                    <div className="font-display uppercase tracking-wide text-base">{m.name}</div>
                    <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{m.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
