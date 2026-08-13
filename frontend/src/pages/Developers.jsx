import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Buildings, ArrowRight } from "@phosphor-icons/react";

export default function Developers() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/developers").then(r => setItems(r.data)); }, []);
  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Trusted Builders</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Top Developers</h1>
          <p className="text-slate-600 max-w-2xl">India's most reputed builders with a track record of on-time delivery, RERA compliance and quality craftsmanship.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(d => (
            <Link key={d.id} to={`/developer/${d.slug}`} data-testid={`developer-${d.slug}`} className="card-premium overflow-hidden group">
              <div className="img-zoom-wrapper aspect-[16/10] bg-slate-100"><img src={d.logo} alt={d.name} className="w-full h-full object-cover" /></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{d.name}</h3>
                <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Buildings size={12} className="text-blue-500" /> {d.total_projects} projects</span>
                  <span>{d.experience_years}+ years</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">{d.description}</p>
                <div className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">View Profile <ArrowRight size={14} /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
