import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, House, Buildings, ChatCircle, Heart, MagnifyingGlass, UserGear, Users, Archive, ArrowCounterClockwise, PencilSimple, GlobeHemisphereWest, CircleNotch, ChartBar, PaperPlaneTilt, FileDashed } from "@phosphor-icons/react";
import { AccountPanel, MyListings } from "@/components/dashboard/AccountPanel";
import DraftsPanel from "@/components/dashboard/DraftsPanel";
import LeadsChart from "@/components/LeadsChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashNavToggle, DashSidebar } from "@/components/DashNav";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";

// Role-based dashboards. Admin uses /admin (AdminPanel).
export function AgentDashboard() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadStats, setLeadStats] = useState(null);
  const [tab, setTab] = useState("listings");

  const loadListings = () => { if (user) api.get(`/properties?owner_id=${user.id}&include_archived=true&page_size=50`).then(r => setItems(r.data.items || [])).catch(() => {}); };
  const loadLeads = () => { api.get("/leads?limit=100").then(r => setLeads(Array.isArray(r.data) ? r.data : [])).catch(() => {}); };
  const loadLeadStats = () => { api.get("/stats/leads").then(r => setLeadStats(r.data)).catch(() => setLeadStats({ total: 0, contacted: 0, converted: 0, conversion: 0 })); };

  useEffect(() => {
    if (!user) return;
    loadListings();
    loadLeads();
    loadLeadStats();
  }, [user]);

  if (!ready) return null;
  if (!user || user.role !== "agent") return <Navigate to="/login" />;

  return (
    <DashShell user={user} title="Agent Workspace" tab={tab} setTab={setTab} menu={[
      ["listings", `My Listings (${items.length})`, House],
      ["drafts", "Drafts", FileDashed],
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

      {tab === "drafts" && <DraftsPanel editPropertyBase="/agent/list-property" />}

      {tab === "leads" && (
        <div className="space-y-5">
          <LeadsChart stats={leadStats} title="My Lead Performance" />
          <StatGrid stats={(() => {
            const total = leads.length;
            const contacted = leads.filter(l => ["contacted", "converted"].includes(l.status)).length;
            const converted = leads.filter(l => l.status === "converted").length;
            const rate = total ? `${Math.round((converted / total) * 100)}%` : "—";
            return [["Total Leads", total], ["Contacted", contacted], ["Converted", converted], ["Conversion Rate", rate]];
          })()} />
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
                    <td className="px-4 py-3">
                      <select
                        data-testid={`agent-lead-status-${l.id}`}
                        value={l.status || "new"}
                        onChange={async (e) => {
                          try {
                            await api.put(`/leads/${l.id}`, { status: e.target.value });
                            toast.success(`Lead marked ${e.target.value}`);
                            loadLeads();
                          } catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
                        }}
                        className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white capitalize"
                      >
                        {["new", "contacted", "converted", "lost"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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
  const [leadStats, setLeadStats] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const loadProjects = () => { if (user) api.get(`/admin/projects?page_size=100`).then(r => {
    const all = r.data.items || [];
    setProjects(all.filter(p => !p.owner_id || p.owner_id === user.id));
  }).catch(() => {}); };
  const loadLeadStats = () => { api.get("/stats/leads").then(r => setLeadStats(r.data)).catch(() => setLeadStats({ total: 0, contacted: 0, converted: 0, conversion: 0 })); };

  useEffect(() => { if (user) { loadProjects(); loadLeadStats(); } }, [user]);
  if (!ready) return null;
  if (!user || user.role !== "developer") return <Navigate to="/login" />;

  const runImport = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) { toast.error("Please enter your website or landing page URL"); return; }
    setImporting(true);
    try {
      const { data } = await api.post("/projects/import", { url: importUrl.trim() });
      toast.success(`"${data.name}" imported as draft — pending admin review`);
      setImportOpen(false);
      setImportUrl("");
      loadProjects();
    } catch (err) { toast.error(err?.response?.data?.detail || "Import failed"); }
    finally { setImporting(false); }
  };

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
      ["drafts", "Drafts", FileDashed],
      ["performance", "Leads & Performance", ChartBar],
      ["account", "Profile & Security", UserGear],
    ]} actions={[
      { to: "/developer/projects/new", label: "Add Project", primary: true, tid: "dev-add-project" },
    ]} extraActions={
      <button onClick={() => setImportOpen(true)} data-testid="dev-import-project" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors">
        <GlobeHemisphereWest size={14} weight="bold" /> Import from Website
      </button>
    }>

      {tab === "projects" && (
        <div className="space-y-5">
          {/* Prominent project listing / import banner */}
          <div className="card-premium p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-blue-200 bg-gradient-to-r from-blue-50 to-white" data-testid="dev-listing-banner">
            <div>
              <div className="font-bold text-slate-900 text-lg">List your projects faster</div>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">Add a project manually, or import it straight from your existing developer website / landing page. Imports are saved as drafts and go live only after admin approval.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/developer/projects/new" data-testid="dev-banner-add" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-800 text-white hover:bg-blue-900 shadow-sm transition-colors"><Plus size={14} weight="bold" /> Project Listing</Link>
              <button onClick={() => setImportOpen(true)} data-testid="dev-banner-import" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 transition-colors"><GlobeHemisphereWest size={14} weight="bold" /> Import from Website</button>
            </div>
          </div>
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
                          {p.status === "draft" && (
                            <button onClick={async () => { try { await api.put(`/projects/${p.id}`, { status: "pending_review" }); toast.success("Submitted for admin review"); loadProjects(); } catch (err) { toast.error(err?.response?.data?.detail || "Submit failed"); } }}
                              data-testid={`dev-publish-${p.id}`} title="Submit for admin review" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><PaperPlaneTilt size={14} /></button>
                          )}
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

      {tab === "drafts" && <DraftsPanel editProjectBase="/developer/projects" />}

      {tab === "performance" && (
        <LeadsChart stats={leadStats} title="My Project Leads" />
      )}

      {tab === "account" && <AccountPanel user={user} />}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import Project from Website</DialogTitle></DialogHeader>
          <form onSubmit={runImport} className="space-y-4 py-2" data-testid="dev-import-form">
            <p className="text-sm text-slate-600">Paste your existing developer landing page or project website URL. We'll fetch the available details and save the project as a <span className="font-semibold">draft pending admin review</span> — it won't go live until approved.</p>
            <Input data-testid="dev-import-url" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://yourdeveloper site.com/project" className="h-11 rounded-lg border-slate-300" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setImportOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={importing} data-testid="dev-import-submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
                {importing && <CircleNotch size={14} className="animate-spin" />} {importing ? "Importing…" : "Fetch & Import"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashShell>
  );
}

export function ClientDashboard() {
  return <Navigate to="/dashboard" />;
}

function DashShell({ user, title, menu, actions = [], extraActions = null, tab, setTab, children }) {
  const [navOpen, setNavOpen] = useState(false);
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
              <Link key={a.tid} to={a.to} data-testid={a.tid} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${a.primary ? "bg-blue-800 text-white hover:bg-blue-900 shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Plus size={14} weight="bold" /> {a.label}
              </Link>
            ))}
            {extraActions}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-8 items-start">
        <DashNavToggle open={navOpen} onToggle={() => setNavOpen(o => !o)} />
        <DashSidebar open={navOpen} onClose={() => setNavOpen(false)} testid="role-sidebar">
        <aside className="card-premium p-4 h-fit lg:sticky lg:top-24">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2">Menu</div>
          <nav className="space-y-1 text-sm">
            {menu.map(([v, l, Icon]) => (
              <button key={v} onClick={() => { setTab(v); setNavOpen(false); }} data-testid={`role-tab-${v}`} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors ${tab === v ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Icon size={16} /> {l}
              </button>
            ))}
          </nav>
        </aside>
        </DashSidebar>
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
