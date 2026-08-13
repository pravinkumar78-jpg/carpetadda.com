import { Link } from "react-router-dom";
import { MapPin, Buildings, Calendar, ArrowRight, WhatsappLogo } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import { waProjectMsg } from "@/lib/whatsapp";

export default function ProjectCard({ p, layout = "grid" }) {
  if (layout === "list") {
    return (
      <Link to={`/project/${p.slug}`} data-testid={`project-card-${p.id}`} className="group card-premium overflow-hidden flex flex-col sm:flex-row">
        <div className="img-zoom-wrapper sm:w-72 sm:flex-shrink-0 aspect-[16/10] sm:aspect-auto relative bg-slate-100">
          <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover sm:absolute sm:inset-0" loading="lazy" />
          {p.featured && <span className="absolute top-3 left-3 blue-badge">Featured</span>}
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
              <span className="flex items-center gap-1"><Buildings size={12} className="text-blue-500" /> {p.total_units} units</span>
              <span className="flex items-center gap-1"><Calendar size={12} className="text-blue-500" /> {p.possession_date}</span>
              <a href={waProjectMsg(p)} target="_blank" rel="noopener" data-testid={`project-wa-${p.id}`} aria-label={`WhatsApp about ${p.name}`}
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors">
                <WhatsappLogo size={14} weight="fill" />
              </a>
            </div>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link to={`/project/${p.slug}`} data-testid={`project-card-${p.id}`} className="group card-premium overflow-hidden flex flex-col">
      <div className="img-zoom-wrapper aspect-[16/10] relative bg-slate-100">
        <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent p-5 pt-16 text-white">
          <div className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold mb-1">{(p.construction_status || "").replace("_", " ")}</div>
          <h3 className="text-xl font-semibold leading-tight">{p.name}</h3>
        </div>
        {p.featured && <span className="absolute top-3 left-3 blue-badge">Featured</span>}
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
          <span className="flex items-center gap-1"><Buildings size={12} className="text-blue-500" /> {p.total_units} units</span>
          <span className="flex items-center gap-1"><Calendar size={12} className="text-blue-500" /> {p.possession_date}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">View Project <ArrowRight size={14} /></div>
          <a href={waProjectMsg(p)} target="_blank" rel="noopener" data-testid={`project-wa-${p.id}`} aria-label={`WhatsApp about ${p.name}`}
            onClick={e => e.stopPropagation()}
            className="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors">
            <WhatsappLogo size={15} weight="fill" />
          </a>
        </div>
      </div>
    </Link>
  );
}
