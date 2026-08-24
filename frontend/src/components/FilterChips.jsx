import { X } from "@phosphor-icons/react";

/**
 * Removable chips for currently-applied listing filters.
 * Purely presentational — removal calls the page's existing update(key, "") which deletes the URL param and refetches.
 */
export default function FilterChips({ params, update, exclude = [], labels = {} }) {
  const SKIP = new Set(["page", "sort", ...exclude]);
  const entries = Object.entries(params).filter(([k, v]) => v && !SKIP.has(k));
  if (!entries.length) return null;
  const pretty = (k, v) => (labels[k] ? labels[k](v) : `${k.replace(/_/g, " ")}: ${String(v).replace(/-/g, " ")}`);
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4" data-testid="active-filter-chips">
      {entries.map(([k, v]) => (
        <span key={k} data-testid={`filter-chip-${k}`} className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 pl-3 pr-1.5 py-1.5 rounded-full capitalize">
          {pretty(k, v)}
          <button type="button" data-testid={`filter-chip-remove-${k}`} onClick={() => update(k, "")} aria-label={`Remove ${k} filter`} className="p-0.5 rounded-full hover:bg-blue-100 transition-colors"><X size={12} weight="bold" /></button>
        </span>
      ))}
    </div>
  );
}
