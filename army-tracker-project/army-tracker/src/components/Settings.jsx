import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Check } from "lucide-react";
import { SectionLabel, formatSyncDate } from "./shared.jsx";
import { THEMES } from "../lib/theme.js";

function Row({ label, description, right }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5" style={{ background: "var(--wh-surface)" }}>
      <div className="min-w-0">
        <div className="font-display uppercase tracking-wide text-sm">{label}</div>
        {description && <div className="fs11 mt-0.5" style={{ color: "var(--wh-muted)" }}>{description}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function ActionButton({ children, ...props }) {
  return (
    <button {...props}
      className="shrink-0 px-3 py-1.5 fs10 uppercase tracking-widest active:opacity-70 disabled:opacity-50"
      style={{ background: "var(--wh-border)", color: "var(--wh-text)" }}>
      {children}
    </button>
  );
}

function StatusLine({ children, tone = "neutral" }) {
  return (
    <p className="fs11 px-1 -mt-1" style={{ color: tone === "good" ? "#8AD9A8" : tone === "bad" ? "#C97B7B" : "var(--wh-dim)" }}>
      {children}
    </p>
  );
}

// The app-version row's own action swaps to "Install update" (green,
// reusing App.jsx's already-in-flight download/install flow) the moment an
// update is found, instead of staying on "Check now" — so this screen and
// the top banner (App.jsx) always agree on what to do next.
function AppUpdateRow({ appUpdate, installingUpdate, onCheckAppUpdate, onInstallUpdate }) {
  const native = Capacitor.isNativePlatform();
  const [appInfo, setAppInfo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkedUpToDate, setCheckedUpToDate] = useState(false);

  useEffect(() => {
    if (!native) return;
    CapacitorApp.getInfo().then(setAppInfo).catch(() => {});
  }, [native]);

  const handleCheck = async () => {
    setChecking(true);
    setCheckedUpToDate(false);
    try {
      const result = await onCheckAppUpdate();
      if (!result) setCheckedUpToDate(true);
    } catch {
      /* onCheckAppUpdate already swallows its own errors; nothing to show */
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Row label="App version"
        description={
          !native ? "Web version — always up to date"
            : appInfo ? `v${appInfo.version} (build ${appInfo.build})`
              : "…"
        }
        right={
          !native ? null : appUpdate ? (
            <ActionButton onClick={onInstallUpdate} disabled={installingUpdate}
              style={{ background: "#1F5C3A" }}>
              {installingUpdate ? "Downloading…" : "Install update"}
            </ActionButton>
          ) : (
            <ActionButton onClick={handleCheck} disabled={checking}>
              {checking ? "Checking…" : "Check now"}
            </ActionButton>
          )
        } />
      {!native && <StatusLine>Only the installed Android app can check for its own updates.</StatusLine>}
      {native && !appUpdate && checkedUpToDate && <StatusLine>You're on the latest version.</StatusLine>}
    </>
  );
}

// Catalog stats/points and rules prose actually come from two different
// upstream sources (see the "About" section below, and CLAUDE.md) even
// though sync-data.mjs fetches both together in one run — so both freshness
// date and "Check now" trigger are always identical between the two
// instances of this below. Shown as two separate rows anyway, each with its
// own source credit, so it's obvious both are covered rather than one lumped
// "rules data" line that doesn't say what it actually includes.
function RulesUpdateRow({ label, credit, meta, onCheckRulesUpdate }) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null); // "updated" | "current" | "error" | null
  const synced = formatSyncDate(meta);

  const handleCheck = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const result = await onCheckRulesUpdate();
      setStatus(result?.updated ? "updated" : result?.error ? "error" : "current");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Row label={label} description={synced ? `${credit} · as of ${synced}` : `${credit} · not yet synced`}
        right={
          <ActionButton onClick={handleCheck} disabled={checking}>
            {checking ? "Checking…" : "Check now"}
          </ActionButton>
        } />
      {status === "updated" && <StatusLine tone="good">Updated.</StatusLine>}
      {status === "current" && <StatusLine>Already up to date.</StatusLine>}
      {status === "error" && <StatusLine tone="bad">Couldn't check for updates — try again later.</StatusLine>}
    </>
  );
}

// Each swatch previews its OWN theme's colors, not the currently-active
// one — so this reads raw hex straight from THEMES rather than the
// var(--wh-*) chrome variables (which only ever reflect whichever theme is
// applied right now).
function ThemePicker({ theme, onSetTheme }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(THEMES).map(([id, palette]) => {
        const selected = id === theme;
        return (
          <button key={id} onClick={() => onSetTheme(id)}
            className="flex flex-col items-center gap-1.5 py-3 active:opacity-80"
            style={{ background: "var(--wh-surface)", border: `2px solid ${selected ? "var(--wh-accent-gold)" : "transparent"}` }}>
            <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${palette.accent} 50%, ${palette.accentGold} 50%)` }}>
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
                  <Check size={16} color="#fff" />
                </div>
              )}
            </div>
            <span className="fs9 uppercase tracking-widest text-center leading-tight" style={{ color: "var(--wh-text)" }}>{palette.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <section className="px-4 pt-6">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export default function Settings({ meta, onCheckRulesUpdate, appUpdate, installingUpdate, onCheckAppUpdate, onInstallUpdate, theme, onSetTheme }) {
  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 px-5 pt-6 pb-4 border-b" style={{ background: "var(--wh-bg)", borderColor: "var(--wh-border)" }}>
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Settings</h1>
      </header>

      <SettingsSection title="Updates">
        <RulesUpdateRow label="Game stats & points" credit="40kdc-data" meta={meta} onCheckRulesUpdate={onCheckRulesUpdate} />
        <RulesUpdateRow label="Rules text" credit="Wahapedia" meta={meta} onCheckRulesUpdate={onCheckRulesUpdate} />
        <AppUpdateRow appUpdate={appUpdate} installingUpdate={installingUpdate}
          onCheckAppUpdate={onCheckAppUpdate} onInstallUpdate={onInstallUpdate} />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <ThemePicker theme={theme} onSetTheme={onSetTheme} />
      </SettingsSection>

      <SettingsSection title="About">
        <div className="px-4 py-3 fs11" style={{ background: "var(--wh-surface)", color: "var(--wh-muted)" }}>
          Unit stats &amp; points from{" "}
          <a href="https://40kdc.alpacasoft.dev" target="_blank" rel="noreferrer" style={{ color: "var(--wh-accent-gold)", textDecoration: "underline" }}>
            40kdc-data
          </a>
          . Rules text from Wahapedia.
        </div>
      </SettingsSection>
    </div>
  );
}
