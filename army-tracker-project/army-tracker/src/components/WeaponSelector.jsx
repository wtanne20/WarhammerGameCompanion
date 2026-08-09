import { SectionLabel } from "./shared.jsx";

// Wahapedia lists every weapon profile a datasheet can take (its defaults
// and its swap-in options together) but doesn't link the "X can be replaced
// with Y" rule text back to specific profiles in a structured way — so
// rather than guess at a swap, this shows the actual rule text as reference
// and lets the player check off what their models are equipped with.
function WeaponList({ title, weapons, selected, onToggle }) {
  if (!weapons || weapons.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="fs9 uppercase tracking-widest mb-1" style={{ color: "var(--wh-dim)" }}>{title}</div>
      {weapons.map((w) => (
        <label key={w.name} className="flex items-center gap-2 py-1">
          <input type="checkbox" checked={selected.includes(w.name)} onChange={() => onToggle(w.name)} />
          <span className="text-sm" style={{ color: "var(--wh-text-body)" }}>{w.name}</span>
        </label>
      ))}
    </div>
  );
}

export default function WeaponSelector({ unit, accent, onToggle }) {
  if (unit.ranged.length === 0 && unit.melee.length === 0) return null;
  const selectedRanged = unit.weaponSelection ? unit.weaponSelection.ranged : unit.ranged.map((w) => w.name);
  const selectedMelee = unit.weaponSelection ? unit.weaponSelection.melee : unit.melee.map((w) => w.name);

  return (
    <section className="px-3 pt-5">
      <SectionLabel accent={accent}>Weapon selection</SectionLabel>
      <div className="mt-2 space-y-2">
        {unit.wargearOptions && unit.wargearOptions.length > 0 && (
          <div className="px-4 py-3" style={{ background: "var(--wh-surface)" }}>
            <div className="fs10 uppercase tracking-widest mb-1" style={{ color: "var(--wh-muted)" }}>Options, from the rulebook</div>
            {unit.wargearOptions.map((opt, i) => (
              <p key={i} className="text-sm mt-1" style={{ color: "var(--wh-text-body)", whiteSpace: "pre-line" }}>{opt}</p>
            ))}
          </div>
        )}
        <div className="px-4 py-3" style={{ background: "var(--wh-surface)" }}>
          <div className="fs10 uppercase tracking-widest" style={{ color: "var(--wh-muted)" }}>Check what this unit is actually carrying</div>
          <WeaponList title="Ranged" weapons={unit.ranged} selected={selectedRanged} onToggle={(name) => onToggle("ranged", name)} />
          <WeaponList title="Melee" weapons={unit.melee} selected={selectedMelee} onToggle={(name) => onToggle("melee", name)} />
        </div>
      </div>
    </section>
  );
}
