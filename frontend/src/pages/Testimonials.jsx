import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Star } from "@phosphor-icons/react";

export default function Testimonials() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get("/testimonials", { params: { limit: 50 } }).then(r => setItems(r.data)).catch(() => setItems([]));
    document.title = "Testimonials | CarpetAdda";
  }, []);

  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Loved by clients</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">What families say about us</h1>
          <p className="text-slate-600 mt-2 text-sm">Real reviews from buyers and tenants across the Mumbai Metropolitan Region.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12" data-testid="testimonials-page">
        {!items ? (
          <div className="text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="card-premium p-10 text-center text-slate-500">Testimonials coming soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(t => (
              <div key={t.id} data-testid={`testimonial-${t.id}`} className="card-premium p-6">
                <div className="flex gap-1 text-amber-400 mb-4">{Array.from({ length: Math.round(t.rating || 0) }).map((_, i) => <Star key={i} size={16} weight="fill" />)}</div>
                <p className="text-slate-700 leading-relaxed mb-6">"{t.review}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                  {t.photo && <img src={t.photo} alt={t.name} className="w-11 h-11 rounded-full object-cover" loading="lazy" />}
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
