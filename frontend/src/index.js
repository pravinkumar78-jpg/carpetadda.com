import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Suppress benign ResizeObserver loop errors (radix dropdowns/popovers trigger these during measurement;
// they are harmless but the webpack dev overlay escalates them to a full-screen error)
const isResizeObserverError = (msg) =>
  typeof msg === "string" && (msg.includes("ResizeObserver loop completed") || msg.includes("ResizeObserver loop limit exceeded"));

window.addEventListener("error", (e) => {
  if (isResizeObserverError(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  if (isResizeObserverError(e.reason?.message)) e.preventDefault();
});


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
