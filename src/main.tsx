// omide-v138-cache-bypass: temporary Safari cache/service-worker cleanup for LiveKit testing
if (typeof window !== "undefined") {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => undefined);
    }

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      }).catch(() => undefined);
    }
  } catch {
    // ignore cache cleanup errors
  }
}

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppStateProvider } from "./app/AppState";
import "./styles/global.css";
import { pwaService } from "./services/pwaService";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </React.StrictMode>
);


void pwaService.registerServiceWorker();
