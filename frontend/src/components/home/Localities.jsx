import { Link } from "react-router-dom";
import { TrendUp, ArrowUpRight } from "@phosphor-icons/react";
import Reveal from "./Reveal";

const META = {
  mumbai: { trend: "+8.4%", note: "Metro 3 · Coastal Road" },
  thane: { trend: "+11.2%", note: "Pokhran Rd corridor" },
  "navi-mumbai": { trend: "+13.6%", note: "MTHL · Airport" },
  dombivli: { trend: "+9.8%", note: "Metro 12 upcoming" },
  kalyan: { trend: "+10.4%", note: "KDMC township belt" },
};

export default function Localities({ cities }) {
  if (!cities?.length) return null;
  return (
    <section data-testid="localities-explorer-section" className="py-24 sm:py-32 bg-[#0B0C0E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <Reveal className="mb-14">
          <div className="lux-overline mb-4">MICRO-MARKETS</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight max-w-2xl">
            Choose your <span className="italic text-[#E6C665]">coordinates.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {cities.map((c, i) => {
            const m = META[c.slug] || { trend: "+8.0%", note: "MMR growth zone" };
            return (
              <Reveal key={c.slug} delay={i * 0.08} className={i === 0 ? "col-span-2 lg:col-span-1" : ""}>
                <Link
                  to={`/location/${c.slug}`}
                  data-testid={`locality-card-${c.slug}`}
                  className="group block relative overflow-hidden rounded-3xl border border-amber-500/15 aspect-[4/5] transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50"
                >
                  {c.image && <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/95 via-[#0B0C0E]/40 to-[#0B0C0E]/10" />
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-amber-500/40 flex items-center justify-center text-[#E6C665] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <ArrowUpRight size={14} weight="bold" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <div className="font-display text-2xl text-[#F7F5F0]">{c.name}</div>
                    <div className="font-spacemono text-[10px] text-stone-400 mt-1">{c.count} RESIDENCES</div>
                    <div className="flex items-center gap-1.5 mt-3 font-spacemono text-[10px] text-[#E6C665]">
                      <TrendUp size={12} weight="bold" /> {m.trend} YOY · {m.note.toUpperCase()}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
