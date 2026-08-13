import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash, Eye, EyeSlash } from "@phosphor-icons/react";

const CATS = ["general", "buy", "rent", "invest", "loans"];

export default function AdminFAQs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/faqs"); setRows(data || []); }
    catch { toast.error("Failed to load FAQs"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this FAQ?")) return;
    try { await api.delete(`/admin/faqs/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const togglePublished = async (row) => {
    try { await api.put(`/admin/faqs/${row.id}`, { published: !row.published }); load(); }
    catch { toast.error("Update failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">FAQs</h2>
          <p className="text-sm text-slate-500">Frequently asked questions shown across the site.</p>
        </div>
        <button data-testid="faq-add" onClick={() => setEditing({ question: "", answer: "", category: "general", order: 0, published: true })} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
          <Plus size={16} weight="bold" /> Add FAQ
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-16">Order</th>
                <th className="px-4 py-3 text-left font-semibold">Question</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">No FAQs yet. Click "Add FAQ" to create one.</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-mono text-slate-500">{r.order}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.question}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.category || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(r)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.published ? <><Eye size={12} /> Live</> : <><EyeSlash size={12} /> Draft</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(r)} data-testid={`faq-edit-${r.id}`} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(r.id)} data-testid={`faq-del-${r.id}`} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <FAQDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function FAQDialog({ row, onClose, onSaved }) {
  const [form, setForm] = useState(row);
  const [busy, setBusy] = useState(false);
  const isEdit = !!row.id;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) { toast.error("Question and answer are required"); return; }
    setBusy(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (isEdit) await api.put(`/admin/faqs/${row.id}`, payload);
      else await api.post("/admin/faqs", payload);
      toast.success(isEdit ? "FAQ updated" : "FAQ created");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl" data-testid="faq-dialog">
        <DialogHeader><DialogTitle className="text-2xl">{isEdit ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Question *"><Input required data-testid="faq-question" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Answer *"><Textarea required rows={4} data-testid="faq-answer" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className="rounded-lg border-slate-200" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category || "general"} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Display order"><Input type="number" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Published (visible on live site)
          </label>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="faq-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Saving…" : (isEdit ? "Save changes" : "Create FAQ")}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
