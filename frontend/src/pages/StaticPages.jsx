import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneCall, EnvelopeSimple, MapPin, PaperPlaneTilt } from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSettings } from "@/lib/useSettings";

export function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="text-8xl font-bold text-blue-500 mb-4">404</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">This page seems to have moved.</h1>
      <p className="text-slate-600 mb-8">Let's help you find what you're looking for.</p>
      <div className="max-w-xl mx-auto mb-10"><SearchBar compact /></div>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Home</Link>
        <Link to="/properties" className="px-6 py-3 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors">Browse Properties</Link>
      </div>
    </div>
  );
}

export function About() {
  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">About</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">Real estate, reimagined.</h1>
          <p className="text-lg text-slate-700 leading-relaxed">CarpetAdda is India's premium property marketplace. We combine verified listings, expert local agents, and AI-powered discovery to make finding your next home effortless.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-14">
        <p className="text-slate-700 leading-relaxed text-lg">From Mumbai's high-rises to Dombivli's family neighbourhoods, our platform helps 50,000+ families every month buy, sell and rent with confidence. Every listing is RERA-verified, every agent hand-picked, every project reviewed.</p>
      </div>
    </div>
  );
}

export function Contact() {
  const s = useSettings();
  const waDigits = (s?.whatsapp_number || "918828830707").replace(/\D/g, "");
  const waDisplay = `+${waDigits.slice(0, 2)} ${waDigits.slice(2, 7)} ${waDigits.slice(7)}`;
  const [form, setForm] = useState({ name: "", phone: "", email: "", configuration: "", budget: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please enter your name"); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid 10-digit phone"); return; }
    setSending(true);
    try {
      const budgetMax = form.budget ? Number(form.budget.replace(/[^\d]/g, "")) || undefined : undefined;
      await api.post("/leads", {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        configuration: form.configuration || undefined,
        budget_max: budgetMax,
        message: form.message || undefined,
        source: "contact_page",
        source_url: window.location.href,
      });
      toast.success("Message sent! We'll get back to you shortly.");
      setForm({ name: "", phone: "", email: "", configuration: "", budget: "", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setSending(false); }
  };

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Get in touch</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">We'd love to hear from you.</h1>
          <p className="text-lg text-slate-600 mt-4 max-w-2xl">Share what you're looking for — our team will reach out within one business day.</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* Form */}
        <form onSubmit={submit} data-testid="contact-form" className="card-premium p-8 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Full name *</label>
              <Input required data-testid="contact-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Kumar" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Mobile *</label>
              <Input required data-testid="contact-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98200 00000" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Email</label>
              <Input data-testid="contact-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Configuration</label>
              <Input data-testid="contact-config" value={form.configuration} onChange={e => setForm({ ...form, configuration: e.target.value })} placeholder="2 BHK / Office / Shop" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Budget (₹)</label>
              <Input data-testid="contact-budget" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="e.g. 75,00,000" className="h-11 rounded-lg border-slate-200" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
            <Textarea data-testid="contact-message" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you're looking for…" className="rounded-lg border-slate-200" />
          </div>
          <button type="submit" disabled={sending} data-testid="contact-submit" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md shadow-blue-500/20 disabled:opacity-60 transition-colors">
            <PaperPlaneTilt size={16} weight="bold" /> {sending ? "Sending…" : "Send Message"}
          </button>
        </form>

        {/* Contact info column */}
        <div className="space-y-4">
          <div className="card-premium p-6">
            <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center mb-3"><PhoneCall size={20} weight="bold" className="text-blue-600" /></div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">WhatsApp</div>
            <a href={`https://wa.me/${waDigits}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">{waDisplay}</a>
          </div>
          <div className="card-premium p-6">
            <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center mb-3"><EnvelopeSimple size={20} weight="bold" className="text-blue-600" /></div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Email</div>
            <a href="mailto:contact@carpetadda.com" className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">contact@carpetadda.com</a>
          </div>
          <div className="card-premium p-6">
            <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center mb-3"><MapPin size={20} weight="bold" className="text-blue-600" /></div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Office</div>
            <div className="text-sm font-medium text-slate-900 leading-relaxed">A-502, BSEL Tech Park, Sector 30A, Opp. Vashi Railway Station, Navi Mumbai, Maharashtra.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQs() {
  const [faqs, setFaqs] = useState(null);
  useEffect(() => {
    api.get("/faqs").then(r => setFaqs(r.data || [])).catch(() => setFaqs([]));
  }, []);
  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Help Center</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600 mt-4 max-w-2xl">Answers to common questions about buying, renting and investing with CarpetAdda.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-14" data-testid="faqs-page">
        {faqs === null && <div className="text-center text-slate-500 py-10">Loading…</div>}
        {faqs !== null && faqs.length === 0 && <div className="text-center text-slate-500 py-10">No FAQs published yet.</div>}
        {faqs && faqs.length > 0 && (
          <Accordion type="single" collapsible className="card-premium px-6">
            {faqs.map(f => (
              <AccordionItem key={f.id} value={f.id} data-testid={`faq-item-${f.id}`}>
                <AccordionTrigger className="text-left text-slate-900 font-medium">{f.question}</AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

export function Favorites() { return null; } // handled in dashboard
