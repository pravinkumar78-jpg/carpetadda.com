import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, House, Buildings, ChatCircle, Heart, MagnifyingGlass, UserGear, Users, Archive, ArrowCounterClockwise, PencilSimple } from "@phosphor-icons/react";
import { AccountPanel, MyListings } from "@/components/dashboard/AccountPanel";
import { formatINR } from "@/lib/format";

// Role-based dashboards. Admin uses /admin (AdminPanel).
export function AgentDashboard() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tab, setTab] = useState("listings");

  const loadListings = () => { if (user) api.get(`/properties?owner_id=${user.id}&include_archived=true&page_size=50`).then(r => setItems(r.data.items || [])).catch(() => {}); };
  const loadLeads = () => { api.get("/leads?limit=100").then(r => setLeads(Array.isArray(r.data) ? r.data : [])).catch(() => {}); };

  useEffect(() => {
    if (!user) return;
    loadListings();
    loadLeads();
  }, [user]);

  if (!ready) return null;
  if (!user || user.role !== "agent") return <Navigate to="/login" />;

  return (
    <DashShell user={user} title="Agent Workspace" tab={tab} setTab={setTab} menu={[
      ["listings", `My Listings (${items.length})`, House],
      ["leads", `Manage Leads (${leads.length})`, ChatCircle],
      ["clients", "Clients", Users],
      ["account", "Profile & Security", UserGear],
    ]} actions={[
      { to: "/agent/list-property?category=residential", label: "List Residential", primary: true, tid: "agent-list-residential" },
      { to: "/agent/list-property?category=commercial", label: "List Commercial", tid: "agent-list-commercial" },
    ]}>

      {tab === "listings" && (
        <div className="space-y-5">
          <StatGrid stats={[["My Listings", items.length], ["Active", items.filter(p => p.status === "active").length], ["Archived", items.filter(p => p.status === "archived").length], ["Featured", items.filter(p => p.featured).length]]} />
          <MyListings items={items} onChanged={loadListings} editBase="/agent/list-property" />
        </div>
      )}

      {tab === "leads" && (
        <div className="card-premium overflow-hidden" data-testid="agent-leads">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 text-left font-semibold">Name</th><th className="px-4 py-3 text-left font-semibold">Phone</th><th className="px-4 py-3 text-left font-semibold">Source</th><th className="px-4 py-3 text-left font-semibold">Status</th></tr>
              </thead>
              <tbody>
                {leads.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No leads yet.</td></tr>}
                {leads.map(l => (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{l.name}</td>
                    <td className="px-4 py-3"><a href={`tel:${l.phone}`} className="text-blue-600">{l.phone}</a></td>
                    <td className="px-4 py-3 text-slate-500 text-xs capitalize">{(l.source || "").replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "clients" && (
        <div className="card-premium p-8 text-center text-slate-500" data-testid="agent-clients">
          Clients are your converted leads — mark a lead as "Converted" in Manage Leads to build your client book.
        </div>
      )}

      {tab === "account" && <AccountPanel user={user} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <Link to="/favorites" className="card-premium p-4 text-center text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2"><Heart size={15} /> Favorites</Link>
        <Link to="/dashboard" className="card-premium p-4 text-center text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2"><MagnifyingGlass size={15} /> Saved Searches</Link>
        <Link to="/properties" className="card-premium p-4 text-center text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2"><House size={15} /> Browse Properties</Link>
        <Link to="/compare" className="card-premium p-4 text-center text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2"><SquaresIcon /> Compare</Link>
      </div>
    </DashShell>
  );
}

export function DeveloperDashboard() {
  const { user, ready } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState("projects");

  const loadProjects = () => { if (user) api.get(`/admin/projects?page_size=100`).then(r => {
    const all = r.data.items || [];
    setProjects(all.filter(p => !p.owner_id || p.owner_id === user.id));
  }).catch(() => {}); };

  useEffect(() => { if (user) loadProjects(); }, [user]);
  if (!ready) return null;
  if (!user || user.role !== "developer") return <Navigate to="/login" />;

  const act = async (p, action) => {
    if (action === "archive" && !confirm("Archive this project? You can restore it anytime.")) return;
    try {
      await api.put(`/admin/projects/${p.id}/${action}`);
      toast.success(action === "archive" ? "Archived" : "Restored");
      loadProjects();
    } catch (err) { toast.error(err?.response?.data?.detail || "Action failed"); }
  };

  return (
    <DashShell user={user} title="Developer Workspace" tab={tab} setTab={setTab} menu={[
      ["projects", `My Projects (${projects.length})`, Buildings],
      ["account", "Profile & Security", UserGear],
    ]} actions={[
      { to: "/developer/projects/new", label: "Add Project", primary: true, tid: "dev-add-project" },
    ]}>

      {tab === "projects" && (
        <div className="space-y-5">
          <StatGrid stats={[["Projects", projects.length], ["Active", projects.filter(p => p.status === "active").length], ["Archived", projects.filter(p => p.status === "archived").length]]} />
          <div className="card-premium overflow-hidden" data-testid="dev-projects">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr><th className="px-4 py-3 text-left font-semibold">Project</th><th className="px-4 py-3 text-left font-semibold">Price Range</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody>
                  {projects.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No projects yet.</td></tr>}
                  {projects.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3"><div className="font-medium text-slate-900 line-clamp-1">{p.name}</div><div className="text-xs text-slate-500 capitalize">{p.location?.replace("-", " ")}</div></td>
                      <td className="px-4 py-3 rupee">{formatINR(p.price_from)} – {formatINR(p.price_to)}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : p.status === "archived" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/developer/projects/${p.id}/units`} data-testid={`dev-units-${p.id}`} title="Manage units" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Buildings size={14} /></Link>
                          <Link to={`/developer/projects/${p.id}/edit`} data-testid={`dev-edit-${p.id}`} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><PencilSimple size={14} /></Link>
                          {p.status === "archived"
                            ? <button onClick={() => act(p, "restore")} data-testid={`dev-restore-${p.id}`} title="Restore" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><ArrowCounterClockwise size={14} /></button>
                            : <button onClick={() => act(p, "archive")} data-testid={`dev-archive-${p.id}`} title="Archive" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Archive size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "account" && <AccountPanel user={user} />}
    </DashShell>
  );
}

export function ClientDashboard() {
  return <Navigate to="/dashboard" />;
}

function DashShell({ user, title, menu, actions = [], tab, setTab, children }) {
  return (
    <div className="min-h-screen">
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2 capitalize">{user.role.replace("_", " ")}</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Link key={a.tid} to={a.to} data-testid={a.tid} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${a.primary ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Plus size={14} weight="bold" /> {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-8 items-start">
        <aside className="card-premium p-4 h-fit lg:sticky lg:top-24">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2">Menu</div>
          <nav className="space-y-1 text-sm">
            {menu.map(([v, l, Icon]) => (
              <button key={v} onClick={() => setTab(v)} data-testid={`role-tab-${v}`} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors ${tab === v ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Icon size={16} /> {l}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 space-y-8">{children}</div>
      </div>
    </div>
  );
}

function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(([label, val]) => (
        <div key={label} className="card-premium p-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{val}</div>
        </div>
      ))}
    </div>
  );
}

function SquaresIcon() {
  return <House size={15} />;
}
