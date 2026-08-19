import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { NotePencil, UserCheck } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

const fmtWhen = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" }); };

/** Listings the super admin assigned to the current user — they can edit these (edits to live listings need admin approval). */
export default function AssignedPanel({ editPropertyBase = "/dashboard/list-property", editProjectBase = "/dashboard/edit-project" }) {
  const [data, setData] = useState({ properties: [], projects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/my/assigned")
      .then(r => setData({ properties: r.data.properties || [], projects: r.data.projects || [] }))
      .catch(() => setData({ properties: [], projects: [] }))
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    ...(data.properties || []).map(d => ({ id: d.id, name: d.title || "Untitled", type: "Property", loc: d.location, status: d.status, pending: d.pending_approval, price: d.listing_type === "rent" ? d.rent : d.price, to: `${editPropertyBase}/${d.id}/edit` })),
    ...(data.projects || []).map(d => ({ id: d.id, name: d.name || "Untitled", type: "Project", loc: d.location, status: d.status, pending: d.pending_approval, price: d.price_from, to: `${editProjectBase}/${d.id}/edit` })),
  ];

  return (
    <div className="card-premium overflow-hidden" data-testid="assigned-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Listing</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12">
                <UserCheck size={36} className="text-slate-300 mx-auto mb-3" />
                <div className="font-semibold text-slate-900 mb-1">Nothing assigned to you yet</div>
                <div className="text-xs text-slate-500">When the admin assigns a property or project to you, it will appear here for you to manage.</div>
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0" data-testid={`assigned-row-${r.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 line-clamp-1">{r.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{(r.loc || "").replace(/-/g, " ")}</div>
                </td>
                <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{r.type}</span></td>
                <td className="px-4 py-3 rupee text-slate-700 whitespace-nowrap">{r.price ? formatINR(r.price) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : r.status === "pending_review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {({ active: "Live", pending_review: "Pending Review", rejected: "Rejected", draft: "Draft", archived: "Archived" })[r.status] || r.status}
                  </span>
                  {r.pending && <span className="ml-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700" data-testid={`assigned-pending-${r.id}`}>Pending Approval</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <Link to={r.to} data-testid={`assigned-edit-${r.id}`} title="Edit (changes to live listings need admin approval)"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><NotePencil size={15} /></Link>
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
