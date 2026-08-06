import { X } from "lucide-react";

export default function DispositionPicker({ dispositions, onClose, onPick, title = "Choose a Force Disposition" }) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto overflow-y-auto" style={{ background: "#14161A", borderTop: "2px solid #8E1D22", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10" style={{ background: "#14161A" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display uppercase tracking-wide text-lg">{title}</h2>
            <button onClick={onClose} className="p-1" style={{ color: "#8B929E" }}><X size={20} /></button>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-2">
          {dispositions.map((d) => (
            <button key={d.id} onClick={() => onPick(d.id)} className="w-full text-left px-4 py-3 active:opacity-80" style={{ background: "#1E2228" }}>
              <div className="font-display uppercase tracking-wide text-base">{d.name}</div>
              <div className="fs11 mt-1" style={{ color: "#8B929E" }}>{d.text}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
