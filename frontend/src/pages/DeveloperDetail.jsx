import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/ProjectCard";
import { Buildings, Calendar } from "@phosphor-icons/react";

export default function DeveloperDetail() {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.get(`/developers/${slug}`).then(r => setD(r.data)).catch(() => setD(false)); window.scrollTo(0, 0); }, [slug]);
  if (d === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Developer not found</h1></div>;
  if (!d) return <div className="p-20 text-center text-slate-500">Loading…</div>;
  return (
    <div>
      <section className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row gap-8 items-start">
          <img src={d.logo} alt={d.name} className="w-40 h-40 rounded-xl object-cover border border-slate-200" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Developer Profile</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{d.name}</h1>
            <div className="flex gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1 text-slate-700"><Buildings size={14} className="text-blue-500" /> {d.total_projects} projects</span>
              <span className="flex items-center gap-1 text-slate-700"><Calendar size={14} className="text-blue-500" /> {d.experience_years}+ years</span>
            </div>
            <p className="text-slate-700 mt-4 max-w-2xl leading-relaxed">{d.description}</p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Projects by {d.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(d.projects || []).map(p => <ProjectCard key={p.id} p={p} />)}</div>
      </section>
      {d.properties?.length > 0 && (
        <section className="section-blue py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{d.properties.map(p => <PropertyCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
