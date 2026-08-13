import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { Star, PhoneCall, WhatsappLogo, EnvelopeSimple, ArrowRight, MapPin } from "@phosphor-icons/react";
import { waAgentMsg } from "@/lib/whatsapp";

export function Agents() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/agents").then(r => setItems(r.data)); }, []);
  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Vetted Professionals</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Top Agents</h1>
          <p className="text-slate-600 max-w-2xl">RERA-registered agents with deep local expertise across Mumbai MMR.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(a => (
            <div key={a.id} data-testid={`agent-${a.slug}`} className="card-premium p-6 flex gap-4 group relative">
              <Link to={`/agent/${a.slug}`} className="flex gap-4 flex-1 min-w-0">
                <img src={a.photo} alt={a.name} className="w-24 h-24 rounded-full object-cover border-2 border-blue-100" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{a.name}</h3>
                  <div className="text-xs text-slate-500 mb-1">{a.experience_years}+ years • {a.total_listings} listings</div>
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-medium mb-2"><Star size={14} weight="fill" /> {a.rating.toFixed(1)}</div>
                  <p className="text-sm text-slate-600 line-clamp-2">{a.bio}</p>
                </div>
              </Link>
              <a href={waAgentMsg(a)} target="_blank" rel="noopener" data-testid={`agent-wa-${a.slug}`} aria-label={`WhatsApp CarpetAdda about ${a.name}`}
                className="absolute bottom-4 right-4 p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-sm">
                <WhatsappLogo size={16} weight="fill" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgentDetail() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  useEffect(() => { api.get(`/agents/${slug}`).then(r => setA(r.data)).catch(() => setA(false)); window.scrollTo(0,0); }, [slug]);
  if (a === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Agent not found</h1></div>;
  if (!a) return <div className="p-20 text-center text-slate-500">Loading…</div>;
  return (
    <div>
      <section className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          <img src={a.photo} alt={a.name} className="w-full aspect-square object-cover rounded-2xl border border-slate-200" />
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Real Estate Agent</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{a.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-amber-500 font-medium"><Star size={16} weight="fill" /> {a.rating.toFixed(1)}</span>
              <span className="text-slate-600">{a.experience_years}+ years</span>
              <span className="text-slate-600">{a.total_listings} listings</span>
            </div>
            <p className="text-slate-700 mt-4 leading-relaxed">{a.bio}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href={`tel:${a.phone}`} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"><PhoneCall size={14}/> {a.phone}</a>
              <a href={waAgentMsg(a)} target="_blank" rel="noopener" data-testid="agent-detail-whatsapp" className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"><WhatsappLogo size={14}/> WhatsApp</a>
              {a.email && <a href={`mailto:${a.email}`} className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"><EnvelopeSimple size={14}/> Email</a>}
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Listings by {a.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(a.properties || []).map(p => <PropertyCard key={p.id} p={p} />)}</div>
      </section>
    </div>
  );
}
