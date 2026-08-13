import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { AccountPanel, MyListings } from "@/components/dashboard/AccountPanel";
import { Heart, MagnifyingGlass, Plus, SquaresFour, UserGear } from "@phosphor-icons/react";

export function UserDashboard() {
  const { user, ready } = useAuth();
  const [favs, setFavs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [mine, setMine] = useState([]);
  const [tab, setTab] = useState("overview");

  const loadMine = () => { if (user) api.get(`/properties?owner_id=${user.id}&include_archived=true&page_size=50`).then(r => setMine(r.data.items || [])).catch(() => {}); };

  useEffect(() => {
    if (!user) return;
    api.get("/favorites").then(r => setFavs(r.data)).catch(() => {});
    api.get("/saved-searches").then(r => setSaved(r.data)).catch(() => {});
    loadMine();
  }, [user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" />;

  const MENU = [
    ["overview", "Overview", SquaresFour],
    ["listings", `My Listings (${mine.length})`, Plus],
    ["account", "Profile & Security", UserGear],
  ];

  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Welcome back, {user.name.split(" ")[0]}</div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Your Dashboard</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-8 items-start">
        <aside className="card-premium p-4 h-fit lg:sticky lg:top-24">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2">Menu</div>
          <nav className="space-y-1 text-sm">
            {MENU.map(([v, l, Icon]) => (
              <button key={v} onClick={() => setTab(v)} data-testid={`dash-tab-${v}`} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors ${tab === v ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Icon size={16} /> {l}
              </button>
            ))}
            <div className="flex items-center gap-2 px-3 py-2.5 text-slate-600"><Heart size={16} /> Favorites ({favs.length})</div>
            <div className="flex items-center gap-2 px-3 py-2.5 text-slate-600"><MagnifyingGlass size={16} /> Saved Searches ({saved.length})</div>
            <Link to="/compare" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">Compare</Link>
            <Link to="/properties" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">Browse Properties</Link>
            {(user.role === "admin" || user.role === "super_admin") && <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-blue-600 font-semibold">Admin Panel →</Link>}
          </nav>
        </aside>

        <div className="min-w-0">
          {tab === "overview" && (
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
          )}

          {tab === "listings" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-slate-900">My Listings</h2>
                <Link to="/dashboard/list-property" data-testid="dash-list-property" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
                  <Plus size={15} weight="bold" /> List Property
                </Link>
              </div>
              <MyListings items={mine} onChanged={loadMine} editBase="/dashboard/list-property" />
            </div>
          )}

          {tab === "account" && <AccountPanel user={user} />}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() { return <Navigate to="/admin" />; }
