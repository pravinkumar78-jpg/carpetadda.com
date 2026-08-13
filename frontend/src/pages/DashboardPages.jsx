import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { Buildings, ChartBar, UserCircle, Heart, MagnifyingGlass, ChatCircle } from "@phosphor-icons/react";

export function UserDashboard() {
  const { user, ready } = useAuth();
  const [favs, setFavs] = useState([]);
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    if (!user) return;
    api.get("/favorites").then(r => setFavs(r.data));
    api.get("/saved-searches").then(r => setSaved(r.data));
  }, [user]);
  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;
  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Welcome back, {user.name.split(" ")[0]}</div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Your Dashboard</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-8">
        <aside className="card-premium p-4 h-fit">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2">Menu</div>
          <nav className="space-y-1 text-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium"><Heart size={16} /> Favorites ({favs.length})</div>
            <div className="flex items-center gap-2 px-3 py-2.5 text-slate-600"><MagnifyingGlass size={16} /> Saved Searches ({saved.length})</div>
            <Link to="/compare" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">Compare</Link>
            <Link to="/properties" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">Browse Properties</Link>
            {(user.role === "admin" || user.role === "super_admin") && <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-blue-600 font-semibold">Admin Panel →</Link>}
          </nav>
        </aside>
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Favorites</h2>
            {favs.length === 0 ? <div className="card-premium p-8 text-center text-slate-500">No favorites yet. Browse and tap the heart to save.</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{favs.map(p => <PropertyCard key={p.id} p={p} />)}</div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Saved Searches</h2>
            {saved.length === 0 ? <div className="card-premium p-8 text-center text-slate-500">No saved searches.</div> : (
              <ul className="space-y-2">{saved.map(s => <li key={s.id} className="card-premium p-4 flex justify-between items-center"><span className="font-medium text-slate-800">{s.name}</span><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold uppercase tracking-wider">{s.alert_frequency}</span></li>)}</ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => { if (user?.role === "admin" || user?.role === "super_admin") api.get("/admin/stats").then(r => setStats(r.data)); }, [user]);
  if (!ready) return null;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return <Navigate to="/login" />;
  const cards = stats ? [
    { icon: Buildings, label: "Total Properties", val: stats.properties_total, color: "blue" },
    { icon: Buildings, label: "Active Listings", val: stats.properties_active, color: "emerald" },
    { icon: Buildings, label: "Total Projects", val: stats.projects_total, color: "blue" },
    { icon: ChatCircle, label: "New Leads", val: stats.leads_new, color: "amber" },
    { icon: ChatCircle, label: "Total Leads", val: stats.leads_total, color: "blue" },
    { icon: ChartBar, label: "Site Visits", val: stats.site_visits_total, color: "blue" },
    { icon: UserCircle, label: "Users", val: stats.users_total, color: "blue" },
    { icon: Buildings, label: "Developers", val: stats.developers_total, color: "blue" },
    { icon: UserCircle, label: "Agents", val: stats.agents_total, color: "blue" },
  ] : [];
  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Admin</div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Command Center</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((c, i) => (
            <div key={i} className="card-premium p-6">
              <div className={`w-10 h-10 rounded-lg bg-${c.color}-100 text-${c.color}-600 flex items-center justify-center mb-4`} style={{ backgroundColor: c.color === "emerald" ? "#d1fae5" : c.color === "amber" ? "#fef3c7" : "#dbeafe", color: c.color === "emerald" ? "#059669" : c.color === "amber" ? "#d97706" : "#2563eb" }}>
                <c.icon size={20} weight="bold" />
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{c.label}</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{c.val ?? "—"}</div>
            </div>
          ))}
        </div>
        <div className="card-premium p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500">
          <div className="text-2xl font-bold mb-3">Manage your portal</div>
          <p className="text-blue-50 text-sm mb-6 max-w-2xl">Full CRUD for properties, projects, leads, agents and developers is available via the API. Rich admin UI panels are on the roadmap.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/properties" className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium">Properties</Link>
            <Link to="/projects" className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium">Projects</Link>
            <Link to="/agents" className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium">Agents</Link>
            <Link to="/developers" className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium">Developers</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
