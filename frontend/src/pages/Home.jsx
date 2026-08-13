import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import api from "@/lib/api";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Manifesto from "@/components/home/Manifesto";
import NewLaunches from "@/components/home/NewLaunches";
import Localities from "@/components/home/Localities";
import EmiWidget from "@/components/home/EmiWidget";
import Directory from "@/components/home/Directory";
import LeadCapture from "@/components/home/LeadCapture";
import SpotlightCard from "@/components/home/SpotlightCard";
import Reveal from "@/components/home/Reveal";

const FILTERS = [
  ["all", "All"],
  ["mumbai", "Mumbai"],
  ["thane", "Thane"],
  ["navi-mumbai", "Navi Mumbai"],
  ["kalyan", "Kalyan"],
];

export default function Home() {
  const [hp, setHp] = useState(null);
  const [agents, setAgents] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api.get("/homepage")
      .then(r => { if (!cancelled) setHp(r.data); })
      .catch(() => { if (!cancelled) setHp({ categories: [], cities: [], featured_properties: [], featured_projects: [], best_resale: [], top_developers: [], testimonials: [] }); });
    api.get("/agents").then(r => { if (!cancelled) setAgents(Array.isArray(r.data) ? r.data : r.data?.items || []); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const properties = useMemo(() => {
    if (!hp) return [];
    const seen = new Set();
    const all = [...(hp.featured_properties || []), ...(hp.best_resale || [])].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    const filtered = filter === "all" ? all : all.filter(p => p.city === filter);
    return filtered.slice(0, 6);
  }, [hp, filter]);

  if (!hp) {
    return (
      <div className="lux-body min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="gold-text font-display text-3xl italic">CarpetAdda</div>
        <div className="lux-overline text-stone-500 animate-pulse">CURATING THE ARCHIVE…</div>
      </div>
    );
  }

  return (
    <div className="lux-body grain-overlay-none">
      <Hero />
      <Marquee />

      <section data-testid="featured-properties-section" className="py-24 sm:py-32 bg-[#0B0C0E] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_90%_90%,rgba(212,175,55,0.05),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <Reveal className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <div className="lux-overline mb-4">HANDPICKED RESIDENCES</div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight">
                This week's <span className="italic text-[#E6C665]">acquisitions.</span>
              </h2>
            </div>
            <Link to="/properties" data-testid="featured-view-all" className="lux-btn-ghost text-xs px-6 py-3 font-cinzel tracking-[0.15em] uppercase">
              All Residences <ArrowUpRight size={14} weight="bold" />
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-wrap gap-2 mb-10">
            {FILTERS.map(([v, l]) => (
              <button
                key={v}
                data-testid={v === "all" ? "filter-pill-all" : `filter-pill-${v}`}
                onClick={() => setFilter(v)}
                className={`font-cinzel text-[11px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full transition-all duration-300 ${filter === v ? "bg-[#D4AF37] text-[#0B0C0E] font-semibold" : "text-stone-400 hover:text-[#E6C665] border border-amber-500/15"}`}
              >
                {l}
              </button>
            ))}
          </Reveal>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {properties.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <SpotlightCard p={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="lux-card p-12 text-center text-stone-500 font-spacemono text-sm">NO RESIDENCES IN THIS MICRO-MARKET THIS WEEK.</div>
          )}
        </div>
      </section>

      <Manifesto />
      <NewLaunches projects={hp.featured_projects} />
      <Localities cities={hp.cities} />
      <EmiWidget />
      <Directory developers={hp.top_developers} agents={agents} testimonials={hp.testimonials} />
      <LeadCapture />
    </div>
  );
}
