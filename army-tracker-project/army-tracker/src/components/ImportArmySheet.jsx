import { useRef, useState } from "react";
import { Upload, ClipboardPaste, X, ArrowLeft } from "lucide-react";
import { parseArmyImport } from "../lib/shareArmy.js";

export default function ImportArmySheet({ onClose, onImport }) {
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleParsed = (text) => {
    try {
      setPreview(parseArmyImport(text));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    handleParsed(await file.text());
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display uppercase tracking-wide text-lg">Import army</h2>
          <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
        </div>

        {preview ? (
          <div className="px-4 pb-6">
            <div className="px-4 py-3 mb-3" style={{ background: "#1E2228" }}>
              <div className="font-display uppercase tracking-wide text-base">{preview.name}</div>
              <div className="fs11 uppercase tracking-widest mt-1" style={{ color: "#8B929E" }}>
                {preview.faction || "Unknown faction"} · {preview.units?.length || 0} unit{(preview.units?.length || 0) !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="flex-1 flex items-center justify-center gap-2 py-3.5 fs11 uppercase tracking-widest active:opacity-70" style={{ background: "#1E2228", color: "#8B929E" }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => onImport(preview)} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70" style={{ background: "#8E1D22", color: "#E8E2D4" }}>
                Import
              </button>
            </div>
          </div>
        ) : pasting ? (
          <div className="px-4 pb-6">
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={8} placeholder="Paste the exported army JSON here…"
              className="w-full outline-none p-3 text-sm resize-none mb-3" style={{ background: "#1E2228", color: "#E8E2D4" }} />
            {error && <p className="fs11 mb-3" style={{ color: "#C97B7B" }}>{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setPasting(false); setError(null); }} className="flex-1 flex items-center justify-center gap-2 py-3.5 fs11 uppercase tracking-widest active:opacity-70" style={{ background: "#1E2228", color: "#8B929E" }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => handleParsed(pasteText)} className="flex-1 py-3.5 font-display uppercase tracking-widest text-sm active:opacity-70" style={{ background: "#8E1D22", color: "#E8E2D4" }}>
                Preview
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-6 space-y-2">
            {error && <p className="fs11 mb-1" style={{ color: "#C97B7B" }}>{error}</p>}
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-80" style={{ background: "#1E2228" }}>
              <span style={{ color: "#B8925A" }}><Upload size={18} /></span>
              <span className="font-display uppercase tracking-wide text-sm">Choose a file</span>
            </button>
            <button onClick={() => setPasting(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-80" style={{ background: "#1E2228" }}>
              <span style={{ color: "#B8925A" }}><ClipboardPaste size={18} /></span>
              <span className="font-display uppercase tracking-wide text-sm">Paste text</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
