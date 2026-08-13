import { Link } from "react-router-dom";
import { Heart, MapPin, Bathtub, Bed, ArrowsOutSimple, WhatsappLogo, PhoneCall, SealCheck, ArrowRight } from "@phosphor-icons/react";
import { formatINR, formatArea } from "@/lib/format";
import { waPropertyMsg } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export default function PropertyCard({ p, layout = "grid" }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Please login to save properties"); return; }
    try {
      if (fav) { await api.delete(`/favorites/${p.id}`); setFav(false); toast.success("Removed from favorites"); }
      else { await api.post(`/favorites/${p.id}`); setFav(true); toast.success("Saved to favorites"); }
    } catch { toast.error("Something went wrong"); }
  };

  const price = p.listing_type === "rent" ? formatINR(p.rent) + "/mo" : formatINR(p.price);
  const wa = waPropertyMsg(p);

  if (layout === "list") {
    return (
      <Link to={`/property/${p.slug}`} data-testid={`property-card-${p.id}`} className="group grid grid-cols-1 md:grid-cols-[280px,1fr] gap-0 card-premium overflow-hidden">
        <div className="img-zoom-wrapper aspect-[4/3] md:aspect-auto md:h-full relative">
          <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {p.featured && <span className="blue-badge">Featured</span>}
            {p.rera_number && <span className="blue-badge">RERA</span>}
          </div>
        </div>
        <div className="p-6 flex flex-col justify-between">
          <div>
            {p.verified && <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mb-2"><SealCheck size={14} weight="fill" /> Verified Listing</div>}
            <h3 className="text-xl font-semibold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{p.title}</h3>
            <div className="text-sm text-slate-500 flex items-center gap-1 mb-3"><MapPin size={14} /> {p.address || p.location}</div>
            <p className="text-sm text-slate-600 line-clamp-2 mb-4">{p.description}</p>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <div className="text-2xl font-bold text-slate-900">{price}</div>
              {p.price_per_sqft && <div className="text-xs text-slate-500 font-medium">₹{p.price_per_sqft}/sq.ft.</div>}
            </div>
            <div className="flex gap-4 text-sm text-slate-600 font-medium">
              {p.bhk && <span className="flex items-center gap-1"><Bed size={16} className="text-blue-500" /> {p.bhk} BHK</span>}
              {p.bathrooms && <span className="flex items-center gap-1"><Bathtub size={16} className="text-blue-500" /> {p.bathrooms}</span>}
              {p.carpet_area && <span className="flex items-center gap-1"><ArrowsOutSimple size={16} className="text-blue-500" /> {formatArea(p.carpet_area)}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group card-premium overflow-hidden flex flex-col relative">
      <Link to={`/property/${p.slug}`} data-testid={`property-card-${p.id}`} className="block">
        <div className="img-zoom-wrapper aspect-[4/3] relative bg-slate-100">
          <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {p.featured && <span className="blue-badge">Featured</span>}
            {p.rera_number && <span className="blue-badge">RERA</span>}
          </div>
          {p.listing_type === "rent" && <span className="absolute bottom-3 left-3 text-xs bg-white/95 backdrop-blur px-2.5 py-1 rounded-md font-semibold text-slate-900 shadow-sm">For Rent</span>}
        </div>
      </Link>
      <button data-testid={`favorite-btn-${p.id}`} onClick={toggleFav} aria-label="Save to favorites" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors z-10">
        <Heart size={16} weight={fav ? "fill" : "regular"} className={fav ? "text-rose-500" : "text-slate-600"} />
      </button>
      <div className="p-5 flex-1 flex flex-col">
        <Link to={`/property/${p.slug}`} className="block">
          <h3 className="text-lg font-semibold text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{p.title}</h3>
          <div className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin size={12} /> {p.address || p.location}</div>

          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{price}</div>
              {p.price_per_sqft && <div className="text-xs text-slate-500 font-medium mt-1">₹{p.price_per_sqft}/sq.ft.</div>}
            </div>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-slate-600 font-medium border-t border-slate-100 pt-4">
            {p.bhk ? <span className="flex items-center gap-1"><Bed size={14} className="text-blue-500" /> {p.bhk} BHK</span> : <span className="text-slate-400">—</span>}
            {p.bathrooms ? <span className="flex items-center gap-1"><Bathtub size={14} className="text-blue-500" /> {p.bathrooms}</span> : <span className="text-slate-400">—</span>}
            {p.carpet_area ? <span className="flex items-center gap-1"><ArrowsOutSimple size={14} className="text-blue-500" /> {formatArea(p.carpet_area)}</span> : <span className="text-slate-400">—</span>}
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <a href={wa} target="_blank" rel="noopener" data-testid={`whatsapp-${p.id}`} className="flex items-center justify-center gap-1.5 text-xs py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors font-medium">
            <WhatsappLogo size={14} /> WhatsApp
          </a>
          <a href="tel:+918828830707" data-testid={`call-${p.id}`} className="flex items-center justify-center gap-1.5 text-xs py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            <PhoneCall size={14} /> Call
          </a>
        </div>
      </div>
    </div>
  );
}
