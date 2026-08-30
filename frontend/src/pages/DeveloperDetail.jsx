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
  const hasProjects = (d.projects || []).length > 0;
  const hasProperties = (d.properties || []).length > 0;
  return (
    <div>
      <section className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row gap-8 items-start">
          {d.logo
            ? <img src={d.logo} alt={d.name} className="w-32 h-32 rounded-xl object-cover border border-slate-200" />
            : <div className="w-32 h-32 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-5xl font-bold border border-slate-200" aria-hidden="true">{(d.name || "D").trim()[0].toUpperCase()}</div>}
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Developer Profile</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{d.name}</h1>
            <div className="flex gap-6 mt-3 text-sm flex-wrap">
              <span className="flex items-center gap-1 text-slate-700" data-testid="developer-project-count"><Buildings size={14} className="text-blue-500" /> {d.total_projects} projects · {d.total_properties ?? 0} listings</span>
              {d.experience_years ? <span className="flex items-center gap-1 text-slate-700"><Calendar size={14} className="text-blue-500" /> {d.experience_years}+ years</span> : null}
            </div>
            {d.description && <p className="text-slate-700 mt-4 max-w-2xl leading-relaxed">{d.description}</p>}
          </div>
        </div>
      </section>
      {hasProjects && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Projects by {d.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{d.projects.map(p => <ProjectCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {hasProperties && (
        <section className="section-blue py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Properties by {d.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{d.properties.map(p => <PropertyCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}
      {!hasProjects && !hasProperties && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 text-center" data-testid="developer-no-listings">
          <p className="text-slate-500">No live listings from {d.name} right now — check back soon.</p>
        </section>
      )}
    </div>
  );
}
