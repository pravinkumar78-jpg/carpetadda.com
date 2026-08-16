import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import { HouseLine } from "@phosphor-icons/react";

export default function Rtmi() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Ready to Move In Projects | CarpetAdda";
    setLoading(true);
    api.get("/projects?construction_status=ready&page_size=60")
      .then(r => { setItems(r.data.items || []); setTotal(r.data.total || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">RTMI — Ready to Move In</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3" data-testid="rtmi-title">Ready to Move In Projects</h1>
          <p className="text-slate-600 max-w-2xl">Completed projects with possession available now — no construction wait, no delay risk. Move in as soon as you buy.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10" data-testid="rtmi-list">
        <div className="text-sm text-slate-600 mb-6" data-testid="rtmi-count">{loading ? "Loading…" : `${total} ready-to-move project${total === 1 ? "" : "s"}`}</div>
        {!loading && items.length === 0 ? (
          <div className="card-premium p-10 text-center">
            <HouseLine size={40} className="text-slate-300 mx-auto mb-3" />
            <div className="font-semibold text-slate-900 mb-1">No ready-to-move projects right now</div>
            <div className="text-sm text-slate-500">New completions are added regularly — check back soon.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
