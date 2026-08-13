import { useEffect, useState } from "react";
import api from "@/lib/api";

let cache = null;
let inflight = null;

/**
 * Fetch the site-wide settings singleton once and share it across the app.
 * Falls back to sensible defaults so the UI never breaks if the API is down.
 */
export function useSettings() {
  const [s, setS] = useState(cache);
  useEffect(() => {
    if (cache) { setS(cache); return; }
    if (!inflight) {
      inflight = api.get("/settings").then(r => { cache = r.data; return cache; }).catch(() => null);
    }
    inflight.then(v => { if (v) setS(v); });
  }, []);
  return s;
}
