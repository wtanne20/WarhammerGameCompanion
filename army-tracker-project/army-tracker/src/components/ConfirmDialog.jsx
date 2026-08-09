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
      <div className="max-w-sm w-full" style={{ background: "var(--wh-bg)", borderTop: "2px solid var(--wh-accent)" }} onClick={(e) => e.stopPropagation()}>
        <p className="px-5 pt-5 pb-4 text-sm" style={{ color: "var(--wh-text)" }}>{message}</p>
        <div className="flex border-t" style={{ borderColor: "var(--wh-border)" }}>
          <button onClick={onCancel} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70" style={{ color: "var(--wh-muted)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70"
            style={{ background: danger ? "var(--wh-accent)" : "var(--wh-border)", color: "var(--wh-text)", borderLeft: "1px solid var(--wh-border)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
