import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import PropertyMap from "@/components/PropertyMap";
import PropertyCard from "@/components/PropertyCard";
import { formatINR, formatArea } from "@/lib/format";
import { waPropertyMsg, telTo } from "@/lib/whatsapp";
import { MapPin, Bed, Bathtub, ArrowsOutSimple, Car, Buildings, Calendar, ShieldCheck, PhoneCall, WhatsappLogo, Heart, ShareNetwork, Download, CaretRight, CalendarBlank, Compass, FileText, Sparkle, SwimmingPool, Barbell, WifiHigh, Tree, Lightning, Elevator, Drop, GameController, Flower, SoccerBall, ShoppingBag, Bank, SquaresFour, List } from "@phosphor-icons/react";
import { ytEmbedId } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const AMENITY_ICONS = [
  [/pool/i, SwimmingPool], [/gym|fitness/i, Barbell], [/wifi|internet|intercom/i, WifiHigh],
  [/park/i, Car], [/garden|green|tree|jog|yoga|landscap/i, Tree], [/power|backup|light/i, Lightning],
  [/lift|elevator/i, Elevator], [/water|gas|sewage|rainwater/i, Drop], [/game|play|sport|amphi|multipurpose|club/i, GameController],
  [/senior/i, Flower], [/security|cctv|fire|safety/i, ShieldCheck], [/shop|mart|retail/i, ShoppingBag], [/solar/i, Lightning],
];

function amenityIcon(name) {
  for (const [re, icon] of AMENITY_ICONS) if (re.test(name)) return icon;
  return Sparkle;
}

const NEARBY_TABS = [
  ["schools", "Schools", /school|college|education/i],
  ["hospitals", "Hospitals", /hospital|clinic|health|medical/i],
  ["metro", "Metro", /metro/i],
  ["railway", "Railway", /rail|station|train/i],
  ["buses", "Buses", /bus|depot|stop/i],
  ["market", "Market & Mall", /market|mall|shop|mart|retail|shopping/i],
];

