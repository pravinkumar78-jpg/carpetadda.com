import { Link } from "react-router-dom";
import { Star, WhatsappLogo, ArrowUpRight } from "@phosphor-icons/react";
import { waAgentMsg } from "@/lib/whatsapp";
import Reveal from "./Reveal";

export default function Directory({ developers, agents, testimonials }) {
  return (
    <section data-testid="directory-section" className="py-24 sm:py-32 bg-[#0B0C0E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <Reveal className="flex items-end justify-between flex-wrap gap-6 mb-14">
          <div>
            <div className="lux-overline mb-4">THE DIRECTORY</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight">
              Names behind <span className="italic text-[#E6C665]">the addresses.</span>
            </h2>
          </div>
          <Link to="/developers" className="lux-btn-ghost text-xs px-6 py-3 font-cinzel tracking-[0.15em] uppercase">
            All Developers <ArrowUpRight size={14} weight="bold" />
          </Link>
        </Reveal>

        {developers?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {developers.map((d, i) => (
              <Reveal key={d.id} delay={i * 0.06}>
                <Link to={`/developer/${d.slug}`} data-testid="developer-logo-item" className="lux-card p-5 block text-center group transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/50">
                  <div className="clipped-frame overflow-hidden mb-4">
                    <img src={d.logo} alt={d.name} loading="lazy" className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-108 group-hover:scale-110" />
                  </div>
                  <div className="font-display text-base text-[#F7F5F0] line-clamp-1 group-hover:text-[#E6C665] transition-colors">{d.name}</div>
                  <div className="font-spacemono text-[10px] text-stone-500 mt-1">{d.total_projects} PROJECTS</div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {agents?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {agents.slice(0, 4).map((a, i) => (
              <Reveal key={a.id} delay={i * 0.08}>
                <div data-testid="agent-card-item" className="lux-card p-5 flex items-center gap-4 transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/50">
                  <img src={a.photo} alt={a.name} loading="lazy" className="w-14 h-14 rounded-full object-cover border border-amber-500/30" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base text-[#F7F5F0] truncate">{a.name}</div>
                    <div className="flex items-center gap-1 text-[10px] font-spacemono text-[#E6C665] mt-0.5">
                      <Star size={11} weight="fill" /> {a.rating?.toFixed(1)} · {a.total_listings} LISTINGS
                    </div>
                  </div>
                  <a href={waAgentMsg(a)} target="_blank" rel="noopener" data-testid="agent-btn-contact" aria-label={`Contact ${a.name} via CarpetAdda WhatsApp`}
                    className="w-9 h-9 rounded-full border border-amber-500/30 flex items-center justify-center text-[#E6C665] hover:bg-amber-500/10 transition-colors shrink-0">
                    <WhatsappLogo size={16} />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {testimonials?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {testimonials.slice(0, 3).map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <div className="lux-card p-6">
                  <div className="flex gap-1 text-[#D4AF37] mb-4">{Array.from({ length: Math.round(t.rating) }).map((_, j) => <Star key={j} size={13} weight="fill" />)}</div>
                  <p className="text-stone-300 leading-relaxed text-sm font-jakarta">"{t.review}"</p>
                  <div className="flex items-center gap-3 pt-5 mt-5 border-t border-amber-500/10">
                    {t.photo && <img src={t.photo} alt={t.name} loading="lazy" className="w-10 h-10 rounded-full object-cover border border-amber-500/30" />}
                    <div>
                      <div className="text-sm font-medium text-[#F7F5F0]">{t.name}</div>
                      <div className="text-[11px] text-stone-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
