import { Link } from "react-router-dom";
import { Heart, MapPin, Calendar, ArrowRight, WhatsappLogo } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import { waProjectMsg } from "@/lib/whatsapp";
import { useAuth } from "@/lib/auth";
import { useFavorite } from "@/lib/favorites";
import { toast } from "sonner";

export default function ProjectCard({ p, layout = "grid" }) {
  const { user } = useAuth();
  const [fav, toggleFavRaw] = useFavorite(p.id, "project");

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Please login to save projects"); return; }
    try {
      const on = await toggleFavRaw();
      toast.success(on ? "Saved to favorites" : "Removed from favorites");
    } catch { toast.error("Something went wrong"); }
  };

  if (layout === "list") {
    return (
      <Link to={`/project/${p.slug}`} data-testid={`project-card-${p.id}`} className="group card-premium overflow-hidden flex flex-col sm:flex-row">
        <div className="img-zoom-wrapper sm:w-72 sm:flex-shrink-0 aspect-[16/10] sm:aspect-auto relative bg-slate-100">
          <img src={p.main_image || p.images?.[0]} alt={p.name} className="w-full h-full object-cover sm:absolute sm:inset-0" loading="lazy"
            onError={e => { const alt = (p.images || []).find(u => u && u !== e.currentTarget.getAttribute("src")); e.currentTarget.onerror = null; if (alt) e.currentTarget.src = alt; else e.currentTarget.style.opacity = "0"; }} />
          {p.featured && <span className="absolute top-3 left-3 blue-badge">Featured</span>}
          <button type="button" data-testid={`favorite-project-${p.id}`} onClick={toggleFav} aria-label="Save project to favorites" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors z-10">
            <Heart size={16} weight={fav ? "fill" : "regular"} className={fav ? "text-rose-500" : "text-slate-600"} />
          </button>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-blue-600 font-semibold mb-1">{(p.construction_status || "").replace("_", " ")}</div>
            <h3 className="text-xl font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1.5"><MapPin size={12} /> {p.location}, {p.city}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(p.configurations || []).slice(0, 5).map(c => (
              <span key={c} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{c}</span>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-500">Starting</span>
              <span className="text-xl font-bold text-slate-900">{formatINR(p.price_from)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">

              <span className="flex items-center gap-1"><Calendar size={12} className="text-blue-500" /> {p.possession_date}</span>
              <button type="button" data-testid={`project-wa-${p.id}`} aria-label={`WhatsApp about ${p.name}`}
                onClick={e => { e.stopPropagation(); e.preventDefault(); window.open(waProjectMsg(p), "_blank", "noopener"); }}
                className="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors">
                <WhatsappLogo size={14} weight="fill" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link to={`/project/${p.slug}`} data-testid={`project-card-${p.id}`} className="group card-premium overflow-hidden flex flex-col">
      <div className="img-zoom-wrapper aspect-[16/10] relative bg-slate-100">
        <img src={p.main_image || p.images?.[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy"
          onError={e => { const alt = (p.images || []).find(u => u && u !== e.currentTarget.getAttribute("src")); e.currentTarget.onerror = null; if (alt) e.currentTarget.src = alt; else e.currentTarget.style.opacity = "0"; }} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent p-5 pt-16 text-white">
          <div className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold mb-1">{(p.construction_status || "").replace("_", " ")}</div>
          <h3 className="text-xl font-semibold leading-tight">{p.name}</h3>
        </div>
        {p.featured && <span className="absolute top-3 left-3 blue-badge">Featured</span>}
        <button type="button" data-testid={`favorite-project-${p.id}`} onClick={toggleFav} aria-label="Save project to favorites" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors z-10">
          <Heart size={16} weight={fav ? "fill" : "regular"} className={fav ? "text-rose-500" : "text-slate-600"} />
        </button>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {p.location}, {p.city}</div>
        <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs text-slate-500">Starting</span>
          <span className="text-2xl font-bold text-slate-900">{formatINR(p.price_from)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(p.configurations || []).slice(0, 4).map(c => (
            <span key={c} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{c}</span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1"><Calendar size={12} className="text-blue-500" /> {p.possession_date}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">View Project <ArrowRight size={14} /></div>
          <button type="button" data-testid={`project-wa-${p.id}`} aria-label={`WhatsApp about ${p.name}`}
            onClick={e => { e.stopPropagation(); e.preventDefault(); window.open(waProjectMsg(p), "_blank", "noopener"); }}
            className="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors">
            <WhatsappLogo size={15} weight="fill" />
          </button>
        </div>
      </div>
    </Link>
  );
}
