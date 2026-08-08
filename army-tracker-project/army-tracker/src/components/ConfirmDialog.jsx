import { useCloseOnBack } from "../lib/useCloseOnBack.js";

// In-app stand-in for window.confirm() — the native dialog works fine, but
// Chrome/the TWA prefixes it with the page's origin ("wtanne20.github.io
// says..."), which isn't something JS can suppress. This gives the same
// "are you sure" gate without the browser chrome.
export default function ConfirmDialog({ open, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  useCloseOnBack(open, onCancel);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onCancel}>
      <div className="max-w-sm w-full" style={{ background: "#14161A", borderTop: "2px solid #8E1D22" }} onClick={(e) => e.stopPropagation()}>
        <p className="px-5 pt-5 pb-4 text-sm" style={{ color: "#E8E2D4" }}>{message}</p>
        <div className="flex border-t" style={{ borderColor: "#2A2E36" }}>
          <button onClick={onCancel} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70" style={{ color: "#8B929E" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70"
            style={{ background: danger ? "#8E1D22" : "#2A2E36", color: "#E8E2D4", borderLeft: "1px solid #2A2E36" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
