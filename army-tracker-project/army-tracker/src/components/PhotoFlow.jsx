import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { compressImage } from "../lib/image.js";
import { useCloseOnBack } from "../lib/useCloseOnBack.js";
import PhotoSourceSheet from "./PhotoSourceSheet.jsx";
import ImageSearch from "./ImageSearch.jsx";
import PasteImageUrlSheet from "./PasteImageUrlSheet.jsx";

// The full "add a photo" flow, shared by the Datasheet (per list instance)
// and My Units (per owned unit): source chooser -> take / choose library /
// find online / paste URL, with the image downscaled + compressed before it
// reaches storage. Mounting it opens the source chooser; onPick(dataUrl) is
// called exactly once when a photo is chosen, then onDone() closes it (the
// parent unmounts). One history entry for the whole flow, so a back gesture
// from any sub-view returns straight to wherever the flow was opened from.
export default function PhotoFlow({ unitName, onPick, onDone }) {
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  // "source" (take/library/online/url chooser), "search" (online image
  // search), or "url" (paste an image URL). Starts at "source" so mounting
  // the flow opens it.
  const [flow, setFlow] = useState("source");

  useCloseOnBack(!!flow, () => setFlow(null));

  // Single exit for every pick path: save the compressed image, then close.
  const commit = async (dataUrl) => {
    setBusy(true);
    try { await onPick(dataUrl); } finally { setBusy(false); }
    onDone && onDone();
  };

  const pickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try { await commit(await compressImage(file)); } catch { /* bad file */ }
  };

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pickFile} className="hidden" />
      <input ref={libraryRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />

      {flow === "source" && (
        <PhotoSourceSheet
          onClose={() => setFlow(null)}
          onTakePhoto={() => { setFlow(null); cameraRef.current && cameraRef.current.click(); }}
          onChooseLibrary={() => { setFlow(null); libraryRef.current && libraryRef.current.click(); }}
          onFindOnline={() => setFlow("search")}
          onPasteUrl={() => setFlow("url")} />
      )}
      {flow === "search" && (
        <ImageSearch unitName={unitName} onClose={() => setFlow(null)} onPick={(dataUrl) => commit(dataUrl)} />
      )}
      {flow === "url" && (
        <PasteImageUrlSheet onClose={() => setFlow(null)} onPick={(dataUrl) => commit(dataUrl)} />
      )}

      {busy && (
        <div className="flex items-center justify-center gap-2 py-2 fs11 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>
          <Loader2 size={14} className="animate-spin" /> Saving photo…
        </div>
      )}
    </>
  );
}
