import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * Shared favorites state — keeps hearts on cards/detail pages in sync with Dashboard → Favorites.
 * One cached fetch per session; anonymous users resolve to an empty set.
 */
let cache = null;
let inflight = null;

export const loadFavorites = () => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = (async () => {
      try {
        const [p, j] = await Promise.all([
          api.get("/favorites").catch(() => ({ data: [] })),
          api.get("/favorites/projects").catch(() => ({ data: [] })),
        ]);
        cache = { properties: new Set((p.data || []).map(x => x.id)), projects: new Set((j.data || []).map(x => x.id)) };
      } catch {
        cache = { properties: new Set(), projects: new Set() };
      }
      inflight = null;
      return cache;
    })();
  }
  return inflight;
};

export function useFavorite(id, type = "property") {
  const key = type === "project" ? "projects" : "properties";
  const [fav, setFav] = useState(false);
  useEffect(() => {
    let on = true;
    if (id) loadFavorites().then(c => { if (on) setFav(c[key].has(id)); });
    return () => { on = false; };
  }, [id, key]);

  const toggle = async () => {
    const url = type === "project" ? `/favorites/project/${id}` : `/favorites/${id}`;
    if (fav) { await api.delete(url); cache?.[key].delete(id); setFav(false); return false; }
    await api.post(url); cache?.[key].add(id); setFav(true); return true;
  };
  return [fav, toggle];
}
