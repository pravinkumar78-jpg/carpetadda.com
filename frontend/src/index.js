import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// ─── ResizeObserver loop fix (root cause) ─────────────────────────────
// Radix popovers/selects measure layout inside ResizeObserver callbacks, which can
// produce the benign "ResizeObserver loop completed" notification storm. The CRA dev
// overlay escalates this to a full-screen error. Capture-phase interception keeps the
// message from reaching the dev overlay. (An earlier rAF-deferral patch here caused the
// Radix dropdown's autoUpdate to re-observe every frame and hard-freeze the page — removed.)
const isResizeObserverError = (msg) =>
  typeof msg === "string" && (msg.includes("ResizeObserver loop completed") || msg.includes("ResizeObserver loop limit exceeded"));

const swallowRO = (e) => {
  if (isResizeObserverError(e.message || e.error?.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
  return undefined;
};
// capture phase: fires before the dev overlay's bubble-phase handlers
window.addEventListener("error", swallowRO, true);
window.addEventListener("unhandledrejection", (e) => {
  if (isResizeObserverError(e.reason?.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
