import { useEffect, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { loadTracker, saveTracker, DEFAULT_TRACKER, SECONDARY_MODES, MISSION_SYSTEMS } from "../lib/tracker.js";
import { SECONDARY_MISSIONS, SECONDARY_SELECT_COUNT, SECONDARY_VP_CAP, TACTICAL_HAND_SIZE, drawableSecondaries } from "../lib/secondaries.js";
import { PRIMARY_MISSIONS } from "../lib/primary.js";
import { fetchDispositions, matchupFor, missionFor, primaryCardFor, dispositionSecondaryDeck } from "../lib/dispositions.js";
import { useCloseOnBack } from "../lib/useCloseOnBack.js";
import { Counter } from "./shared.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import PrimaryMissionPicker from "./PrimaryMissionPicker.jsx";
import DispositionPicker from "./DispositionPicker.jsx";
import SecondaryObjectivesPicker from "./SecondaryObjectivesPicker.jsx";

export default function GameTracker() {
  const [state, setState] = useState(null);
  const [dispositionData, setDispositionData] = useState(null);
  const [pickingPrimary, setPickingPrimary] = useState(false);
  const [pickingOpponentPrimary, setPickingOpponentPrimary] = useState(false);
  const [pickingDisposition, setPickingDisposition] = useState(false);
  const [pickingOpponentDisposition, setPickingOpponentDisposition] = useState(false);
  const [pickingSecondaries, setPickingSecondaries] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  useCloseOnBack(pickingPrimary, () => setPickingPrimary(false));
  useCloseOnBack(pickingOpponentPrimary, () => setPickingOpponentPrimary(false));
  useCloseOnBack(pickingDisposition, () => setPickingDisposition(false));
  useCloseOnBack(pickingOpponentDisposition, () => setPickingOpponentDisposition(false));
  useCloseOnBack(pickingSecondaries, () => setPickingSecondaries(false));

  useEffect(() => { (async () => setState(await loadTracker()))(); }, []);
  useEffect(() => { if (state) saveTracker(state); }, [state]);
  useEffect(() => { fetchDispositions().then(setDispositionData).catch(() => {}); }, []);

  if (!state) return null;

  const forceDisposition = state.missionSystem === MISSION_SYSTEMS.FORCE_DISPOSITION;

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

  const yourDisposition = dispositionData && state.dispositionId
    ? dispositionData.dispositions.find((d) => d.id === state.dispositionId)
    : null;
  const opponentDisposition = dispositionData && state.opponentDispositionId
    ? dispositionData.dispositions.find((d) => d.id === state.opponentDispositionId)
    : null;
  const matchup = dispositionData ? matchupFor(dispositionData, state.dispositionId, state.opponentDispositionId) : null;
  const resolvedMission = matchup ? missionFor(dispositionData, matchup.mission_id) : null;
  const resolvedCard = matchup ? primaryCardFor(dispositionData, matchup.mission_id) : null;
  const pickDisposition = (id) => {
    setState((s) => ({ ...s, dispositionId: id }));
    setPickingDisposition(false);
  };
  const pickOpponentDisposition = (id) => {
    setState((s) => ({ ...s, opponentDispositionId: id }));
    setPickingOpponentDisposition(false);
  };

  const set = (key) => (value) => setState((s) => ({ ...s, [key]: value }));
  const setMissionSystem = (system) => setState((s) => ({ ...s, missionSystem: system }));
  const reset = () => setConfirmingReset(true);

  // The active secondary deck follows the chosen mission system: the base
  // rulebook's 18 Eternal War objectives, or the Chapter Approved 2026-2027
  // deck bundled with the mission system above. Same {name, category,
  // description} shape either way, so the rest of this component (Fixed
  // picker, Tactical draw/discard) doesn't need to know which deck is active.
  const secondaryDeck = forceDisposition && dispositionData ? dispositionSecondaryDeck(dispositionData) : SECONDARY_MISSIONS;

  const toggleSecondary = (name) => {
    setState((s) => {
      const exists = s.secondarySelections.some((sel) => sel.name === name);
      if (exists) return { ...s, secondarySelections: s.secondarySelections.filter((sel) => sel.name !== name) };
      if (s.secondarySelections.length >= SECONDARY_SELECT_COUNT) return s;
      const mission = secondaryDeck.find((m) => m.name === name);
      const category = mission?.category;
      if (category && s.secondarySelections.some((sel) => secondaryDeck.find((m) => m.name === sel.name)?.category === category)) return s;
      return { ...s, secondarySelections: [...s.secondarySelections, { name, scored: 0 }] };
    });
  };
  const setSecondaryScore = (name, scored) => {
    setState((s) => ({
      ...s,
      secondarySelections: s.secondarySelections.map((sel) => (sel.name === name ? { ...sel, scored: Math.max(0, Math.min(SECONDARY_VP_CAP, scored)) } : sel)),
    }));
  };

  const setSecondaryMode = (mode) => setState((s) => ({ ...s, secondaryMode: mode }));

  const drawTactical = () => {
    setState((s) => {
      if (s.tacticalHand.length >= TACTICAL_HAND_SIZE) return s;
      const pool = drawableSecondaries(secondaryDeck, s.tacticalHand, s.tacticalDiscarded);
      if (pool.length === 0) return s;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { ...s, tacticalHand: [...s.tacticalHand, { name: pick.name, scored: 0 }] };
    });
  };
  const discardTactical = (name) => {
    setState((s) => {
      const card = s.tacticalHand.find((h) => h.name === name);
      if (!card) return s;
      return {
        ...s,
        tacticalHand: s.tacticalHand.filter((h) => h.name !== name),
        tacticalDiscarded: [...s.tacticalDiscarded, card],
      };
    });
  };
  const setTacticalScore = (name, scored) => {
    setState((s) => ({
      ...s,
      tacticalHand: s.tacticalHand.map((h) => (h.name === name ? { ...h, scored: Math.max(0, Math.min(SECONDARY_VP_CAP, scored)) } : h)),
    }));
  };

  const tactical = state.secondaryMode === SECONDARY_MODES.TACTICAL;
  const secondaryTotal = tactical
    ? state.tacticalHand.reduce((sum, c) => sum + c.scored, 0) + state.tacticalDiscarded.reduce((sum, c) => sum + c.scored, 0)
    : state.secondarySelections.reduce((sum, c) => sum + c.scored, 0);
  const totalVp = state.primaryVp + secondaryTotal;
  const tacticalPool = tactical ? drawableSecondaries(secondaryDeck, state.tacticalHand, state.tacticalDiscarded) : [];

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Game Tracker</h1>
        <button onClick={reset} className="flex items-center gap-1.5 fs11 uppercase tracking-widest active:opacity-60" style={{ color: "#8B929E" }}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="flex gap-1">
        <button onClick={() => setMissionSystem(MISSION_SYSTEMS.FORCE_DISPOSITION)} className="flex-1 fs10 uppercase tracking-widest py-1.5 active:opacity-80"
          style={{ background: forceDisposition ? "#8E1D22" : "#1E2228", color: forceDisposition ? "#E8E2D4" : "#8B929E" }}>Force Disposition</button>
        <button onClick={() => setMissionSystem(MISSION_SYSTEMS.ETERNAL_WAR)} className="flex-1 fs10 uppercase tracking-widest py-1.5 active:opacity-80"
          style={{ background: !forceDisposition ? "#8E1D22" : "#1E2228", color: !forceDisposition ? "#E8E2D4" : "#8B929E" }}>Eternal War</button>
      </div>

      <div className="px-4 py-3" style={{ background: "#1E2228" }}>
        <div className="fs10 uppercase tracking-widest mb-1.5" style={{ color: "#8B929E" }}>Primary mission</div>

        {forceDisposition ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setPickingDisposition(true)} className="flex-1 min-w-0 text-left active:opacity-80">
                <div className="fs9 uppercase tracking-widest" style={{ color: "#6B7280" }}>You</div>
                <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">
                  {yourDisposition ? yourDisposition.name : "Set disposition"}
                </div>
              </button>
              <span className="fs10 font-display shrink-0" style={{ color: "#6B7280" }}>VS</span>
              <button onClick={() => setPickingOpponentDisposition(true)} className="flex-1 min-w-0 text-right active:opacity-80">
                <div className="fs9 uppercase tracking-widest" style={{ color: "#6B7280" }}>Opponent</div>
                <div className="font-display uppercase tracking-wide text-sm leading-tight truncate">
                  {opponentDisposition ? opponentDisposition.name : "Set disposition"}
                </div>
              </button>
            </div>
            {resolvedMission ? (
              <>
                <div className="font-display uppercase tracking-wide text-sm mt-2" style={{ color: "#B8925A" }}>{resolvedMission.name}</div>
                {resolvedCard && <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{resolvedCard.text}</div>}
                <div className="fs9 uppercase tracking-widest mt-1.5" style={{ color: "#6B7280" }}>
                  Cap {resolvedMission.vp_per_round_cap}VP / round · {resolvedMission.vp_per_game_cap}VP / game
                </div>
              </>
            ) : (
              <div className="fs11 mt-2" style={{ color: "#6B7280" }}>Set both dispositions to reveal the mission.</div>
            )}
          </>
        ) : (
          <>
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
          </>
        )}

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
        <div className="flex items-center justify-between">
          <span className="fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Secondary objectives</span>
          <span className="fs10 uppercase tracking-widest" style={{ color: "#6B7280" }}>
            {tactical ? `${state.tacticalHand.length} / ${TACTICAL_HAND_SIZE} in hand` : `${state.secondarySelections.length} / ${SECONDARY_SELECT_COUNT} selected`}
          </span>
        </div>
        <div className="flex gap-1 mt-2 mb-2">
          <button onClick={() => setSecondaryMode(SECONDARY_MODES.FIXED)} className="flex-1 fs10 uppercase tracking-widest py-1.5 active:opacity-80"
            style={{ background: !tactical ? "#8E1D22" : "#1E2228", color: !tactical ? "#E8E2D4" : "#8B929E" }}>Fixed</button>
          <button onClick={() => setSecondaryMode(SECONDARY_MODES.TACTICAL)} className="flex-1 fs10 uppercase tracking-widest py-1.5 active:opacity-80"
            style={{ background: tactical ? "#8E1D22" : "#1E2228", color: tactical ? "#E8E2D4" : "#8B929E" }}>Tactical</button>
        </div>

        {!tactical ? (
          <div className="space-y-2">
            {state.secondarySelections.map((sel) => {
              const mission = secondaryDeck.find((m) => m.name === sel.name);
              return (
                <div key={sel.name} className="px-4 py-3" style={{ background: "#1E2228" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display uppercase tracking-wide text-sm">{sel.name}</div>
                    {mission?.category && <div className="fs9 uppercase tracking-widest shrink-0" style={{ color: "#6B7280" }}>{mission.category}</div>}
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
        ) : (
          <div className="space-y-2">
            {state.tacticalHand.map((card) => {
              const mission = secondaryDeck.find((m) => m.name === card.name);
              return (
                <div key={card.name} className="px-4 py-3" style={{ background: "#1E2228" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display uppercase tracking-wide text-sm">{card.name}</div>
                    {mission?.category && <div className="fs9 uppercase tracking-widest shrink-0" style={{ color: "#6B7280" }}>{mission.category}</div>}
                  </div>
                  {mission && <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{mission.description}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => discardTactical(card.name)} className="fs10 uppercase tracking-widest active:opacity-70" style={{ color: "#C97B7B" }}>
                      Discard
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setTacticalScore(card.name, card.scored - 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>–</button>
                      <span className="font-display text-lg tnum w-6 text-center">{card.scored}</span>
                      <button onClick={() => setTacticalScore(card.name, card.scored + 1)} className="font-display text-lg w-8 h-8 flex items-center justify-center" style={{ background: "#0F1115", color: "#E8E2D4" }}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {state.tacticalHand.length < TACTICAL_HAND_SIZE && (
              <button onClick={drawTactical} disabled={tacticalPool.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 fs11 uppercase tracking-widest active:opacity-70 disabled:opacity-40"
                style={{ background: "#1E2228", color: "#E8E2D4" }}>
                <Shuffle size={14} /> {tacticalPool.length === 0 ? "No cards left to draw" : "Draw a card"}
              </button>
            )}

            {state.tacticalDiscarded.length > 0 && (
              <div className="pt-2">
                <div className="fs10 uppercase tracking-widest mb-1.5 px-1" style={{ color: "#6B7280" }}>Discarded this game</div>
                <div className="space-y-1">
                  {state.tacticalDiscarded.map((c) => (
                    <div key={c.name} className="flex items-center justify-between px-3 py-1.5 fs11" style={{ background: "#0F1115", color: "#6B7280" }}>
                      <span>{c.name}</span>
                      <span className="tnum">{c.scored} VP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        <PrimaryMissionPicker missions={PRIMARY_MISSIONS} onClose={() => setPickingPrimary(false)} onPick={pickPrimary}
          title="Choose your primary mission" />
      )}
      {pickingOpponentPrimary && (
        <PrimaryMissionPicker missions={PRIMARY_MISSIONS} onClose={() => setPickingOpponentPrimary(false)} onPick={pickOpponentPrimary}
          title="Choose opponent's primary mission" />
      )}
      {pickingDisposition && dispositionData && (
        <DispositionPicker dispositions={dispositionData.dispositions} onClose={() => setPickingDisposition(false)} onPick={pickDisposition}
          title="Choose your Force Disposition" />
      )}
      {pickingOpponentDisposition && dispositionData && (
        <DispositionPicker dispositions={dispositionData.dispositions} onClose={() => setPickingOpponentDisposition(false)} onPick={pickOpponentDisposition}
          title="Choose opponent's Force Disposition" />
      )}
      {pickingSecondaries && (
        <SecondaryObjectivesPicker missions={secondaryDeck} selectCount={SECONDARY_SELECT_COUNT}
          selected={state.secondarySelections} onToggle={toggleSecondary} onClose={() => setPickingSecondaries(false)} />
      )}
      <ConfirmDialog open={confirmingReset} message="Reset command points, objectives, and notes for a new game?" confirmLabel="Reset"
        onConfirm={() => { setState({ ...DEFAULT_TRACKER }); setConfirmingReset(false); }}
        onCancel={() => setConfirmingReset(false)} />
    </div>
  );
}
