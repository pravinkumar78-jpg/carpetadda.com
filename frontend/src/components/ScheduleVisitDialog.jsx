import { useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CalendarBlank, Clock, Users, Phone, User, EnvelopeSimple } from "@phosphor-icons/react";

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
];

const todayISO = () => new Date().toISOString().split("T")[0];
const maxDateISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
};

export default function ScheduleVisitDialog({ open, onOpenChange, propertyId, projectId, targetName }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    visit_date: "", visit_time: "10:30 AM", visitors: "1",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const minDate = useMemo(todayISO, []);
  const maxDate = useMemo(maxDateISO, []);

  const reset = () => setForm({ name: "", phone: "", email: "", visit_date: "", visit_time: "10:30 AM", visitors: "1", notes: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (form.phone.replace(/\D/g, "").length < 10) return toast.error("Please enter a valid 10-digit mobile number");
    if (!form.visit_date) return toast.error("Please pick a visit date");
    if (!form.visit_time) return toast.error("Please pick a visit time");

    setBusy(true);
    try {
      await api.post("/site-visits", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        property_id: propertyId,
        project_id: projectId,
        visit_date: form.visit_date,
        visit_time: form.visit_time,
        visitors: Number(form.visitors) || 1,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Visit requested! Our team will confirm shortly.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="visit-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">Schedule a site visit</DialogTitle>
          {targetName && (
            <p className="text-sm text-slate-500 mt-1">
              For <span className="font-semibold text-slate-700">{targetName}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IconField icon={<User size={16} />} label="Full name *">
              <Input required data-testid="visit-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Kumar" className="h-11 pl-9 rounded-lg border-slate-200" />
            </IconField>
            <IconField icon={<Phone size={16} />} label="Mobile *">
              <Input required data-testid="visit-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98200 00000" className="h-11 pl-9 rounded-lg border-slate-200" />
            </IconField>
            <IconField icon={<EnvelopeSimple size={16} />} label="Email" className="sm:col-span-2">
              <Input data-testid="visit-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-11 pl-9 rounded-lg border-slate-200" />
            </IconField>
            <IconField icon={<CalendarBlank size={16} />} label="Visit date *">
              <Input required data-testid="visit-date" type="date" min={minDate} max={maxDate} value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} className="h-11 pl-9 rounded-lg border-slate-200" />
            </IconField>
            <IconField icon={<Clock size={16} />} label="Visit time *">
              <Select value={form.visit_time} onValueChange={v => setForm({ ...form, visit_time: v })}>
                <SelectTrigger data-testid="visit-time" className="h-11 pl-9 rounded-lg border-slate-200"><SelectValue placeholder="Pick a time" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </IconField>
            <IconField icon={<Users size={16} />} label="No. of visitors" className="sm:col-span-2">
              <Select value={form.visitors} onValueChange={v => setForm({ ...form, visitors: v })}>
                <SelectTrigger data-testid="visit-visitors" className="h-11 pl-9 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>)}
                </SelectContent>
              </Select>
            </IconField>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Anything specific we should know?</label>
            <Textarea data-testid="visit-notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Preferred floor, budget constraints, questions…" className="rounded-lg border-slate-200" />
          </div>

          <DialogFooter className="gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="visit-submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/25 disabled:opacity-60 transition-colors">
              {busy ? "Booking…" : "Confirm Visit Request"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IconField({ icon, label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
        {children}
      </div>
    </label>
  );
}
