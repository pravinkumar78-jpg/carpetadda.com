import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload";
import { CircleNotch } from "@phosphor-icons/react";

const EMPTY = { name: "", phone: "", email: "", rera_number: "", office_address: "", website: "", experience_years: "", description: "", logo: "" };

/**
 * "Register New Developer" modal used inside the Project form.
 * Saves to the existing developers collection (POST /admin/developers),
 * then calls onRegistered(developer) so the parent can refresh + auto-select.
 * The project form's state is untouched while the modal is open.
 */
export default function RegisterDeveloper({ open, onClose, onRegistered }) {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Developer / company name required"); return; }
    if (f.phone && f.phone.replace(/\D/g, "").length < 10) { toast.error("Enter a valid 10-digit mobile number"); return; }
    setBusy(true);
    try {
      const payload = { ...f, experience_years: Number(f.experience_years) || 0 };
      const { data } = await api.post("/admin/developers", payload);
      toast.success(`Developer "${data.name}" registered`);
      setF(EMPTY);
      onRegistered(data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setBusy(false); }
  };

  const L = ({ children }) => <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">{children}</label>;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Register New Developer</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2" data-testid="register-developer-form">
          <div>
            <L>Full Name / Company Name *</L>
            <Input data-testid="dev-reg-name" required value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Lodha Group" className="h-11 rounded-lg border-slate-300" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <L>Mobile Number</L>
              <Input data-testid="dev-reg-phone" type="tel" value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile" className="h-11 rounded-lg border-slate-300" />
            </div>
            <div>
              <L>Email</L>
              <Input data-testid="dev-reg-email" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="sales@developer.com" className="h-11 rounded-lg border-slate-300" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <L>RERA Number</L>
              <Input data-testid="dev-reg-rera" value={f.rera_number} onChange={e => set("rera_number", e.target.value)} placeholder="e.g. A51700012345" className="h-11 rounded-lg border-slate-300" />
            </div>
            <div>
              <L>Experience (years)</L>
              <Input data-testid="dev-reg-experience" type="number" min="0" value={f.experience_years} onChange={e => set("experience_years", e.target.value)} placeholder="0" className="h-11 rounded-lg border-slate-300" />
            </div>
          </div>
          <div>
            <L>Office Address</L>
            <Textarea data-testid="dev-reg-address" rows={2} value={f.office_address} onChange={e => set("office_address", e.target.value)} placeholder="Registered office address" className="rounded-lg border-slate-300" />
          </div>
          <div>
            <L>Website</L>
            <Input data-testid="dev-reg-website" value={f.website} onChange={e => set("website", e.target.value)} placeholder="https://…" className="h-11 rounded-lg border-slate-300" />
          </div>
          <div>
            <L>Logo</L>
            <ImageUpload value={f.logo} onChange={v => set("logo", v)} kind="developers" dataTestid="dev-reg-logo-upload" />
          </div>
          <div>
            <L>About (optional)</L>
            <Textarea data-testid="dev-reg-description" rows={2} value={f.description} onChange={e => set("description", e.target.value)} placeholder="Short profile of the developer" className="rounded-lg border-slate-300" />
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={busy} data-testid="dev-reg-submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
              {busy && <CircleNotch size={14} className="animate-spin" />} Register Developer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
