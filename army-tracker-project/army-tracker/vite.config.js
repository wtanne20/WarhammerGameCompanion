import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // registered manually in main.jsx so we can force-reload on a new version
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      // Data/icon libraries are large (public/icons is ~19MB of SVGs) — cache
      // the app shell for offline use, but don't try to precache all of that
      // into the service worker; it's fetched (and browser-cached) on demand
      // instead via a runtime caching rule below.
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["icons/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/data/") || url.pathname.includes("/icons/"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "army-tracker-data" },
          },
        ],
      },
      manifest: {
        name: "Army Tracker",
        short_name: "Army Tracker",
        description: "Warhammer 40k army list builder and tabletop companion",
        theme_color: "#14161A",
        background_color: "#14161A",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "pwa/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
