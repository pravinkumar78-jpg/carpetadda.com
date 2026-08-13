import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SquaresFour, List, MagnifyingGlass } from "@phosphor-icons/react";
import api from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatINR } from "@/lib/format";

const PRICE_CAP = 100000000; // ₹10 Cr

export default function Projects() {
  const [sp, setSp] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [locations, setLocations] = useState([]);

  const params = Object.fromEntries(sp.entries());
  const [keyword, setKeyword] = useState(params.q || "");
  const priceMax = Number(params.price_max || PRICE_CAP);

  useEffect(() => {
    api.get("/locations?type=locality&limit=100").then(r => {
      const d = r.data;
      setLocations(Array.isArray(d) ? d : d.items || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qp = new URLSearchParams(sp);
    qp.set("page_size", "60");
    api.get(`/projects?${qp.toString()}`)
      .then(r => { setItems(r.data.items || []); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [sp]);

  const update = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value === "" || value === undefined || value === null) next.delete(key);
    else next.set(key, value);
    setSp(next);
  };

  const search = () => update("q", keyword.trim());
  const locOptions = useMemo(() => locations.map(l => [l.slug, l.name]), [locations]);

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">New Launches</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Signature Projects</h1>
            <p className="text-slate-600 max-w-2xl">Handpicked new-launch developments from India's most trusted builders — RERA verified, on-time delivery.</p>
          </div>
          <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden" data-testid="project-layout-toggle">
            {[["grid", SquaresFour], ["list", List]].map(([k, Icon]) => (
              <button key={k} data-testid={`project-layout-${k}`} onClick={() => setLayout(k)}
                className={`p-2.5 ${layout === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"} transition-colors`} aria-label={`${k} view`}>
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
        <div className="card-premium p-5 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr,1fr,1fr,1.4fr,auto] gap-4 items-end" data-testid="project-filters">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Keyword</div>
            <Input data-testid="pf-keyword" value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()} placeholder="Project or developer…" className="h-11 rounded-lg border-slate-300" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">BHK</div>
            <Select value={params.bhk || ""} onValueChange={v => update("bhk", v === "any" ? "" : v)}>
              <SelectTrigger data-testid="pf-bhk" className="h-11 rounded-lg border-slate-300"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent><SelectItem value="any">Any</SelectItem>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
          <button onClick={search} data-testid="pf-search" className="h-11 px-6 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/25">
            <MagnifyingGlass size={16} weight="bold" /> Search
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mt-6 mb-6">
          <div className="text-sm text-slate-600" data-testid="project-count">{loading ? "Searching…" : `${total} project${total === 1 ? "" : "s"} found`}</div>
          <Select value={params.sort || "newest"} onValueChange={v => update("sort", v === "newest" ? "" : v)}>
            <SelectTrigger data-testid="pf-sort" className="w-56 bg-white border-slate-300 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recently Added First</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {layout === "list" ? (
          <div className="space-y-4 pb-12">{items.map(p => <ProjectCard key={p.id} p={p} layout="list" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">{items.map(p => <ProjectCard key={p.id} p={p} />)}</div>
        )}
        {loading && <div className="text-center py-10 text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-blue-50 rounded-xl border border-blue-100 mb-12" data-testid="projects-empty">No projects match your filters. Try adjusting them.</div>
        )}
      </div>
    </div>
  );
}
