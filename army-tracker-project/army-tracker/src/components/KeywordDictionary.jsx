import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { buildKeywordDictionary } from "../lib/keywordDictionary.js";
import { AbilityText } from "./shared.jsx";

// Keyword dictionary for the Rules tab: a searchable list of every keyword
// and game term with a verified definition (see lib/keywordDictionary.js —
// definitions are only ever text the app already uses, nothing new).
// Entries render through AbilityText, so terms that reference other rules
// ("[ASSAULT]", "Deep Strike"…) stay tappable.
//
// Grouped by type (unit keyword / core ability / weapon ability / game
// term), with a chip filter to show one type at a time. Terms whose effect
// depends on a value ("Blast", "Rapid Fire 1"…) are marked "(X)" — the X
// stands for whatever number the datasheet lists.

const CATEGORY_ORDER = ["Unit keyword", "Core ability", "Weapon ability", "Game term"];
const CATEGORY_LABELS = {
  "Unit keyword": "Unit keywords",
  "Core ability": "Core abilities",
  "Weapon ability": "Weapon abilities",
  "Game term": "Game terms",
};

export default function KeywordDictionary({ catalog = [] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null); // null = all types
  const [open, setOpen] = useState(() => new Set());

  const entries = useMemo(() => buildKeywordDictionary(catalog), [catalog]);

  const q = query.trim().toLowerCase();
  const matches = (e) => !q || e.name.toLowerCase().includes(q) || e.text.toLowerCase().includes(q);
  const groups = CATEGORY_ORDER
    .filter((c) => !category || c === category)
    .map((c) => ({ category: c, items: entries.filter((e) => e.category === c && matches(e)) }))
    .filter((g) => g.items.length > 0);
  const shownCount = groups.reduce((n, g) => n + g.items.length, 0);

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
        “(X)” marks terms whose effect depends on a value listed on the datasheet.
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

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setCategory(null)}
          className="fs10 uppercase tracking-widest px-2.5 py-1.5 active:opacity-70"
          style={{ background: category === null ? "var(--wh-accent)" : "var(--wh-surface)", color: category === null ? "var(--wh-text)" : "var(--wh-text-body)" }}>
          All types
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button key={c} onClick={() => setCategory(category === c ? null : c)}
            className="fs10 uppercase tracking-widest px-2.5 py-1.5 active:opacity-70"
            style={{ background: category === c ? "var(--wh-accent)" : "var(--wh-surface)", color: category === c ? "var(--wh-text)" : "var(--wh-text-body)" }}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <p className="fs11" style={{ color: "var(--wh-dim)" }}>
        {shownCount} of {entries.length} terms
      </p>

      {groups.length === 0 && (
        <p className="fs12 px-1" style={{ color: "var(--wh-dim)" }}>
          No match for “{query}”. Try a shorter fragment.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.category}>
          <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--wh-dim)" }}>
            {CATEGORY_LABELS[g.category]} · {g.items.length}
          </div>
          <div className="space-y-px">
            {g.items.map((e) => {
              const isOpen = open.has(e.name);
              return (
                <div key={e.name} style={{ background: "var(--wh-surface)" }}>
                  <button onClick={() => toggle(e.name)} className="w-full flex items-center gap-2 px-4 py-3 text-left active:opacity-80">
                    <span className="flex-1 min-w-0 font-display uppercase tracking-wide text-sm" style={{ color: "var(--wh-text)" }}>
                      {e.name}{e.params ? " (X)" : ""}
                    </span>
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
      ))}
    </div>
  );
}
