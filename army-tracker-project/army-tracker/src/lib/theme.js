// UI chrome color themes — a personal appearance preference (Settings tab),
// distinct from FACTION_ACCENT in catalog.js which colors each unit tile by
// that unit's own faction. Someone running an Ultramarines-themed app can
// still track an Ork army; its tile stays Ork-green regardless of theme.
//
// Ten CSS variables cover the whole chrome (backgrounds, borders, text,
// two accent slots). Semantic status colors (error/success banners, damaged-
// wounds orange, danger-delete text) are intentionally NOT themed — they
// keep a fixed, universally-understood meaning across every theme.

export const THEMES = {
  codex: {
    label: "Codex (default)",
    bg: "#14161A", surface: "#1E2228", surfaceAlt: "#0F1115", surfaceSelected: "#262B33",
    border: "#2A2E36", text: "#E8E2D4", textBody: "#C5C9D0", muted: "#8B929E", dim: "#6B7280",
    accent: "#8E1D22", accentGold: "#B8925A",
  },
  ultramarines: {
    label: "Ultramarines",
    bg: "#0E1622", surface: "#16233A", surfaceAlt: "#0A1220", surfaceSelected: "#1E2F4A",
    border: "#2A3F63", text: "#E8E9EA", textBody: "#C7D3E3", muted: "#8B9BB4", dim: "#5D6C87",
    accent: "#2547A0", accentGold: "#C9A646",
  },
  salamanders: {
    label: "Salamanders",
    bg: "#10160F", surface: "#1A2A1A", surfaceAlt: "#0C120B", surfaceSelected: "#233A24",
    border: "#2E4530", text: "#E9E6DC", textBody: "#CBD1C3", muted: "#92A088", dim: "#647062",
    accent: "#1F6B33", accentGold: "#C97A2E",
  },
  tyranids: {
    label: "Tyranids",
    bg: "#160B1C", surface: "#2A1233", surfaceAlt: "#0F0714", surfaceSelected: "#361A42",
    border: "#45204F", text: "#EDE0EA", textBody: "#D2B9CE", muted: "#A182A0", dim: "#6E5470",
    accent: "#7A1F63", accentGold: "#D34E86",
  },
  necrons: {
    label: "Necrons",
    bg: "#0A100D", surface: "#121C17", surfaceAlt: "#070B09", surfaceSelected: "#182823",
    border: "#23352C", text: "#DCEFE2", textBody: "#AFCFB9", muted: "#6E9179", dim: "#45594C",
    accent: "#1C3A2C", accentGold: "#39FF6A",
  },
  tau: {
    label: "T'au",
    bg: "#0D1418", surface: "#17242B", surfaceAlt: "#0A1216", surfaceSelected: "#1F323B",
    border: "#2B3E47", text: "#E7EEF1", textBody: "#C3D3DA", muted: "#85A0AA", dim: "#57717A",
    accent: "#1C5F73", accentGold: "#E08328",
  },
};

const VAR_NAMES = {
  bg: "--wh-bg", surface: "--wh-surface", surfaceAlt: "--wh-surface-alt", surfaceSelected: "--wh-surface-selected",
  border: "--wh-border", text: "--wh-text", textBody: "--wh-text-body", muted: "--wh-muted", dim: "--wh-dim",
  accent: "--wh-accent", accentGold: "--wh-accent-gold",
};

export const THEME_CSS = Object.entries(THEMES)
  .map(([id, palette]) => {
    const selector = id === "codex" ? ":root" : `[data-theme="${id}"]`;
    const vars = Object.entries(VAR_NAMES).map(([key, varName]) => `${varName}: ${palette[key]};`).join(" ");
    return `${selector} { ${vars} }`;
  })
  .join("\n");

const KEY = "app-theme";

export async function loadTheme() {
  try {
    const res = await window.storage.get(KEY);
    return res?.value && THEMES[res.value] ? res.value : "codex";
  } catch {
    return "codex";
  }
}

export async function saveTheme(id) {
  try {
    await window.storage.set(KEY, id);
  } catch { /* best effort */ }
}
