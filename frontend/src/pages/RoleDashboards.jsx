import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, House, Buildings, ChatCircle, ChartBar, UserCircle } from "@phosphor-icons/react";

// Role-based mini dashboards. Admin still uses /admin (AdminPanel).
export function AgentDashboard() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => { if (user) api.get(`/properties?agent_id=${user.id}&page_size=20`).then(r => setItems(r.data.items || [])); }, [user]);
  if (!ready) return null;
  if (!user || user.role !== "agent") return <Navigate to="/login" />;
  return <RoleShell user={user} title="Agent Workspace" links={[
    { to: "/admin/properties/new", label: "Add Property", icon: Plus, primary: true },
    { to: "/dashboard", label: "My Enquiries", icon: ChatCircle },
    { to: "/properties", label: "Browse Listings", icon: House },
  ]}>
    <StatGrid stats={[["My Listings", items.length], ["Active", items.filter(p => p.status === "active").length], ["Featured", items.filter(p => p.featured).length]]} />
    <MyList title="My Listings" items={items} />
  </RoleShell>;
}

export function DeveloperDashboard() {
  const { user, ready } = useAuth();
  const [projects, setProjects] = useState([]);
  useEffect(() => { if (user) api.get("/projects?page_size=20").then(r => setProjects(r.data.items || [])); }, [user]);
  if (!ready) return null;
  if (!user || user.role !== "developer") return <Navigate to="/login" />;
  return <RoleShell user={user} title="Developer Workspace" links={[
    { to: "/admin/projects/new", label: "Add Project", icon: Plus, primary: true },
    { to: "/dashboard", label: "Enquiries", icon: ChatCircle },
    { to: "/projects", label: "Browse Projects", icon: Buildings },
  ]}>
    <StatGrid stats={[["Projects", projects.length], ["Featured", projects.filter(p => p.featured).length]]} />
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.slice(0, 6).map(p => (
          <Link key={p.id} to={`/admin/projects/${p.id}/edit`} className="card-premium p-5">
            <img src={p.images?.[0]} alt="" className="w-full aspect-[16/10] object-cover rounded-lg mb-3" />
            <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
            <div className="text-xs text-slate-500 mt-1 capitalize">{p.location?.replace("-", " ")}</div>
          </Link>
        ))}
      </div>
    </div>
  </RoleShell>;
}

export function ClientDashboard() {
  const { user, ready } = useAuth();
  const [favs, setFavs] = useState([]);
  useEffect(() => { if (user) api.get("/favorites").then(r => setFavs(r.data)); }, [user]);
  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;
  return <RoleShell user={user} title={`Welcome, ${user.name.split(" ")[0]}`} links={[
    { to: "/properties", label: "Browse Properties", icon: House, primary: true },
    { to: "/ai-search", label: "AI Search", icon: ChatCircle },
    { to: "/dashboard", label: "My Favorites", icon: House },
  ]}>
    <StatGrid stats={[["Saved", favs.length], ["Recent Views", 0]]} />
  </RoleShell>;
}

function RoleShell({ user, title, links, children }) {
  return (
    <div className="min-h-screen">
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">{user.role.replace("_", " ")}</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((l, i) => (
              <Link key={i} to={l.to} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${l.primary ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <l.icon size={14} weight="bold" /> {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-8">{children}</div>
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
function MyList({ title, items }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">{title}</h2>
      {items.length === 0 ? <div className="card-premium p-8 text-center text-slate-500">Nothing yet.</div> : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3 text-left font-semibold">Property</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map(p => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3"><div className="font-medium text-slate-900 line-clamp-1">{p.title}</div><div className="text-xs text-slate-500">{p.location}</div></td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-right"><Link to={`/admin/properties/${p.id}/edit`} className="text-blue-600 text-sm font-medium hover:underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
