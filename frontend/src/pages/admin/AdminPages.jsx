import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";
import { Pencil, Trash, Plus, Eye } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function AdminPages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/pages"); setRows(data || []); }
    catch { toast.error("Failed to load pages"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}" permanently?`)) return;
    try { await api.delete(`/admin/pages/${p.id}`); toast.success("Page deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const togglePublish = async (p) => {
    try {
      await api.put(`/admin/pages/${p.id}`, { published: !p.published });
      toast.success(p.published ? "Unpublished — removed from footer" : "Published — now linked in the footer");
      load();
    } catch { toast.error("Update failed"); }
  };

  return (
    <div data-testid="admin-pages">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CMS Pages</h2>
          <p className="text-sm text-slate-500">Create pages like Disclaimer, Terms, Privacy Policy. Published pages appear in the footer automatically.</p>
        </div>
        <button data-testid="page-add" onClick={() => setEditing({ title: "", slug: "", content: "", published: false, seo: {} })} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
          <Plus size={15} weight="bold" /> New Page
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-slate-500">No pages yet. Create your first CMS page.</td></tr>}
              {!loading && rows.map(p => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">/page/{p.slug}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(p)} data-testid={`page-publish-${p.id}`} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.published && <Link to={`/page/${p.slug}`} target="_blank" title="View" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye size={14} /></Link>}
                      <button onClick={() => setEditing(p)} data-testid={`page-edit-${p.id}`} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(p)} data-testid={`page-del-${p.id}`} title="Delete" className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <PageDialog page={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function PageDialog({ page, onClose, onSaved }) {
  const [form, setForm] = useState({ ...page, seo: page.seo || {} });
  const [busy, setBusy] = useState(false);
  const isEdit = !!page.id;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setSeo = (k, v) => setForm(p => ({ ...p, seo: { ...(p.seo || {}), [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setBusy(true);
    try {
      if (isEdit) await api.put(`/admin/pages/${page.id}`, form);
      else await api.post("/admin/pages", form);
      toast.success(isEdit ? "Page updated" : "Page created");
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="page-dialog">
        <DialogHeader><DialogTitle className="text-2xl">{isEdit ? `Edit · ${page.title}` : "New CMS page"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Page Title *"><Input required data-testid="page-title" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Privacy Policy" className="h-11 rounded-lg border-slate-200" /></F>
            <F label="Slug"><Input data-testid="page-slug" value={form.slug || ""} onChange={e => set("slug", e.target.value)} placeholder="privacy-policy (auto if blank)" className="h-11 rounded-lg border-slate-200" /></F>
          </div>
          <F label="Content"><RichTextEditor value={form.content || ""} onChange={v => set("content", v)} dataTestid="page-content-editor" /></F>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">SEO</div>
            <div className="grid grid-cols-1 gap-3">
              <F label="Meta Title"><Input data-testid="page-seo-title" value={form.seo?.title || ""} onChange={e => setSeo("title", e.target.value)} className="h-11 rounded-lg border-slate-200" /></F>
              <F label="Meta Description"><Input data-testid="page-seo-description" value={form.seo?.description || ""} onChange={e => setSeo("description", e.target.value)} className="h-11 rounded-lg border-slate-200" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="OG Title"><Input value={form.seo?.og_title || ""} onChange={e => setSeo("og_title", e.target.value)} className="h-11 rounded-lg border-slate-200" /></F>
                <F label="Canonical URL"><Input value={form.seo?.canonical || ""} onChange={e => setSeo("canonical", e.target.value)} className="h-11 rounded-lg border-slate-200" /></F>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" data-testid="page-published" checked={!!form.published} onChange={e => set("published", e.target.checked)} /> Published (linked in footer)
          </label>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="page-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Saving…" : "Save Page"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
