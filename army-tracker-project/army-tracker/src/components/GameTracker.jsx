import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { loadTracker, saveTracker, DEFAULT_TRACKER } from "../lib/tracker.js";
import { SECONDARY_MISSIONS, SECONDARY_SELECT_COUNT, SECONDARY_VP_CAP } from "../lib/secondaries.js";
import { PRIMARY_MISSIONS } from "../lib/primary.js";
import { useCloseOnBack } from "../lib/useCloseOnBack.js";
import { Counter } from "./shared.jsx";
import PrimaryMissionPicker from "./PrimaryMissionPicker.jsx";
import SecondaryObjectivesPicker from "./SecondaryObjectivesPicker.jsx";

export default function GameTracker() {
  const [state, setState] = useState(null);
  const [pickingPrimary, setPickingPrimary] = useState(false);
  const [pickingOpponentPrimary, setPickingOpponentPrimary] = useState(false);
  const [pickingSecondaries, setPickingSecondaries] = useState(false);
  useCloseOnBack(pickingPrimary, () => setPickingPrimary(false));
  useCloseOnBack(pickingOpponentPrimary, () => setPickingOpponentPrimary(false));
  useCloseOnBack(pickingSecondaries, () => setPickingSecondaries(false));

  useEffect(() => { (async () => setState(await loadTracker()))(); }, []);
  useEffect(() => { if (state) saveTracker(state); }, [state]);

  if (!state) return null;

  const primaryMission = PRIMARY_MISSIONS.find((m) => m.id === state.primaryMissionId) || PRIMARY_MISSIONS[0];
  const opponentPrimaryMission = state.opponentPrimaryMissionId
    ? PRIMARY_MISSIONS.find((m) => m.id === state.opponentPrimaryMissionId)
    : null;
  const pickPrimary = (id) => {
    setState((s) => ({ ...s, primaryMissionId: id }));
    setPickingPrimary(false);
  };
  const pickOpponentPrimary = (id) => {
    setState((s) => ({ ...s, opponentPrimaryMissionId: id }));
    setPickingOpponentPrimary(false);
  };

  const set = (key) => (value) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => {
    if (window.confirm("Reset command points, objectives, and notes for a new game?")) {
      setState({ ...DEFAULT_TRACKER });
    }
  };

  const toggleSecondary = (name) => {
    setState((s) => {
      const exists = s.secondarySelections.some((sel) => sel.name === name);
      if (exists) return { ...s, secondarySelections: s.secondarySelections.filter((sel) => sel.name !== name) };
      if (s.secondarySelections.length >= SECONDARY_SELECT_COUNT) return s;
      const mission = SECONDARY_MISSIONS.find((m) => m.name === name);
      const category = mission?.category;
      if (category && s.secondarySelections.some((sel) => SECONDARY_MISSIONS.find((m) => m.name === sel.name)?.category === category)) return s;
      return { ...s, secondarySelections: [...s.secondarySelections, { name, scored: 0 }] };
    });
  };
  const setSecondaryScore = (name, scored) => {
    setState((s) => ({
      ...s,
      secondarySelections: s.secondarySelections.map((sel) => (sel.name === name ? { ...sel, scored: Math.max(0, Math.min(SECONDARY_VP_CAP, scored)) } : sel)),
    }));
  };

  const secondaryTotal = state.secondarySelections.reduce((sum, c) => sum + c.scored, 0);
  const totalVp = state.primaryVp + secondaryTotal;

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Game Tracker</h1>
        <button onClick={reset} className="flex items-center gap-1.5 fs11 uppercase tracking-widest active:opacity-60" style={{ color: "#8B929E" }}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="px-4 py-3" style={{ background: "#1E2228" }}>
        <div className="fs10 uppercase tracking-widest mb-1.5" style={{ color: "#8B929E" }}>Primary mission</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPickingPrimary(true)} className="flex-1 min-w-0 text-left active:opacity-80">
            <div className="fs9 uppercase tracking-widest" style={{ color: "#6B7280" }}>You</div>
            <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">{primaryMission.name}</div>
          </button>
          <span className="fs10 font-display shrink-0" style={{ color: "#6B7280" }}>VS</span>
          <button onClick={() => setPickingOpponentPrimary(true)} className="flex-1 min-w-0 text-right active:opacity-80">
            <div className="fs9 uppercase tracking-widest" style={{ color: "#6B7280" }}>Opponent</div>
            <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">
              {opponentPrimaryMission ? opponentPrimaryMission.name : "Set mission"}
            </div>
          </button>
        </div>
        <div className="fs11 mt-2" style={{ color: "#8B929E" }}>{primaryMission.description}</div>
        <div className="flex items-center justify-between mt-3">
          <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Points scored</span>
          <div className="flex items-center gap-3">
            <button onClick={() => set("primaryVp")(Math.max(0, state.primaryVp - 1))} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>–</button>
            <span className="font-display text-lg tnum w-6 text-center">{state.primaryVp}</span>
            <button onClick={() => set("primaryVp")(state.primaryVp + 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>+</button>
          </div>
        </div>
      </div>

      <Counter label="Command points" value={state.cp} onChange={set("cp")} />

      <div className="flex items-center justify-between px-4 py-3" style={{ background: "#1E2228" }}>
        <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Total victory points</span>
        <span className="font-display text-2xl tnum" style={{ color: "#B8925A" }}>{totalVp}</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Secondary objectives</span>
          <span className="fs10 uppercase tracking-widest" style={{ color: "#6B7280" }}>{state.secondarySelections.length} / {SECONDARY_SELECT_COUNT} selected</span>
        </div>

        <div className="space-y-2">
          {state.secondarySelections.map((sel) => {
            const mission = SECONDARY_MISSIONS.find((m) => m.name === sel.name);
            return (
              <div key={sel.name} className="px-4 py-3" style={{ background: "#1E2228" }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display uppercase tracking-wide text-sm">{sel.name}</div>
                  {mission && <div className="fs9 uppercase tracking-widest shrink-0" style={{ color: "#6B7280" }}>{mission.category}</div>}
                </div>
                {mission && <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{mission.description}</div>}
                <div className="flex items-center justify-between mt-2">
                  <span className="fs10 uppercase tracking-widest" style={{ color: "#6B7280" }}>Scored (max {SECONDARY_VP_CAP})</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSecondaryScore(sel.name, sel.scored - 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>–</button>
                    <span className="font-display text-lg tnum w-6 text-center">{sel.scored}</span>
                    <button onClick={() => setSecondaryScore(sel.name, sel.scored + 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>+</button>
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={() => setPickingSecondaries(true)}
            className="w-full flex items-center justify-center gap-2 py-3 fs11 uppercase tracking-widest active:opacity-70"
            style={{ background: "#1E2228", color: "#E8E2D4" }}>
            {state.secondarySelections.length === 0 ? "Select secondary objectives" : "Change secondary objectives"}
          </button>
        </div>
      </div>

      <div>
        <label className="fs11 uppercase tracking-widest block mb-2" style={{ color: "#8B929E" }}>Notes</label>
        <textarea value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          rows={6} placeholder="Turn order, stratagem reminders…"
          className="w-full outline-none p-3 text-sm resize-none" style={{ background: "#1E2228", color: "#E8E2D4" }} />
      </div>

      {pickingPrimary && (
        <PrimaryMissionPicker missions={PRIMARY_MISSIONS} onClose={() => setPickingPrimary(false)} onPick={pickPrimary}
          title="Choose your primary mission" />
      )}
      {pickingOpponentPrimary && (
        <PrimaryMissionPicker missions={PRIMARY_MISSIONS} onClose={() => setPickingOpponentPrimary(false)} onPick={pickOpponentPrimary}
          title="Choose opponent's primary mission" />
      )}
      {pickingSecondaries && (
        <SecondaryObjectivesPicker selected={state.secondarySelections} onToggle={toggleSecondary} onClose={() => setPickingSecondaries(false)} />
      )}
    </div>
  );
}
