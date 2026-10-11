import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RULE_SECTIONS, TURN_ORDER } from "../lib/coreRules.js";
import { AbilityText } from "./shared.jsx";

// "How to play" quick reference: the turn order at a glance, then one
// collapsible card per phase/topic. Each card's one-line summary is often
// all that's needed mid-game; tapping it shows the few rules behind it.
export default function RulesPage() {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto">
      <h1 className="font-display uppercase tracking-wide text-2xl leading-none">How to play</h1>
      <p className="fs12 mt-1.5" style={{ color: "var(--wh-muted)" }}>
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
