import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import PropertyMap from "@/components/PropertyMap";
import ProjectCard from "@/components/ProjectCard";
import { formatINR, formatArea } from "@/lib/format";
import { waProjectMsg } from "@/lib/whatsapp";
import { MapPin, Download, PhoneCall, WhatsappLogo, CalendarBlank, Check, Compass, Car, Bed, Bank } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ScheduleVisitDialog from "@/components/ScheduleVisitDialog";
import ScrollVisitPopup from "@/components/ScrollVisitPopup";
import AllImagesGallery from "@/components/AllImagesGallery";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [visitOpen, setVisitOpen] = useState(false);

  useEffect(() => {
    api.get(`/projects/${slug}`).then(r => {
      setP(r.data);
      api.get(`/projects/${r.data.id}/units/summary`).then(res => setInventory(res.data)).catch(() => setInventory(null));
    }).catch(() => setP(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (p?.seo?.title) document.title = p.seo.title;
    else if (p?.name) document.title = `${p.name} | CarpetAdda`;
    if (p?.seo?.description) {
      let el = document.head.querySelector('meta[name="description"]');
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", "description"); document.head.appendChild(el); }
      el.setAttribute("content", p.seo.description);
    }
  }, [p]);

  if (p === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Project not found</h1><Link to="/projects" className="text-blue-600 mt-4 inline-block font-medium">Browse all projects →</Link></div>;
  if (!p) return <div className="p-20 text-center text-slate-500">Loading…</div>;

  const gallery = Array.from(new Set([p.main_image, ...(p.images || [])].filter(Boolean)));
  const allImages = [
    { src: p.main_image, label: "Main Image" },
    ...(p.images || []).map(src => ({ src, label: "Gallery" })),
    ...(p.floor_plans || []).map(fp => ({ src: fp.image, label: fp.title ? `Floor Plan · ${fp.title}` : "Floor Plan" })),
    ...(p.units || []).map(u => ({ src: u.unit_plan, label: `Unit Plan · ${u.typology || u.unit_no || "Unit"}` })),
    { src: p.rera_qr_url, label: "RERA QR" },
  ];
  const hasHtml = (p.description || "").includes("<");

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

  const detailRows = [
    ["Construction Status", p.construction_status?.replace(/_/g, " ")],
    ["Launch Date", p.launch_date],
    ["Possession", p.possession_date],
    ["Area Range", p.area_from ? `${p.area_from} – ${p.area_to} sq.ft.` : null],
    ["Total Towers", p.total_towers],
    ["Total Floors", p.total_floors],
    ["Total Units", p.total_units],
    ["RERA Number", p.rera_number],
    ["Payment Plan", p.payment_plan],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div>
      {/* 1. Main Image — slider only */}
      <section className="relative" data-testid="project-gallery-slider">
        <Carousel className="relative" opts={{ loop: true }}>
          <CarouselContent>
            {gallery.map((src, i) => (
              <CarouselItem key={i}>
                <div className="relative h-[55vh] min-h-[400px]">
                  <img src={src} alt={`${p.name} — image ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious data-testid="gallery-prev" className="left-4 lg:left-8 bg-white/90 border-0 text-slate-800 hover:bg-white" />
          <CarouselNext data-testid="gallery-next" className="right-4 lg:right-8 bg-white/90 border-0 text-slate-800 hover:bg-white" />
        </Carousel>
        <div className="absolute inset-x-0 bottom-0 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-12 text-white">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {p.rera_number && <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-3 py-1 rounded-full">RERA {p.rera_number}</span>}
              {p.construction_status && <span className="inline-flex items-center text-xs font-semibold bg-white/15 backdrop-blur text-white px-3 py-1 rounded-full uppercase tracking-wider">{p.construction_status.replace("_", " ")}</span>}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{p.name}</h1>
            <div className="flex items-center gap-2 text-white/80 mt-3"><MapPin size={16} /> {p.location}, {p.city}</div>
          </div>
        </div>
      </section>

      {/* 2. Overview */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 -mt-8 relative z-10">
        <div className="card-premium bg-white p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-1">Starting from</div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 rupee">{formatINR(p.price_from)}</span>
              <span className="text-slate-500 rupee">– {formatINR(p.price_to)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(p.configurations || []).map(c => (
              <span key={c} className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">{c}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          <section data-testid="section-overview" className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Stat label="Total Units" value={p.total_units} />
              <Stat label="Towers" value={p.total_towers} />
              <Stat label="Floors" value={p.total_floors} />
              <Stat label="Possession" value={p.possession_date} />
            </div>

            {inventory && inventory.total > 0 && (
              <div data-testid="project-live-availability">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Live Availability</h2>
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
          </section>

          {/* 3. Description */}
          <section data-testid="section-description">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About {p.name}</h2>
            {hasHtml
              ? <div className="text-slate-700 leading-relaxed rich-content" dangerouslySetInnerHTML={{ __html: p.description }} />
              : <p className="text-slate-700 leading-relaxed">{p.description}</p>}
          </section>

          {/* 4. Property Details */}
          <section data-testid="section-details">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">Property Details</h2>
            <div className="card-premium overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {detailRows.map(([k, v], i) => (
                    <tr key={k} className={i % 2 ? "bg-slate-50/60" : ""}>
                      <td className="px-5 py-3 text-slate-500 font-medium w-1/2">{k}</td>
                      <td className="px-5 py-3 text-slate-900 font-semibold capitalize">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Amenities */}
          {p.amenities?.length > 0 && (
            <section data-testid="section-amenities">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {p.amenities.map(a => (
                  <div key={a} className="card-premium p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><Check size={16} weight="bold" /></span>
                    <span className="text-sm font-medium text-slate-800">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Nearby Locations + Map */}
          <section data-testid="section-location">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">Location &amp; Nearby</h2>
            {p.nearby_locations?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {p.nearby_locations.map((n, i) => (
                  <div key={i} className="card-premium p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><Compass size={16} weight="bold" /></span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{n.name}</div>
                      <div className="text-xs text-slate-500">{[n.category, n.distance].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {p.lat && p.lng && (
              <div className="rounded-xl overflow-hidden"><PropertyMap items={[{ ...p, title: p.name, price: p.price_from }]} center={[p.lat, p.lng]} zoom={14} height={400} /></div>
            )}
            {p.google_map_link && (
              <a href={p.google_map_link} target="_blank" rel="noopener" data-testid="google-map-link" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                <MapPin size={16} /> Open in Google Maps →
              </a>
            )}
          </section>

          {/* 6b. All Images — every stored project image, deduped, with lightbox */}
          <AllImagesGallery items={allImages} testid="all-images" />

          {/* 7. Unit Plan (collapsible) */}
          {(p.units?.length > 0 || p.floor_plans?.length > 0) && (
            <section data-testid="section-unit-plans">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Unit Plans</h2>
              {p.units?.length > 0 && (
                <Accordion type="single" collapsible className="card-premium px-6">
                  {p.units.map(u => (
                    <AccordionItem key={u.id} value={u.id} data-testid={`unit-plan-${u.id}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-2">
                          <span className="font-semibold text-slate-900">{u.typology || u.unit_no}</span>
                          <span className="flex items-center gap-4 text-xs text-slate-500 font-normal">
                            {u.carpet_area && <span className="inline-flex items-center gap-1"><Bed size={13} /> {formatArea(u.carpet_area)}</span>}
                            {u.balcony != null && <span>{u.balcony} balcony</span>}
                            {u.parking != null && <span className="inline-flex items-center gap-1"><Car size={13} /> {u.parking}</span>}
                            {u.price && <span className="font-semibold text-blue-600 rupee">{formatINR(u.price)}</span>}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {u.unit_plan && (
                          <a href={u.unit_plan} target="_blank" rel="noopener" className="block mb-3">
                            <img src={u.unit_plan} alt={`${u.typology || u.unit_no} plan`} className="w-full max-h-[420px] object-contain bg-slate-50 rounded-lg border border-slate-100" />
                          </a>
                        )}
                        {u.description && <p className="text-sm text-slate-600 leading-relaxed">{u.description}</p>}
                        {!u.unit_plan && !u.description && <p className="text-sm text-slate-400">Plan details coming soon.</p>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
              {p.floor_plans?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {p.floor_plans.map((fp, i) => (
                    <div key={i} className="card-premium overflow-hidden">
                      {fp.image && <img src={fp.image} alt={fp.title || "Floor plan"} className="w-full aspect-[4/3] object-contain bg-slate-50" />}
                      <div className="p-4 text-sm font-medium text-slate-800">{fp.title || `Floor plan ${i + 1}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
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

          {/* 8. Schedule Visit */}
          <section data-testid="section-schedule-visit" className="card-premium p-6 bg-gradient-to-r from-blue-600 to-blue-500 border-blue-500 text-white flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Visit the sample flat</h2>
              <p className="text-blue-100 text-sm mt-1">Book a free guided tour of {p.name}.</p>
            </div>
            <button data-testid="schedule-visit-strip" onClick={() => setVisitOpen(true)} className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md">
              <CalendarBlank size={16} weight="bold" /> Schedule Visit
            </button>
          </section>

          {/* 9. Similar Projects */}
          {p.similar?.length > 0 && (
            <section data-testid="section-similar">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Similar Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {p.similar.map(s => <ProjectCard key={s.id} p={s} />)}
              </div>
            </section>
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
                <a href="tel:+918828830707" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"><PhoneCall size={14} /> Call</a>
                <a href={waProjectMsg(p)} target="_blank" rel="noopener" data-testid="project-detail-whatsapp" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium"><WhatsappLogo size={14} /> WhatsApp</a>
              </div>
              <button data-testid="schedule-visit-btn" onClick={() => setVisitOpen(true)} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <CalendarBlank size={16} weight="bold" /> Schedule Site Visit
              </button>
              <Link to={`/home-loan?project_id=${p.id}&property_name=${encodeURIComponent(p.name)}&property_cost=${p.price_from || ""}`} data-testid="apply-loan-btn"
                className="w-full mt-2.5 inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                <Bank size={16} weight="bold" /> Apply Loan
              </Link>
            </div>
            {p.brochure_url && p.brochure_url !== "#" && (
              <a href={p.brochure_url} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                <Download size={16} /> Download Brochure
              </a>
            )}
          </div>
        </aside>
      </div>

      <ScheduleVisitDialog open={visitOpen} onOpenChange={setVisitOpen} projectId={p.id} targetName={p.name} />
      <ScrollVisitPopup projectId={p.id} targetName={p.name} />
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
