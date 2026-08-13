import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUSES = ["requested", "confirmed", "rescheduled", "completed", "cancelled", "no_show"];

export default function AdminSiteVisits() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/site-visits?limit=200"); setRows(data || []); }
    catch { toast.error("Failed to load site visits"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (v, status) => {
    try {
      await api.put(`/site-visits/${v.id}`, { status });
      toast.success("Status updated");
      load();
    } catch { toast.error("Update failed"); }
  };

  return (
    <div data-testid="admin-site-visits">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Site Visits</h2>
        <p className="text-sm text-slate-500">Every scheduled property and project visit request.</p>
      </div>
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Lead</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Listing</th>
                <th className="px-4 py-3 text-left font-semibold">Requested</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-500">No site visits yet.</td></tr>}
              {!loading && rows.map(v => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{v.name || "—"}</td>
                  <td className="px-4 py-3"><a href={`tel:${v.phone}`} className="text-blue-600">{v.phone || "—"}</a>{v.email && <div className="text-xs text-slate-400">{v.email}</div>}</td>
                  <td className="px-4 py-3 text-slate-600">{v.property_title || v.project_name || "—"}{(v.agent_name || v.developer_name) && <div className="text-xs text-slate-400">{v.agent_name || v.developer_name}</div>}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{[v.visit_date, v.visit_time].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{v.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <Select value={v.status || "requested"} onValueChange={s => setStatus(v, s)}>
                      <SelectTrigger data-testid={`visit-status-${v.id}`} className="h-8 w-32 text-xs border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
