import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import Reveal from "./Reveal";

export default function LeadCapture() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error("Please share your name and phone number"); return; }
    setBusy(true);
    try {
      await api.post("/leads", {
        name: name.trim(),
        phone: phone.trim(),
        message: `VIP advisory request — micro-market: ${location || "any"}, budget: ${budget || "flexible"}`,
        source: "home_vip_concierge",
        landing_page: "/",
      });
      toast.success("Request received. Our concierge will call you shortly.");
      setName(""); setPhone(""); setLocation(""); setBudget("");
    } catch {
      toast.error("Could not submit right now. Please try WhatsApp instead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-testid="lead-capture-section" className="py-24 sm:py-32 bg-[#0B0C0E] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_120%,rgba(212,175,55,0.08),transparent_60%)]" />
      <div className="max-w-4xl mx-auto px-6 lg:px-10 relative text-center">
        <Reveal>
          <div className="lux-overline mb-4">PRIVATE ADVISORY</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight">
            Looking for off-market <span className="italic gold-text">luxury penthouses?</span>
          </h2>
          <p className="mt-5 text-stone-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Some of the finest residences never reach the public archive. Leave your details and our concierge desk will open the private ledger for you.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <form onSubmit={submit} className="lux-card mt-12 p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <input data-testid="lead-input-name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="lux-input" />
            <input data-testid="lead-input-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (+91)" className="lux-input" />
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger data-testid="lead-select-location" className="lux-input !h-12"><SelectValue placeholder="Desired micro-market" /></SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-amber-500/20 text-stone-200">
                {["South Mumbai", "Bandra / Juhu", "Powai", "Thane West", "Palm Beach Road", "Dombivli-Kalyan"].map(l => (
                  <SelectItem key={l} value={l} className="focus:bg-amber-500/15 focus:text-[#E6C665]">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger data-testid="lead-select-budget" className="lux-input !h-12"><SelectValue placeholder="Budget range" /></SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-amber-500/20 text-stone-200">
                {["₹50 L – ₹1 Cr", "₹1 – ₹2.5 Cr", "₹2.5 – ₹5 Cr", "₹5 Cr+"].map(b => (
                  <SelectItem key={b} value={b} className="focus:bg-amber-500/15 focus:text-[#E6C665]">{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button data-testid="lead-form-submit-button" disabled={busy} className="lux-btn-gold md:col-span-2 text-xs py-4 font-cinzel tracking-[0.2em] uppercase disabled:opacity-60">
              {busy ? "Sending…" : <>Request Private Concierge Callback <ArrowUpRight size={14} weight="bold" /></>}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
