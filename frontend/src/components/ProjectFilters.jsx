import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatINR } from "@/lib/format";

export const PRICE_CAP = 100000000; // ₹10 Cr

/**
 * Shared Projects filter panel — the single projects filter system, reused by
 * the Projects listing page and the Enquiry page's projects section.
 * Stateless: the parent owns params/keyword and supplies update/search.
 */
export default function ProjectFilters({ params, update, keyword, setKeyword, search, locOptions, priceMax }) {
  return (
    <div className="space-y-5" data-testid="project-filters">
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Keyword</div>
        <Input data-testid="pf-keyword" value={keyword} onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()} placeholder="Project or developer…" className="h-11 rounded-lg border-slate-300" />
      </div>
      {params.category === "commercial" ? (
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Commercial Sub-Category</div>
          <Select value={params.config || ""} onValueChange={v => update("config", v === "any" ? "" : v)}>
            <SelectTrigger data-testid="pf-config" className="h-11 rounded-lg border-slate-300"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent><SelectItem value="any">Any</SelectItem>{[["shop", "Shop"], ["office", "Office Space"], ["showroom", "Showroom"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">BHK</div>
          <Select value={params.bhk || ""} onValueChange={v => update("bhk", v === "any" ? "" : v)}>
            <SelectTrigger data-testid="pf-bhk" className="h-11 rounded-lg border-slate-300"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent><SelectItem value="any">Any</SelectItem>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Location</div>
        <Select value={params.location || ""} onValueChange={v => update("location", v === "any" ? "" : v)}>
          <SelectTrigger data-testid="pf-location" className="h-11 rounded-lg border-slate-300"><SelectValue placeholder="Any location" /></SelectTrigger>
          <SelectContent><SelectItem value="any">Any location</SelectItem>{locOptions.map(([v, l]) => <SelectItem key={v} value={v} className="capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 flex justify-between">
          <span>Max Price</span><span className="text-blue-600 font-bold" data-testid="pf-price-label">{priceMax >= PRICE_CAP ? "Any" : formatINR(priceMax)}</span>
        </div>
        <Slider data-testid="pf-price" value={[priceMax]} min={2000000} max={PRICE_CAP} step={500000}
          onValueChange={([v]) => update("price_max", v >= PRICE_CAP ? "" : String(v))} className="py-3" />
      </div>
      <button onClick={search} data-testid="pf-search" className="h-11 w-full px-6 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/25">
        <MagnifyingGlass size={16} weight="bold" /> Search
      </button>
    </div>
  );
}
