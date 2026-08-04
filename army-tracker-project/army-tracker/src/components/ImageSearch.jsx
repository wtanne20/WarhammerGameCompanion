import { useEffect, useRef, useState } from "react";
import { X, Search, Loader2, ImageOff } from "lucide-react";
import { searchImagesWithFallback, downloadImageBlob } from "../lib/imageSearch.js";
import { compressImage } from "../lib/image.js";

// Note: back-gesture handling for this view is owned by the parent
// (Datasheet's single `photoFlow` history entry covers both this and the
// PhotoSourceSheet it's opened from), so this component doesn't register
// its own useCloseOnBack.
export default function ImageSearch({ unitName, onClose, onPick }) {
  const [q, setQ] = useState(`${unitName} warhammer 40k`);
  const [results, setResults] = useState([]);
  const [matchedQuery, setMatchedQuery] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error | empty | done
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const query = q.trim();
    if (!query) {
      setResults([]);
      setStatus("idle");
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      searchImagesWithFallback(query, { signal: controller.signal })
        .then(({ query: matched, results: res }) => {
          setResults(res);
          setMatchedQuery(res.length && matched !== query ? matched : null);
          setStatus(res.length ? "done" : "empty");
        })
        .catch((err) => {
          if (err.name !== "AbortError") setStatus("error");
        });
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const pick = async (result) => {
    setDownloadError(null);
    setDownloadingId(result.id);
    try {
      const blob = await downloadImageBlob(result);
      const dataUrl = await compressImage(blob);
      onPick(dataUrl);
    } catch {
      setDownloadError(result.id);
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">Find a photo online</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3" style={{ background: "#1E2228" }}>
              <Search size={16} style={{ color: "#8B929E" }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…"
                className="flex-1 bg-transparent outline-none py-3 text-sm" style={{ color: "#E8E2D4" }} />
            </div>
            <p className="fs10 mt-2" style={{ color: "#6B7280" }}>
              Searches Flickr, Wikimedia, and museum archives. Not finding it? Try "Paste an image URL" instead for anything you find yourself.
            </p>
          </div>
        </div>

        <div className="px-4 pb-6">
          {status === "loading" && (
            <div className="flex items-center justify-center py-10" style={{ color: "#8B929E" }}>
              <Loader2 className="animate-spin" size={22} />
            </div>
          )}
          {status === "error" && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>
              Couldn't reach the image search. Try again.
            </div>
          )}
          {status === "empty" && (
            <div className="text-center py-10 fs11 uppercase tracking-widest" style={{ color: "#8B929E" }}>
              No photos found for "{q}"
            </div>
          )}
          {matchedQuery && (
            <p className="fs10 uppercase tracking-widest pb-2" style={{ color: "#8B929E" }}>
              No matches for "{q}" — showing results for "{matchedQuery}"
            </p>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {results.map((r) => (
                <button key={r.id} onClick={() => pick(r)} disabled={downloadingId === r.id}
                  className="relative text-left overflow-hidden active:opacity-80" style={{ background: "#1E2228", aspectRatio: "1 / 1" }}>
                  <img src={r.thumbnail} alt={r.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  {(r.creator || r.title) && (
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 fs9 truncate" style={{ background: "rgba(15,17,21,0.85)", color: "#C5C9D0" }}>
                      {r.creator || r.title}
                    </div>
                  )}
                  {downloadingId === r.id && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(15,17,21,0.75)" }}>
                      <Loader2 className="animate-spin" size={20} style={{ color: "#E8E2D4" }} />
                    </div>
                  )}
                  {downloadError === r.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 fs9 text-center px-2" style={{ background: "rgba(58,20,20,0.9)", color: "#E8B4B4" }}>
                      <ImageOff size={16} /> Couldn't download — try another
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
