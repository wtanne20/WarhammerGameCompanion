import { useMemo } from "react";
import { X, Check } from "lucide-react";

export default function SecondaryObjectivesPicker({ missions, selectCount, selected, onToggle, onClose }) {
  const selectedNames = new Set(selected.map((s) => s.name));
  const selectedCategories = new Set(
    selected.map((s) => missions.find((m) => m.name === s.name)?.category).filter(Boolean)
  );

  const groups = useMemo(() => {
    const byCategory = new Map();
    for (const m of missions) {
      const key = m.category || "Secondary Objectives";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key).push(m);
    }
    return [...byCategory.entries()];
  }, [missions]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="font-display uppercase tracking-wide text-lg">Secondary objectives</h2>
              <p className="fs10 uppercase tracking-widest mt-0.5" style={{ color: "#8B929E" }}>
                {selectedNames.size} of {selectCount} selected{missions.some((m) => m.category) ? " · one per category" : ""}
              </p>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-4">
          {groups.map(([category, groupMissions]) => (
            <div key={category}>
              <div className="fs10 uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>{category}</div>
              <div className="space-y-2">
                {groupMissions.map((m) => {
                  const isSelected = selectedNames.has(m.name);
                  const categoryTaken = m.category && selectedCategories.has(m.category) && !isSelected;
                  const handFull = selectedNames.size >= selectCount && !isSelected;
                  const disabled = categoryTaken || handFull;
                  return (
                    <button key={m.name} disabled={disabled} onClick={() => onToggle(m.name)}
                      className="w-full text-left px-4 py-3 active:opacity-80 disabled:active:opacity-100"
                      style={{ background: isSelected ? "#8E1D22" : "#1E2228", opacity: disabled ? 0.4 : 1 }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display uppercase tracking-wide text-base flex items-center gap-1.5">
                          {isSelected && <Check size={14} style={{ color: "#E8E2D4" }} />}
                          {m.name}
                        </span>
                        <span className="fs9 uppercase tracking-widest shrink-0" style={{ color: isSelected ? "rgba(232,226,212,0.7)" : "#6B7280" }}>{m.type}</span>
                      </div>
                      <div className="fs11 mt-1" style={{ color: isSelected ? "rgba(232,226,212,0.85)" : "#8B929E" }}>{m.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
