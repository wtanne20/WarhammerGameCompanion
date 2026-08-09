import { Boxes, Shield, Swords, ClipboardList, Settings } from "lucide-react";

// "Roster" (not "Units") to keep this visually distinct from the "My Units"
// collection tab — same underlying screen/state key as before, just a
// clearer label now that there are two unit-ish destinations.
const TABS = [
  { id: "my-units", label: "My Units", icon: Boxes },
  { id: "armies", label: "Armies", icon: Shield },
  { id: "units", label: "Roster", icon: Swords },
  { id: "tracker", label: "Game", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", background: "var(--wh-bg)", borderColor: "var(--wh-border)" }}>
      <div className="flex-1 max-w-xl mx-auto flex" style={{ height: 64 }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 active:opacity-70"
              style={{ color: active ? "var(--wh-text)" : "var(--wh-dim)" }}>
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} color={active ? "var(--wh-accent-gold)" : "var(--wh-dim)"} />
              <span className="fs9 uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
