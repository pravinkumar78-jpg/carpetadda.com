import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import PropertyMap from "@/components/PropertyMap";
import ProjectCard from "@/components/ProjectCard";
import { formatINR, formatArea } from "@/lib/format";
import { waProjectMsg, waUnitMsg, telTo } from "@/lib/whatsapp";
import { MapPin, Download, PhoneCall, WhatsappLogo, CalendarBlank, Check, Compass, Bed, Bank, SquaresFour, List, QrCode, FileText, ArrowSquareOut, ShieldCheck } from "@phosphor-icons/react";
import { ytEmbedId } from "@/lib/utils";
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
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [visitOpen, setVisitOpen] = useState(false);
  const [similarView, setSimilarView] = useState("grid");

  useEffect(() => {
    api.get(`/projects/${slug}`).then(r => {
      setP(r.data);
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

  // Main image section shows ONLY the single main image
  const gallery = [p.main_image].filter(Boolean);
  // Image Gallery shows ONLY the Project Form → Gallery Images (main image, unit plans and RERA QR live in their own sections)
  const allImages = (p.images || []).filter(src => src && src !== p.main_image).map(src => ({ src, label: "Gallery" }));
  // RERA blocks: new multi-entry list wins; fall back to the legacy single fields
  const reraBlocks = (Array.isArray(p.rera_entries) && p.rera_entries.length
    ? p.rera_entries.filter(r => r && (r.number || r.qr_url || r.certificate_url || r.url))
    : (p.rera_number || p.rera_qr_url || p.rera_link
      ? [{ number: p.rera_number, description: null, url: p.rera_link, qr_url: p.rera_qr_url, certificate_url: null }]
      : []));
  const ytId = ytEmbedId(p.youtube_url);
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
    <div className="pb-20 lg:pb-0">
      {/* 1. Main Image — slider only */}
      <section className="relative" data-testid="project-gallery-slider">
        {/* RERA / Verified / status tags — pinned to the TOP so the main image stays fully visible */}
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-5 flex items-center gap-2 flex-wrap">
            {p.rera_number && <span data-testid="project-rera-tag" className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-3 py-1 rounded-full shadow">RERA {p.rera_number}</span>}
            {p.verified && <span data-testid="project-verified-tag" className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500 text-white px-3 py-1 rounded-full shadow"><ShieldCheck size={12} weight="fill" /> Verified Property</span>}
            {p.construction_status && <span className="inline-flex items-center text-xs font-semibold bg-slate-900/60 backdrop-blur text-white px-3 py-1 rounded-full uppercase tracking-wider">{p.construction_status.replace("_", " ")}</span>}
          </div>
        </div>
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{p.hero_title || p.name}</h1>
            {p.hero_description && <p data-testid="project-hero-description" className="mt-3 text-base lg:text-lg max-w-2xl leading-relaxed opacity-90">{p.hero_description}</p>}
            <div className="flex items-center gap-2 text-white/80 mt-3"><MapPin size={16} /> {p.location}, {p.city}</div>
            {allImages.length > 0 && (
              <button type="button" data-testid="view-gallery-btn"
                onClick={() => document.getElementById("image-gallery-section")?.scrollIntoView({ behavior: "smooth" })}
                className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 backdrop-blur text-white px-4 py-2 rounded-full hover:bg-white/25 transition-colors">
                <SquaresFour size={14} /> View Gallery ({allImages.length})
              </button>
            )}
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
              <Stat label="Land Area" value={p.land_size} />
              <Stat label="Towers" value={p.total_towers} />
              <Stat label="Floors" value={p.total_floors} />
              <Stat label="Possession" value={p.possession_date} />
            </div>
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

          {/* 6b. Image Gallery — only the Project Form gallery images, with lightbox */}
          <AllImagesGallery items={allImages} testid="image-gallery" title="Image Gallery" />

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
                          <span className="flex items-center gap-4 text-xs text-slate-500 font-normal flex-wrap">
                            {u.carpet_area && <span className="inline-flex items-center gap-1"><Bed size={13} /> Carpet {formatArea(u.carpet_area)}</span>}
                            {u.builtup_area && <span>Built-up {formatArea(u.builtup_area)}</span>}
                            {u.balcony != null && <span>{u.balcony} balcony</span>}
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${(u.status || "available") === "available" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`} data-testid={`unit-status-badge-${u.id}`}>{(u.status || "available").replace(/_/g, " ")}</span>
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
                        <a href={waUnitMsg(p, u)} target="_blank" rel="noopener" data-testid={`unit-request-price-${u.id}`}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                          <WhatsappLogo size={15} weight="bold" /> Request Price
                        </a>
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

          {/* 7b. YouTube Video — rendered only when a valid link exists */}
          {ytId && (
            <section data-testid="section-youtube">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">YouTube Video</h2>
              <div className="card-premium overflow-hidden">
                <div className="relative w-full aspect-video">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}`} title={`${p.name} — video`}
                    className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              </div>
            </section>
          )}

          {/* 7c. RERA Details — one block per RERA registration */}
          {reraBlocks.length > 0 && (
            <section data-testid="section-rera-details">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">RERA Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reraBlocks.map((r, i) => (
                  <div key={i} data-testid={`rera-block-${i}`} className="card-premium p-5">
                    <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">RERA Registration</div>
                    {r.number && <div className="text-base font-bold text-slate-900 font-mono tracking-wide mb-2">RERA No: {r.number}</div>}
                    {r.description && <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.description}</p>}
                    <div className="flex items-end gap-4 flex-wrap">
                      {r.qr_url && (
                        <a href={r.url || r.qr_url} target="_blank" rel="noopener" data-testid={`rera-qr-${i}`} className="block" title={r.url ? "Open official RERA page" : "View QR"}>
                          <img src={r.qr_url} alt={`RERA QR ${r.number || i + 1}`} className="w-20 h-20 rounded-lg border border-slate-200 object-contain bg-white" loading="lazy" />
                        </a>
                      )}
                      <div className="flex flex-col gap-2 text-sm">
                        {r.certificate_url && (
                          <a href={r.certificate_url} target="_blank" rel="noopener" data-testid={`rera-cert-${i}`} className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700">
                            <FileText size={15} /> View RERA Certificate
                          </a>
                        )}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener" data-testid={`rera-link-${i}`} className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700">
                            <ArrowSquareOut size={15} /> Open Official RERA Page
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Developer profile intentionally hidden from public project detail (component/API/data preserved) */}

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

          {/* 9. Similar Projects — grid/list toggle */}
          {p.similar?.length > 0 && (
            <section data-testid="section-similar">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Similar Projects</h2>
                <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden" data-testid="similar-view-toggle">
                  {[["grid", SquaresFour], ["list", List]].map(([k, Icon]) => (
                    <button key={k} type="button" data-testid={`similar-view-${k}`} onClick={() => setSimilarView(k)}
                      className={`p-2.5 ${similarView === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"} transition-colors`} aria-label={`${k} view`}>
                      <Icon size={17} />
                    </button>
                  ))}
                </div>
              </div>
              {similarView === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {p.similar.map(s => <ProjectCard key={s.id} p={s} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {p.similar.map(s => (
                    <Link key={s.id} to={`/project/${s.slug}`} data-testid={`similar-list-${s.slug}`} className="card-premium p-3 flex items-center gap-4 group">
                      <img src={s.main_image} alt={s.name} loading="lazy" className="w-28 sm:w-36 aspect-[4/3] object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{s.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 capitalize"><MapPin size={12} /> {(s.location || "").replace(/-/g, " ")}, {s.city}</div>
                        {(s.configurations || []).length > 0 && <div className="text-xs text-slate-500 mt-1">{(s.configurations || []).join(" · ")}</div>}
                      </div>
                      {s.price_from && <div className="text-sm font-bold text-blue-600 rupee whitespace-nowrap">{formatINR(s.price_from)}+</div>}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card-premium p-6">
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Get Best Price</div>
              <form id="enquiry-form" onSubmit={submit} className="space-y-3">
                <Input required data-testid="proj-enquiry-name" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-lg border-slate-200" />
                <Input required data-testid="proj-enquiry-phone" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-lg border-slate-200" />
                <Input type="email" data-testid="proj-enquiry-email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-lg border-slate-200" />
                <Textarea data-testid="proj-enquiry-message" placeholder="Ask about pricing, floor plans…" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} className="rounded-lg border-slate-200" />
                <button data-testid="proj-enquiry-submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">Request Callback</button>
              </form>
              {p.contact?.name && (
                <p className="text-xs text-slate-500 mt-3 text-center" data-testid="project-contact-name">You’ll be connected with <span className="font-semibold text-slate-700">{p.contact.name}</span></p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a href={telTo(p.contact?.phone || p.contact?.whatsapp)} data-testid="project-detail-call" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"><PhoneCall size={14} /> Call</a>
                <a href={waProjectMsg(p, p.contact?.whatsapp || p.contact?.phone)} target="_blank" rel="noopener" data-testid="project-detail-whatsapp" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium"><WhatsappLogo size={14} /> WhatsApp</a>
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

      {/* Mobile sticky enquiry bar — same routing as Property Detail (assigned contact → business fallback) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] px-3 py-2.5 grid grid-cols-3 gap-2" data-testid="mobile-enquiry-bar">
        <a href={telTo(p.contact?.phone || p.contact?.whatsapp)} data-testid="mobile-bar-call" className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm"><PhoneCall size={15} /> Call</a>
        <a href={waProjectMsg(p, p.contact?.whatsapp || p.contact?.phone)} target="_blank" rel="noopener" data-testid="mobile-bar-whatsapp" className="flex items-center justify-center gap-1.5 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg font-medium text-sm"><WhatsappLogo size={15} /> WhatsApp</a>
        <button type="button" data-testid="mobile-bar-enquire" onClick={() => { document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => document.querySelector('[data-testid="proj-enquiry-name"]')?.focus({ preventScroll: true }), 600); }} className="py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm">Enquire</button>
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
