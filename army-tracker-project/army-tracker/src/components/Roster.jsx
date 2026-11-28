import { useState } from "react";
import { Plus, RotateCcw, ChevronRight, ChevronDown, ImagePlus, X, Sparkles } from "lucide-react";
import { BATTLE_SIZES, battleSize, dpUsed } from "../lib/detachments.js";
import { armyPoints, factionAccent } from "../lib/catalog.js";
import { isLibraryIcon } from "../lib/icons.js";
import { withBase } from "../lib/paths.js";
import { UnitTile, SectionLabel, AbilityText } from "./shared.jsx";
import StratagemsPanel from "./StratagemsPanel.jsx";

function ArmyIcon({ icon, accent, editable, onClick }) {
  const library = isLibraryIcon(icon);
  const badge = (
    <div className="relative shrink-0 overflow-hidden" style={{ width: 44, height: 44, background: icon ? (library ? "#C9CDD3" : "var(--wh-surface-alt)") : accent }}>
      {icon ? (
        <img src={library ? encodeURI(withBase(icon)) : icon} alt="" className={library ? "absolute inset-0 w-full h-full object-contain p-1" : "absolute inset-0 w-full h-full object-cover"} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImagePlus size={16} style={{ color: "rgba(232,226,212,0.7)" }} />
        </div>
      )}
    </div>
  );

  if (!editable) return badge;
  return <button onClick={onClick} className="active:opacity-80">{badge}</button>;
}

// The four non-"Other" roles are the actual official roster categories
// (confirmed against wahapedia.ru's own faction pages, same source as the
// rest of the data). "Other" is also the correct official catch-all label —
// but it's a big catch-all (964 of 1708 datasheets), so it's split further
// here using each unit's own official keyword tags (Vehicle/Monster/Walker/
// Aircraft/Mounted/Infantry — these are structured keywords straight off
// the datasheet, not a guess) rather than left as one undifferentiated pile.
const TYPE_PRIORITY = ["Monster", "Walker", "Aircraft", "Mounted", "Infantry", "Vehicle"];
const TYPE_LABELS = { Monster: "Monsters", Walker: "Walkers", Aircraft: "Aircraft", Mounted: "Mounted", Infantry: "Infantry", Vehicle: "Vehicles" };
const CATEGORY_ORDER = ["Characters", "Battleline", "Dedicated Transports", "Fortifications", ...TYPE_PRIORITY.map((t) => TYPE_LABELS[t]), "Other"];

function displayCategory(unit) {
  if (unit.role && unit.role !== "Other") return unit.role;
  const keywords = new Set(unit.keywords || []);
  const type = TYPE_PRIORITY.find((t) => keywords.has(t));
  return type ? TYPE_LABELS[type] : "Other";
}

function groupByRole(units) {
  const groups = new Map();
  for (const u of units) {
    const category = displayCategory(u);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(u);
  }
  const known = CATEGORY_ORDER.filter((c) => groups.has(c));
  const rest = [...groups.keys()].filter((c) => !CATEGORY_ORDER.includes(c));
  return [...known, ...rest].map((category) => [category, groups.get(category).sort((a, b) => a.name.localeCompare(b.name))]);
}

