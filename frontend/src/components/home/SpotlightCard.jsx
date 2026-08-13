import { Link } from "react-router-dom";
import { MapPin, Bed, Bathtub, ArrowsOutSimple, CalendarBlank } from "@phosphor-icons/react";
import { formatINR, formatArea } from "@/lib/format";

export default function SpotlightCard({ p }) {
  const price = p.listing_type === "rent" ? `${formatINR(p.rent)}/mo` : formatINR(p.price);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      data-testid="property-card-item"
      onMouseMove={onMove}
      className="spotlight-card lux-card overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/60"
    >
      <Link to={`/property/${p.slug}`} data-testid="property-card-btn-view" className="block">
        <div className="clipped-frame relative aspect-[4/3] overflow-hidden bg-[#1A1D24]">
          <img src={p.images?.[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/80 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {p.rera_number && <span className="font-spacemono text-[9px] tracking-[0.2em] bg-[#0B0C0E]/80 backdrop-blur border border-amber-500/30 text-[#E6C665] px-2.5 py-1 rounded-full">RERA</span>}
            {p.listing_type === "rent" && <span className="font-spacemono text-[9px] tracking-[0.2em] bg-[#0B0C0E]/80 backdrop-blur border border-amber-500/30 text-stone-300 px-2.5 py-1 rounded-full">FOR RENT</span>}
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <div data-testid="property-card-price" className="font-spacemono text-xl text-[#E6C665]">{price}</div>
            {p.price_per_sqft && <div className="font-spacemono text-[10px] text-stone-400 mt-0.5">₹{p.price_per_sqft}/SQ.FT.</div>}
          </div>
        </div>
      </Link>
      <div className="p-5">
        <Link to={`/property/${p.slug}`} className="block">
          <h3 className="font-display text-xl text-[#F7F5F0] leading-snug line-clamp-1 group-hover:text-[#E6C665] transition-colors">{p.title}</h3>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1.5"><MapPin size={12} className="text-[#D4AF37]" /> {p.address || p.location}</div>
        </Link>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-500/10 text-xs text-stone-400 font-spacemono">
          {p.bhk ? <span className="flex items-center gap-1.5"><Bed size={14} className="text-[#D4AF37]" /> {p.bhk} BHK</span> : <span>—</span>}
          {p.bathrooms ? <span className="flex items-center gap-1.5"><Bathtub size={14} className="text-[#D4AF37]" /> {p.bathrooms}</span> : <span>—</span>}
          {p.carpet_area ? <span className="flex items-center gap-1.5"><ArrowsOutSimple size={14} className="text-[#D4AF37]" /> {formatArea(p.carpet_area)}</span> : <span>—</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Link to={`/property/${p.slug}`} className="lux-btn-ghost text-[11px] py-2.5 font-cinzel tracking-[0.15em] uppercase">View Details</Link>
          <Link to={`/property/${p.slug}`} data-testid="property-card-btn-schedule" className="lux-btn-gold text-[11px] py-2.5 font-cinzel tracking-[0.15em] uppercase">
            <CalendarBlank size={13} weight="bold" /> Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
