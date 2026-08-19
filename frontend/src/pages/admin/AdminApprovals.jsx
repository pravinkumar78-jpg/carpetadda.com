import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { CheckCircle, XCircle, Clock } from "@phosphor-icons/react";

const SKIP = new Set(["seo", "nearby_locations", "images", "floor_plans", "rera_entries", "amenities", "features"]);
const fmtWhen = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); };

/** Super admin: review edits that assigned/owner users made to LIVE listings. */
export default function AdminApprovals() {
  const [data, setData] = useState({ properties: [], projects: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/admin/pending-changes")
      .then(r => setData({ properties: r.data.properties || [], projects: r.data.projects || [] }))
      .catch(() => setData({ properties: [], projects: [] }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const act = async (kind, d, action) => {
    const name = d.title || d.name;
    if (!confirm(`${action === "approve" ? "Approve and apply these changes to the live listing" : "Reject these changes (the live listing stays unchanged and the user can edit/resubmit)"}: "${name}"?`)) return;
    try {
      await api.put(`/admin/${kind}/${d.id}/changes/${action}`);
      toast.success(action === "approve" ? "Changes applied — live listing updated" : "Changes rejected — live listing unchanged");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Action failed"); }
  };

  const rows = [
    ...(data.properties || []).map(d => ({ kind: "properties", type: "Property", name: d.title || "Untitled", d })),
    ...(data.projects || []).map(d => ({ kind: "projects", type: "Project", name: d.name || "Untitled", d })),
  ];

  const diffSummary = (d) => {
    const ch = d.pending_changes || {};
    return Object.keys(ch)
      .filter(k => !SKIP.has(k) && JSON.stringify(ch[k]) !== JSON.stringify(d[k]))
      .slice(0, 8)
      .map(k => {
        const oldV = d[k], newV = ch[k];
        const simple = (v) => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, 40) : null;
        const o = simple(oldV), n = simple(newV);
        return { field: k.replace(/_/g, " "), text: o !== null && n !== null ? `${o || "—"} → ${n || "—"}` : "updated" };
      });
  };

  return (
    <div className="card-premium overflow-hidden" data-testid="admin-approvals">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Listing</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Assigned User</th>
              <th className="px-4 py-3 text-left font-semibold">Pending Changes</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12">
                <CheckCircle size={36} className="text-emerald-200 mx-auto mb-3" />
                <div className="font-semibold text-slate-900 mb-1">Nothing pending</div>
                <div className="text-xs text-slate-500">Edits made by assigned users to live listings will appear here for approval.</div>
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={`${r.kind}-${r.d.id}`} className="border-b border-slate-100 last:border-0 align-top" data-testid={`approval-row-${r.d.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 line-clamp-1">{r.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{(r.d.location || "").replace(/-/g, " ")}</div>
                </td>
                <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{r.type}</span></td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div className="font-medium text-slate-800">{r.d.assigned_to_name || r.d.pending_by_name || "—"}</div>
                  <div className="inline-flex items-center gap-1 text-slate-400 mt-0.5"><Clock size={11} /> {fmtWhen(r.d.pending_at)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Pending Approval</span>
                  <div className="mt-1.5 space-y-0.5">
                    {diffSummary(r.d).map(x => (
                      <div key={x.field} className="text-[11px] text-slate-500"><span className="font-semibold text-slate-600 capitalize">{x.field}:</span> {x.text}</div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => act(r.kind, r.d, "approve")} data-testid={`approval-approve-${r.d.id}`}
                      className="h-8 px-3 inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><CheckCircle size={13} weight="bold" /> Approve</button>
                    <button onClick={() => act(r.kind, r.d, "reject")} data-testid={`approval-reject-${r.d.id}`}
                      className="h-8 px-3 inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"><XCircle size={13} weight="bold" /> Reject</button>
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
