import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fetchDispositions, matchupFor, missionFor, primaryCardFor } from "../lib/dispositions.js";
import { describeAwards } from "../lib/missionText.js";

// Rules > Missions: a browsable reference for the Chapter Approved
// 2026-2027 mission deck (lib/dispositions.js). Each player picks one of
// five Force Dispositions (Take and Hold, Purge the Foe, Priority Assets...);
// the pairing of yours against your opponent's decides your primary
// mission. Shows a quick "you vs them" lookup, every disposition with its
// five resulting missions, and the 18-card secondary deck.

function ScoringLines({ card }) {
  const lines = describeAwards(card);
  if (!lines.length) return null;
  return (
    <div>
      <div className="fs10 uppercase tracking-widest mb-1" style={{ color: "var(--wh-dim)" }}>Scoring</div>
      <ul className="space-y-1.5">
        {lines.map((l, i) => {
          const [amount, per] = l.vp.split(" per ");
          const cap = (t) => t[0].toUpperCase() + t.slice(1);
          const detail = per ? `Per ${per}${l.condition ? ` (${l.condition})` : ""}` : l.condition ? cap(l.condition) : null;
          return (
            <li key={i} className="flex gap-3 text-sm leading-snug">
              <span className="shrink-0 font-display tnum" style={{ color: "var(--wh-accent-gold)", minWidth: 52 }}>{amount}</span>
              <span className="min-w-0">
                {l.mode && <span className="fs10 uppercase tracking-widest mr-1.5" style={{ color: "var(--wh-muted)" }}>{l.mode}</span>}
                {detail && <span style={{ color: "var(--wh-text-body)" }}>{detail}</span>}
                <span className={detail ? "block fs11" : "fs12"} style={{ color: "var(--wh-muted)" }}>{l.when}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CardBody({ card }) {
  return (
    <>
      <p className="text-sm leading-relaxed" style={{ color: "var(--wh-text)" }}>{card.text}</p>
      <ScoringLines card={card} />
    </>
  );
}

function Row({ title, subtitle, children, defaultOpen = false, level = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: level ? "var(--wh-bg)" : "var(--wh-surface)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-80">
        <div className="flex-1 min-w-0">
          <div className={`font-display uppercase tracking-wide leading-tight ${level ? "text-sm" : "text-base"}`} style={{ color: "var(--wh-text)" }}>{title}</div>
          {subtitle && <div className="fs11 mt-0.5" style={{ color: "var(--wh-muted)" }}>{subtitle}</div>}
        </div>
        <span style={{ color: "var(--wh-muted)" }}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block flex-1 min-w-0">
      <span className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-dim)" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full outline-none py-2.5 px-3 text-sm" style={{ background: "var(--wh-bg)", color: "var(--wh-text)" }}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

function MatchupFinder({ data }) {
  const ds = data.dispositions;
  const [mine, setMine] = useState(ds[0]?.id);
  const [theirs, setTheirs] = useState(ds[0]?.id);
  const m = matchupFor(data, mine, theirs);
  const mission = m && missionFor(data, m.mission_id);
  const card = m && primaryCardFor(data, m.mission_id);
  return (
    <div className="px-4 py-4 space-y-3" style={{ background: "var(--wh-surface)", borderLeft: "3px solid var(--wh-accent)" }}>
      <div className="font-display uppercase tracking-wide text-base">Find your mission</div>
      <div className="flex gap-2">
        <Select label="You" value={mine} onChange={setMine} options={ds} />
        <Select label="Opponent" value={theirs} onChange={setTheirs} options={ds} />
      </div>
      {card ? (
        <div className="space-y-3 pt-1">
          <div>
            <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-dim)" }}>Your primary mission</div>
            <div className="font-display uppercase tracking-wide text-xl leading-tight" style={{ color: "var(--wh-accent-gold)" }}>{card.name}</div>
            {mission?.vp_per_game_cap && (
              <div className="fs11" style={{ color: "var(--wh-muted)" }}>Up to {mission.vp_per_round_cap} VP per round, {mission.vp_per_game_cap} VP per game</div>
            )}
          </div>
          <CardBody card={card} />
        </div>
      ) : (
        <p className="fs12" style={{ color: "var(--wh-dim)" }}>No mission listed for this pairing.</p>
      )}
    </div>
  );
}

function DispositionList({ data }) {
  const byId = Object.fromEntries(data.dispositions.map((d) => [d.id, d]));
  return (
    <div className="space-y-1">
      {data.dispositions.map((d) => {
        const matchups = data.matchups.filter((m) => m.disposition === d.id);
        return (
          <Row key={d.id} title={d.name} subtitle={d.text}>
            <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-dim)" }}>Your mission against each opponent</div>
            <div className="space-y-px">
              {matchups.map((m) => {
                const card = primaryCardFor(data, m.mission_id);
                if (!card) return null;
                return (
                  <Row key={m.id} level={1} title={card.name} subtitle={`vs ${byId[m.opponent_disposition]?.name || m.opponent_disposition}`}>
                    <CardBody card={card} />
                  </Row>
                );
              })}
            </div>
          </Row>
        );
      })}
    </div>
  );
}

function SecondaryList({ data }) {
  const cards = data.cards.filter((c) => c.card_type === "secondary").sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-1">
      {cards.map((c) => (
        <Row key={c.id} title={c.name}>
          <CardBody card={c} />
        </Row>
      ))}
    </div>
  );
}

const SUBTABS = [
  { id: "primary", label: "Dispositions" },
  { id: "secondary", label: "Secondaries" },
];

export default function MissionsReference() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [sub, setSub] = useState("primary");

  useEffect(() => {
    let live = true;
    fetchDispositions().then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);

  if (error) return <p className="fs12" style={{ color: "var(--wh-dim)" }}>{error}</p>;
  if (!data) return <p className="fs12" style={{ color: "var(--wh-dim)" }}>Loading missions…</p>;

  return (
    <div className="space-y-3">
      <p className="fs12" style={{ color: "var(--wh-muted)" }}>
        Chapter Approved 2026-27. Each player picks one of five Force Dispositions, and your pick against your opponent's decides your primary mission. Secondary cards are drawn from a shared deck.
      </p>
      <div className="grid grid-cols-2 gap-1">
        {SUBTABS.map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)} className="fs11 uppercase tracking-widest py-2 active:opacity-70"
            style={{ background: "transparent", color: sub === t.id ? "var(--wh-accent-gold)" : "var(--wh-muted)", borderBottom: `2px solid ${sub === t.id ? "var(--wh-accent-gold)" : "var(--wh-border)"}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === "primary" && (
        <>
          <MatchupFinder data={data} />
          <DispositionList data={data} />
        </>
      )}
      {sub === "secondary" && <SecondaryList data={data} />}
    </div>
  );
}
