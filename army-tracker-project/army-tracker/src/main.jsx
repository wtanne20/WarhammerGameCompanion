import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./storage.js"; // installs window.storage shim before App mounts
import "./index.css";
import App from "./App.jsx";

// Auto-reload to the new version as soon as one's deployed, rather than
// leaving a stale build open until the user happens to close/reopen the
// app — state is persisted continuously to window.storage anyway, so a
// reload doesn't lose anything.
registerSW({ immediate: true, onNeedRefresh: () => window.location.reload() });

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
