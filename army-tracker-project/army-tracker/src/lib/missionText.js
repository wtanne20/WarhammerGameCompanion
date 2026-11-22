// Turns the structured `awards` on a Chapter Approved 2026-2027 mission
// card (public/data/dispositions.json, see lib/dispositions.js) into short
// human-readable scoring lines for the Rules > Missions reference. The
// card's own `text` explains the mission in prose but often leaves the VP
// numbers out ("score the smaller payout..."), so these lines fill that in.
// Phrasing is deliberately compact; anything not specifically handled falls
// back to the data's own slug with dashes turned into spaces.

const words = (s) => String(s).replace(/-/g, " ").replace(/\bnon home\b/g, "non-home")
  .replace(/with wounds (\d+) or more/, "with $1+ Wounds").replace(/of (\d+) or more starting strength/, "with a starting strength of $1+")
  .replace(/opponent deployment zone/, "your opponent's deployment zone");
const title = (s) => words(s).replace(/\b\w/g, (c) => c.toUpperCase());
const article = (noun) => (/^[aeiou]/i.test(noun) ? "an" : "a");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function timing(trigger = {}) {
  const { timing: t, phase, player_turn: who } = trigger;
  if (t === "end-of-battle") return "End of battle";
  if (t === "end-of-phase") return `End of ${who === "opponent-turn" ? "opponent's" : "your"} ${cap(phase || "")} phase`;
  if (who === "opponent-turn") return "End of opponent's turn";
  if (who === "either") return "End of each turn";
  return "End of your turn";
}

function rounds(br) {
  if (!br) return null;
  const { min, max } = br;
  if (min != null && max != null) return min === max ? `round ${min}` : `rounds ${min}–${max}`;
  if (min != null) return `from round ${min}`;
  if (max != null) return max === 1 ? "round 1" : `rounds 1–${max}`;
  return null;
}

function objectiveName(p) {
  if (p.objective === "your-home") return "your home objective";
  if (p.objective === "opponent-home") return "your opponent's home objective";
  if (p.objective === "tempting-target") return "the Tempting Target objective";
  return null;
}

function count(p, noun) {
  const { count_min: min, count_max: max } = p;
  const plural = (n) => (n === 1 ? noun : `${noun}s`);
  if (min != null && max != null) return min === max ? `exactly ${min} ${plural(min)}` : `${min}–${max} ${noun}s`;
  if (min != null) return min === 1 ? `${article(noun)} ${noun}` : `${min}+ ${noun}s`;
  if (max === 0) return `no ${noun}s`;
  return `${noun}s`;
}

function condition(when) {
  if (!when) return null;
  if (when.operands) {
    return when.operands.map(condition).join(when.operator === "or" ? " or " : " and ");
  }
  const p = when.parameters || {};
  switch (when.type) {
    case "objective-majority":
      return "control more objectives than your opponent";
    case "controls-objective": {
      const named = objectiveName(p);
      if (named) return `control ${named}`;
      let noun = "objective";
      if (p.objective_role) noun = `${p.objective_role} objective`;
      if (p.exclude === "home") noun = `non-home objective`;
      return `control ${count(p, noun)}${p.scope === "no-mans-land" ? " in No Man's Land" : ""}`;
    }
    case "objective-has-tag": {
      const named = objectiveName(p);
      if (named) return `${named} is ${p.tag}`;
      return `${count(p, "objective")} ${p.tag}`;
    }
    case "action-completed":
      return `completed the ${title(p.action_id)} action this turn`;
    case "engagement-fronts":
      return `units in ${p.count_min}+ table quarters`;
    case "units-destroyed":
      return `${p.count_min ?? 1}+ ${p.side || ""} units destroyed this turn`.replace("  ", " ");
    case "units-destroyed-comparison":
      return "destroyed more enemy units this turn than you lost last turn";
    case "territory-control":
      return `no enemy units in ${p.territory_ref === "your-deployment-zone" ? "your deployment zone" : "your territory"}`;
    case "unit-has-tag":
      return p.window === "left-battlefield-this-turn" ? `a ${p.tag} enemy unit left the battlefield this turn` : `an enemy unit became ${p.tag} this turn`;
    case "operation-markers": {
      const whose = p.side === "opponent" ? "the opponent's" : "your";
      if (p.count_max === 0) return `${whose} side has no operation markers`.replace("your side has", "you have").replace("the opponent's side has", "your opponent has");
      const where = p.within_range_of === "opponent-home-objective" ? " within range of your opponent's home objective" : "";
      const held = p.friendly_unit_in_same_terrain_area ? " held by your units with no enemy nearby" : "";
      const n = p.count_min != null && p.count_min === p.count_max ? `exactly ${p.count_min}` : p.count_min > 1 ? `${p.count_min}+` : "one";
      return `${n} of ${whose} operation markers${where}${held}`;
    }
    case "destroyed-in-tagged-terrain":
      return `destroyed an enemy unit in ${p.tag ? `a ${p.tag}` : "a marked"} terrain area`;
    case "destroyed-while-on-objective":
      return p.destroyer_on_objective ? "destroyed an enemy unit while on an objective" : "destroyed an enemy unit that started the turn on an objective";
    case "new-objective-controlled":
      return "took control of a new objective";
    default:
      return words(when.type);
  }
}

// One award → { when, vp, condition, mode } for display.
export function describeAward(a) {
  const when = [timing(a.trigger), rounds(a.trigger?.battle_round)].filter(Boolean).join(", ");
  let vp;
  if (a.vp_per != null) vp = `${a.cumulative ? "+" : ""}${a.vp_per} VP per ${words(a.per || "")}`;
  else vp = `${a.cumulative ? "+" : ""}${a.vp ?? 0} VP`;
  if (a.vp_max != null) vp += ` (max ${a.vp_max})`;
  return { when, vp, condition: condition(a.when), mode: a.mode || null };
}

export function describeAwards(card) {
  return (Array.isArray(card?.awards) ? card.awards : []).map(describeAward);
}
