import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { buildKeywordDictionary } from "../lib/keywordDictionary.js";
import { AbilityText } from "./shared.jsx";

// Keyword dictionary for the Rules tab: a searchable list of every keyword
// and game term with a verified definition (see lib/keywordDictionary.js —
// definitions are only ever text the app already uses, nothing new).
// Entries render through AbilityText, so terms that reference other rules
// ("[ASSAULT]", "Deep Strike"…) stay tappable.
export default function KeywordDictionary({ catalog = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(() => new Set());

  const entries = useMemo(() => buildKeywordDictionary(catalog), [catalog]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? entries.filter((e) => e.name.toLowerCase().includes(q) || e.text.toLowerCase().includes(q))
    : entries;

  const toggle = (name) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  return (
    <div className="space-y-3">
      <p className="fs12" style={{ color: "var(--wh-muted)" }}>
        Keywords and game terms with verified definitions, from the core rules and datasheet glossaries.
        Gold words can be tapped for details. Terms without a confirmed definition are left out rather than guessed.
      </p>

      <div className="flex items-center gap-2 px-3" style={{ background: "var(--wh-surface)" }}>
        <Search size={16} style={{ color: "var(--wh-muted)", flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search keywords (e.g. fly, anti-, deep strike…)"
          className="flex-1 bg-transparent outline-none text-sm py-2" style={{ color: "var(--wh-text)" }} />
        {query && (
          <button onClick={() => setQuery("")} style={{ color: "var(--wh-muted)" }}><X size={16} /></button>
        )}
      </div>

      <p className="fs11" style={{ color: "var(--wh-dim)" }}>
        {shown.length} of {entries.length} terms
      </p>

      <div className="space-y-1">
        {shown.length === 0 && (
          <p className="fs12 px-1" style={{ color: "var(--wh-dim)" }}>
            No match for “{query}”. Try a shorter fragment.
          </p>
        )}
        {shown.map((e) => {
          const isOpen = open.has(e.name);
          return (
            <div key={e.name} style={{ background: "var(--wh-surface)" }}>
              <button onClick={() => toggle(e.name)} className="w-full flex items-center gap-2 px-4 py-3 text-left active:opacity-80">
                <div className="flex-1 min-w-0">
                  <span className="font-display uppercase tracking-wide text-sm" style={{ color: "var(--wh-text)" }}>{e.name}</span>
                  {e.params && <span className="fs9 uppercase tracking-widest ml-2" style={{ color: "var(--wh-dim)" }}>value varies</span>}
                </div>
                <span className="fs9 uppercase tracking-widest shrink-0" style={{ color: "var(--wh-muted)" }}>{e.category}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm leading-relaxed">
                  <AbilityText text={e.text} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
