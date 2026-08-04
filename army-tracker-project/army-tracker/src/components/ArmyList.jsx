import { Plus, Trash2, Shield } from "lucide-react";
import { factionAccent } from "../lib/catalog.js";
import { isLibraryIcon } from "../lib/icons.js";
import { withBase } from "../lib/paths.js";

function formatSyncDate(meta) {
  if (!meta?.lastUpdate) return null;
  const d = new Date(meta.lastUpdate.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return meta.lastUpdate;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function FactionBadge({ faction, icon }) {
  if (icon) {
    const library = isLibraryIcon(icon);
    return (
      <div className="shrink-0 overflow-hidden" style={{ width: 40, height: 40, background: library ? "#C9CDD3" : "#0F1115" }}>
        <img src={library ? encodeURI(withBase(icon)) : icon} alt="" className={library ? "w-full h-full object-contain p-1" : "w-full h-full object-cover"} />
      </div>
    );
  }
  return (
    <div className="shrink-0 flex items-center justify-center font-display uppercase text-sm"
      style={{ width: 40, height: 40, background: faction ? factionAccent(faction) : "#2A2E36", color: "#E8E2D4" }}>
      {faction ? faction.charAt(0) : "?"}
    </div>
  );
}

export default function ArmyList({ armies, meta, activeArmyId, onSelect, onCreate, onDelete }) {
  const synced = formatSyncDate(meta);
  return (
    <div className="pb-44 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 px-5 pt-6 pb-4 border-b" style={{ background: "#14161A", borderColor: "#2A2E36" }}>
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Armies</h1>
        <p className="fs11 uppercase tracking-widest mt-2" style={{ color: "#8B929E" }}>
          {armies.length} arm{armies.length !== 1 ? "ies" : "y"}
          {meta ? ` · ${meta.unitCount} units` : ""}
          {synced ? ` · data as of ${synced}` : ""}
        </p>
      </header>

      <div className="px-4 pt-4">
        {armies.length === 0 ? (
          <div className="text-center py-16 px-6" style={{ color: "#8B929E" }}>
            <Shield size={28} className="mx-auto mb-3" style={{ color: "#2A2E36" }} />
            <p className="font-display uppercase tracking-wide text-lg" style={{ color: "#E8E2D4" }}>No armies yet</p>
            <p className="text-sm mt-1">Start one to begin building a roster.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {armies.map((a) => {
              const active = a.id === activeArmyId;
              return (
                <div key={a.id} className="flex items-stretch overflow-hidden" style={{ background: "#1E2228", borderLeft: active ? "3px solid #B8925A" : "3px solid transparent" }}>
                  <button onClick={() => onSelect(a.id)} className="flex-1 flex items-center gap-3 text-left px-4 py-3 active:opacity-80">
                    <FactionBadge faction={a.faction} icon={a.icon} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display uppercase tracking-wide text-base truncate">{a.name}</span>
                        {active && <span className="fs9 uppercase tracking-widest shrink-0" style={{ color: "#B8925A" }}>Active</span>}
                      </div>
                      <div className="fs11 uppercase tracking-widest mt-1" style={{ color: "#8B929E" }}>
                        {a.faction || "Unknown faction"} · {a.unitCount} unit{a.unitCount !== 1 ? "s" : ""} · {a.points} pts
                      </div>
                    </div>
                  </button>
                  <button onClick={() => onDelete(a.id)} className="px-4 flex items-center active:opacity-60" style={{ color: "#8B929E" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 p-4" style={{ bottom: 64, background: "linear-gradient(to top, #14161A 60%, transparent)" }}>
        <button onClick={onCreate} className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 py-4 font-display uppercase tracking-widest text-sm"
          style={{ background: "#8E1D22", color: "#E8E2D4" }}>
          <Plus size={18} /> New army
        </button>
      </div>
    </div>
  );
}
