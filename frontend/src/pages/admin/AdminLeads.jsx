import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PhoneCall, EnvelopeSimple, WhatsappLogo, Trash, Pencil, CircleNotch } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

const STATUSES = ["new", "contacted", "interested", "site_visit", "negotiation", "booking", "converted", "lost", "junk"];
const PRIORITIES = ["hot", "warm", "cold"];

const statusColor = (s) => ({
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  interested: "bg-violet-50 text-violet-700 border-violet-200",
  site_visit: "bg-amber-50 text-amber-700 border-amber-200",
  negotiation: "bg-orange-50 text-orange-700 border-orange-200",
  booking: "bg-teal-50 text-teal-700 border-teal-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-rose-50 text-rose-700 border-rose-200",
  junk: "bg-slate-100 text-slate-500 border-slate-200",
}[s] || "bg-slate-100 text-slate-600 border-slate-200");

const priorityColor = (p) => ({
  hot: "bg-rose-100 text-rose-700",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-slate-100 text-slate-600",
}[p] || "bg-slate-100 text-slate-600");

export default function AdminLeads() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const url = filter ? `/leads?status=${filter}&limit=200` : "/leads?limit=200";
    try { const { data } = await api.get(url); setRows(data); }
    catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const updateField = async (id, patch) => {
    try { await api.put(`/leads/${id}`, patch); toast.success("Updated"); load(); if (editing?.id === id) setEditing({...editing, ...patch}); }
    catch { toast.error("Update failed"); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this lead permanently?")) return;
    try { await api.delete(`/leads/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const addNote = async () => {
    if (!note.trim() || !editing) return;
    const notes = [...(editing.notes || []), { text: note, at: new Date().toISOString() }];
    try {
      await api.put(`/leads/${editing.id}`, { notes });
      setEditing({ ...editing, notes });
      setNote("");
      toast.success("Note added");
    } catch { toast.error("Failed to add note"); }
  };

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: rows.filter(r => r.status === s).length }), {});

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button data-testid="filter-all" onClick={() => setFilter("")} className={`text-xs px-3 py-1.5 rounded-full border font-medium ${filter === "" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
          All <span className="ml-1 opacity-70">({rows.length})</span>
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} data-testid={`filter-${s}`} className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize ${filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
            {s.replace("_", " ")} <span className="ml-1 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Interest</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Source</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-slate-500"><CircleNotch className="inline animate-spin" size={20} /></td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <a href={`tel:${r.phone}`} className="hover:text-blue-600 flex items-center gap-1"><PhoneCall size={11} /> {r.phone}</a>
                      {r.email && <a href={`mailto:${r.email}`} className="hover:text-blue-600 flex items-center gap-1"><EnvelopeSimple size={11} /> {r.email}</a>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">
                    {r.property_id && <div>Property enquiry</div>}
                    {r.project_id && <div>Project enquiry</div>}
                    {r.message && <div className="text-slate-500 line-clamp-2 mt-1">{r.message}</div>}
                    {(r.budget_min || r.budget_max) && <div className="mt-1">Budget: {formatINR(r.budget_min || 0)} – {formatINR(r.budget_max || 0)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={v => updateField(r.id, { status: v })}>
                      <SelectTrigger data-testid={`lead-status-${r.id}`} className={`h-8 text-xs w-36 border ${statusColor(r.status)} font-semibold capitalize`}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={r.priority || "warm"} onValueChange={v => updateField(r.id, { priority: v })}>
                      <SelectTrigger className={`h-8 text-xs w-24 ${priorityColor(r.priority)} font-semibold capitalize border-transparent`}><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 capitalize">{r.source?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="WhatsApp"><WhatsappLogo size={14} /></a>
                      <button onClick={() => setEditing(r)} data-testid={`edit-lead-${r.id}`} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => remove(r.id)} data-testid={`del-lead-${r.id}`} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-slate-500">No leads {filter && `in "${filter}"`}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Dialog open onOpenChange={o => !o && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Lead · {editing.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="text-sm text-slate-600 space-y-1">
                <div><PhoneCall size={12} className="inline mr-1" /> {editing.phone}</div>
                {editing.email && <div><EnvelopeSimple size={12} className="inline mr-1" /> {editing.email}</div>}
                {editing.message && <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-slate-700">"{editing.message}"</div>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Notes</label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {(editing.notes || []).map((n, i) => (
                    <div key={i} className="text-xs bg-slate-50 border border-slate-200 rounded p-2">
                      <div className="text-slate-400 mb-1">{new Date(n.at).toLocaleString()}</div>
                      <div className="text-slate-700">{n.text}</div>
                    </div>
                  ))}
                  {(editing.notes || []).length === 0 && <div className="text-xs text-slate-400 italic">No notes yet.</div>}
                </div>
                <div className="flex gap-2">
                  <Textarea data-testid="lead-note-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a follow-up note…" rows={2} className="rounded-lg border-slate-200" />
                </div>
                <button data-testid="add-lead-note" onClick={addNote} disabled={!note.trim()} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add Note</button>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Close</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
