import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash, Star, Eye, EyeSlash } from "@phosphor-icons/react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminTestimonials() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/testimonials"); setRows(data || []); }
    catch { toast.error("Failed to load testimonials"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    try { await api.delete(`/admin/testimonials/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const toggle = async (row, key) => {
    try { await api.put(`/admin/testimonials/${row.id}`, { [key]: !row[key] }); load(); }
    catch { toast.error("Update failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Testimonials</h2>
          <p className="text-sm text-slate-500">Customer stories shown on the homepage and about page.</p>
        </div>
        <button data-testid="testimonial-add" onClick={() => setEditing({ name: "", review: "", rating: 5, role: "", project: "", photo: "", published: true, show_on_homepage: false, seo: { title: "", description: "", keywords: "" } })} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
          <Plus size={16} weight="bold" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div className="col-span-full text-center py-12 text-slate-500">Loading…</div>}
        {!loading && rows.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No testimonials yet.</div>}
        {!loading && rows.map(r => (
          <div key={r.id} className="card-premium p-5">
            <div className="flex items-center gap-3 mb-3">
              {r.photo ? <img src={r.photo} alt="" className="w-12 h-12 rounded-full object-cover" /> :
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{(r.name || "?").charAt(0)}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{r.name}</div>
                <div className="text-xs text-slate-500 truncate">{r.role || r.project || ""}</div>
              </div>
              <div className="flex items-center text-amber-500 text-sm">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} weight={i < (r.rating || 0) ? "fill" : "regular"} />)}
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{r.review}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <button onClick={() => toggle(r, "published")} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.published ? <><Eye size={12} /> Live</> : <><EyeSlash size={12} /> Draft</>}
                </button>
                <button onClick={() => toggle(r, "show_on_homepage")} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${r.show_on_homepage ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  Homepage
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(r)} data-testid={`testimonial-edit-${r.id}`} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                <button onClick={() => remove(r.id)} data-testid={`testimonial-del-${r.id}`} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <TestimonialDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function TestimonialDialog({ row, onClose, onSaved }) {
  const [form, setForm] = useState(row);
  const [busy, setBusy] = useState(false);
  const isEdit = !!row.id;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.review.trim()) { toast.error("Name and review are required"); return; }
    setBusy(true);
    try {
      const payload = { ...form, rating: Number(form.rating) || 5 };
      if (isEdit) await api.put(`/admin/testimonials/${row.id}`, payload);
      else await api.post("/admin/testimonials", payload);
      toast.success(isEdit ? "Testimonial updated" : "Testimonial created");
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="testimonial-dialog">
        <DialogHeader><DialogTitle className="text-2xl">{isEdit ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *"><Input required data-testid="testimonial-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
            <Field label="Role or Project"><Input value={form.role || ""} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Bought a 2 BHK in Dombivli" className="h-11 rounded-lg border-slate-200" /></Field>
            <Field label="Rating (1-5)"><Input type="number" min="1" max="5" step="0.5" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
          </div>
          <Field label="Customer photo">
            <ImageUpload value={form.photo || ""} onChange={v => setForm({ ...form, photo: v })} kind="testimonials" dataTestid="testimonial-photo-upload" />
          </Field>
          <Field label="Review *"><Textarea required rows={4} data-testid="testimonial-review" value={form.review} onChange={e => setForm({ ...form, review: e.target.value })} className="rounded-lg border-slate-200" /></Field>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">SEO</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Meta title"><Input data-testid="testimonial-seo-title" value={form.seo?.title || ""} onChange={e => setForm({ ...form, seo: { ...(form.seo || {}), title: e.target.value } })} className="h-11 rounded-lg border-slate-200" /></Field>
              <Field label="Meta description"><Textarea rows={2} data-testid="testimonial-seo-description" value={form.seo?.description || ""} onChange={e => setForm({ ...form, seo: { ...(form.seo || {}), description: e.target.value } })} className="rounded-lg border-slate-200" /></Field>
              <Field label="Meta keywords"><Input data-testid="testimonial-seo-keywords" value={form.seo?.keywords || ""} onChange={e => setForm({ ...form, seo: { ...(form.seo || {}), keywords: e.target.value } })} className="h-11 rounded-lg border-slate-200" /></Field>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.show_on_homepage} onChange={e => setForm({ ...form, show_on_homepage: e.target.checked })} /> Show on homepage</label>
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="testimonial-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Saving…" : (isEdit ? "Save changes" : "Create")}</button>
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
