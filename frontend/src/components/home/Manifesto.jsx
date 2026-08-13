import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

const CHAPTERS = [
  {
    num: "01",
    title: "True Carpet Area Verification",
    body: "Every listing is physically measured and cross-checked against RERA filings. What you see on CarpetAdda is the exact square footage you own — no inflated super built-up illusions.",
  },
  {
    num: "02",
    title: "Curated Architectural Standard",
    body: "We list fewer than one in nine properties submitted to us. Light, ventilation, structure quality and builder pedigree are scored before a home earns its place in the archive.",
  },
  {
    num: "03",
    title: "Direct Developer Transparency",
    body: "Pricing, payment plans and possession timelines come straight from the developer's desk. No hidden brokerage layers, no last-mile surprises at the negotiation table.",
  },
  {
    num: "04",
    title: "End-to-End Concierge Advisory",
    body: "From shortlisting and site visits to home loans, registration and interiors — a dedicated advisor walks with you until the keys are in your hand.",
  },
];

export default function Manifesto() {
  const [active, setActive] = useState(0);

  return (
    <section data-testid="manifesto-section" className="py-24 sm:py-32 lg:py-40 bg-[#0B0C0E] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_15%_20%,rgba(212,175,55,0.05),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
        <Reveal>
          <div className="lux-overline mb-4">THE MANIFESTO</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight max-w-2xl leading-tight">
            Four promises, <span className="italic text-[#E6C665]">etched in gold.</span>
          </h2>
        </Reveal>

        <div className="mt-16 lg:mt-20 border-t border-amber-500/10">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.num} delay={i * 0.08}>
              <button
                data-testid={`manifesto-chapter-${i + 1}`}
                onClick={() => setActive(i)}
                className={`w-full text-left py-8 lg:py-10 border-b border-amber-500/10 grid grid-cols-[auto_1fr] gap-6 lg:gap-14 items-start group transition-colors duration-500 ${active === i ? "" : "opacity-70 hover:opacity-100"}`}
              >
                <span className={`font-display font-bold tracking-tighter text-6xl sm:text-7xl lg:text-8xl leading-none transition-all duration-500 ${active === i ? "gold-text" : "text-amber-500/15 group-hover:text-amber-500/30"}`}>
                  {c.num}
                </span>
                <span>
                  <span className={`font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight transition-colors duration-500 block ${active === i ? "text-[#F7F5F0]" : "text-stone-400 group-hover:text-stone-200"}`}>
                    {c.title}
                  </span>
                  <AnimatePresence initial={false}>
                    {active === i && (
                      <motion.span
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="block overflow-hidden"
                      >
                        <span className="block pt-4 max-w-2xl text-stone-400 leading-relaxed text-sm sm:text-base font-jakarta">
                          {c.body}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
