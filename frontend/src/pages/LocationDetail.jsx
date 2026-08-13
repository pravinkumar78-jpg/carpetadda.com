import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/ProjectCard";
import { MapPin } from "@phosphor-icons/react";

export default function LocationDetail() {
  const { slug } = useParams();
  const [loc, setLoc] = useState(null);
  const [props, setProps] = useState([]);
  const [projs, setProjs] = useState([]);

  useEffect(() => {
    api.get(`/locations/${slug}`).then(r => setLoc(r.data)).catch(() => setLoc(false));
    api.get(`/properties?city=${slug}&page_size=8`).then(r => setProps(r.data.items || []));
    api.get(`/properties?location=${slug}&page_size=8`).then(r => { if (r.data.items?.length) setProps(r.data.items); });
    api.get(`/projects?city=${slug}&page_size=6`).then(r => setProjs(r.data.items || []));
    window.scrollTo(0, 0);
  }, [slug]);

  if (loc === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Location not found</h1></div>;
  if (!loc) return <div className="p-20 text-center text-slate-500">Loading…</div>;

  return (
    <div>
      <section className="relative h-[45vh] min-h-[350px]">
        <img src={loc.hero_image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 h-full flex flex-col justify-end pb-12 text-white">
          <div className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/90 text-white w-fit mb-4 uppercase tracking-wider"><MapPin size={12} /> {loc.type}</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{loc.name}</h1>
          <p className="text-white/85 mt-3 max-w-2xl">{loc.description}</p>
          <div className="flex gap-6 mt-4 text-sm text-white/85">
            <span><strong className="text-white">{loc.properties_count}</strong> properties</span>
            <span><strong className="text-white">{loc.projects_count}</strong> projects</span>
          </div>
        </div>
      </section>
      <section className="section-blue py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Properties in {loc.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{props.map(p => <PropertyCard key={p.id} p={p} />)}</div>
          {props.length === 0 && <div className="text-slate-500 bg-white rounded-xl border border-slate-200 p-8 text-center">No properties yet in this location.</div>}
        </div>
      </section>
      {projs.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Projects in {loc.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{projs.map(p => <ProjectCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
