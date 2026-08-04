import { useState, useMemo, useRef } from "react";
import { X, Search, Upload } from "lucide-react";
import { compressImage } from "../lib/image.js";
import { withBase } from "../lib/paths.js";

const RESULT_CAP = 60;

export default function IconPicker({ icons, onClose, onPick }) {
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const query = q.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return [];
    return icons.filter((icon) =>
      [icon.name, icon.category, ...icon.keywords].join(" ").toLowerCase().includes(query)
    );
  }, [icons, query]);

  const results = matches.slice(0, RESULT_CAP);

  const uploadCustom = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { onPick(await compressImage(file, 200, 0.8)); } catch { /* bad file */ }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Choose an icon</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3" style={{ background: "#1E2228" }}>
              <Search size={16} style={{ color: "#8B929E" }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${icons.length} icons…`}
                className="flex-1 bg-transparent outline-none py-3 text-sm" style={{ color: "#E8E2D4" }} />
              {q && <button onClick={() => setQ("")} style={{ color: "#8B929E" }}><X size={16} /></button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadCustom} className="hidden" />
            <button onClick={() => fileRef.current && fileRef.current.click()}
              className="shrink-0 flex items-center justify-center active:opacity-80" style={{ width: 44, height: 44, background: "#1E2228", color: "#8B929E" }}>
              <Upload size={16} />
            </button>
          </div>
        </div>

        {query ? (
          <p className="px-5 pb-2 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>
            {matches.length} icon{matches.length !== 1 ? "s" : ""}{matches.length > RESULT_CAP ? ` · showing first ${RESULT_CAP}` : ""}
          </p>
        ) : (
          <p className="px-5 pb-2 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>
            Search {icons.length} chapter/faction icons, or upload your own image
          </p>
        )}

        <div className="px-4 pb-6 grid grid-cols-4 gap-2">
          {results.map((icon) => (
            <button key={icon.path} onClick={() => onPick(icon.path)} className="flex flex-col items-center gap-1.5 p-2 active:opacity-70" style={{ background: "#1E2228" }}>
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: "#C9CDD3" }}>
                <img src={encodeURI(withBase(icon.path))} alt="" className="w-9 h-9 object-contain" />
              </div>
              <span className="fs9 text-center leading-tight" style={{ color: "#8B929E" }}>{icon.name}</span>
            </button>
          ))}
        </div>

        {uploading && (
          <p className="px-5 pb-4 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>Uploading…</p>
        )}
      </div>
    </div>
  );
}
