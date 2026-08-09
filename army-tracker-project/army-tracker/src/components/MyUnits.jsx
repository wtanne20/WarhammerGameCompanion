import { useState, useMemo } from "react";
import { Search, X, Minus, Plus } from "lucide-react";
import { factionAccent } from "../lib/catalog.js";

const RESULT_CAP = 100;

function QtyStepper({ qty, accent, onChange }) {
  return (
    <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {qty > 0 && (
        <>
          <button onClick={() => onChange(qty - 1)} className="flex items-center justify-center" style={{ width: 26, height: 26, background: "var(--wh-surface-alt)", color: "var(--wh-text)" }}>
            <Minus size={14} />
          </button>
          <span className="font-display text-sm tnum text-center" style={{ minWidth: 16 }}>{qty}</span>
        </>
      )}
      <button onClick={() => onChange(qty + 1)} className="flex items-center justify-center" style={{ width: 26, height: 26, background: qty > 0 ? "var(--wh-surface-alt)" : accent, color: "var(--wh-text)" }}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function MyUnits({ catalog, owned, onSetQty }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const totalOwned = useMemo(() => [...owned.values()].reduce((s, n) => s + n, 0), [owned]);

  const ownedUnits = useMemo(
    () => catalog
      .filter((c) => owned.has(c.id))
      .sort((a, b) => a.faction.localeCompare(b.faction) || a.name.localeCompare(b.name)),
    [catalog, owned]
  );

  const matches = useMemo(() => {
    if (!query) return [];
    return catalog.filter((c) =>
      [c.name, c.role, c.faction, ...(c.keywords || [])].join(" ").toLowerCase().includes(query)
    );
  }, [catalog, query]);

  const results = matches.slice(0, RESULT_CAP);
  const list = query ? results : ownedUnits;

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 px-5 pt-6 pb-4 border-b" style={{ background: "var(--wh-bg)", borderColor: "var(--wh-border)" }}>
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">My Units</h1>
        <p className="fs11 uppercase tracking-widest mt-2" style={{ color: "var(--wh-muted)" }}>
          {owned.size} unit type{owned.size !== 1 ? "s" : ""}{totalOwned !== owned.size ? ` · ${totalOwned} owned` : ""}
        </p>
        <div className="flex items-center gap-2 px-3 mt-3" style={{ background: "var(--wh-surface)" }}>
          <Search size={16} style={{ color: "var(--wh-muted)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${catalog.length} units to mark as owned…`}
            className="flex-1 bg-transparent outline-none py-3 text-sm" style={{ color: "var(--wh-text)" }} />
          {q && <button onClick={() => setQ("")} style={{ color: "var(--wh-muted)" }}><X size={16} /></button>}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {!query && ownedUnits.length === 0 && (
          <div className="text-center py-16 px-6" style={{ color: "var(--wh-muted)" }}>
            <p className="font-display uppercase tracking-wide text-lg" style={{ color: "var(--wh-text)" }}>Nothing marked yet</p>
            <p className="text-sm mt-1">Search above and tap + to add units to your collection.</p>
          </div>
        )}
        {query && results.length === 0 && (
          <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>No units match "{q}"</div>
        )}
        {query && matches.length > RESULT_CAP && (
          <p className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Showing first {RESULT_CAP} of {matches.length}</p>
        )}
        {list.map((c) => {
          const accent = factionAccent(c.faction);
          const qty = owned.get(c.id) || 0;
          return (
            <div key={c.id} className="w-full flex items-stretch overflow-hidden" style={{ background: "var(--wh-surface)" }}>
              <div style={{ width: 4, background: accent }} />
              <div className="flex-1 px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-display uppercase tracking-wide text-base">{c.name}</span>
                  <div className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{c.faction} · {c.role}</div>
                </div>
                <QtyStepper qty={qty} accent={accent} onChange={(n) => onSetQty(c.id, n)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
