import { defineConfig } from "vitest/config";

// The app's source uses Vite's `import.meta.env.BASE_URL` (see lib/paths.js),
// so vitest needs to resolve the `virtual:pwa-register`-free modules the same
// way Vite does. We only test pure logic in lib/, which has no DOM or
// Capacitor runtime dependencies at import time.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "src/**/*.test.jsx"],
  },
});
