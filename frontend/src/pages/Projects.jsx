import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";

export default function Projects() {
  const [sp] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/projects?${sp.toString()}`).then(r => setItems(r.data.items || [])).finally(() => setLoading(false));
  }, [sp]);

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">New Launches</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Signature Projects</h1>
          <p className="text-slate-600 max-w-2xl">Handpicked new-launch developments from India's most trusted builders — RERA verified, on-time delivery.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(p => <ProjectCard key={p.id} p={p} />)}
        </div>
        {loading && <div className="text-center py-10 text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="text-center py-20 text-slate-500">No projects yet.</div>}
      </div>
    </div>
  );
}
