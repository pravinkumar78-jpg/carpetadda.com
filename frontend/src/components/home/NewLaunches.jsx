import { Link } from "react-router-dom";
import { MapPin, Buildings, Calendar, ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import Reveal from "./Reveal";

const STATUS_LABEL = { under_construction: "UNDER CONSTRUCTION", new_launch: "PRE-LAUNCH OFFER", ready: "READY TO MOVE" };

export default function NewLaunches({ projects }) {
  if (!projects?.length) return null;
  return (
    <section data-testid="new-launches-section" className="py-24 sm:py-32 bg-[#121418] border-y border-amber-500/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_85%_15%,rgba(212,175,55,0.06),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
        <Reveal className="flex items-end justify-between flex-wrap gap-6 mb-14">
          <div>
            <div className="lux-overline mb-4">NEW LAUNCHES</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight">
              Towers that will define <span className="italic text-[#E6C665]">the skyline.</span>
            </h2>
          </div>
          <Link to="/projects" className="lux-btn-ghost text-xs px-6 py-3 font-cinzel tracking-[0.15em] uppercase" data-testid="new-launches-view-all">
            All Projects <ArrowUpRight size={14} weight="bold" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {projects.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <div data-testid="project-card-item" className="spotlight-card lux-card overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                }}
              >
                <Link to={`/project/${p.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                  <img src={p.images?.[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/90 via-[#0B0C0E]/20 to-transparent" />
                  <span className="absolute top-4 left-4 font-spacemono text-[9px] tracking-[0.2em] bg-[#0B0C0E]/80 backdrop-blur border border-amber-500/30 text-[#E6C665] px-3 py-1.5 rounded-full">
                    {STATUS_LABEL[p.construction_status] || "NEW LAUNCH"}
                  </span>
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl lg:text-3xl text-[#F7F5F0] tracking-tight">{p.name}</h3>
                      <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-[#D4AF37]" /> {p.location}, {p.city}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="lux-overline !text-[9px] text-stone-500">STARTING</div>
                      <div className="font-spacemono text-lg text-[#E6C665]">{formatINR(p.price_from)}</div>
                    </div>
                  </div>
                </Link>
                <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-5 text-xs text-stone-400 font-spacemono">
                    <span className="flex items-center gap-1.5"><Buildings size={14} className="text-[#D4AF37]" /> {p.total_units} UNITS</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#D4AF37]" /> {p.possession_date}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={p.brochure_url || "#"} target="_blank" rel="noopener" data-testid="project-btn-download-brochure" className="lux-btn-ghost text-[11px] px-4 py-2.5 font-cinzel tracking-[0.15em] uppercase">
                      <ArrowDownRight size={13} /> Brochure
                    </a>
                    <Link to={`/project/${p.slug}`} data-testid="project-btn-view-details" className="lux-btn-gold text-[11px] px-4 py-2.5 font-cinzel tracking-[0.15em] uppercase">View Project</Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
