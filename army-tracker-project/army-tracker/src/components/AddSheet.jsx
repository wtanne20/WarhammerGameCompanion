import { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { factionAccent, cheapestPoints } from "../lib/catalog.js";

const RESULT_CAP = 100;

export default function AddSheet({ catalog, faction, owned, onClose, onPick }) {
  const [q, setQ] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [addedCounts, setAddedCounts] = useState(new Map());
  const query = q.trim().toLowerCase();

  const pick = (c) => {
    setAddedCounts((prev) => new Map(prev).set(c.id, (prev.get(c.id) || 0) + 1));
    onPick(c);
  };

  const pool = useMemo(() => {
    let list = faction ? catalog.filter((c) => c.faction === faction) : catalog;
    if (ownedOnly) list = list.filter((c) => owned.has(c.id));
    return list;
  }, [catalog, faction, owned, ownedOnly]);

  const matches = useMemo(() => {
    if (!query) return ownedOnly ? pool : [];
    return pool.filter((c) =>
      [c.name, c.role, c.faction, ...(c.keywords || [])].join(" ").toLowerCase().includes(query)
    );
  }, [pool, query, ownedOnly]);

  const results = matches.slice(0, RESULT_CAP);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "var(--wh-bg)", borderTop: "2px solid var(--wh-accent)", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "var(--wh-bg)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Add a unit{faction ? ` · ${faction}` : ""}</h2>
            <button onClick={onClose} className="p-1" style={{ color: "var(--wh-muted)" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3" style={{ background: "var(--wh-surface)" }}>
              <Search size={16} style={{ color: "var(--wh-muted)" }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${pool.length} units…`}
                className="flex-1 bg-transparent outline-none py-3 text-sm" style={{ color: "var(--wh-text)" }} />
              {q && <button onClick={() => setQ("")} style={{ color: "var(--wh-muted)" }}><X size={16} /></button>}
            </div>
            <button onClick={() => setOwnedOnly((v) => !v)}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 fs11 uppercase tracking-widest"
              style={{ background: ownedOnly ? "var(--wh-accent-gold)" : "var(--wh-surface)", color: ownedOnly ? "var(--wh-bg)" : "var(--wh-muted)" }}>
              <Check size={12} /> Owned only
            </button>
          </div>
        </div>

        {query ? (
          <p className="px-5 pb-2 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
            {matches.length} result{matches.length !== 1 ? "s" : ""}{matches.length > RESULT_CAP ? ` · showing first ${RESULT_CAP}` : ""}
          </p>
        ) : ownedOnly ? (
          <p className="px-5 pb-2 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
            {matches.length} owned unit{matches.length !== 1 ? "s" : ""}{faction ? ` in ${faction}` : ""}
          </p>
        ) : (
          <p className="px-5 pb-2 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
            {faction ? `Start typing to search ${faction}` : "Start typing to search every faction"}
          </p>
        )}

        <div className="px-4 pb-6 space-y-2">
          {query && results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>No units match "{q}"</div>
          )}
          {!query && ownedOnly && results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
              No owned {faction || ""} units yet — mark some in My Units
            </div>
          )}
          {results.map((c) => {
            const accent = factionAccent(c.faction);
            const cheapest = cheapestPoints(c);
            const addedCount = addedCounts.get(c.id) || 0;
            return (
              <button key={c.id} onClick={() => pick(c)} className="w-full text-left flex items-stretch overflow-hidden active:opacity-80" style={{ background: "var(--wh-surface)" }}>
                <div style={{ width: 4, background: addedCount ? "var(--wh-accent-gold)" : accent }} />
                <div className="flex-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display uppercase tracking-wide text-base flex items-center gap-1.5">
                      {owned.has(c.id) && <Check size={14} style={{ color: "var(--wh-accent-gold)" }} />}
                      {c.name}
                      {owned.get(c.id) > 1 && <span className="fs10 tnum" style={{ color: "var(--wh-muted)" }}>×{owned.get(c.id)}</span>}
                    </span>
                    <span className="font-display tnum shrink-0" style={{ color: "var(--wh-accent-gold)" }}>
                      {cheapest}{c.composition.length > 1 ? "+" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{faction ? c.role : `${c.faction} · ${c.role}`}</div>
                    {addedCount > 0 && (
                      <div className="flex items-center gap-1 fs10 uppercase tracking-widest shrink-0" style={{ color: "var(--wh-accent-gold)" }}>
                        <Check size={12} /> Added{addedCount > 1 ? ` ×${addedCount}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
