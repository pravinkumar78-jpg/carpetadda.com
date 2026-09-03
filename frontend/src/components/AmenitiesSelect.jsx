import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CaretDown, X } from "@phosphor-icons/react";

/**
 * Shared A–Z multi-select dropdown for amenities (Property & Project forms).
 * Options + current selections are merged, deduped, and shown sorted ascending;
 * selected amenities appear as removable chips below the trigger.
 */
export default function AmenitiesSelect({ options = [], selected = [], onChange, testIdPrefix = "amenities" }) {
  const [open, setOpen] = useState(false);
  const all = Array.from(new Set([...options, ...selected])).sort((a, b) => a.localeCompare(b));
  const chosen = [...selected].sort((a, b) => a.localeCompare(b));
  const toggle = (a) => onChange(selected.includes(a) ? selected.filter(x => x !== a) : [...selected, a]);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" data-testid={`${testIdPrefix}-dropdown`}
            className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 flex items-center justify-between hover:border-blue-300 transition-colors">
            <span>{chosen.length ? `${chosen.length} amenit${chosen.length === 1 ? "y" : "ies"} selected` : "Select amenities"}</span>
            <CaretDown size={14} className="text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] max-h-72 overflow-y-auto p-1.5">
          {all.map(a => (
            <label key={a} data-testid={`${testIdPrefix}-option-${a}`}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
              <Checkbox checked={selected.includes(a)} onCheckedChange={() => toggle(a)} />
              <span>{a}</span>
            </label>
          ))}
          {all.length === 0 && <div className="text-sm text-slate-400 px-2.5 py-3">No amenities available.</div>}
        </PopoverContent>
      </Popover>
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3" data-testid={`${testIdPrefix}-selected`}>
          {chosen.map(a => (
            <span key={a} data-testid={`${testIdPrefix}-chip-${a}`}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2.5 py-1.5 font-medium">
              {a}
              <button type="button" aria-label={`Remove ${a}`} data-testid={`${testIdPrefix}-remove-${a}`} onClick={() => toggle(a)}
                className="text-blue-400 hover:text-blue-700 transition-colors"><X size={12} weight="bold" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
