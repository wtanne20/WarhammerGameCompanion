import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RULE_SECTIONS, TURN_ORDER } from "../lib/coreRules.js";
import { detachmentsForFaction, isMatchedPlay } from "../lib/detachments.js";
import { stratagemsForDetachment } from "../lib/stratagems.js";
import { factionAccent } from "../lib/catalog.js";
import { AbilityText } from "./shared.jsx";
import { StratagemRow, StratagemFilters, inPhase, inTurn } from "./StratagemsPanel.jsx";

// "How to play" quick reference: the turn order at a glance, then one
// collapsible card per phase/topic. Each card's one-line summary is often
// all that's needed mid-game; tapping it shows the few rules behind it.
function HowToPlay() {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div>
      <p className="fs12" style={{ color: "var(--wh-muted)" }}>
        11th edition core rules, condensed. Gold words can be tapped for details.
      </p>

      <div className="mt-4 grid grid-cols-5 gap-1">
        {TURN_ORDER.map((phase, i) => (
          <button key={phase} onClick={() => setOpen((cur) => new Set(cur).add(phase.toLowerCase()))}
            className="text-center py-2 active:opacity-70" style={{ background: "var(--wh-surface)" }}>
            <div className="font-display text-lg leading-none tnum" style={{ color: "var(--wh-accent-gold)" }}>{i + 1}</div>
            <div className="fs10 uppercase tracking-wider mt-1" style={{ color: "var(--wh-text)" }}>{phase}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1">
        {RULE_SECTIONS.map((section) => {
          const isOpen = open.has(section.id);
          return (
            <div key={section.id} style={{ background: "var(--wh-surface)" }}>
              <button onClick={() => toggle(section.id)} className="w-full flex items-start gap-3 px-4 py-3 text-left active:opacity-80">
                <div className="flex-1 min-w-0">
                  <div className="font-display uppercase tracking-wide text-base leading-tight" style={{ color: "var(--wh-text)" }}>{section.title}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--wh-text-body)" }}>{section.summary}</div>
                </div>
                <span className="pt-0.5" style={{ color: "var(--wh-muted)" }}>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              {isOpen && (
                <ul className="px-4 pb-4 space-y-2.5">
                  {section.points.map((point, i) => (
                    <li key={i} className="text-sm leading-relaxed pl-3" style={{ borderLeft: "2px solid var(--wh-border)" }}>
                      <AbilityText text={point} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Collapsible({ title, subtitle, badge, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--wh-surface)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-80">
        {badge}
        <div className="flex-1 min-w-0">
          <div className="font-display uppercase tracking-wide text-base leading-tight" style={{ color: "var(--wh-text)" }}>{title}</div>
          {subtitle && <div className="fs11 mt-0.5" style={{ color: "var(--wh-muted)" }}>{subtitle}</div>}
        </div>
        <span style={{ color: "var(--wh-muted)" }}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function FactionSelect({ factions, value, onChange }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}
      className="w-full outline-none py-2.5 px-3 text-sm" style={{ background: "var(--wh-surface)", color: "var(--wh-text)" }}>
      {factions.map((f) => <option key={f} value={f}>{f}</option>)}
    </select>
  );
}

// Every matched-play detachment for a faction (the active army's by
// default): its DP cost, rule, enhancements and stratagems.
function DetachmentList({ detachments, stratagems, faction, factions, setFaction }) {
  const list = detachmentsForFaction(detachments, faction).filter(isMatchedPlay)
    .sort((a, b) => (a.dp ?? 9) - (b.dp ?? 9) || a.name.localeCompare(b.name));
  const accent = factionAccent(faction);
  return (
    <div className="space-y-3">
      <FactionSelect factions={factions} value={faction} onChange={setFaction} />
      <p className="fs12" style={{ color: "var(--wh-muted)" }}>
        An army spends 2 detachment points (DP) at 1000 pts or 3 DP at 2000 pts, and can always take any one detachment on its own.
      </p>
      <div className="space-y-1">
        {list.length === 0 && <p className="fs12" style={{ color: "var(--wh-dim)" }}>No detachments listed for this faction.</p>}
        {list.map((d) => {
          const strats = stratagemsForDetachment(stratagems, d.id);
          return (
            <Collapsible key={d.id} title={d.name}
              subtitle={[d.forceDisposition, `${d.enhancements.length} enhancements`, `${strats.length} stratagems`].filter(Boolean).join(" · ")}
              badge={(
                <div className="shrink-0 text-center" style={{ width: 30 }}>
                  <div className="font-display text-xl leading-none tnum" style={{ color: "var(--wh-accent-gold)" }}>{d.dp ?? "?"}</div>
                  <div className="fs9 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>DP</div>
                </div>
              )}>
              {d.abilities.map((a, i) => (
                <div key={i}>
                  <div className="font-semibold" style={{ color: "var(--wh-accent-gold)" }}>{a.name}</div>
                  <div className="text-sm mt-0.5 leading-relaxed"><AbilityText text={a.text} /></div>
                </div>
              ))}
              {d.enhancements.length > 0 && (
                <div>
                  <div className="fs10 uppercase tracking-widest mb-1" style={{ color: "var(--wh-dim)" }}>Enhancements</div>
                  <div className="space-y-2">
                    {d.enhancements.map((e) => (
                      <div key={e.id}>
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-sm" style={{ color: "var(--wh-text)" }}>{e.name}</span>
                          <span className="fs12 tnum" style={{ color: "var(--wh-accent-gold)" }}>{e.points} pts</span>
                        </div>
                        <div className="text-sm leading-relaxed"><AbilityText text={e.text} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {strats.length > 0 && (
                <div>
                  <div className="fs10 uppercase tracking-widest mb-1" style={{ color: "var(--wh-dim)" }}>Stratagems</div>
                  <div className="space-y-px">{strats.map((s) => <StratagemRow key={s.id} s={s} accent={accent} />)}</div>
                </div>
              )}
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

// Core stratagems (every army), filterable by phase and turn.
function StratagemList({ stratagems }) {
  const [phase, setPhase] = useState(null);
  const [turn, setTurn] = useState(null);
  const accent = "var(--wh-accent)";
  const core = (stratagems?.core || []).filter((s) => inPhase(s, phase) && inTurn(s, turn));
  return (
    <div className="space-y-3">
      <p className="fs12" style={{ color: "var(--wh-muted)" }}>
        Core stratagems every army can use. Detachment stratagems are listed under each detachment, and your army's are on the Roster screen.
      </p>
      <StratagemFilters phase={phase} setPhase={setPhase} turn={turn} setTurn={setTurn} accent={accent} />
      <div className="space-y-px">
        {core.length === 0 && <p className="fs12" style={{ color: "var(--wh-dim)" }}>None for this phase and turn.</p>}
        {core.map((s) => <StratagemRow key={s.id} s={s} accent={accent} />)}
      </div>
    </div>
  );
}

const TABS = [
  { id: "play", label: "How to play" },
  { id: "detachments", label: "Detachments" },
  { id: "stratagems", label: "Stratagems" },
];

export default function RulesPage({ detachments = [], stratagems, armyFaction }) {
  const [tab, setTab] = useState("play");
  const factions = useMemo(() => [...new Set(detachments.filter(isMatchedPlay).map((d) => d.faction))].sort(), [detachments]);
  const [faction, setFaction] = useState(null);
  const shownFaction = faction || (armyFaction && detachmentsForFaction(detachments, armyFaction).length ? armyFaction : factions[0]);

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto">
      <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Rules</h1>
      <div className="mt-3 mb-4 grid grid-cols-3 gap-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="fs11 uppercase tracking-widest py-2 active:opacity-70"
            style={{ background: tab === t.id ? "var(--wh-accent)" : "var(--wh-surface)", color: tab === t.id ? "var(--wh-text)" : "var(--wh-text-body)" }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "play" && <HowToPlay />}
      {tab === "detachments" && (
        <DetachmentList detachments={detachments} stratagems={stratagems} faction={shownFaction} factions={factions} setFaction={setFaction} />
      )}
      {tab === "stratagems" && <StratagemList stratagems={stratagems} />}
    </div>
  );
}
