import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, CircleNotch } from "@phosphor-icons/react";

/**
 * "+ Add New Amenity" button + modal. Saves to the shared amenities collection
 * (POST /admin/amenities — server-side case-insensitive dedupe), then calls
 * onAdded(name) so the parent form can list + auto-select it immediately.
 */
export default function AddAmenity({ existing = [], onAdded, buttonTestId = "add-amenity-btn" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const n = name.trim();
    if (!n) { toast.error("Please enter an amenity name"); return; }
    const dupe = existing.find(a => a.toLowerCase() === n.toLowerCase());
    if (dupe) {
      onAdded(dupe);
      toast.info(`"${dupe}" already exists — selected it for you`);
      setName(""); setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/admin/amenities", { name: n });
      const saved = data?.name || n;
      onAdded(saved);
      setName(""); setOpen(false);
      toast.success(`"${saved}" added — available on all future listings`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not add amenity");
    } finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" data-testid={buttonTestId} onClick={() => setOpen(true)}
        className="px-4 h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap inline-flex items-center gap-1.5">
        <Plus size={14} weight="bold" /> Add New Amenity
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Amenity</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Amenity Name</label>
            <Input data-testid="new-amenity-input" autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), save())}
              placeholder="e.g. Sky Deck, Infinity Pool…" className="h-11 rounded-lg border-slate-300" />
            <p className="text-xs text-slate-400 mt-2">Saved permanently and selectable on all future property & project listings.</p>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="button" onClick={save} disabled={busy || !name.trim()} data-testid="save-amenity-btn"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
              {busy && <CircleNotch size={14} className="animate-spin" />} Save Amenity
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
