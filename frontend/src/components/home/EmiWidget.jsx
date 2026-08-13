import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Slider } from "@/components/ui/slider";
import Reveal from "./Reveal";

export default function EmiWidget() {
  const [lakhs, setLakhs] = useState(80);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { emi, principalShare } = useMemo(() => {
    const P = lakhs * 100000;
    const r = rate / 1200;
    const n = years * 12;
    const e = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = e * n;
    return { emi: Math.round(e), principalShare: Math.round((P / total) * 100) };
  }, [lakhs, rate, years]);

  const ctrls = [
    { label: "LOAN AMOUNT", val: lakhs >= 100 ? `₹${(lakhs / 100).toFixed(1)} Cr` : `₹${lakhs} L`, min: 10, max: 1000, step: 5, v: lakhs, set: setLakhs, tid: "emi-slider-amount" },
    { label: "INTEREST RATE", val: `${rate.toFixed(2)} %`, min: 6, max: 12, step: 0.05, v: rate, set: setRate, tid: "emi-slider-rate" },
    { label: "TENURE", val: `${years} YRS`, min: 5, max: 30, step: 1, v: years, set: setYears, tid: "emi-slider-tenure" },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#121418] border-y border-amber-500/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_10%_80%,rgba(212,175,55,0.05),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <Reveal>
          <div className="lux-overline mb-4">AFFORDABILITY</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#F7F5F0] tracking-tight leading-tight">
            Know your number <span className="italic text-[#E6C665]">before you fall in love.</span>
          </h2>
          <p className="mt-5 text-stone-400 leading-relaxed max-w-md text-sm sm:text-base">
            A quiet preview of our full EMI suite — drag the sliders and watch your monthly outgo compose itself in real time.
          </p>
          <Link to="/emi-calculator" data-testid="emi-btn-full-calculator" className="lux-btn-gold text-xs px-7 py-3.5 mt-8 font-cinzel tracking-[0.15em] uppercase">
            Full Calculator <ArrowUpRight size={14} weight="bold" />
          </Link>
        </Reveal>

        <Reveal delay={0.15}>
          <div data-testid="emi-calculator-widget" className="lux-card p-7 lg:p-9">
            {ctrls.map((c) => (
              <div key={c.tid} className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <span className="lux-overline !text-[10px] text-stone-500">{c.label}</span>
                  <span className="font-spacemono text-sm text-[#E6C665]">{c.val}</span>
                </div>
                <Slider data-testid={c.tid} value={[c.v]} min={c.min} max={c.max} step={c.step} onValueChange={([v]) => c.set(v)} className="[&_[role=slider]]:bg-[#D4AF37] [&_[role=slider]]:border-[#D4AF37] [&_.bg-primary]:bg-[#D4AF37]" />
              </div>
            ))}
            <div className="mt-8 pt-7 border-t border-amber-500/10">
              <div className="lux-overline !text-[10px] text-stone-500">MONTHLY EMI</div>
              <div data-testid="emi-result-monthly-value" className="font-spacemono text-4xl text-[#F7F5F0] mt-2">
                ₹{emi.toLocaleString("en-IN")}<span className="text-sm text-stone-500">/MO</span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-[#1A1D24] overflow-hidden flex">
                <motion.div className="h-full bg-gradient-to-r from-[#BF953F] to-[#D4AF37]" animate={{ width: `${principalShare}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                <div className="h-full bg-[#C85A32] flex-1" />
              </div>
              <div className="flex justify-between mt-2 font-spacemono text-[10px] text-stone-500">
                <span>PRINCIPAL {principalShare}%</span>
                <span>INTEREST {100 - principalShare}%</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
