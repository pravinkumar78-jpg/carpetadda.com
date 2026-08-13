import { Link } from "react-router-dom";
import { MapPin, Buildings, Calendar, ArrowRight } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

export default function ProjectCard({ p }) {
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
        <div className="text-blue-600 text-sm font-medium flex items-center gap-1 pt-1 group-hover:gap-2 transition-all">View Project <ArrowRight size={14} /></div>
      </div>
    </Link>
  );
}
