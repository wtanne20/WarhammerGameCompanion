import { useEffect, useState } from "react";
import { RotateCcw, Shuffle, Check, X, ChevronRight } from "lucide-react";
import { loadTracker, saveTracker, DEFAULT_TRACKER } from "../lib/tracker.js";
import { SECONDARY_MISSIONS, SECONDARY_HAND_SIZE } from "../lib/secondaries.js";
import { PRIMARY_MISSIONS } from "../lib/primary.js";
import { uid } from "../lib/id.js";
import { Counter } from "./shared.jsx";
import PrimaryMissionPicker from "./PrimaryMissionPicker.jsx";

export default function GameTracker() {
  const [state, setState] = useState(null);
  const [pickingPrimary, setPickingPrimary] = useState(false);

  useEffect(() => { (async () => setState(await loadTracker()))(); }, []);
  useEffect(() => { if (state) saveTracker(state); }, [state]);

  if (!state) return null;

  const primaryMission = PRIMARY_MISSIONS.find((m) => m.id === state.primaryMissionId) || PRIMARY_MISSIONS[0];
  const pickPrimary = (id) => {
    setState((s) => ({ ...s, primaryMissionId: id }));
    setPickingPrimary(false);
  };

  const set = (key) => (value) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => {
    if (window.confirm("Reset command points, objectives, and notes for a new game?")) {
      setState({ ...DEFAULT_TRACKER });
    }
  };

  const drawnNames = new Set([...state.secondaryHand.map((c) => c.name), ...state.secondaryDiscarded.map((c) => c.name)]);
  const deckRemaining = SECONDARY_MISSIONS.filter((m) => !drawnNames.has(m.name));

  const drawSecondary = () => {
    if (state.secondaryHand.length >= SECONDARY_HAND_SIZE || deckRemaining.length === 0) return;
    const mission = deckRemaining[Math.floor(Math.random() * deckRemaining.length)];
    setState((s) => ({ ...s, secondaryHand: [...s.secondaryHand, { id: uid(), name: mission.name, description: mission.description, scored: 0 }] }));
  };
  const setCardScore = (id, scored) => {
    setState((s) => ({ ...s, secondaryHand: s.secondaryHand.map((c) => (c.id === id ? { ...c, scored } : c)) }));
  };
  const resolveCard = (id, keepScore) => {
    setState((s) => {
      const card = s.secondaryHand.find((c) => c.id === id);
      if (!card) return s;
      return {
        ...s,
        secondaryHand: s.secondaryHand.filter((c) => c.id !== id),
        secondaryDiscarded: [...s.secondaryDiscarded, { ...card, scored: keepScore ? card.scored : 0 }],
      };
    });
  };

  const secondaryTotal = [...state.secondaryHand, ...state.secondaryDiscarded].reduce((sum, c) => sum + c.scored, 0);
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
        <button onClick={() => setPickingPrimary(true)} className="w-full flex items-center justify-between text-left active:opacity-80">
          <div>
            <div className="fs10 uppercase tracking-widest" style={{ color: "#8B929E" }}>Primary mission</div>
            <div className="font-display uppercase tracking-wide text-base mt-0.5">{primaryMission.name}</div>
          </div>
          <ChevronRight size={18} style={{ color: "#8B929E" }} />
        </button>
        <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{primaryMission.description}</div>
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
          <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Secondary missions</span>
          <span className="fs10 uppercase tracking-widest" style={{ color: "#6B7280" }}>{deckRemaining.length} left in deck</span>
        </div>

        <div className="space-y-2">
          {state.secondaryHand.map((card) => (
            <div key={card.id} className="px-4 py-3" style={{ background: "#1E2228" }}>
              <div className="font-display uppercase tracking-wide text-sm">{card.name}</div>
              {card.description && <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{card.description}</div>}
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCardScore(card.id, Math.max(0, card.scored - 1))} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>–</button>
                  <span className="font-display text-lg tnum w-6 text-center">{card.scored}</span>
                  <button onClick={() => setCardScore(card.id, card.scored + 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>+</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => resolveCard(card.id, true)} disabled={card.scored === 0}
                    className="flex items-center gap-1 fs10 uppercase tracking-widest px-2 py-1.5 active:opacity-70"
                    style={{ background: card.scored > 0 ? "#8E1D22" : "#0F1115", color: card.scored > 0 ? "#E8E2D4" : "#6B7280" }}>
                    <Check size={12} /> Score
                  </button>
                  <button onClick={() => resolveCard(card.id, false)}
                    className="flex items-center gap-1 fs10 uppercase tracking-widest px-2 py-1.5 active:opacity-70" style={{ background: "#0F1115", color: "#8B929E" }}>
                    <X size={12} /> Discard
                  </button>
                </div>
              </div>
            </div>
          ))}

          {state.secondaryHand.length < SECONDARY_HAND_SIZE && (
            <button onClick={drawSecondary} disabled={deckRemaining.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 fs11 uppercase tracking-widest active:opacity-70"
              style={{ background: "#1E2228", color: deckRemaining.length ? "#E8E2D4" : "#6B7280" }}>
              <Shuffle size={14} /> {deckRemaining.length ? "Draw secondary mission" : "Deck empty"}
            </button>
          )}
        </div>

        {state.secondaryDiscarded.length > 0 && (
          <div className="mt-3">
            <div className="fs10 uppercase tracking-widest mb-1" style={{ color: "#6B7280" }}>Achieved / discarded</div>
            <div className="space-y-1">
              {state.secondaryDiscarded.map((c) => (
                <div key={c.id} className="flex items-center justify-between fs11 px-3 py-1.5" style={{ background: "#1E2228", color: "#8B929E" }}>
                  <span>{c.name}</span>
                  <span className="tnum">{c.scored} VP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="fs11 uppercase tracking-widest block mb-2" style={{ color: "#8B929E" }}>Notes</label>
        <textarea value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          rows={6} placeholder="Turn order, stratagem reminders…"
          className="w-full outline-none p-3 text-sm resize-none" style={{ background: "#1E2228", color: "#E8E2D4" }} />
      </div>

      {pickingPrimary && (
        <PrimaryMissionPicker missions={PRIMARY_MISSIONS} onClose={() => setPickingPrimary(false)} onPick={pickPrimary} />
      )}
    </div>
  );
}
