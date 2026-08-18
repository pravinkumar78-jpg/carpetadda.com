import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { NotePencil, PaperPlaneTilt, Trash, FileDashed } from "@phosphor-icons/react";

const fmtWhen = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function DraftsPanel({ editPropertyBase = "/dashboard/list-property", editProjectBase = "/developer/projects" }) {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "admin" || user.role === "super_admin");
  const [drafts, setDrafts] = useState({ properties: [], projects: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/drafts")
      .then(r => setDrafts({ properties: r.data.properties || [], projects: r.data.projects || [] }))
      .catch(() => setDrafts({ properties: [], projects: [] }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const publish = async (kind, d) => {
    try {
      await api.put(`/${kind}/${d.id}`, { status: isAdmin ? "active" : "pending_review" });
      toast.success(isAdmin ? "Published — now live" : "Submitted for admin review");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Publish failed"); }
  };

  const remove = async (kind, d) => {
    if (!confirm("Delete this draft permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/drafts/${kind}/${d.id}`);
      toast.success("Draft deleted");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Delete failed"); }
  };

  const rows = [
    ...(drafts.properties || []).map(p => ({ kind: "properties", id: p.id, name: p.title || "Untitled property", type: "Property", loc: p.location, updated: p.updated_at || p.created_at, raw: p })),
    ...(drafts.projects || []).map(p => ({ kind: "projects", id: p.id, name: p.name || "Untitled project", type: "Project", loc: p.location, updated: p.updated_at || p.created_at, raw: p })),
  ].sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")));

  return (
    <div className="card-premium overflow-hidden" data-testid="drafts-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Draft</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Last Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading drafts…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12">
                <FileDashed size={36} className="text-slate-300 mx-auto mb-3" />
                <div className="font-semibold text-slate-900 mb-1">No drafts</div>
                <div className="text-xs text-slate-500">Unfinished listings you save will appear here so you can continue anytime.</div>
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={`${r.kind}-${r.id}`} className="border-b border-slate-100 last:border-0" data-testid={`draft-row-${r.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 line-clamp-1">{r.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{(r.loc || "").replace(/-/g, " ")}</div>
                </td>
                <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{r.type}</span></td>
                <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500" data-testid={`draft-status-${r.id}`}>Draft</span></td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap" data-testid={`draft-updated-${r.id}`}>{fmtWhen(r.updated)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`${r.kind === "properties" ? editPropertyBase : editProjectBase}/${r.id}/edit`} data-testid={`draft-edit-${r.id}`} title="Continue editing"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><NotePencil size={15} /></Link>
                    <button onClick={() => publish(r.kind, r.raw)} data-testid={`draft-publish-${r.id}`} title={isAdmin ? "Publish now" : "Submit for review"}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><PaperPlaneTilt size={15} /></button>
                    <button onClick={() => remove(r.kind, r.raw)} data-testid={`draft-delete-${r.id}`} title="Delete draft"
                      className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
