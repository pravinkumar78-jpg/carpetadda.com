import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkle, House, Buildings, Key, CurrencyCircleDollar, City, Bank, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/ProjectCard";
import api from "@/lib/api";
import { useSettings } from "@/lib/useSettings";
import { formatINR } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";



export default function Home() {
  const [hp, setHp] = useState(null);
  const settings = useSettings();
  const [req, setReq] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const heroSlides = hp?.hero_projects || [];
  const bgImages = (settings?.hero_backgrounds || []).filter(b => b && b.enabled && b.url).map(b => b.url);
  const [bgIdx, setBgIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    if (bgImages.length < 2) return;
    const t = setInterval(() => setBgIdx(i => (i + 1) % bgImages.length), 7000);
    return () => clearInterval(t);
  }, [bgImages.length]);

  useEffect(() => {
    let cancelled = false;
    api.get("/homepage")
      .then(r => { if (!cancelled) setHp(r.data); })
      .catch(() => { if (!cancelled) setHp({ categories: [], cities: [], featured_projects: [], commercial_projects: [], investor_properties: [], best_resale: [], top_developers: [], testimonials: [], rtmi_projects: [] }); });
    return () => { cancelled = true; };
  }, []);

  if (!hp) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-3">
      <div>Loading…</div>
    </div>
  );

  const submitRequirement = async (e) => {
    e.preventDefault();
    if (!req.name.trim()) { toast.error("Please enter your name"); return; }
    if (req.phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    setSending(true);
    try {
      await api.post("/leads", {
        name: req.name.trim(),
        phone: req.phone.trim(),
        email: req.email.trim() || undefined,
        message: req.message.trim() || undefined,
        source: "home_requirement",
        landing_page: "/",
        source_url: window.location.href,
      });
      toast.success("Requirement shared! Our team will call you back shortly.");
      setReq({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Please try again");
    } finally { setSending(false); }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50" data-testid="hero-section">
        {/* Admin-managed rotating background (fallback: static hero image) */}
        {bgImages.length > 0 ? (
          <div className="absolute inset-0" data-testid="hero-bg-rotator" aria-hidden="true">
            {bgImages.map((url, i) => (
              <img key={url} src={url} alt="" loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                style={{ opacity: i === bgIdx % bgImages.length ? 1 : 0 }} />
            ))}
          </div>
        ) : (
          <>
            <img src={settings?.hero_image || "/hero-carpetadda.png"} alt="CarpetAdda real estate" className="hero-img-light absolute inset-0 w-full h-full object-cover" />
            <img src="/hero-dark.webp" alt="CarpetAdda real estate — night skyline" className="hero-img-dark absolute inset-0 w-full h-full object-cover" />
          </>
        )}
        {/* Hero Project carousel — independent layer above the background */}
        {heroSlides.length > 0 && (
          <div className="absolute inset-0" data-testid="hero-carousel">
            {heroSlides.map((proj, i) => {
              const loc = (() => {
                const pretty = s => (s || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
                const locality = pretty(proj.location);
                const city = pretty(proj.city);
                if (locality && city && !locality.toLowerCase().includes(city.toLowerCase())) return `${locality}, ${city}`;
                return locality || city;
              })();
              const price = proj.price_from
                ? (proj.price_to && proj.price_to > proj.price_from
                  ? `${formatINR(proj.price_from)} – ${formatINR(proj.price_to)}`
                  : `${formatINR(proj.price_from)} onwards`)
                : null;
              return (
              <Link
                key={proj.id}
                to={`/project/${proj.slug}`}
                data-testid={`hero-slide-${proj.slug}`}
                aria-label={`View ${proj.name}`}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{ opacity: i === heroIdx % heroSlides.length ? 1 : 0, pointerEvents: i === heroIdx % heroSlides.length ? "auto" : "none" }}
              >
                <img src={proj.main_image} alt={proj.name} className="w-full h-full object-cover object-center" loading={i === 0 ? "eager" : "lazy"} />
                <span data-testid={`hero-chip-${proj.slug}`} className="absolute bottom-8 xl:bottom-16 left-6 lg:left-10 z-10 block max-w-[calc(100vw-3rem)] bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg border border-slate-200">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <span className="truncate">{proj.name}</span>
                    <ArrowRight size={13} weight="bold" className="text-blue-600 flex-shrink-0" />
                  </span>
                  {loc && <span className="block text-xs text-slate-600 truncate mt-0.5">{loc}</span>}
                  {price && <span className="block text-xs font-semibold text-blue-600 truncate mt-0.5">{price}</span>}
                </span>
              </Link>
              );
            })}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-3 xl:bottom-16 right-6 z-10 flex gap-1.5" data-testid="hero-dots">
                {heroSlides.map((proj, i) => (
                  <button key={proj.id} type="button" onClick={() => setHeroIdx(i)} aria-label={`Go to slide ${i + 1}`} data-testid={`hero-dot-${i}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIdx % heroSlides.length ? "w-6 bg-blue-600" : "w-1.5 bg-slate-400/60 hover:bg-slate-500"}`} />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="hero-overlay-light absolute inset-0 bg-gradient-to-r from-white/90 via-white/45 to-transparent pointer-events-none" />
        <div className="hero-overlay-dark absolute inset-0 bg-gradient-to-r from-[#162E2A]/90 via-[#162E2A]/50 to-[#162E2A]/20 pointer-events-none" />
        <div className="hero-overlay-light absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-36 lg:pt-24 lg:pb-44">
          <div className="max-w-3xl">
            <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-slate-900 mb-6">
              Every Dream <span className="text-blue-600">Deserves</span> an Address
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              {settings?.hero_subtitle || "Discover residential and commercial properties, new projects, resale homes and rentals — verified listings from India's most trusted developers."}
            </p>
          </div>
        </div>
      </section>

      {/* Search bar — in flow below the hero on mobile/tablet, straddles the hero boundary on desktop */}
      <div className="relative z-10 mt-6 mb-8 xl:-mt-12 xl:mb-4 max-w-7xl mx-auto px-6 lg:px-10" data-testid="hero-search-wrap">
        <SearchBar />
      </div>

      {/* Browse by Categories — exactly 6 entry points with real DB counts */}
      <Section title="Browse by Categories" eyebrow="Explore" more="/properties">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(() => {
            const bc = hp.browse_counts || {};
            const cards = [
              { to: "/properties?category=residential", label: "Residential", count: bc.residential, Icon: House, tid: "residential" },
              { to: "/properties?category=commercial", label: "Commercial", count: bc.commercial, Icon: Buildings, tid: "commercial" },
              { to: "/properties?listing_type=sale", label: "Buy", count: bc.sale, Icon: CurrencyCircleDollar, tid: "buy" },
              { to: "/properties?listing_type=rent", label: "Rent", count: bc.rent, Icon: Key, tid: "rent" },
              { to: "/projects", label: "Projects", count: bc.projects, Icon: City, tid: "projects" },
              { to: "/home-loan", label: "Home Loan", sub: "EMI & eligibility", Icon: Bank, tid: "home-loan" },
            ];
            return cards.map(c => (
              <Link key={c.tid} to={c.to} data-testid={`cat-${c.tid}`} className="card-premium p-6 text-center group">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                  <c.Icon size={26} weight="bold" />
                </div>
                <div className="font-semibold text-slate-900">{c.label}</div>
                <div className="text-xs text-slate-500 mt-1">{c.count != null ? `${c.count} ${c.count === 1 ? "listing" : "listings"}` : c.sub}</div>
              </Link>
            ));
          })()}
        </div>
      </Section>

      {/* Browse by City */}
      <Section title="Browse by City" eyebrow="Locations" bg="section-blue">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {hp.cities.map(c => (
            <Link key={c.slug} to={`/location/${c.slug}`} data-testid={`city-${c.slug}`} className="group card-premium img-zoom-wrapper relative aspect-[4/5] overflow-hidden">
              {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xl font-semibold">{c.name}</div>
                <div className="text-xs text-blue-200 font-medium mt-1">{c.count} {c.count === 1 ? "property" : "properties"}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Expert Choice Projects */}
      {hp.featured_projects.length > 0 && (
        <Section title="Expert Choice Projects" eyebrow="Handpicked" more="/projects" testid="expert-choice-projects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hp.featured_projects.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        </Section>
      )}

      {/* Commercial Projects */}
      {hp.commercial_projects.length > 0 && (
        <Section title="Commercial Projects" eyebrow="Business & Retail" more="/projects?category=commercial" bg="section-blue">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hp.commercial_projects.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        </Section>
      )}

      {/* RTMI — Ready to Move In projects (max 6) */}
      {(hp.rtmi_projects || []).length > 0 && (
        <Section title="RTMI Projects" eyebrow="Ready to Move In" more="/rtmi" moreLabel="View All RTMI Projects" testid="rtmi-projects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(hp.rtmi_projects || []).slice(0, 6).map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        </Section>
      )}

      {/* Investor Gallery */}
      {hp.investor_properties.length > 0 && (
        <Section title="Investor Gallery" eyebrow="High-yield picks" more="/properties?category=commercial">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hp.investor_properties.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        </Section>
      )}

      {/* Best Resale Properties */}
      {hp.best_resale.length > 0 && (
        <Section title="Best Ready to Move Properties" eyebrow="Ready to move · Resale" more="/properties?listing_type=sale" bg="section-blue">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hp.best_resale.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        </Section>
      )}

      {/* Landmark Developers — top 6 with logo fallback */}
      {hp.top_developers.length > 0 && (
        <Section title="Landmark Developers" eyebrow="Trusted names" more="/developers" testid="landmark-developers">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {hp.top_developers.map(d => (
              <Link key={d.id} to={`/developer/${d.slug}`} data-testid={`developer-${d.slug}`} className="card-premium p-4 text-center group">
                <DevLogo d={d} />
                <div className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{d.name}</div>
                <div className="text-xs text-slate-500 mt-1">{d.total_projects} projects</div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* AI callout */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0"><Sparkle size={28} weight="fill" className="text-white" /></div>
              <div>
                <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-1">AI-Powered</div>
                <div className="text-2xl font-semibold">Just tell us what you're looking for.</div>
                <div className="text-sm text-blue-100 mt-1">"2 BHK under 80 lakh in Dombivli East with parking"</div>
              </div>
            </div>
            <Link to="/ai-search" className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md whitespace-nowrap">Try AI Search <ArrowRight size={16} weight="bold" /></Link>
          </div>
        </div>
      </section>

      {/* Share Your Requirement */}
      <section data-testid="share-requirement-section" className="section-blue py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Concierge Desk</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">Share Your Requirement</h2>
            <p className="text-slate-600 leading-relaxed max-w-md">
              Tell us what you're looking for — budget, locality, configuration. A dedicated advisor will curate matching homes and call you back within one business day.
            </p>
          </div>
          <form onSubmit={submitRequirement} data-testid="requirement-form" className="card-premium p-6 lg:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input required data-testid="req-name" value={req.name} onChange={e => setReq({ ...req, name: e.target.value })} placeholder="Full name" className="h-11 rounded-lg border-slate-200" />
              <Input required data-testid="req-phone" type="tel" value={req.phone} onChange={e => setReq({ ...req, phone: e.target.value })} placeholder="Mobile" className="h-11 rounded-lg border-slate-200" />
            </div>
            <Input data-testid="req-email" type="email" value={req.email} onChange={e => setReq({ ...req, email: e.target.value })} placeholder="Email (optional)" className="h-11 rounded-lg border-slate-200" />
            <Textarea data-testid="req-message" rows={3} value={req.message} onChange={e => setReq({ ...req, message: e.target.value })} placeholder="e.g. 2 BHK in Thane West under ₹1 Cr, ready to move…" className="rounded-lg border-slate-200" />
            <button type="submit" disabled={sending} data-testid="req-submit" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 transition-colors">
              <PaperPlaneTilt size={16} weight="bold" /> {sending ? "Sending…" : "Submit Requirement"}
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px 300px at 20% 30%, rgba(59, 130, 246, 0.4), transparent), radial-gradient(500px 300px at 80% 70%, rgba(37, 99, 235, 0.3), transparent)" }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Have a property to sell or rent?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">List your property free and reach 50,000+ verified buyers across MMR.</p>
          <Link to="/post-property" data-testid="cta-list-property" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white hover:bg-blue-400 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/25">List Property Free <ArrowRight size={16} weight="bold" /></Link>
        </div>
      </section>
    </div>
  );
}

function DevLogo({ d }) {
  const [err, setErr] = useState(false);
  if (!d.logo || err) {
    return (
      <div className="w-full aspect-square rounded-lg mb-3 bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold" aria-hidden="true">
        {(d.name || "D").trim()[0].toUpperCase()}
      </div>
    );
  }
  return <img src={d.logo} alt={d.name} loading="lazy" onError={() => setErr(true)} className="w-full aspect-square object-cover rounded-lg mb-3" />;
}


function Section({ eyebrow, title, more, moreLabel = "Check more", bg = "", testid, children }) {
  return (
    <section className={`${bg} py-16 lg:py-20`} data-testid={testid}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">{eyebrow}</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
          </div>
          {more && <Link to={more} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">{moreLabel} <ArrowRight size={14} /></Link>}
        </div>
        {children}
      </div>
    </section>
  );
}
