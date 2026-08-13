import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HERO_BG = "https://images.unsplash.com/photo-1573132223210-d65883b944aa?auto=format&fit=crop&w=2000&q=85";
const FLOAT_1 = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=85";
const FLOAT_2 = "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=800&q=85";

const LINES = [
  { text: "Curated Architectural", cls: "text-[#F7F5F0]" },
  { text: "Masterpieces for", cls: "text-[#F7F5F0] italic font-normal" },
  { text: "Discerning Buyers.", cls: "gold-text" },
];

const STATS = [
  ["12,400+", "VERIFIED HOMES"],
  ["04", "LOCALITY ZONES"],
  ["99.8%", "PRICE ACCURACY"],
];

export default function Hero() {
  const nav = useNavigate();
  const ref = useRef(null);
  const [tab, setTab] = useState("sale");
  const [city, setCity] = useState("");
  const [bhk, setBhk] = useState("");
  const [budget, setBudget] = useState("");
  const [q, setQ] = useState("");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const card1X = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const card1Y = useTransform(sy, [-0.5, 0.5], [-12, 12]);
  const card2X = useTransform(sx, [-0.5, 0.5], [26, -26]);
  const card2Y = useTransform(sy, [-0.5, 0.5], [18, -18]);

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const submit = () => {
    const params = new URLSearchParams();
    if (tab === "projects") { nav("/projects"); return; }
    params.set("listing_type", tab);
    if (city) params.set("city", city);
    if (bhk) params.set("bhk", bhk);
    if (budget) params.set("price_max", budget);
    if (q) params.set("q", q);
    nav(`/properties?${params.toString()}`);
  };

  return (
    <section ref={ref} onMouseMove={onMouseMove} className="relative min-h-[100svh] flex items-center overflow-hidden bg-[#0B0C0E]" data-testid="hero-section">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <img src={HERO_BG} alt="Mumbai skyline at dusk" className="w-full h-full object-cover scale-110" />
      </motion.div>
      <div className="absolute inset-0 hero-vignette" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_75%_30%,rgba(212,175,55,0.08),transparent_60%)]" />

      <motion.div style={{ x: card1X, y: card1Y }} className="hidden xl:block absolute right-[6%] top-[16%] w-64 z-10">
        <div className="clipped-frame overflow-hidden border border-amber-500/25 shadow-2xl shadow-black/60">
          <img src={FLOAT_1} alt="Signature residence" className="w-full aspect-[4/5] object-cover" />
        </div>
        <div className="lux-overline mt-3 text-right">WORLI · SEA FACING</div>
      </motion.div>
      <motion.div style={{ x: card2X, y: card2Y }} className="hidden xl:block absolute right-[20%] bottom-[10%] w-52 z-10">
        <div className="clipped-frame overflow-hidden border border-amber-500/25 shadow-2xl shadow-black/60">
          <img src={FLOAT_2} alt="Penthouse interior" className="w-full aspect-square object-cover" />
        </div>
        <div className="lux-overline mt-3 text-right">BANDRA WEST</div>
      </motion.div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="lux-overline mb-8 flex items-center gap-3"
        >
          <span className="w-10 h-px bg-[#D4AF37]/60" />
          THE MMR REAL ESTATE ARCHIVE — MUMBAI / THANE / NAVI MUMBAI
        </motion.div>

        <h1 data-testid="hero-title" className="font-display font-bold tracking-tight leading-[1.04] text-5xl sm:text-6xl lg:text-[5.2rem] max-w-4xl">
          {LINES.map((l, i) => (
            <span key={i} className="mask-line pb-1">
              <motion.span
                className={`block ${l.cls}`}
                initial={{ y: "115%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.35 + i * 0.14, ease: [0.16, 1, 0.3, 1] }}
              >
                {l.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-7 max-w-xl text-stone-400 text-base sm:text-lg leading-relaxed font-jakarta"
        >
          Residences, penthouses and landmark towers across the Mumbai Metropolitan Region — every listing verified to the carpet square foot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05 }}
          className="mt-10 max-w-4xl rounded-3xl border border-amber-500/15 bg-[#121418]/80 backdrop-blur-xl p-5 lg:p-6 shadow-2xl shadow-black/50"
        >
          <div className="flex gap-2 mb-5">
            {[["sale", "Buy"], ["rent", "Rent"], ["projects", "New Projects"]].map(([v, l]) => (
              <button
                key={v}
                data-testid={`hero-tab-${v === "sale" ? "buy" : v}`}
                onClick={() => setTab(v)}
                className={`font-cinzel text-[11px] tracking-[0.18em] uppercase px-4 py-2 rounded-full transition-all duration-300 ${tab === v ? "bg-[#D4AF37] text-[#0B0C0E] font-semibold" : "text-stone-400 hover:text-[#E6C665] border border-amber-500/15"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-3">
            <input
              data-testid="hero-search-input-location"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Locality, project or landmark…"
              className="lux-input"
            />
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger data-testid="hero-search-select-city" className="lux-input !h-12"><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-amber-500/20 text-stone-200">
                {["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"].map(c => (
                  <SelectItem key={c} value={c} className="capitalize focus:bg-amber-500/15 focus:text-[#E6C665]">{c.replace("-", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bhk} onValueChange={setBhk}>
              <SelectTrigger data-testid="hero-search-select-bhk" className="lux-input !h-12"><SelectValue placeholder="BHK" /></SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-amber-500/20 text-stone-200">
                {["1", "2", "3", "4"].map(b => <SelectItem key={b} value={b} className="focus:bg-amber-500/15 focus:text-[#E6C665]">{b} BHK</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger data-testid="hero-search-select-budget" className="lux-input !h-12"><SelectValue placeholder="Budget" /></SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-amber-500/20 text-stone-200">
                <SelectItem value="5000000" className="focus:bg-amber-500/15 focus:text-[#E6C665]">Under ₹50 L</SelectItem>
                <SelectItem value="10000000" className="focus:bg-amber-500/15 focus:text-[#E6C665]">Under ₹1 Cr</SelectItem>
                <SelectItem value="25000000" className="focus:bg-amber-500/15 focus:text-[#E6C665]">Under ₹2.5 Cr</SelectItem>
                <SelectItem value="50000000" className="focus:bg-amber-500/15 focus:text-[#E6C665]">Under ₹5 Cr</SelectItem>
                <SelectItem value="100000000" className="focus:bg-amber-500/15 focus:text-[#E6C665]">Under ₹10 Cr</SelectItem>
              </SelectContent>
            </Select>
            <button data-testid="hero-search-submit-button" onClick={submit} className="lux-btn-gold h-12 px-6 text-sm whitespace-nowrap">
              <MagnifyingGlass size={16} weight="bold" /> Search
            </button>
          </div>
          <Link to="/ai-search" data-testid="hero-ai-search-prompt-link" className="mt-4 inline-flex items-center gap-2 text-xs text-stone-500 hover:text-[#E6C665] transition-colors font-spacemono">
            <Sparkle size={13} weight="fill" className="text-[#D4AF37]" />
            SEARCH LIKE: "3 BHK SEA VIEW IN BANDRA WEST UNDER ₹8 CR"
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="mt-12 flex flex-wrap gap-10"
        >
          {STATS.map(([v, l]) => (
            <div key={l}>
              <div className="font-spacemono text-2xl text-[#E6C665]">{v}</div>
              <div className="lux-overline mt-1 !text-[10px] text-stone-500">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 lux-overline !text-[9px] text-stone-500 flex flex-col items-center gap-2"
      >
        SCROLL
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-px h-8 bg-gradient-to-b from-[#D4AF37] to-transparent" />
      </motion.div>
    </section>
  );
}
