import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import PropertyMap from "@/components/PropertyMap";
import PropertyCard from "@/components/PropertyCard";
import { formatINR } from "@/lib/format";
import { MapPin, Download, PhoneCall, WhatsappLogo, ShieldCheck, CalendarBlank } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ScheduleVisitDialog from "@/components/ScheduleVisitDialog";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [visitOpen, setVisitOpen] = useState(false);

  useEffect(() => {
    api.get(`/projects/${slug}`).then(r => {
      setP(r.data);
      // fetch inventory summary once project is loaded
      api.get(`/projects/${r.data.id}/units/summary`)
        .then(res => setInventory(res.data))
        .catch(() => setInventory(null));
    }).catch(() => setP(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => { if (p?.name) document.title = `${p.name} | CarpetAdda`; }, [p]);

  if (p === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Project not found</h1></div>;
  if (!p) return <div className="p-20 text-center text-slate-500">Loading…</div>;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please enter your name"); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid 10-digit phone"); return; }
    try {
      await api.post("/leads", {
        ...form,
        project_id: p.id,
        source: "project_page",
        source_url: window.location.href,
        configuration: (p.configurations || []).join(", ") || undefined,
        budget_min: p.price_from,
        budget_max: p.price_to,
      });
      toast.success("Enquiry sent! Our team will contact you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) { toast.error(err?.response?.data?.detail || "Please try again"); }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[55vh] min-h-[400px]">
          <img src={p.images?.[0]} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-end pb-12 text-white">
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {p.rera_number && <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-3 py-1 rounded-full">RERA {p.rera_number}</span>}
                {p.construction_status && <span className="inline-flex items-center text-xs font-semibold bg-white/15 backdrop-blur text-white px-3 py-1 rounded-full uppercase tracking-wider">{p.construction_status.replace("_", " ")}</span>}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{p.name}</h1>
              <div className="flex items-center gap-2 text-white/80 mt-3"><MapPin size={16} /> {p.location}, {p.city}</div>
            </div>
          </div>
        </div>
        {/* Price bar */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 -mt-8 relative z-10">
          <div className="card-premium bg-white p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-1">Starting from</div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900">{formatINR(p.price_from)}</span>
                <span className="text-slate-500">– {formatINR(p.price_to)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(p.configurations || []).map(c => (
                <span key={c} className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Total Units" value={p.total_units} />
            <Stat label="Towers" value={p.total_towers} />
            <Stat label="Floors" value={p.total_floors} />
            <Stat label="Possession" value={p.possession_date} />
          </div>

          {inventory && inventory.total > 0 && (
            <div data-testid="project-live-availability">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-3xl font-bold text-slate-900">Live Availability</h2>
                <div className="text-sm text-slate-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle animate-pulse" />
                  {inventory.by_status.available} of {inventory.total} units available
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventory.by_typology.map(t => (
                  <div key={t.typology} className="card-premium p-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold">{t.typology}</div>
                      <div className="text-slate-500 text-sm mt-1">
                        {t.carpet_min ? `${t.carpet_min}${t.carpet_max && t.carpet_max !== t.carpet_min ? `–${t.carpet_max}` : ""} sqft` : "Various sizes"}
                        {t.price_min ? ` · from ${formatINR(t.price_min)}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${t.available > 0 ? "text-emerald-600" : "text-rose-500"}`}>{t.available}</div>
                      <div className="text-xs text-slate-500">of {t.total} available</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">About {p.name}</h2>
            <p className="text-slate-700 leading-relaxed">{p.description}</p>
          </div>

          {p.amenities?.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {p.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 py-2.5 px-3 bg-blue-50 text-slate-700 rounded-lg text-sm">
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /></span>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.developer && (
            <div className="card-premium p-6">
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">About the Developer</div>
              <Link to={`/developer/${p.developer.slug}`} className="flex items-center gap-4">
                <img src={p.developer.logo} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="text-xl font-semibold text-slate-900">{p.developer.name}</div>
                  <div className="text-sm text-slate-500">{p.developer.experience_years}+ years • {p.developer.total_projects} projects</div>
                </div>
                <div className="text-blue-600 text-sm font-medium">View →</div>
              </Link>
            </div>
          )}

          {p.lat && p.lng && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Location</h2>
              <div className="rounded-xl overflow-hidden"><PropertyMap items={[{ ...p, images: p.images, title: p.name, slug: p.slug, price: p.price_from }]} center={[p.lat, p.lng]} zoom={14} height={400} /></div>
            </div>
          )}

          {p.properties?.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Available Units</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {p.properties.map(s => <PropertyCard key={s.id} p={s} />)}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card-premium p-6">
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Get Best Price</div>
              <form onSubmit={submit} className="space-y-3">
                <Input required data-testid="proj-enquiry-name" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-lg border-slate-200" />
                <Input required data-testid="proj-enquiry-phone" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-lg border-slate-200" />
                <Input type="email" data-testid="proj-enquiry-email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-lg border-slate-200" />
                <Textarea data-testid="proj-enquiry-message" placeholder="Ask about pricing, floor plans…" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} className="rounded-lg border-slate-200" />
                <button data-testid="proj-enquiry-submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">Request Callback</button>
              </form>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a href="tel:+919820000000" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"><PhoneCall size={14} /> Call</a>
                <a href="https://wa.me/919820000000" target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium"><WhatsappLogo size={14} /> WhatsApp</a>
              </div>
              <button data-testid="schedule-visit-btn" onClick={() => setVisitOpen(true)} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <CalendarBlank size={16} weight="bold" /> Schedule Site Visit
              </button>
            </div>
            {p.brochure_url && (
              <a href={p.brochure_url} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                <Download size={16} /> Download Brochure
              </a>
            )}
          </div>
        </aside>
      </div>

      <ScheduleVisitDialog open={visitOpen} onOpenChange={setVisitOpen} projectId={p.id} targetName={p.name} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card-premium p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className="text-lg font-semibold text-slate-900 mt-1">{value || "—"}</div>
    </div>
  );
}