function DetachmentCard({ detachment, playing, onRemove, accent }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "var(--wh-surface)" }}>
      <div className="w-full flex items-center gap-2 pr-2">
        <button onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 flex items-center gap-3 text-left px-4 py-3 active:opacity-80">
          <span className="font-display text-base tnum shrink-0 px-1.5" style={{ color: "var(--wh-accent-gold)", border: "1px solid var(--wh-border)" }}>{detachment.dp ?? "?"}</span>
          <span className="font-display uppercase tracking-wide text-base truncate">{detachment.name}</span>
          <span className="ml-auto shrink-0" style={{ color: "var(--wh-muted)" }}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
        </button>
        {!playing && (
          <button onClick={() => onRemove(detachment.id)} className="p-2 shrink-0 active:opacity-70" title="Remove detachment" style={{ color: "var(--wh-muted)" }}>
            <X size={16} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {detachment.abilities.map((a, i) => (
            <div key={i}>
              <div className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{a.name}</div>
              <div className="text-sm mt-0.5"><AbilityText text={a.text} accent={accent} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Battle size sets the detachment-point budget (lib/detachments.js); the
// army's detachments are listed under it with their DP cost.
function DetachmentsSection({ army, detachments, playing, onOpenDetachmentPicker, onRemoveDetachment, onSetBattleSize, accent }) {
  const size = battleSize(army);
  const used = dpUsed(detachments);
  const canAdd = detachments.length === 0 || used < size.dp;
  return (
    <div className="space-y-px">
      <div className="flex items-center justify-between gap-2 px-4 py-2" style={{ background: "var(--wh-surface)" }}>
        <span className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
          Detachments · <span className="tnum" style={{ color: used > size.dp && detachments.length > 1 ? "#D98C4A" : "var(--wh-text)" }}>{used}/{size.dp} DP</span>
        </span>
        {playing ? (
          <span className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{size.label}</span>
        ) : (
          <div className="flex gap-1">
            {BATTLE_SIZES.map((b) => (
              <button key={b.id} onClick={() => onSetBattleSize(b.id)} className="fs10 uppercase tracking-widest px-2 py-1 active:opacity-70"
                style={{ background: b.id === size.id ? accent : "var(--wh-surface-alt)", color: b.id === size.id ? "var(--wh-text)" : "var(--wh-text-body)" }}>
                {b.points}
              </button>
            ))}
          </div>
        )}
      </div>
      {detachments.map((d) => (
        <DetachmentCard key={d.id} detachment={d} playing={playing} onRemove={onRemoveDetachment} accent={accent} />
      ))}
      {!playing && canAdd && (
        <button onClick={onOpenDetachmentPicker} className="w-full flex items-center justify-between px-4 py-3 active:opacity-80" style={{ background: "var(--wh-surface)" }}>
          <span className="flex items-center gap-2 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
            <Plus size={14} /> {detachments.length ? "Add another detachment" : "Choose a detachment"}
          </span>
          <ChevronRight size={18} style={{ color: "var(--wh-muted)" }} />
        </button>
      )}
    </div>
  );
}

// Detachment enhancements, selectable from the roster while editing. Each is
// carried by one leader/character (the existing per-unit enhancement model),
// and its points are added to the army total via unitPoints(). Selecting one
// routes it to that character; picking a different character moves it there.
function EnhancementsSection({ army, detachment, accent, onSetEnhancement }) {
  const [expanded, setExpanded] = useState(true);
  if (!detachment || !detachment.enhancements.length) return null;

  // Which (if any) character currently carries each enhancement.
  const carrierOf = (id) => army.units.find((u) => u.enhancementId === id) || null;
  const characters = army.units.filter((u) => u.role === "Characters");
  const totalEnhancementPts = detachment.enhancements
    .filter((e) => carrierOf(e.id))
    .reduce((s, e) => s + (e.points || 0), 0);

  return (
    <div className="space-y-px">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left active:opacity-80" style={{ background: "var(--wh-surface)" }}>
        <span className="flex items-center gap-1.5 fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
          <Sparkles size={13} /> Enhancements · {detachment.enhancements.length}
        </span>
        <span className="flex items-center gap-2">
          {totalEnhancementPts > 0 && (
            <span className="fs10 uppercase tracking-widest tnum" style={{ color: "var(--wh-accent-gold)" }}>+{totalEnhancementPts} pts</span>
          )}
          <span style={{ color: "var(--wh-muted)" }}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {characters.length === 0 && (
            <p className="fs11" style={{ color: "var(--wh-dim)" }}>Add a leader or character to assign an enhancement.</p>
          )}
          {detachment.enhancements.map((e) => {
            const carrier = carrierOf(e.id);
            return (
              <div key={e.id} style={{ background: "var(--wh-surface)" }}>
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm" style={{ color: "var(--wh-text)" }}>{e.name}</div>
                    <div className="fs10 uppercase tracking-widest mt-0.5" style={{ color: "var(--wh-muted)" }}>
                      {e.points} pts{e.source ? ` · ${e.source}` : ""}
                    </div>
                  </div>
                  {carrier && (
                    <span className="fs10 uppercase tracking-widest shrink-0" style={{ color: "var(--wh-accent-gold)" }}>
                      → {carrier.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  <button onClick={() => onSetEnhancement(null, e.id)}
                    className="fs10 uppercase tracking-widest px-2.5 py-1.5 active:opacity-70"
                    style={{ background: !carrier ? "var(--wh-accent)" : "var(--wh-surface-alt)", color: !carrier ? "var(--wh-text)" : "var(--wh-text-body)" }}>
                    None
                  </button>
                  {characters.map((c) => (
                    <button key={c.instId} onClick={() => onSetEnhancement(c.instId, e.id)}
                      className="fs10 uppercase tracking-widest px-2.5 py-1.5 active:opacity-70"
                      style={{ background: carrier?.instId === c.instId ? "var(--wh-accent)" : "var(--wh-surface-alt)", color: carrier?.instId === c.instId ? "var(--wh-text)" : "var(--wh-text-body)" }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModeToggle({ playing, onChange }) {
  return (
    <button onClick={() => onChange(playing ? "edit" : "play")} className="flex items-center gap-2 active:opacity-80">
      <span className="fs10 uppercase tracking-widest" style={{ color: playing ? "var(--wh-muted)" : "var(--wh-text)" }}>Editing</span>
      <span className="relative shrink-0" style={{ width: 40, height: 22, background: playing ? "var(--wh-accent)" : "var(--wh-border)", borderRadius: 999 }}>
        <span className="absolute" style={{ top: 2, left: playing ? 20 : 2, width: 18, height: 18, background: "var(--wh-text)", borderRadius: 999, transition: "left 0.15s" }} />
      </span>
      <span className="fs10 uppercase tracking-widest" style={{ color: playing ? "var(--wh-text)" : "var(--wh-muted)" }}>Playing</span>
    </button>
  );
}

export default function Roster({
  army, detachments, detachment, stratagems, onRename, onSelect, onAdd, onOpenDetachmentPicker, onRemoveDetachment, onSetBattleSize, onSetEnhancement,
  onResetGame, onSetMode, onOpenIconPicker,
  selectedUnitId, fixedAddButton = true, onDuplicateUnit, onDeleteUnit,
}) {
  const total = armyPoints(army);
  const [renamingArmy, setRenamingArmy] = useState(false);
  const accent = factionAccent(army.faction);
  const groups = groupByRole(army.units);
  const playing = army.mode === "play";

  return (
    <div className={fixedAddButton ? "pb-44 max-w-xl mx-auto" : "pb-6"}>
      <header className="sticky top-0 z-10 px-3 pt-4 pb-4 border-b" style={{ background: "var(--wh-bg)", borderColor: "var(--wh-border)" }}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ArmyIcon icon={army.icon} accent={accent} editable={!playing} onClick={onOpenIconPicker} />
            {renamingArmy ? (
              <input autoFocus value={army.name}
                onChange={(e) => onRename(e.target.value)}
                onBlur={() => setRenamingArmy(false)}
                onKeyDown={(e) => e.key === "Enter" && setRenamingArmy(false)}
                className="font-display uppercase tracking-wide text-2xl bg-transparent border-b outline-none flex-1 min-w-0"
                style={{ borderColor: "var(--wh-accent)", color: "var(--wh-text)" }} />
            ) : (
              <h1 onClick={() => !playing && setRenamingArmy(true)} className="font-display uppercase tracking-wide text-2xl leading-none truncate min-w-0">{army.name}</h1>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-2xl leading-none tnum" style={{ color: "var(--wh-accent-gold)" }}>{total}</div>
            <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>points</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-2">
          <p className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
            {army.faction || "Unknown faction"} · {army.units.length} unit{army.units.length !== 1 ? "s" : ""}
          </p>
          <ModeToggle playing={playing} onChange={onSetMode} />
        </div>
      </header>

      <div className="px-4 pt-4">
        {(detachments.length > 0 || !playing) && (
          <DetachmentsSection army={army} detachments={detachments} playing={playing} accent={accent}
            onOpenDetachmentPicker={onOpenDetachmentPicker} onRemoveDetachment={onRemoveDetachment} onSetBattleSize={onSetBattleSize} />
        )}

        {!playing && (
          <div className="mt-2">
            <EnhancementsSection army={army} detachment={detachment} accent={accent} onSetEnhancement={onSetEnhancement} />
          </div>
        )}

        <div className="mt-2">
          <StratagemsPanel stratagems={stratagems} detachments={detachments} accent={accent} />
        </div>

        {army.units.length > 0 && (
          <button onClick={onResetGame} className="flex items-center gap-1.5 fs10 uppercase tracking-widest mt-2 py-1 active:opacity-60" style={{ color: "var(--wh-muted)" }}>
            <RotateCcw size={11} /> Reset wounds &amp; effects for a new game
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
        {army.units.length === 0 ? (
          <div className="text-center py-16 px-6" style={{ color: "var(--wh-muted)" }}>
            <p className="font-display uppercase tracking-wide text-lg" style={{ color: "var(--wh-text)" }}>No units yet</p>
            <p className="text-sm mt-1">Add your first datasheet to start building the force.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([role, units]) => (
              <section key={role}>
                <SectionLabel accent={accent}>{role} · {units.length}</SectionLabel>
                <div className="space-y-2 mt-2">
                  {units.map((u) => (
                    <UnitTile key={u.instId} unit={u} armyUnits={army.units} selected={u.instId === selectedUnitId} editing={!playing}
                      onClick={() => onSelect(u.instId)}
                      onDuplicate={() => onDuplicateUnit(u.instId)}
                      onDelete={() => onDeleteUnit(u.instId)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {!playing && (fixedAddButton ? (
        <div className="fixed left-0 right-0 p-4" style={{ bottom: "calc(64px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--wh-bg) 60%, transparent)" }}>
          <button onClick={onAdd} className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 py-4 font-display uppercase tracking-widest text-sm"
            style={{ background: "var(--wh-accent)", color: "var(--wh-text)" }}>
            <Plus size={18} /> Add unit
          </button>
        </div>
      ) : (
        <div className="px-4 pt-2">
          <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 py-4 font-display uppercase tracking-widest text-sm"
            style={{ background: "var(--wh-accent)", color: "var(--wh-text)" }}>
            <Plus size={18} /> Add unit
          </button>
        </div>
      ))}
    </div>
  );
}
