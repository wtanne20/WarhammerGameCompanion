import { useState } from "react";
import { X, Link2, Loader2, ImageOff } from "lucide-react";
import { downloadImageFromUrl } from "../lib/imageSearch.js";
import { compressImage } from "../lib/image.js";

export default function PasteImageUrlSheet({ onClose, onPick }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const use = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await downloadImageFromUrl(trimmed);
      const dataUrl = await compressImage(blob);
      onPick(dataUrl);
    } catch (err) {
      setError(err.message || "Couldn't download that image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display uppercase tracking-wide text-lg">Paste an image URL</h2>
          <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
        </div>
        <div className="px-4 pb-6">
          <p className="fs11 mb-3" style={{ color: "#8B929E" }}>
            Found a photo yourself (e.g. in a regular Google Images search)? Paste its direct image link here.
          </p>
          <div className="flex items-center gap-2 px-3" style={{ background: "#1E2228" }}>
            <Link2 size={16} style={{ color: "#8B929E" }} />
            <input autoFocus value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }}
              inputMode="url" placeholder="https://…" className="flex-1 bg-transparent outline-none py-3 text-sm" style={{ color: "#E8E2D4" }} />
          </div>

          {url.trim() && !error && (
            <div className="mt-3 flex items-center justify-center overflow-hidden" style={{ background: "#0F1115", aspectRatio: "16 / 10" }}>
              <img src={url.trim()} alt="" className="max-w-full max-h-full object-contain" onError={() => setError("That URL doesn't look like a direct image link.")} />
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 fs11 px-3 py-2" style={{ background: "rgba(58,20,20,0.9)", color: "#E8B4B4" }}>
              <ImageOff size={14} /> {error}
            </div>
          )}

          <button onClick={use} disabled={!url.trim() || busy}
            className="w-full flex items-center justify-center gap-2 mt-3 py-3 font-display uppercase tracking-widest text-sm active:opacity-80"
            style={{ background: url.trim() ? "#8E1D22" : "#1E2228", color: url.trim() ? "#E8E2D4" : "#6B7280" }}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Use this photo
          </button>
        </div>
      </div>
    </div>
  );
}
