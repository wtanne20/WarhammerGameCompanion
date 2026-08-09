import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { SectionLabel, formatSyncDate } from "./shared.jsx";

function Row({ label, description, right }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5" style={{ background: "#1E2228" }}>
      <div className="min-w-0">
        <div className="font-display uppercase tracking-wide text-sm">{label}</div>
        {description && <div className="fs11 mt-0.5" style={{ color: "#8B929E" }}>{description}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function ActionButton({ children, ...props }) {
  return (
    <button {...props}
      className="shrink-0 px-3 py-1.5 fs10 uppercase tracking-widest active:opacity-70 disabled:opacity-50"
      style={{ background: "#2A2E36", color: "#E8E2D4" }}>
      {children}
    </button>
  );
}

function StatusLine({ children, tone = "neutral" }) {
  return (
    <p className="fs11 px-1 -mt-1" style={{ color: tone === "good" ? "#8AD9A8" : tone === "bad" ? "#C97B7B" : "#6B7280" }}>
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

function RulesUpdateRow({ meta, onCheckRulesUpdate }) {
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
      <Row label="Warhammer rules data" description={synced ? `Data as of ${synced}` : "Not yet synced"}
        right={
          <ActionButton onClick={handleCheck} disabled={checking}>
            {checking ? "Checking…" : "Check now"}
          </ActionButton>
        } />
      {status === "updated" && <StatusLine tone="good">Rules data updated.</StatusLine>}
      {status === "current" && <StatusLine>Already up to date.</StatusLine>}
      {status === "error" && <StatusLine tone="bad">Couldn't check for updates — try again later.</StatusLine>}
    </>
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

export default function Settings({ meta, onCheckRulesUpdate, appUpdate, installingUpdate, onCheckAppUpdate, onInstallUpdate }) {
  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-10 px-5 pt-6 pb-4 border-b" style={{ background: "#14161A", borderColor: "#2A2E36" }}>
        <h1 className="font-display uppercase tracking-wide text-2xl leading-none">Settings</h1>
      </header>

      <SettingsSection title="Updates">
        <RulesUpdateRow meta={meta} onCheckRulesUpdate={onCheckRulesUpdate} />
        <AppUpdateRow appUpdate={appUpdate} installingUpdate={installingUpdate}
          onCheckAppUpdate={onCheckAppUpdate} onInstallUpdate={onInstallUpdate} />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <Row label="Color theme" description="Codex (default)"
          right={
            <span className="fs9 uppercase tracking-widest px-2 py-1" style={{ background: "#2A2E36", color: "#6B7280" }}>
              Coming soon
            </span>
          } />
      </SettingsSection>

      <SettingsSection title="About">
        <div className="px-4 py-3 fs11" style={{ background: "#1E2228", color: "#8B929E" }}>
          Unit stats &amp; points from{" "}
          <a href="https://40kdc.alpacasoft.dev" target="_blank" rel="noreferrer" style={{ color: "#B8925A", textDecoration: "underline" }}>
            40kdc-data
          </a>
          . Rules text from Wahapedia.
        </div>
      </SettingsSection>
    </div>
  );
}
