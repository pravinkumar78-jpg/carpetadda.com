import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import PropertyMap from "@/components/PropertyMap";
import PropertyCard from "@/components/PropertyCard";
import { formatINR, formatArea } from "@/lib/format";
import { MapPin, Bed, Bathtub, ArrowsOutSimple, Car, Buildings, Calendar, ShieldCheck, PhoneCall, WhatsappLogo, Heart, ShareNetwork, Download, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ScheduleVisitDialog from "@/components/ScheduleVisitDialog";

export default function PropertyDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [visitOpen, setVisitOpen] = useState(false);

  useEffect(() => {
    api.get(`/properties/${slug}`).then(r => setP(r.data)).catch(() => setP(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (p?.seo?.title) document.title = p.seo.title;
    else if (p?.title) document.title = `${p.title} | CarpetAdda`;
  }, [p]);

  if (p === false) return <div className="max-w-4xl mx-auto p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Property not found</h1><Link to="/properties" className="text-blue-600 mt-4 inline-block font-medium">Browse all properties →</Link></div>;
  if (!p) return <div className="max-w-4xl mx-auto p-20 text-center text-slate-500">Loading…</div>;

  const price = p.listing_type === "rent" ? `${formatINR(p.rent)}/mo` : formatINR(p.price);
  const waMsg = `https://wa.me/919820000000?text=${encodeURIComponent(`Hi, I'm interested in ${p.title} (${window.location.href})`)}`;

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
        configuration: p.bhk ? `${p.bhk} BHK` : (p.category === "commercial" ? "Commercial" : undefined),
        budget_max: p.price || p.rent,
      });
      toast.success("Enquiry sent! Our team will contact you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) { toast.error(err?.response?.data?.detail || "Please try again"); }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        {/* Breadcrumbs */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-blue-600">Home</Link><CaretRight size={10} />
          <Link to="/properties" className="hover:text-blue-600">Properties</Link><CaretRight size={10} />
          <Link to={`/location/${p.city}`} className="hover:text-blue-600 capitalize">{p.city.replace("-", " ")}</Link><CaretRight size={10} />
          <span className="text-slate-700">{p.title}</span>
        </nav>

        {/* Title bar */}
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
              <div className="text-3xl font-bold text-slate-900">{price}</div>
              {p.price_per_sqft && <div className="text-sm text-slate-500 font-medium">₹{p.price_per_sqft}/sq.ft.</div>}
            </div>
            <button data-testid="share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} className="p-3 border border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"><ShareNetwork size={16} /></button>
            <button data-testid="save-btn" onClick={async () => { try { await api.post(`/favorites/${p.id}`); toast.success("Saved!"); } catch { toast.error("Please login to save"); } }} className="p-3 border border-slate-200 rounded-lg text-slate-600 hover:border-rose-300 hover:text-rose-500 transition-colors"><Heart size={16} /></button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 mb-10 rounded-2xl overflow-hidden" data-testid="property-gallery">
          <div className="md:col-span-3 md:row-span-2 aspect-[16/10] md:aspect-auto overflow-hidden">
            <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
          </div>
          {(p.images || []).slice(1, 5).map((src, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden hidden md:block"><img src={src} alt="" className="w-full h-full object-cover" /></div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Facts */}
          <div className="card-premium p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {p.bhk && <Fact icon={<Bed size={20} />} label="Configuration" value={`${p.bhk} BHK`} />}
            {p.bathrooms && <Fact icon={<Bathtub size={20} />} label="Bathrooms" value={p.bathrooms} />}
            {p.carpet_area && <Fact icon={<ArrowsOutSimple size={20} />} label="Carpet Area" value={formatArea(p.carpet_area)} />}
            {p.parking !== null && <Fact icon={<Car size={20} />} label="Parking" value={p.parking || "—"} />}
            {p.floor && <Fact icon={<Buildings size={20} />} label="Floor" value={`${p.floor}/${p.total_floors || "—"}`} />}
            {p.possession && <Fact icon={<Calendar size={20} />} label="Possession" value={p.possession} />}
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="bg-slate-100 rounded-xl p-1 h-auto inline-flex flex-wrap">
              {[["overview", "Overview"], ["amenities", "Amenities"], ["location", "Location"], ["similar", "Similar"]].map(([v, l]) => (
                <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600">{l}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview" className="pt-6 space-y-6">
              <h3 className="text-2xl font-semibold text-slate-900">About this property</h3>
              <p className="text-slate-700 leading-relaxed">{p.description}</p>
              {p.features?.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Highlights</div>
                  <ul className="grid grid-cols-2 gap-2">{p.features.map(f => <li key={f} className="text-sm text-slate-700 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {f}</li>)}</ul>
                </div>
              )}
            </TabsContent>
            <TabsContent value="amenities" className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(p.amenities || []).map(a => (
                  <div key={a} className="flex items-center gap-2 py-2.5 px-3 bg-blue-50 text-slate-700 rounded-lg text-sm">
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /></span>
                    {a}
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="location" className="pt-6">
              {p.lat && p.lng ? <div className="rounded-xl overflow-hidden"><PropertyMap items={[p]} center={[p.lat, p.lng]} zoom={14} height={400} /></div> : <div className="text-slate-500">Location not available.</div>}
            </TabsContent>
            <TabsContent value="similar" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(p.similar || []).map(s => <PropertyCard key={s.id} p={s} />)}
              </div>
            </TabsContent>
          </Tabs>
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

              <div className="grid grid-cols-2 gap-2 mt-3">
                <a data-testid="detail-call" href="tel:+919820000000" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors font-medium"><PhoneCall size={14} /> Call</a>
                <a data-testid="detail-whatsapp" href={waMsg} target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 text-sm py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"><WhatsappLogo size={14} /> WhatsApp</a>
              </div>

              <button data-testid="schedule-visit-btn" onClick={() => setVisitOpen(true)} className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <CalendarBlank size={16} weight="bold" /> Schedule Site Visit
              </button>
            </div>

            {p.brochure_url && (
              <a href={p.brochure_url} target="_blank" rel="noopener" data-testid="brochure-btn" className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                <Download size={16} /> Download Brochure
              </a>
            )}
          </div>
        </aside>
      </div>

      <ScheduleVisitDialog open={visitOpen} onOpenChange={setVisitOpen} propertyId={p.id} targetName={p.title} />
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
