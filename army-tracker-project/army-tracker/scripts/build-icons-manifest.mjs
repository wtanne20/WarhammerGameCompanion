// Indexes the SVG icon library at public/icons/wh40k (community fan-made
// faction/chapter heraldry the user supplied — see public/icons/links.txt
// for sources) into public/icons/manifest.json, so the in-app icon picker
// can search/browse without needing to list a directory from the browser.
// Re-run this if you add or remove icon files:
//   npm run build-icons

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("../public/icons/wh40k/", import.meta.url);
const OUT_FILE = new URL("../public/icons/manifest.json", import.meta.url);

function parseName(filename) {
  const base = filename.replace(/\.svg$/i, "");
  const bracket = base.match(/\[([^\]]+)\]/);
  const keywords = bracket ? bracket[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  const namePart = bracket ? base.slice(0, bracket.index) : base;
  const name = namePart.replace(/[-_]+/g, " ").trim().replace(/\s+/g, " ");
  return { name, keywords };
}

async function walk(dir, relParts) {
  const entries = await readdir(dir, { withFileTypes: true });
  const icons = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "desktop.ini") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      icons.push(...(await walk(full, [...relParts, entry.name])));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
      const { name, keywords } = parseName(entry.name);
      icons.push({
        path: `/icons/wh40k/${[...relParts, entry.name].join("/")}`,
        name,
        category: relParts[0] || "General",
        keywords: [...new Set([...relParts, ...keywords])],
      });
    }
  }
  return icons;
}

async function main() {
  const icons = await walk(new URL(ROOT).pathname, []);
  icons.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(OUT_FILE, JSON.stringify(icons));
  console.log(`Indexed ${icons.length} icons to public/icons/manifest.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
