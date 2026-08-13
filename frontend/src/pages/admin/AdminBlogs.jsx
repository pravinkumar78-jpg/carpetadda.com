import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash, Eye, EyeSlash, Article } from "@phosphor-icons/react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminBlogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/blogs"); setRows(data || []); }
    catch { toast.error("Failed to load blogs"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this blog post?")) return;
    try { await api.delete(`/admin/blogs/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const togglePublished = async (row) => {
    try { await api.put(`/admin/blogs/${row.id}`, { published: !row.published }); load(); }
    catch { toast.error("Update failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Blog Posts</h2>
          <p className="text-sm text-slate-500">Write and publish blog posts. SEO-editable per post.</p>
        </div>
        <button data-testid="blog-add" onClick={() => setEditing({ title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "guides", author: "Editorial Team", published: true, seo: { title: "", description: "" } })} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
          <Plus size={16} weight="bold" /> New Post
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-14"></th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">No blog posts yet.</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    {r.cover_image ? <img src={r.cover_image} alt="" className="w-10 h-10 rounded object-cover" /> :
                      <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><Article size={16} /></div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.category || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(r)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.published ? <><Eye size={12} /> Live</> : <><EyeSlash size={12} /> Draft</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(r)} data-testid={`blog-edit-${r.id}`} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(r.id)} data-testid={`blog-del-${r.id}`} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <BlogDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function BlogDialog({ row, onClose, onSaved }) {
  const [form, setForm] = useState({ ...row, seo: row.seo || { title: "", description: "" } });
  const [busy, setBusy] = useState(false);
  const isEdit = !!row.id;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content are required"); return; }
    setBusy(true);
    try {
      if (isEdit) await api.put(`/admin/blogs/${row.id}`, form);
      else await api.post("/admin/blogs", form);
      toast.success(isEdit ? "Blog updated" : "Blog created");
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="blog-dialog">
        <DialogHeader><DialogTitle className="text-2xl">{isEdit ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title *"><Input required data-testid="blog-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
            <Field label="Slug (URL)"><Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-title" className="h-11 rounded-lg border-slate-200" /></Field>
            <Field label="Category"><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="guides / market / legal" className="h-11 rounded-lg border-slate-200" /></Field>
            <Field label="Author"><Input value={form.author || ""} onChange={e => setForm({ ...form, author: e.target.value })} className="h-11 rounded-lg border-slate-200" /></Field>
          </div>
          <Field label="Cover image">
            <ImageUpload value={form.cover_image || ""} onChange={v => setForm({ ...form, cover_image: v })} kind="blogs" dataTestid="blog-cover-upload" />
          </Field>
          <Field label="Excerpt"><Textarea rows={2} value={form.excerpt || ""} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="rounded-lg border-slate-200" /></Field>
          <Field label="Content *"><Textarea required rows={8} data-testid="blog-content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write in markdown or HTML…" className="rounded-lg border-slate-200 font-mono text-xs" /></Field>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">SEO</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Meta title"><Input value={form.seo?.title || ""} onChange={e => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} className="h-11 rounded-lg border-slate-200" /></Field>
              <Field label="Meta description"><Textarea rows={2} value={form.seo?.description || ""} onChange={e => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} className="rounded-lg border-slate-200" /></Field>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Published</label>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="blog-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Saving…" : (isEdit ? "Save changes" : "Create post")}</button>
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
