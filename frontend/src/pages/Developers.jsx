import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Buildings, ArrowRight } from "@phosphor-icons/react";

export default function Developers() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/developers").then(r => setItems(r.data)).catch(() => setItems([])); }, []);
  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Trusted Builders</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Developers</h1>
          <p className="text-slate-600 max-w-2xl">Reputed builders with a track record of on-time delivery, RERA compliance and quality craftsmanship.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {items === null && <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>}
        {items?.length === 0 && <div className="text-sm text-slate-500 py-12 text-center">No developers listed yet.</div>}
        {/* Compact, consistent developer cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(items || []).map(d => (
            <Link key={d.id} to={`/developer/${d.slug}`} data-testid={`developer-${d.slug}`} className="card-premium p-4 text-center group">
              <DevAvatar d={d} />
              <div className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{d.name}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                <Buildings size={11} className="text-blue-500" /> {d.total_projects} projects · {d.total_properties ?? 0} listings
              </div>
              {d.top_developer && <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Top Developer</span>}
              <div className="mt-2 text-blue-600 text-xs font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">View Profile <ArrowRight size={12} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function DevAvatar({ d }) {
  const [err, setErr] = useState(false);
  if (!d.logo || err) {
    return (
      <div className="w-16 h-16 mx-auto rounded-xl mb-3 bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold" aria-hidden="true">
        {(d.name || "D").trim()[0].toUpperCase()}
      </div>
    );
  }
  return <img src={d.logo} alt={d.name} loading="lazy" onError={() => setErr(true)} className="w-16 h-16 mx-auto object-cover rounded-xl mb-3 border border-slate-200" />;
}
