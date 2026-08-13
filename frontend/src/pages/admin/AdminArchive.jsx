import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

export default function AdminArchive() {
  const [props, setProps] = useState([]);
  const [projs, setProjs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pr, pj] = await Promise.all([
        api.get("/admin/properties?status=archived&page_size=100"),
        api.get("/admin/projects?status=archived&page_size=100"),
      ]);
      setProps(pr.data.items || []);
      setProjs(pj.data.items || []);
    } catch { toast.error("Failed to load archive"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const restore = async (kind, id) => {
    try {
      await api.put(`/admin/${kind}/${id}/restore`);
      toast.success("Restored to active listings");
      load();
    } catch { toast.error("Restore failed"); }
  };

  return (
    <div data-testid="admin-archive">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Archive</h2>
        <p className="text-sm text-slate-500">Archived properties and projects are hidden from the site. Restore brings them back live.</p>
      </div>

      {loading && <div className="text-slate-500 py-10 text-center">Loading…</div>}

      {!loading && (
        <div className="space-y-8">
          <ArchiveTable
            title="Archived Properties"
            rows={props}
            testid="archive-properties"
            cols={["Property", "Price", "Location"]}
            render={(r) => [r.title, formatINR(r.listing_type === "rent" ? r.rent : r.price), `${r.location?.replace("-", " ")}, ${r.city}`]}
            onRestore={(id) => restore("properties", id)}
          />
          <ArchiveTable
            title="Archived Projects"
            rows={projs}
            testid="archive-projects"
            cols={["Project", "Price Range", "Location"]}
            render={(r) => [r.name, `${formatINR(r.price_from)} – ${formatINR(r.price_to)}`, `${r.location?.replace("-", " ")}, ${r.city}`]}
            onRestore={(id) => restore("projects", id)}
          />
        </div>
      )}
    </div>
  );
}

function ArchiveTable({ title, rows, cols, render, onRestore, testid }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title} <span className="text-slate-400 font-normal">({rows.length})</span></h3>
      <div className="card-premium overflow-hidden" data-testid={testid}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                {cols.map(c => <th key={c} className="px-4 py-3 text-left font-semibold">{c}</th>)}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-slate-500">Nothing archived.</td></tr>}
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  {render(r).map((cell, i) => <td key={i} className="px-4 py-3 text-slate-700 capitalize">{cell}</td>)}
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onRestore(r.id)} data-testid={`restore-${r.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
                      <ArrowCounterClockwise size={13} weight="bold" /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