function NearbyTabs({ locations }) {
  const claimed = new Set();
  const groups = NEARBY_TABS.map(([key, label, re]) => {
    const items = locations.filter(l => {
      const idx = locations.indexOf(l);
      if (claimed.has(idx)) return false;
      const hit = re.test(`${l.category || ""} ${l.name || ""}`) || (l.category || "").toLowerCase().replace(/[^a-z]/g, "").includes(key);
      if (hit) claimed.add(idx);
      return hit;
    });
    return [key, label, items];
  });
  const available = groups.filter(([, , items]) => items.length > 0);
  const [active, setActive] = useState(available[0]?.[0] || "all");
  const shown = active === "all" ? locations : (groups.find(([k]) => k === active)?.[2] || []);
  return (
    <div className="mb-5" data-testid="nearby-tabs">
      <div className="flex flex-wrap gap-2 mb-4">
        {available.map(([key, label, items]) => (
          <button key={key} data-testid={`nearby-tab-${key}`} onClick={() => setActive(key)}
            className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${active === key ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
            {label} <span className="opacity-70">({items.length})</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((n, i) => (
          <div key={i} className="card-premium p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><MapPin size={16} weight="bold" /></span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{n.name}</div>
              <div className="text-xs text-slate-500">{[n.category, n.distance].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ScheduleVisitDialog from "@/components/ScheduleVisitDialog";
import ScrollVisitPopup from "@/components/ScrollVisitPopup";
import AllImagesGallery from "@/components/AllImagesGallery";

export default function PropertyDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [visitOpen, setVisitOpen] = useState(false);
  const [similarView, setSimilarView] = useState("grid");

  useEffect(() => {
    api.get(`/properties/${slug}`).then(r => setP(r.data)).catch(() => setP(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (p?.seo?.title) document.title = p.seo.title;
    else if (p?.title) document.title = `${p.title} | CarpetAdda`;
    if (p?.seo?.description) {
      let el = document.head.querySelector('meta[name="description"]');
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", "description"); document.head.appendChild(el); }
      el.setAttribute("content", p.seo.description);
    }
  }, [p]);

  if (p === false) return <div className="max-w-4xl mx-auto p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Property not found</h1><Link to="/properties" className="text-blue-600 mt-4 inline-block font-medium">Browse all properties →</Link></div>;
  if (!p) return <div className="max-w-4xl mx-auto p-20 text-center text-slate-500">Loading…</div>;

  const price = p.listing_type === "rent" ? `${formatINR(p.rent)}/mo` : formatINR(p.price);
  const waMsg = waPropertyMsg(p, p.contact?.whatsapp || p.contact?.phone);
  const hasHtml = (p.description || "").includes("<");
  const ytId = ytEmbedId(p.youtube_url);
  const allImages = [
    { src: p.main_image, label: "Main Image" },
    ...(p.images || []).map(src => ({ src, label: "Gallery" })),
    { src: p.floor_plan, label: "Floor Plan" },
    { src: p.unit_plan, label: "Unit Plan" },
  ];

  const submitEnquiry = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please enter your name"); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid 10-digit phone"); return; }
    try {
      await api.post("/leads", {
        ...form,
        property_id: p.id,
        source: "property_page",
        source_url: window.location.href,
        configuration: p.bhk ? `${p.bhk} BHK` : (p.property_category === "commercial" ? "Commercial" : undefined),
        budget_max: p.price || p.rent,
      });
      toast.success("Enquiry sent! Our team will contact you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) { toast.error(err?.response?.data?.detail || "Please try again"); }
  };

  const detailRows = [
    ["Listing Type", p.listing_type === "rent" ? "For Rent" : "For Sale"],
    ["Category", p.property_category],
    ["Property Type", p.property_type?.replace(/_/g, " ")],
    ["Furnishing", p.furnishing],
    ["Construction", p.construction_status?.replace(/_/g, " ")],
    ["Possession", p.possession],
    ["Built-up Area", p.builtup_area ? formatArea(p.builtup_area) : null],
    ["Balconies", p.balcony],
    ["Price per sq.ft.", p.price_per_sqft ? `₹${p.price_per_sqft}` : null],
    ["Security Deposit", p.deposit ? formatINR(p.deposit) : null],
    ["Maintenance", p.maintenance ? `${formatINR(p.maintenance)}/mo` : null],
    ["RERA Number", p.rera_number],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-blue-600">Home</Link><CaretRight size={10} />
          <Link to="/properties" className="hover:text-blue-600">Properties</Link><CaretRight size={10} />
          <Link to={`/location/${p.city}`} className="hover:text-blue-600 capitalize">{p.city.replace("-", " ")}</Link><CaretRight size={10} />
          <span className="text-slate-700">{p.title}</span>
        </nav>

        <div className="flex items-start justify-between flex-wrap gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {p.featured && <span className="blue-badge">Featured</span>}
              {p.rera_number && <span className="blue-badge">RERA {p.rera_number}</span>}
              {p.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><ShieldCheck size={12} weight="fill" /> Verified</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">{p.title}</h1>
            <div className="flex items-center gap-2 text-slate-500"><MapPin size={16} /> {p.address}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900"><span className="rupee">{price}</span></div>
              {p.price_per_sqft && <div className="text-sm text-slate-500 font-medium"><span className="rupee">₹</span>{p.price_per_sqft}/sq.ft.</div>}
            </div>
            <button data-testid="share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} className="p-3 border border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"><ShareNetwork size={16} /></button>
            <button data-testid="save-btn" onClick={async () => { try { await api.post(`/favorites/${p.id}`); toast.success("Saved!"); } catch { toast.error("Please login to save"); } }} className="p-3 border border-slate-200 rounded-lg text-slate-600 hover:border-rose-300 hover:text-rose-500 transition-colors"><Heart size={16} /></button>
          </div>
        </div>

        {/* 1. Main Image — slider with arrows */}
        <div className="rounded-2xl overflow-hidden mb-10" data-testid="property-gallery">
          <Carousel className="relative" opts={{ loop: true }}>
            <CarouselContent>
              {Array.from(new Set([p.main_image, ...(p.images || [])].filter(Boolean))).map((src, i) => (
                <CarouselItem key={i}>
                  <div className="relative aspect-[16/9] max-h-[540px] w-full bg-slate-100 overflow-hidden">
                    <img src={src} alt={`${p.title} — image ${i + 1}`} className="absolute inset-0 w-full h-full object-cover object-center" loading={i === 0 ? "eager" : "lazy"} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious data-testid="gallery-prev" className="left-4 bg-white/90 border-0 text-slate-800 hover:bg-white" />
            <CarouselNext data-testid="gallery-next" className="right-4 bg-white/90 border-0 text-slate-800 hover:bg-white" />
          </Carousel>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* 2. Overview */}
          <section data-testid="section-overview">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">Overview</h2>
            <div className="card-premium p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {p.bhk && <Fact icon={<Bed size={20} />} label="Configuration" value={`${p.bhk} BHK`} />}
              {p.bathrooms && <Fact icon={<Bathtub size={20} />} label="Bathrooms" value={p.bathrooms} />}
              {p.carpet_area && <Fact icon={<ArrowsOutSimple size={20} />} label="Carpet Area" value={formatArea(p.carpet_area)} />}
              {p.parking !== null && p.parking !== undefined && <Fact icon={<Car size={20} />} label="Parking" value={p.parking || "—"} />}
              {p.balcony !== null && p.balcony !== undefined && p.balcony !== "" && <Fact icon={<Compass size={20} />} label="Balconies" value={p.balcony || "—"} />}
              {p.floor && <Fact icon={<Buildings size={20} />} label="Floor" value={`${p.floor}/${p.total_floors || "—"}`} />}
              {p.possession && <Fact icon={<Calendar size={20} />} label="Possession" value={p.possession} />}
            </div>
            {p.features?.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Highlights</div>
                <ul className="grid grid-cols-2 gap-2">{p.features.map(f => <li key={f} className="text-sm text-slate-700 flex items-center gap-2"><Sparkle size={13} weight="fill" className="text-blue-500 flex-shrink-0" /> {f}</li>)}</ul>
              </div>
            )}
          </section>

          {/* 3. Description */}
          <section data-testid="section-description">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Description</h2>
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
                {p.amenities.map(a => {
                  const Icon = amenityIcon(a);
                  return (
                    <div key={a} className="card-premium p-4 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><Icon size={17} weight="bold" /></span>
                      <span className="text-sm font-medium text-slate-800">{a}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. Nearby Locations + Map */}
          <section data-testid="section-location">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">Location &amp; Nearby</h2>
            {p.nearby_locations?.length > 0 && (
              <NearbyTabs locations={p.nearby_locations} />
            )}
            {p.lat && p.lng
              ? <div className="rounded-xl overflow-hidden"><PropertyMap items={[p]} center={[p.lat, p.lng]} zoom={14} height={400} /></div>
              : <div className="text-slate-500 text-sm">Map location not available.</div>}
            {p.google_map_link && (
              <a href={p.google_map_link} target="_blank" rel="noopener" data-testid="google-map-link" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                <MapPin size={16} /> Open in Google Maps →
              </a>
            )}
          </section>

          {/* 6b. All Images — every stored property image, deduped, with lightbox */}
          <AllImagesGallery items={allImages} testid="all-images" />

          {/* 6c. YouTube Video — rendered only when a valid link exists */}
          {ytId && (
            <section data-testid="section-youtube">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">YouTube Video</h2>
              <div className="card-premium overflow-hidden">
                <div className="relative w-full aspect-video">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}`} title={`${p.title} — video`}
                    className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              </div>
            </section>
          )}

          {/* 7. Unit Plan */}
          {p.unit_plan && (
            <section data-testid="section-unit-plan">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Unit Plan</h2>
              <a href={p.unit_plan} target="_blank" rel="noopener" className="card-premium overflow-hidden block group">
                <img src={p.unit_plan} alt="Unit plan" className="w-full max-h-[480px] object-contain bg-slate-50 group-hover:opacity-95 transition-opacity" />
                <div className="p-4 text-sm text-blue-600 font-medium flex items-center gap-2"><FileText size={16} /> View full unit plan →</div>
              </a>
            </section>
          )}

          {/* 8. Schedule Visit */}
          <section data-testid="section-schedule-visit" className="card-premium p-6 bg-gradient-to-r from-blue-600 to-blue-500 border-blue-500 text-white flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">See it in person</h2>
              <p className="text-blue-100 text-sm mt-1">Book a free guided site visit at a time that suits you.</p>
            </div>
            <button data-testid="schedule-visit-strip" onClick={() => setVisitOpen(true)} className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md">
              <CalendarBlank size={16} weight="bold" /> Schedule Visit
            </button>
          </section>

          {/* 9. Similar Properties — grid/list toggle */}
          {p.similar?.length > 0 && (
            <section data-testid="section-similar">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Similar Properties</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {p.similar.map(s => <PropertyCard key={s.id} p={s} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {p.similar.map(s => (
                    <Link key={s.id} to={`/property/${s.slug}`} data-testid={`similar-list-${s.slug}`} className="card-premium p-3 flex items-center gap-4 group">
                      <img src={s.main_image} alt={s.title} loading="lazy" className="w-28 sm:w-36 aspect-[4/3] object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{s.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 capitalize"><MapPin size={12} /> {(s.location || "").replace(/-/g, " ")}, {s.city}</div>
                        {s.bhk && <div className="text-xs text-slate-500 mt-1">{s.bhk} BHK{s.carpet_area ? ` · ${formatArea(s.carpet_area)}` : ""}</div>}
                      </div>
                      <div className="text-sm font-bold text-blue-600 rupee whitespace-nowrap">{s.listing_type === "rent" ? `${formatINR(s.rent)}/mo` : formatINR(s.price)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card-premium p-6">
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Contact Agent</div>
              {p.agent ? (
                <Link to={`/agent/${p.agent.slug}`} className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <img src={p.agent.photo} alt={p.agent.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-slate-900">{p.agent.name}</div>
                    <div className="text-xs text-slate-500">{p.agent.experience_years}+ years experience</div>
                  </div>
                </Link>
              ) : null}

              <form onSubmit={submitEnquiry} className="mt-4 space-y-3">
                <Input required data-testid="enquiry-name" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-lg border-slate-200" />
                <Input required data-testid="enquiry-phone" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-lg border-slate-200" />
                <Input type="email" data-testid="enquiry-email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-lg border-slate-200" />
                <Textarea data-testid="enquiry-message" placeholder="I'm interested in this property…" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} className="rounded-lg border-slate-200" />
                <button type="submit" data-testid="enquiry-submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">Enquire Now</button>
              </form>

              {p.contact?.name && (
                <p className="text-xs text-slate-500 mt-3 text-center" data-testid="detail-contact-name">You’ll be connected with <span className="font-semibold text-slate-700">{p.contact.name}</span></p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a data-testid="detail-call" href={telTo(p.contact?.phone || p.contact?.whatsapp)} className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"><PhoneCall size={14} /> Call</a>
                <a data-testid="detail-whatsapp" href={waMsg} target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"><WhatsappLogo size={14} /> WhatsApp</a>
              </div>

              <button data-testid="schedule-visit-btn" onClick={() => setVisitOpen(true)} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <CalendarBlank size={16} weight="bold" /> Schedule Site Visit
              </button>
              <Link to={`/home-loan?property_id=${p.id}&property_name=${encodeURIComponent(p.title)}&property_cost=${p.listing_type === "rent" ? (p.rent || p.price || "") : (p.price || "")}`} data-testid="apply-loan-btn"
                className="w-full mt-2.5 inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                <Bank size={16} weight="bold" /> Apply Loan
              </Link>
            </div>

            {p.brochure_url && p.brochure_url !== "#" && (
              <a href={p.brochure_url} target="_blank" rel="noopener" data-testid="brochure-btn" className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                <Download size={16} /> Download Brochure
              </a>
            )}
          </div>
        </aside>
      </div>

      <ScheduleVisitDialog open={visitOpen} onOpenChange={setVisitOpen} propertyId={p.id} targetName={p.title} />
      <ScrollVisitPopup propertyId={p.id} targetName={p.title} />
    </div>
  );
}

function Fact({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
        <div className="font-semibold text-slate-900 mt-1">{value}</div>
      </div>
    </div>
  );
}
