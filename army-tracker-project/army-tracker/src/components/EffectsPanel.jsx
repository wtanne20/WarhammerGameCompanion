import { useState } from "react";
import { Link2, Unlink, X, Plus, AlertTriangle, HelpCircle } from "lucide-react";
import { unitMatchesAbility } from "../lib/detachments.js";
import { attachmentRole } from "../lib/catalog.js";
import { showRule } from "../lib/rules.js";
import { SectionLabel, AbilityText } from "./shared.jsx";

function Chip({ active, accent, onClick, children }) {
  return (
    <button onClick={onClick} className="text-left px-3 py-2"
      style={{ background: active ? accent : "var(--wh-surface-alt)", color: active ? "var(--wh-text)" : "var(--wh-text-body)" }}>
      {children}
    </button>
  );
}

// Everything here is either exact (leader attachment is official structured
// data — see Datasheets_leader.csv via canLead/canBeLedBy) or explicitly
// labeled as a heuristic suggestion to verify (detachment-rule matching via
// unitMatchesAbility — the user opted into automatic matching knowing it can
// be wrong or incomplete, so it must never be presented as certain).
export default function EffectsPanel({
  unit, armyUnits, detachment, accent, editing = true,
  onSetLeader, onSetEnhancement, onAddCustomEffect, onRemoveCustomEffect,
}) {
  const [note, setNote] = useState("");

  const isCharacter = unit.role === "Characters";
  // A squad can carry BOTH a leader and a support (e.g. led by Adrax Agatone
  // AND supported by a Bladeguard Ancient) — two separate slots.
  const leader = unit.leaderInstId ? armyUnits.find((u) => u.instId === unit.leaderInstId) : null;
  const support = unit.supportInstId ? armyUnits.find((u) => u.instId === unit.supportInstId) : null;
  const attachedAbilities = (att) => (att ? (att.abilities || []).filter((a) => a.type === "Datasheet") : []);

  // For a character: the squads it's attached to, tagged with the role it
  // plays in each (it could lead one squad and support another).
  const attachedSquads = isCharacter
    ? armyUnits
        .filter((u) => u.instId !== unit.instId && (u.leaderInstId === unit.instId || u.supportInstId === unit.instId))
        .map((u) => ({ squad: u, role: u.supportInstId === unit.instId ? "support" : "lead" }))
    : [];
  // Squads this character can attach to (as leader or support).
  const eligibleSquads = isCharacter
    ? armyUnits.filter((u) => u.instId !== unit.instId && (unit.canLead || []).includes(u.id))
    : [];
  // For a squad: the leaders / supports it can attach, split by role.
  const eligibleLeaders = !leader
    ? armyUnits.filter((u) => u.instId !== unit.instId && (unit.canBeLedBy || []).includes(u.id) && attachmentRole(u) === "lead")
    : [];
  const eligibleSupports = !support
    ? armyUnits.filter((u) => u.instId !== unit.instId && (unit.canBeLedBy || []).includes(u.id) && attachmentRole(u) === "support")
    : [];

  const matchedAbilities = detachment ? detachment.abilities.filter((a) => unitMatchesAbility(unit, a)) : [];
  const enhancementUsedElsewhere = (id) => armyUnits.some((u) => u.instId !== unit.instId && u.enhancementId === id);
  const selectedEnhancement = detachment?.enhancements?.find((e) => e.id === unit.enhancementId);
  const customEffects = unit.customEffects || [];

  const addNote = () => {
    if (!note.trim()) return;
    onAddCustomEffect(unit.instId, note.trim());
    setNote("");
  };

  return (
    <section className="px-3 pt-5">
      <SectionLabel accent={accent}>Active Effects</SectionLabel>
      <div className="mt-2 space-y-2 pl-2" style={{ borderLeft: `3px solid ${accent}` }}>
        {/* A squad's attachments — a leader and/or a support, each removable. */}
        {leader && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Led by {leader.name}</span>
              <button onClick={() => onSetLeader(unit.instId, leader.instId)} className="p-1 active:opacity-60 shrink-0" style={{ color: "var(--wh-muted)" }} title="Detach"><Unlink size={14} /></button>
            </div>
            {attachedAbilities(leader).length === 0 ? (
              <p className="fs11 mt-1" style={{ color: "var(--wh-dim)" }}>Check {leader.name}'s own sheet for anything that applies while attached.</p>
            ) : attachedAbilities(leader).map((ab, i) => (
              <div key={i} className="mt-2">
                <span className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{ab.name}.</span>{" "}
                <AbilityText text={ab.text} accent={accent} />
              </div>
            ))}
          </div>
        )}

        {support && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Supported by {support.name}</span>
              <button onClick={() => onSetLeader(unit.instId, support.instId)} className="p-1 active:opacity-60 shrink-0" style={{ color: "var(--wh-muted)" }} title="Detach"><Unlink size={14} /></button>
            </div>
            {attachedAbilities(support).length === 0 ? (
              <p className="fs11 mt-1" style={{ color: "var(--wh-dim)" }}>Check {support.name}'s own sheet for anything that applies while attached.</p>
            ) : attachedAbilities(support).map((ab, i) => (
              <div key={i} className="mt-2">
                <span className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{ab.name}.</span>{" "}
                <AbilityText text={ab.text} accent={accent} />
              </div>
            ))}
          </div>
        )}

        {/* A character's attachments — the squad(s) it leads and/or supports. */}
        {!editing && attachedSquads.length > 0 && (
          <div className="px-3 py-2 space-y-1" style={{ background: "var(--wh-surface)" }}>
            {attachedSquads.map(({ squad, role }) => (
              <span key={squad.instId} className="fs11 uppercase tracking-widest block" style={{ color: "var(--wh-muted)" }}>
                {role === "support" ? "Supporting" : "Leading"} {squad.name}
              </span>
            ))}
          </div>
        )}

        {editing && isCharacter && eligibleSquads.length > 0 && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>{attachmentRole(unit) === "support" ? "Attach to a unit (support)" : "Attach to a unit (lead)"}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {eligibleSquads.map((f) => {
                const attached = attachedSquads.some((x) => x.squad.instId === f.instId);
                return (
                  <Chip key={f.instId} active={attached} accent={accent}
                    onClick={() => onSetLeader(f.instId, unit.instId)}>
                    <div className="flex items-center gap-1.5 font-display text-sm"><Link2 size={12} />{f.name}</div>
                  </Chip>
                );
              })}
            </div>
          </div>
        )}

        {editing && eligibleLeaders.length > 0 && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Attach a leader</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {eligibleLeaders.map((l) => (
                <Chip key={l.instId} accent={accent} onClick={() => onSetLeader(unit.instId, l.instId)}>
                  <div className="flex items-center gap-1.5 font-display text-sm"><Link2 size={12} />{l.name}</div>
                </Chip>
              ))}
            </div>
          </div>
        )}

        {editing && eligibleSupports.length > 0 && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Attach a support</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {eligibleSupports.map((l) => (
                <Chip key={l.instId} accent={accent} onClick={() => onSetLeader(unit.instId, l.instId)}>
                  <div className="flex items-center gap-1.5 font-display text-sm"><Link2 size={12} />{l.name}</div>
                </Chip>
              ))}
            </div>
          </div>
        )}

        {isCharacter && detachment && detachment.enhancements.length > 0 && (editing || selectedEnhancement) && (
          <div className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Enhancement</span>
            {editing && (
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                <Chip active={!unit.enhancementId} accent={accent} onClick={() => onSetEnhancement(unit.instId, null)}>
                  <span className="font-display text-sm">None</span>
                </Chip>
                {detachment.enhancements.map((e) => (
                  <div key={e.id} className="flex items-center gap-1">
                    <Chip active={unit.enhancementId === e.id} accent={accent} onClick={() => onSetEnhancement(unit.instId, e.id)}>
                      <div className="font-display text-sm">{e.name}</div>
                      <div className="fs10 tnum mt-0.5" style={{ color: unit.enhancementId === e.id ? "rgba(232,226,212,0.8)" : "var(--wh-muted)" }}>{e.points} pts{e.source ? ` · ${e.source}` : ""}</div>
                    </Chip>
                    {(e.text || e.legend) && (
                      <button onClick={() => showRule({ title: e.name, text: e.text || e.legend })} className="p-1 active:opacity-60" style={{ color: "var(--wh-muted)" }} aria-label={`What does ${e.name} do?`}>
                        <HelpCircle size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedEnhancement && (
              <div className="mt-2">
                {enhancementUsedElsewhere(selectedEnhancement.id) && (
                  <div className="flex items-center gap-1.5 fs10 mb-1" style={{ color: "#D98C4A" }}>
                    <AlertTriangle size={11} /> Also assigned elsewhere — an army normally carries only one
                  </div>
                )}
                <AbilityText text={selectedEnhancement.text} accent={accent} />
              </div>
            )}
          </div>
        )}

        {matchedAbilities.map((a, i) => (
          <div key={i} className="px-3 py-2" style={{ background: "var(--wh-surface)" }}>
            <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Possible {a.source || "detachment"} bonus — verify</div>
            <span className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{a.name}.</span>{" "}
            <AbilityText text={a.text} accent={accent} />
          </div>
        ))}

        {customEffects.map((ce) => (
          <div key={ce.id} className="px-3 py-2 flex items-center justify-between gap-2" style={{ background: "var(--wh-surface)" }}>
            <span style={{ color: "var(--wh-text-body)" }}>{ce.text}</span>
            <button onClick={() => onRemoveCustomEffect(unit.instId, ce.id)} className="p-1 active:opacity-60 shrink-0" style={{ color: "var(--wh-muted)" }}><X size={14} /></button>
          </div>
        ))}

        <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--wh-surface)" }}>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Add a note (battle-shocked, stratagem, etc.)"
            className="flex-1 bg-transparent outline-none text-sm py-1" style={{ color: "var(--wh-text)" }} />
          <button onClick={addNote} className="p-1 active:opacity-60 shrink-0" style={{ color: accent }}><Plus size={16} /></button>
        </div>
      </div>
    </section>
  );
}
