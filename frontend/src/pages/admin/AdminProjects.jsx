import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pencil, Plus, MagnifyingGlass, Star, Package, Archive } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];

export default function AdminProjects() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    const { data } = await api.get(`/admin/projects?${params.toString()}`);
    setRows(data.items); setTotal(data.total);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, city]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const archive = async (id) => {
    if (!confirm("Archive this project? It will be hidden from the site. You can restore it anytime from the Archive tab.")) return;
    try { await api.put(`/admin/projects/${id}/archive`); toast.success("Archived — find it in the Archive tab"); load(); }
    catch { toast.error("Archive failed"); }
  };

  const toggleFeatured = async (row) => {
    try { await api.put(`/projects/${row.id}`, { featured: !row.featured }); load(); }
    catch { toast.error("Update failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <form onSubmit={onSearch} className="flex-1 max-w-md relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search project name…" className="pl-9 h-10 border-slate-200 rounded-lg" data-testid="admin-proj-search" />
        </form>
        <div className="flex items-center gap-2">
          <Select value={city} onValueChange={v => { setCity(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36 h-10 border-slate-200 rounded-lg"><SelectValue placeholder="All cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {CITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-"," ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <button data-testid="admin-proj-new" onClick={() => nav("/admin/projects/new")} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 shadow-sm">
            <Plus size={14} weight="bold" /> New Project
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Possession</th>
                <th className="px-4 py-3 text-left font-semibold">RERA</th>
                <th className="px-4 py-3 text-center font-semibold">Featured</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <div className="font-medium text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{r.location?.replace("-", " ")}, {r.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatINR(r.price_from)}<span className="text-slate-400"> — {formatINR(r.price_to)}</span></td>
                  <td className="px-4 py-3 text-slate-600">{r.possession_date}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{r.rera_number || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleFeatured(r)} className={`p-1.5 rounded ${r.featured ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}>
                      <Star size={16} weight={r.featured ? "fill" : "regular"} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => nav(`/admin/projects/${r.id}/units`)} data-testid={`units-proj-${r.id}`} title="Manage Units" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Package size={14} /></button>
                      <button onClick={() => nav(`/admin/projects/${r.id}/edit`)} data-testid={`edit-proj-${r.id}`} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => archive(r.id)} data-testid={`archive-proj-${r.id}`} title="Archive (restorable)" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Archive size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-slate-500">No projects.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-slate-500">Showing {rows.length} of {total}</div>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40">Previous</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page}</span>
          <button disabled={rows.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40">Next</button>
        </div>
      </div>

    </div>
  );
}
