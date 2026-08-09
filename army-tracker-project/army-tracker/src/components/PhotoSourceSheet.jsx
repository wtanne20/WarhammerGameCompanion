import { Camera, ImagePlus, Search, Link2, X } from "lucide-react";

export default function PhotoSourceSheet({ onClose, onTakePhoto, onChooseLibrary, onFindOnline, onPasteUrl }) {
  const options = [
    { icon: <Camera size={18} />, label: "Take a photo", onClick: onTakePhoto },
    { icon: <ImagePlus size={18} />, label: "Choose from library", onClick: onChooseLibrary },
    { icon: <Search size={18} />, label: "Find a photo online", onClick: onFindOnline },
    { icon: <Link2 size={18} />, label: "Paste an image URL", onClick: onPasteUrl },
  ];
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="max-w-xl w-full mx-auto" style={{ background: "var(--wh-bg)", borderTop: "2px solid var(--wh-accent)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display uppercase tracking-wide text-lg">Add photo</h2>
          <button onClick={onClose} className="p-1" style={{ color: "var(--wh-muted)" }}><X size={20} /></button>
        </div>
        <div className="px-4 pb-6 space-y-2">
          {options.map((opt) => (
            <button key={opt.label} onClick={opt.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-80" style={{ background: "var(--wh-surface)" }}>
              <span style={{ color: "var(--wh-accent-gold)" }}>{opt.icon}</span>
              <span className="font-display uppercase tracking-wide text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
