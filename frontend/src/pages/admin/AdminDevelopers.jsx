import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";
import { Buildings, Plus } from "@phosphor-icons/react";

/** Admin → Developers: list + add. Only the name is required; everything else optional. */
export default function AdminDevelopers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const empty = { name: "", phone: "", email: "", website: "", rera_number: "", logo: "" };
  const [form, setForm] = useState(empty);

  const load = () => {
    setLoading(true);
    api.get("/developers?limit=200")
      .then(r => setItems(Array.isArray(r.data) ? r.data : r.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Developer name is required"); return; }
    setBusy(true);
    try {
      await api.post("/admin/developers", { ...form, name: form.name.trim() });
      toast.success("Developer saved");
      setForm(empty);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  const FL = ({ children }) => <label className="text-xs font-semibold text-slate-600 mb-1 block">{children}</label>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start" data-testid="admin-developers">
      {/* Existing developers */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Developer</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">RERA</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} className="text-center py-10 text-slate-500">Loading…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-slate-500">No developers yet — add the first one.</td></tr>}
              {!loading && items.map(d => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0" data-testid={`developer-row-${d.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d.logo
                        ? <img src={d.logo} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                        : <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{(d.name || "?").slice(0, 2).toUpperCase()}</span>}
                      <div className="font-medium text-slate-900">{d.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{[d.phone, d.email].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{d.rera_number || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add developer — only name required */}
      <form onSubmit={submit} className="card-premium p-6 space-y-4" data-testid="developer-add-form">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Buildings size={18} className="text-blue-600" /> Add Developer</h3>
        <div>
          <FL>Developer Name *</FL>
          <Input data-testid="developer-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lodha Group" className="h-11 rounded-lg border-slate-300" />
        </div>
        <div>
          <FL>Phone (optional)</FL>
          <Input data-testid="developer-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-lg border-slate-200" />
        </div>
        <div>
          <FL>Email (optional)</FL>
          <Input data-testid="developer-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-11 rounded-lg border-slate-200" />
        </div>
        <div>
          <FL>Website (optional)</FL>
          <Input data-testid="developer-website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://…" className="h-11 rounded-lg border-slate-200" />
        </div>
        <div>
          <FL>RERA Number (optional)</FL>
          <Input data-testid="developer-rera" value={form.rera_number} onChange={e => setForm({ ...form, rera_number: e.target.value })} className="h-11 rounded-lg border-slate-200" />
        </div>
        <div>
          <FL>Logo (optional)</FL>
          <ImageUpload value={form.logo} onChange={v => setForm({ ...form, logo: v })} kind="developers" dataTestid="developer-logo-upload" allowUrl={false} />
        </div>
        <button type="submit" disabled={busy} data-testid="developer-save"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
          <Plus size={15} weight="bold" /> {busy ? "Saving…" : "Save Developer"}
        </button>
      </form>
    </div>
  );
}
