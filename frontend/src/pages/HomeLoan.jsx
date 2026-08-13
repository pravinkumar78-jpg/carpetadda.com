import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Bank, ArrowRight } from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

const EMPTY = { name: "", phone: "", email: "", profession: "", designation: "", company_name: "", property_finalised: "", property_cost: "", loan_amount: "" };

export default function HomeLoan() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please enter your full name"); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    setBusy(true);
    try {
      await api.post("/leads", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        profession: form.profession.trim() || undefined,
        designation: form.designation.trim() || undefined,
        company_name: form.company_name.trim() || undefined,
        message: `Home loan application — Profession: ${form.profession || "—"}, Designation: ${form.designation || "—"}, Company: ${form.company_name || "—"}`,
        source: "home_loan",
        landing_page: "/home-loan",
        source_url: window.location.href,
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-4"><Bank size={14} weight="bold" /> Home Loan Assistance</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Apply for a Home Loan</h1>
          <p className="text-slate-600 mt-3 max-w-2xl">Share your details and our loan desk will call you back with the best pre-approved offers across leading banks.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">
        {done ? (
          <div data-testid="hl-thankyou" className="card-premium p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={34} weight="fill" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Thank You!</h2>
            <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
              Your home loan enquiry has been received. Our loan specialist will contact you within one business day with personalised offers.
            </p>
            <div className="flex gap-3 justify-center mt-8 flex-wrap">
              <Link to="/properties" className="btn-primary text-sm">Browse Properties <ArrowRight size={14} /></Link>
              <Link to="/emi-calculator" className="btn-secondary text-sm">EMI Calculator</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} data-testid="home-loan-form" className="card-premium p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Fl label="Full Name *"><Input required data-testid="hl-name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Rajesh Kumar" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Mobile *"><Input required data-testid="hl-mobile" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="88288 30707" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Email"><Input data-testid="hl-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Profession"><Input data-testid="hl-profession" value={form.profession} onChange={e => set("profession", e.target.value)} placeholder="Salaried / Self-employed" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Designation"><Input data-testid="hl-designation" value={form.designation} onChange={e => set("designation", e.target.value)} placeholder="Senior Manager" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Company Name"><Input data-testid="hl-company" value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Acme Ltd." className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Property Finalised?">
                <Select value={form.property_finalised} onValueChange={v => set("property_finalised", v)}>
                  <SelectTrigger data-testid="hl-finalised" className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </Fl>
              <Fl label="Property Cost (₹)"><Input data-testid="hl-property-cost" type="number" min="0" value={form.property_cost} onChange={e => set("property_cost", e.target.value)} placeholder="8500000" className="h-11 rounded-lg border-slate-200" /></Fl>
              <Fl label="Loan Amount (₹)"><Input data-testid="hl-loan-amount" type="number" min="0" value={form.loan_amount} onChange={e => set("loan_amount", e.target.value)} placeholder="6000000" className="h-11 rounded-lg border-slate-200" /></Fl>
            </div>
            <button type="submit" disabled={busy} data-testid="hl-submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 transition-colors">
              {busy ? "Submitting…" : "Submit Application"}
            </button>
            <p className="text-xs text-slate-400 text-center">By submitting, you agree to be contacted by our loan desk.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function Fl({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
