import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pencil, Plus, MagnifyingGlass, Star, Package, Archive, Eye, UserPlus } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import RejectDialog from "@/pages/admin/RejectDialog";
import AssignUserDialog from "@/components/admin/AssignUserDialog";
import { Link } from "react-router-dom";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];

export default function AdminProjects() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [status, setStatus] = useState("");

  const load = async () => {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (status) params.set("status", status);
    const { data } = await api.get(`/admin/projects?${params.toString()}`);
    setRows(data.items); setTotal(data.total);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, city, status]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const review = async (r, action) => {
    if (action === "reject") { setRejecting(r); return; }
    if (action === "approve" && !confirm(`Approve "${r.name}" and make it live?`)) return;
    try {
      await api.put(`/admin/projects/${r.id}/${action}`, {});
      toast.success("Approved — now live");
      load();
    } catch { toast.error("Action failed"); }
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="filter-pending-review"
            onClick={() => { setStatus(status === "pending_review" ? "" : "pending_review"); setPage(1); }}
            className={`h-10 px-4 inline-flex items-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border ${status === "pending_review" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"}`}
          >
            Pending Review
          </button>
          <Select value={city} onValueChange={v => { setCity(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36 h-10 border-slate-200 rounded-lg"><SelectValue placeholder="All cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {CITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-"," ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <button data-testid="admin-proj-new" onClick={() => nav("/admin/projects/new")} className="h-10 bg-blue-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap">
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
                <th className="px-4 py-3 text-left font-semibold">Status</th>
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
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      r.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      r.status === "pending_review" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      r.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>{({ pending_review: "Pending Review", active: "Approved", rejected: "Rejected", draft: "Draft", archived: "Archived" })[r.status] || r.status}</span>
                    {r.pending_approval && <span className="ml-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-200" data-testid={`pending-changes-${r.id}`}>Edits Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleFeatured(r)} className={`p-1.5 rounded ${r.featured ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}>
                      <Star size={16} weight={r.featured ? "fill" : "regular"} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {r.status === "pending_review" && (
                        <>
                          <button onClick={() => review(r, "approve")} data-testid={`approve-proj-${r.id}`} className="h-8 px-3 inline-flex items-center whitespace-nowrap text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Approve</button>
                          <button onClick={() => review(r, "reject")} data-testid={`reject-proj-${r.id}`} className="h-8 px-3 inline-flex items-center whitespace-nowrap text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Reject</button>
                        </>
                      )}
                      <Link to={`/project/${r.slug}`} target="_blank" title="View listing" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye size={14} /></Link>
                      <button onClick={() => nav(`/admin/projects/${r.id}/units`)} data-testid={`units-proj-${r.id}`} title="Manage Units" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Package size={14} /></button>
                      <button onClick={() => nav(`/admin/projects/${r.id}/edit`)} data-testid={`edit-proj-${r.id}`} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setAssigning(r)} data-testid={`assign-proj-${r.id}`} title="Assign user" className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"><UserPlus size={14} /></button>
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

      {rejecting && <RejectDialog row={rejecting} kind="projects" onClose={() => setRejecting(null)} onDone={load} />}
      {assigning && <AssignUserDialog kind="projects" item={assigning} onClose={() => setAssigning(null)} onDone={load} />}
    </div>
  );
}
