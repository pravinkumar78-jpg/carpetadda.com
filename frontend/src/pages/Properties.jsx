import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SquaresFour, List, MapTrifold, FunnelSimple } from "@phosphor-icons/react";
import PropertyCard from "@/components/PropertyCard";
import PropertyMap from "@/components/PropertyMap";
import api from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];

export default function Properties() {
  const [sp, setSp] = useSearchParams();
  const [layout, setLayout] = useState("grid");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");

  const params = Object.fromEntries(sp.entries());

  const update = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value === "" || value === undefined || value === null) next.delete(key);
    else next.set(key, value);
    setSp(next);
    setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    const qp = new URLSearchParams(sp);
    qp.set("page", String(page));
    qp.set("sort", sort);
    qp.set("page_size", layout === "half_map" ? "10" : "12");
    api.get(`/properties?${qp.toString()}`).then(r => {
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  }, [sp, page, sort, layout]);

  const filters = (
    <div className="space-y-5">
      <FilterGroup label="Listing Type">
        <Select value={params.listing_type || ""} onValueChange={v => update("listing_type", v)}>
          <SelectTrigger data-testid="filter-listing-type" className="rounded-lg border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent><SelectItem value="sale">Buy</SelectItem><SelectItem value="rent">Rent</SelectItem></SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Category">
        <Select value={params.category || ""} onValueChange={v => update("category", v)}>
          <SelectTrigger data-testid="filter-category" className="rounded-lg border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem></SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="City">
        <Select value={params.city || ""} onValueChange={v => update("city", v)}>
          <SelectTrigger data-testid="filter-city" className="rounded-lg border-slate-200"><SelectValue placeholder="Any city" /></SelectTrigger>
          <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="BHK">
        <Select value={params.bhk || ""} onValueChange={v => update("bhk", v)}>
          <SelectTrigger data-testid="filter-bhk" className="rounded-lg border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Price Range (₹)">
        <div className="grid grid-cols-2 gap-2">
          <Input data-testid="filter-price-min" type="number" placeholder="Min" value={params.price_min || ""} onChange={e => update("price_min", e.target.value)} className="rounded-lg border-slate-200" />
          <Input data-testid="filter-price-max" type="number" placeholder="Max" value={params.price_max || ""} onChange={e => update("price_max", e.target.value)} className="rounded-lg border-slate-200" />
        </div>
      </FilterGroup>
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700">
          <Checkbox data-testid="filter-verified" checked={params.verified === "true"} onCheckedChange={v => update("verified", v ? "true" : "")} /> Verified only
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700">
          <Checkbox data-testid="filter-rera" checked={params.rera === "true"} onCheckedChange={v => update("rera", v ? "true" : "")} /> RERA registered
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700">
          <Checkbox data-testid="filter-featured" checked={params.featured === "true"} onCheckedChange={v => update("featured", v ? "true" : "")} /> Featured
        </label>
      </div>
      <button data-testid="clear-filters" onClick={() => setSp({})} className="w-full text-sm text-blue-600 border border-blue-200 py-2.5 rounded-lg hover:bg-blue-50 font-medium transition-colors">Clear filters</button>
    </div>
  );

  return (
    <div>
      <div className="section-blue">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-2"><a href="/" className="hover:text-blue-600">Home</a> › Properties</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Properties for Sale & Rent</h1>
              <div className="text-sm text-slate-600 mt-1">{loading ? "Searching…" : `${total} listings found`}</div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Sheet>
                <SheetTrigger asChild>
                  <button data-testid="filters-btn" className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700"><FunnelSimple size={16} /> Filters</button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto bg-white"><div className="mt-8">{filters}</div></SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger data-testid="sort-select" className="w-44 bg-white border-slate-200 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="area_low">Area: Low to High</SelectItem>
                  <SelectItem value="area_high">Area: High to Low</SelectItem>
                  <SelectItem value="most_viewed">Most Viewed</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                {[["grid", SquaresFour], ["list", List], ["half_map", MapTrifold]].map(([k, Icon]) => (
                  <button key={k} data-testid={`layout-${k}`} onClick={() => setLayout(k)}
                    className={`p-2.5 ${layout === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"} transition-colors`} aria-label={k}>
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
          <aside className="hidden lg:block card-premium p-6 h-fit sticky top-24">{filters}</aside>

          <div>
            {layout === "half_map" ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                  {items.map(p => <PropertyCard key={p.id} p={p} layout="list" />)}
                </div>
                <div className="sticky top-24 h-fit rounded-xl overflow-hidden">
                  <PropertyMap items={items} height={"80vh"} />
                </div>
              </div>
            ) : layout === "list" ? (
              <div className="space-y-4">{items.map(p => <PropertyCard key={p.id} p={p} layout="list" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(p => <PropertyCard key={p.id} p={p} />)}
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-center py-20 text-slate-500 bg-blue-50 rounded-xl border border-blue-100">No properties match your filters. Try adjusting them.</div>
            )}
            {items.length > 0 && (
              <div className="flex justify-center gap-2 mt-10">
                <button data-testid="page-prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">Previous</button>
                <span className="px-4 py-2 text-sm text-slate-600">Page {page}</span>
                <button data-testid="page-next" disabled={items.length < 12} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">{label}</div>
      {children}
    </div>
  );
}
