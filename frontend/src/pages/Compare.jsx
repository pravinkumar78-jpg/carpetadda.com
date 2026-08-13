import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";
import api from "@/lib/api";
import { X } from "@phosphor-icons/react";

export default function Compare() {
  const [id1, setId1] = useState(""); const [id2, setId2] = useState(""); const [id3, setId3] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState(""); const [search, setSearch] = useState([]);

  useEffect(() => {
    if (!q) { setSearch([]); return; }
    const t = setTimeout(() => api.get(`/properties?q=${q}&page_size=5`).then(r => setSearch(r.data.items)), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = async () => {
    const ids = [id1, id2, id3].filter(Boolean);
    if (!ids.length) { setItems([]); return; }
    const { data } = await api.post("/compare", { ids });
    setItems(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id1, id2, id3]);

  const rows = [
    ["Price", (p) => formatINR(p.listing_type === "rent" ? p.rent : p.price)],
    ["₹/sq.ft.", (p) => p.price_per_sqft ? `₹${p.price_per_sqft}` : "—"],
    ["BHK", (p) => p.bhk || "—"],
    ["Carpet Area", (p) => p.carpet_area ? `${p.carpet_area} sq.ft.` : "—"],
    ["Bathrooms", (p) => p.bathrooms || "—"],
    ["Floor", (p) => `${p.floor || "—"}/${p.total_floors || "—"}`],
    ["Furnishing", (p) => p.furnishing || "—"],
    ["Possession", (p) => p.possession || "—"],
    ["RERA", (p) => p.rera_number || "—"],
    ["Location", (p) => p.location],
  ];

  const addProperty = (id) => {
    if (!id1) setId1(id); else if (!id2) setId2(id); else if (!id3) setId3(id);
    setQ(""); setSearch([]);
  };

  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Compare Properties</h1>
          <p className="text-slate-600 max-w-2xl">Add up to 3 properties to compare side by side.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="relative mb-8 max-w-lg">
          <Input data-testid="compare-search" placeholder="Search property by name or address…" value={q} onChange={e => setQ(e.target.value)} className="rounded-lg border-slate-200 h-12" />
          {search.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 card-premium shadow-xl z-10 max-h-64 overflow-y-auto">
              {search.map(p => (
                <button key={p.id} onClick={() => addProperty(p.id)} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 text-sm last:border-0 transition-colors">
                  <div className="font-medium text-slate-900">{p.title}</div>
                  <div className="text-xs text-slate-500">{formatINR(p.price)} • {p.city}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-500 card-premium p-12">Search and add properties above to compare.</div>
        ) : (
          <div className="overflow-x-auto card-premium">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-500 font-semibold border-b border-slate-200 bg-slate-50">Attribute</th>
                  {items.map((p, i) => (
                    <th key={p.id} className="p-4 text-left border-b border-slate-200 min-w-[220px] bg-slate-50">
                      <img src={p.images?.[0]} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                      <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                      <button data-testid={`remove-${i}`} onClick={() => { [setId1, setId2, setId3][i]?.(""); }} className="text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1 mt-1 font-medium"><X size={10} /> Remove</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => (
                  <tr key={label} className="border-b border-slate-100 last:border-0">
                    <td className="p-4 text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</td>
                    {items.map(p => <td key={p.id} className="p-4 text-sm text-slate-800 font-medium">{fn(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
