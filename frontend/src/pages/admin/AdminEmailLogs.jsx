import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowClockwise, CheckCircle, XCircle, Clock } from "@phosphor-icons/react";

export default function AdminEmailLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/email/logs?limit=200"); setRows(data || []); }
    catch { toast.error("Failed to load email logs"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resend = async (r) => {
    setResending(r.id);
    try {
      await api.post(`/admin/email/resend/${r.id}`);
      toast.success("Email resent successfully");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Resend failed");
      load();
    } finally { setResending(null); }
  };

  const statusBadge = (s) => s === "sent"
    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700"><CheckCircle size={11} weight="fill" /> Sent</span>
    : s === "skipped"
      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700"><Clock size={11} weight="fill" /> Skipped</span>
      : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-rose-50 text-rose-700"><XCircle size={11} weight="fill" /> Failed</span>;

  return (
    <div data-testid="admin-email-logs">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Email Logs</h2>
          <p className="text-sm text-slate-500">Every delivery attempt — business inbox, agent/developer copies and client confirmations.</p>
        </div>
        <button onClick={load} data-testid="email-logs-refresh" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <ArrowClockwise size={14} /> Refresh
        </button>
      </div>
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Date / Time</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">To</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Related</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Error / Reason</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id || r.at} data-testid={`email-log-${r.id || r.at}`} className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(r.at).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 capitalize">{(r.kind || "").replace(/[:_]/g, " ")}{r.resend_of ? " (resend)" : ""}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-44 break-all">{(r.to || []).join(", ")}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-52 truncate" title={r.subject}>{r.subject}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.meta?.client && <div>{r.meta.client}</div>}
                    {r.meta?.listing && <div className="text-slate-400">{r.meta.listing}</div>}
                    {r.meta?.lead_id && <div className="text-[10px] text-slate-400">Lead {String(r.meta.lead_id).slice(0, 8)}…</div>}
                  </td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-xs text-rose-600 max-w-52 break-words">{r.error || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "failed" && r.resendable && (
                      <button onClick={() => resend(r)} disabled={resending === r.id} data-testid={`resend-${r.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                        <ArrowClockwise size={12} className={resending === r.id ? "animate-spin" : ""} />
                        {resending === r.id ? "Sending…" : "Resend"}
                      </button>
                    )}
                    {r.status === "failed" && !r.resendable && <span className="text-[10px] text-slate-400">no content stored</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-slate-400 text-sm">No email attempts logged yet — submit an enquiry to see it here.</td></tr>
              )}
              {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
