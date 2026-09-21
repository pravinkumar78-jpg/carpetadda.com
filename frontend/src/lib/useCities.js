import { useEffect, useState } from "react";
import api from "@/lib/api";

let cache = null;
let inflight = null;

/**
 * Shared dynamic city list — derived from active properties/projects via GET /api/cities.
 * One source for every city dropdown (home search, forms, admin filters).
 * Cities appear/disappear automatically as listings are added or unlisted.
 */
export function useCities() {
  const [cities, setCities] = useState(cache || []);
  useEffect(() => {
    if (cache) { setCities(cache); return; }
    if (!inflight) {
      inflight = api.get("/cities").then(r => { cache = Array.isArray(r.data) ? r.data : []; return cache; }).catch(() => { cache = []; return cache; });
    }
    inflight.then(v => setCities(v || []));
  }, []);
  return cities;
}
