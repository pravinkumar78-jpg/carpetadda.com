import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Extract a YouTube video ID from watch / youtu.be / embed / shorts URLs (safe, no network)
export function ytEmbedId(url) {
  if (!url) return null;
  const m = String(url).trim().match(/(?:youtube\.com\/(?:watch\?[^#\s]*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
