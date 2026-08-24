import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash, Check, X } from "@phosphor-icons/react";

export default function AdminAmenities() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Amenities</h2>
        <p className="text-sm text-slate-500">Add, edit or remove amenities. Changes apply instantly to the Property and Project forms. Deleting an amenity never alters existing listings.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AmenitySection category="residential" title="Residential Amenities" />
        <AmenitySection category="commercial" title="Commercial Amenities" />
      </div>
    </div>
  );
}

function AmenitySection({ category, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/amenities?category=${category}`); setItems(data || []); }
    catch { toast.error(`Failed to load ${title.toLowerCase()}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category]);

  const add = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { toast.error("Enter an amenity name"); return; }
    setBusy(true);
    try {
      await api.post("/admin/amenities", { name, category });
      toast.success(`"${name}" added`);
      setNewName("");
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Could not add amenity"); }
    finally { setBusy(false); }
  };

  const saveEdit = async (a) => {
    const name = editName.trim();
    if (!name) { toast.error("Name is required"); return; }
    if (name === a.name) { setEditingId(null); return; }
    setBusy(true);
    try {
      await api.put(`/admin/amenities/${a.id}`, { name });
      toast.success("Amenity updated");
      setEditingId(null);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
    finally { setBusy(false); }
  };

  const remove = async (a) => {
    if (!confirm(`Delete "${a.name}" from ${title}?\n\nExisting properties keep their saved data — this only removes it from new selections.`)) return;
    try { await api.delete(`/admin/amenities/${a.id}`); toast.success("Amenity deleted"); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Delete failed"); }
  };

  return (
    <div className="card-premium p-5" data-testid={`amenities-section-${category}`}>
      <h3 className="font-semibold text-slate-900 mb-3">{title} <span className="text-xs font-normal text-slate-400">({items.length})</span></h3>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${category} amenity…`} className="h-10 rounded-lg border-slate-200" data-testid={`amenity-add-input-${category}`} />
        <button type="submit" disabled={busy} data-testid={`amenity-add-btn-${category}`} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 rounded-lg disabled:opacity-60 whitespace-nowrap">
          <Plus size={14} weight="bold" /> Add
        </button>
      </form>
      {loading && <div className="text-sm text-slate-500 py-6 text-center">Loading…</div>}
      {!loading && items.length === 0 && <div className="text-sm text-slate-500 py-6 text-center">No amenities yet.</div>}
      {!loading && items.length > 0 && (
        <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {items.map(a => (
            <li key={a.id} className="flex items-center gap-2 py-2" data-testid={`amenity-row-${a.id}`}>
              {editingId === a.id ? (
                <>
                  <Input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="h-9 rounded-lg border-slate-300 flex-1" data-testid={`amenity-edit-input-${a.id}`}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveEdit(a); } if (e.key === "Escape") setEditingId(null); }} />
                  <button onClick={() => saveEdit(a)} disabled={busy} data-testid={`amenity-edit-save-${a.id}`} title="Save" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check size={15} weight="bold" /></button>
                  <button onClick={() => setEditingId(null)} data-testid={`amenity-edit-cancel-${a.id}`} title="Cancel" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"><X size={15} weight="bold" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{a.name}</span>
                  <button onClick={() => { setEditingId(a.id); setEditName(a.name); }} data-testid={`amenity-edit-${a.id}`} title="Edit amenity" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => remove(a)} data-testid={`amenity-delete-${a.id}`} title="Delete amenity" className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
