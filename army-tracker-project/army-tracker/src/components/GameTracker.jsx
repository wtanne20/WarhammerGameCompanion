import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { loadTracker, saveTracker, DEFAULT_TRACKER } from "../lib/tracker.js";
import { Counter } from "./shared.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

// Mission/disposition selection and the secondary-objective deck (fixed
// picks or tactical draw/discard — see lib/primary.js, lib/secondaries.js,
// lib/dispositions.js, and the picker components) are deliberately not
// wired up here for now — that system isn't ready for use yet. This is a
// stripped-down version: just the three point totals a game actually needs
// tracked turn to turn. The underlying data/logic is untouched so the full
// mission-tracking UI can be reinstated later.
export default function GameTracker() {
  const [state, setState] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => { (async () => setState(await loadTracker()))(); }, []);
  useEffect(() => { if (state) saveTracker(state); }, [state]);

  if (!state) return null;

  const set = (key) => (value) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => setConfirmingReset(true);

  const totalVp = state.primaryVp + state.secondaryVp;

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Game Tracker</h1>
        <button onClick={reset} className="flex items-center gap-1.5 fs11 uppercase tracking-widest active:opacity-60" style={{ color: "var(--wh-muted)" }}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <Counter label="Primary objective points" value={state.primaryVp} onChange={set("primaryVp")} />
      <Counter label="Command points" value={state.cp} onChange={set("cp")} />
      <Counter label="Secondary objective points" value={state.secondaryVp} onChange={set("secondaryVp")} />

      <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--wh-surface)" }}>
        <span className="fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Total victory points</span>
        <span className="font-display text-2xl tnum" style={{ color: "var(--wh-accent-gold)" }}>{totalVp}</span>
      </div>

      <div>
        <label className="fs11 uppercase tracking-widest block mb-2" style={{ color: "var(--wh-muted)" }}>Notes</label>
        <textarea value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          rows={6} placeholder="Turn order, stratagem reminders…"
          className="w-full outline-none p-3 text-sm resize-none" style={{ background: "var(--wh-surface)", color: "var(--wh-text)" }} />
      </div>

      <ConfirmDialog open={confirmingReset} message="Reset command points, objectives, and notes for a new game?" confirmLabel="Reset"
        onConfirm={() => { setState({ ...DEFAULT_TRACKER }); setConfirmingReset(false); }}
        onCancel={() => setConfirmingReset(false)} />
    </div>
  );
}
