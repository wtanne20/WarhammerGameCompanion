import { useState, useMemo } from "react";
import { X, Check } from "lucide-react";
import { battleSize, dpUsed, detachmentAvailability } from "../lib/detachments.js";

// Picks the army's detachments. 11th edition lets an army take several, as
// long as their detachment-point costs fit the battle size's budget (see
// lib/detachments.js). Tapping a row adds it, or removes it if it's already
// taken; rows that can't be added say why.
export default function DetachmentPicker({ detachments, army, selected, onClose, onToggle }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  // The army's own detachments first, then cheapest first.
  const results = useMemo(() => {
    const isSel = (d) => selected.some((x) => x.id === d.id);
    return (query ? detachments.filter((d) => d.name.toLowerCase().includes(query)) : detachments)
      .slice().sort((a, b) => isSel(b) - isSel(a) || (a.dp ?? 9) - (b.dp ?? 9) || a.name.localeCompare(b.name));
  }, [detachments, query, selected]);
  const size = battleSize(army);
  const used = dpUsed(selected);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "var(--wh-bg)", borderTop: "2px solid var(--wh-accent)", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "var(--wh-bg)" }}>
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Detachments</h2>
            <button onClick={onClose} className="p-1" style={{ color: "var(--wh-muted)" }}><X size={20} /></button>
          </div>
          <p className="px-5 pt-1 pb-3 fs12" style={{ color: "var(--wh-muted)" }}>
            {size.label} ({size.points} pts): <span className="tnum" style={{ color: used > size.dp ? "#D98C4A" : "var(--wh-text)" }}>{used} of {size.dp} DP</span> used.
            {" "}Tap to add or remove. Any one detachment can always be taken on its own.
          </p>
          <div className="px-4 pb-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search detachments…"
              className="w-full outline-none py-3 px-3 text-sm" style={{ background: "var(--wh-surface)", color: "var(--wh-text)" }} />
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2">
          {results.length === 0 && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
              {query ? `No detachments match "${q}"` : "No detachments available for this faction"}
            </div>
          )}
          {results.map((d) => {
            const avail = detachmentAvailability(d, selected, size.dp);
            return (
              <button key={d.id} onClick={() => avail.ok && onToggle(d.id)} disabled={!avail.ok}
                className="w-full text-left px-4 py-3 flex items-center gap-3 active:opacity-80"
                style={{ background: avail.selected ? "var(--wh-surface-selected)" : "var(--wh-surface)", opacity: avail.ok ? 1 : 0.45,
                  borderLeft: avail.selected ? "3px solid var(--wh-accent-gold)" : "3px solid transparent" }}>
                <div className="shrink-0 text-center" style={{ width: 34 }}>
                  <div className="font-display text-xl leading-none tnum" style={{ color: "var(--wh-accent-gold)" }}>{d.dp ?? "?"}</div>
                  <div className="fs9 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>DP</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display uppercase tracking-wide text-base leading-tight">{d.name}</div>
                  <div className="fs11 mt-1" style={{ color: avail.ok ? "var(--wh-muted)" : "#D98C4A" }}>
                    {avail.reason || [
                      d.forceDisposition,
                      `${d.enhancements.length} enhancement${d.enhancements.length === 1 ? "" : "s"}`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {avail.selected && <Check size={18} style={{ color: "var(--wh-accent-gold)" }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
