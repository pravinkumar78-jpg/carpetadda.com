import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pencil, Copy, Plus, MagnifyingGlass, ShieldCheck, Star, Archive, Eye } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import RejectDialog from "@/pages/admin/RejectDialog";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];
const STATUSES = ["draft", "pending_review", "active", "rejected", "sold", "rented", "archived"];
const STATUS_LABEL = { pending_review: "Pending Review", active: "Approved", rejected: "Rejected", draft: "Draft", archived: "Archived" };


export default function AdminProperties() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);

  const load = async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (city) params.set("city", city);
    const { data } = await api.get(`/admin/properties?${params.toString()}`);
    setRows(data.items); setTotal(data.total);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status, city]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const review = async (r, action) => {
    if (action === "reject") { setRejecting(r); return; }
    if (action === "approve" && !confirm(`Approve "${r.title}" and make it live?`)) return;
    try {
      await api.put(`/admin/properties/${r.id}/${action}`, {});
      toast.success("Approved — now live");
      load();
    } catch { toast.error("Action failed"); }
  };

  const archive = async (id) => {
    if (!confirm("Archive this property? It will be hidden from the site. You can restore it anytime from the Archive tab.")) return;
    try { await api.put(`/admin/properties/${id}/archive`); toast.success("Archived — find it in the Archive tab"); load(); }
    catch { toast.error("Archive failed"); }
  };

  const duplicate = async (id) => {
    try { await api.post(`/properties/${id}/duplicate`); toast.success("Duplicated as draft"); load(); }
    catch { toast.error("Duplicate failed"); }
  };

  const toggleFlag = async (row, key) => {
    try { await api.put(`/properties/${row.id}`, { [key]: !row[key] }); load(); }
    catch { toast.error("Update failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <form onSubmit={onSearch} className="flex-1 max-w-md relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input data-testid="admin-prop-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, slug, address…" className="pl-9 h-10 border-slate-200 rounded-lg" />
        </form>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="filter-pending-review"
            onClick={() => { setStatus(status === "pending_review" ? "" : "pending_review"); setPage(1); }}
            className={`h-10 px-4 rounded-lg text-xs font-semibold transition-colors border ${status === "pending_review" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"}`}
          >
            Pending Review
          </button>
          <Select value={status} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36 h-10 border-slate-200 rounded-lg" data-testid="admin-prop-status"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s] || s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={v => { setCity(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36 h-10 border-slate-200 rounded-lg" data-testid="admin-prop-city"><SelectValue placeholder="All cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {CITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-"," ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <button data-testid="admin-prop-new" onClick={() => nav("/admin/properties/new")} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus size={14} weight="bold" /> New Property
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Property</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Flags</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 line-clamp-1">{r.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{r.bhk ? `${r.bhk} BHK · ` : ""}{r.property_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatINR(r.listing_type === "rent" ? r.rent : r.price)}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.location?.replace("-"," ")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      r.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      r.status === "pending_review" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      r.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>{STATUS_LABEL[r.status] || r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <button data-testid={`toggle-featured-${r.id}`} onClick={() => toggleFlag(r, "featured")} title="Toggle featured" className={`p-1.5 rounded ${r.featured ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}>
                        <Star size={16} weight={r.featured ? "fill" : "regular"} />
                      </button>
                      <button data-testid={`toggle-verified-${r.id}`} onClick={() => toggleFlag(r, "verified")} title="Toggle verified" className={`p-1.5 rounded ${r.verified ? "text-emerald-500" : "text-slate-300 hover:text-slate-500"}`}>
                        <ShieldCheck size={16} weight={r.verified ? "fill" : "regular"} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "pending_review" && (
                        <>
                          <button data-testid={`approve-${r.id}`} onClick={() => review(r, "approve")} className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Approve</button>
                          <button data-testid={`reject-${r.id}`} onClick={() => review(r, "reject")} className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">Reject</button>
                        </>
                      )}
                      <Link to={`/property/${r.slug}`} target="_blank" title="View listing" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye size={14} /></Link>
                      <button data-testid={`edit-${r.id}`} onClick={() => nav(`/admin/properties/${r.id}/edit`)} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button data-testid={`dup-${r.id}`} onClick={() => duplicate(r.id)} title="Duplicate" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Copy size={14} /></button>
                      <button data-testid={`archive-${r.id}`} onClick={() => archive(r.id)} title="Archive (restorable)" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Archive size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-slate-500">No properties. Try clearing filters.</td></tr>}
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

      {rejecting && <RejectDialog row={rejecting} kind="properties" onClose={() => setRejecting(null)} onDone={load} />}
    </div>
  );
}

