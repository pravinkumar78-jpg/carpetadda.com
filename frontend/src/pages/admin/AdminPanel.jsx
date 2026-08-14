import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Buildings, ChartBar, UserCircle, ChatCircle, House, Package, ListChecks, Question, Star, Article, Users, Gear, MagnifyingGlass, Archive, CaretDown, EnvelopeSimple } from "@phosphor-icons/react";
import AdminProperties from "@/pages/admin/AdminProperties";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminSiteVisits from "@/pages/admin/AdminSiteVisits";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminFAQs from "@/pages/admin/AdminFAQs";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminBlogs from "@/pages/admin/AdminBlogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminSeo, { MAJOR_PAGES } from "@/pages/admin/AdminSeo";
import AdminEmailLogs from "@/pages/admin/AdminEmailLogs";
import LeadsChart from "@/components/LeadsChart";
import AdminArchive from "@/pages/admin/AdminArchive";
import AdminPages from "@/pages/admin/AdminPages";
import { DashNavToggle, DashSidebar } from "@/components/DashNav";

const TABS = [
  ["overview", "Overview", ChartBar],
  ["properties", "Properties", House],
  ["projects", "Projects", Buildings],
  ["leads", "Leads", ChatCircle],
  ["site-visits", "Site Visits", ListChecks],
  ["email-logs", "Email Logs", EnvelopeSimple],
  ["blogs", "Blog", Article],
  ["testimonials", "Testimonials", Star],
  ["faqs", "FAQs", Question],
  ["pages", "Pages", Article],
  ["archive", "Archive", Archive],
  ["users", "Users", Users],
  ["settings", "Settings", Gear],
];

export default function AdminPanel() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("overview");
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoPage, setSeoPage] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const openSeoPage = (p) => { setSeoPage(p); setTab("seo"); setSeoOpen(true); };

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "super_admin") api.get("/admin/stats").then(r => setStats(r.data));
  }, [user]);

  if (!ready) return null;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen">
      <div className="section-blue py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">Admin</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Command Center</h1>
              <p className="text-slate-600 mt-1 text-sm">Welcome back, {user.name} · <span className="capitalize text-slate-800 font-medium">{user.role.replace("_", " ")}</span></p>
            </div>
            <Link to="/" className="text-sm text-slate-600 hover:text-blue-600 font-medium">← Back to site</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setNavOpen(false); }} className="grid grid-cols-1 lg:grid-cols-[230px,1fr] gap-8 items-start">
          {/* Left-side navigation — collapsible drawer on mobile via DashSidebar */}
          <DashNavToggle open={navOpen} onToggle={() => setNavOpen(o => !o)} />
          <DashSidebar open={navOpen} onClose={() => setNavOpen(false)} testid="admin-sidebar">
          <TabsList className="flex flex-col h-auto bg-white card-premium p-3 gap-1 lg:sticky lg:top-24 w-full items-stretch justify-start" data-testid="admin-left-nav">
            {TABS.map(([v, l, Icon]) => (
              <TabsTrigger key={v} value={v} data-testid={`admin-tab-${v}`} className="justify-start rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 flex items-center gap-2.5 w-full">
                <Icon size={16} weight="bold" /> {l}
              </TabsTrigger>
            ))}
            {/* SEO submenu (below Settings) */}
            <button
              type="button"
              data-testid="admin-tab-seo"
              onClick={() => setSeoOpen(o => !o)}
              className={`justify-start rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2.5 w-full hover:bg-blue-50 hover:text-blue-600 transition-colors ${tab.startsWith("seo") ? "text-blue-600" : ""}`}
            >
              <MagnifyingGlass size={16} weight="bold" /> SEO
              <CaretDown size={12} weight="bold" className={`ml-auto transition-transform ${seoOpen ? "rotate-180" : ""}`} />
            </button>
            {seoOpen && (
              <div className="pl-5 lg:pl-8 flex flex-col gap-1 w-full">
                <TabsTrigger value="seo" data-testid="admin-tab-seo-pages" onClick={() => setSeoPage(null)} className="justify-start rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 flex items-center gap-2.5 w-full">
                  <Article size={14} /> Pages
                </TabsTrigger>
                {tab === "seo" && MAJOR_PAGES.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => openSeoPage(v)} data-testid={`seo-nav-${v.replace(/\//g, "_") || "_home"}`}
                    className={`justify-start rounded-lg px-4 py-1.5 lg:ml-4 text-xs font-medium flex items-center gap-2 w-full transition-colors ${seoPage === v ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50/60"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${seoPage === v ? "bg-blue-600" : "bg-slate-300"}`} /> {l}
                  </button>
                ))}
              </div>
            )}
          </TabsList>
          </DashSidebar>

          <div className="min-w-0">
            <TabsContent value="overview"><Overview stats={stats} go={setTab} nav={nav} /></TabsContent>
            <TabsContent value="properties"><AdminProperties /></TabsContent>
            <TabsContent value="projects"><AdminProjects /></TabsContent>
            <TabsContent value="leads"><AdminLeads /></TabsContent>
            <TabsContent value="site-visits"><AdminSiteVisits /></TabsContent>
            <TabsContent value="email-logs"><AdminEmailLogs /></TabsContent>
            <TabsContent value="blogs"><AdminBlogs /></TabsContent>
            <TabsContent value="testimonials"><AdminTestimonials /></TabsContent>
            <TabsContent value="faqs"><AdminFAQs /></TabsContent>
            <TabsContent value="pages"><AdminPages /></TabsContent>
            <TabsContent value="seo"><AdminSeo page={seoPage} onSelectPage={setSeoPage} /></TabsContent>
            <TabsContent value="archive"><AdminArchive /></TabsContent>
            <TabsContent value="users"><AdminUsers /></TabsContent>
            <TabsContent value="settings"><AdminSettings /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function Overview({ stats, go, nav }) {
  if (!stats) return <div className="text-slate-500">Loading stats…</div>;
  const cards = [
    { icon: House, label: "Total Properties", val: stats.properties_total, color: "blue", go: "properties" },
    { icon: Package, label: "Active Listings", val: stats.properties_active, color: "emerald", go: "properties" },
    { icon: Buildings, label: "Total Projects", val: stats.projects_total, color: "blue", go: "projects" },
    { icon: ChatCircle, label: "New Leads", val: stats.leads_new, color: "amber", go: "leads" },
    { icon: ListChecks, label: "Total Leads", val: stats.leads_total, color: "blue", go: "leads" },
    { icon: ListChecks, label: "Site Visits", val: stats.site_visits_total, color: "blue", go: "site-visits" },
    { icon: UserCircle, label: "Users", val: stats.users_total, color: "blue", go: "users" },
    { icon: Users, label: "Agents", val: stats.agents_total, color: "blue", go: "users" },
    { icon: Buildings, label: "Developers", val: stats.developers_total, color: "blue", go: "users" },
    { icon: ListChecks, label: "Pending Reviews", val: (stats.properties_pending || 0) + (stats.projects_pending || 0), color: "amber", go: "properties" },
    { icon: Package, label: "Approved Live", val: stats.approved_total, color: "emerald", go: "projects" },
    { icon: Archive, label: "Archived", val: (stats.properties_archived || 0) + (stats.projects_archived || 0), color: "amber", go: "archive" },
  ];
  const styles = {
    blue: { bg: "#dbeafe", fg: "#2563eb" },
    emerald: { bg: "#d1fae5", fg: "#059669" },
    amber: { bg: "#fef3c7", fg: "#d97706" },
  };
  const actions = [
    { label: "Manage Properties", onClick: () => go("properties"), tid: "qa-properties" },
    { label: "Manage Projects", onClick: () => go("projects"), tid: "qa-projects" },
    { label: "Manage Leads", onClick: () => go("leads"), tid: "qa-leads" },
    { label: "New Property", onClick: () => nav("/admin/properties/new"), tid: "qa-new-property" },
    { label: "New Project", onClick: () => nav("/admin/projects/new"), tid: "qa-new-project" },
    { label: "SEO Management", onClick: () => go("seo"), tid: "qa-seo" },
    { label: "Open Archive", onClick: () => go("archive"), tid: "qa-archive" },
    { label: "Site Settings", onClick: () => go("settings"), tid: "qa-settings" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <button key={i} onClick={() => go(c.go)} data-testid={`stat-${c.go}-${i}`} className="card-premium p-6 text-left hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: styles[c.color].bg, color: styles[c.color].fg }}>
              <c.icon size={20} weight="bold" />
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{c.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{c.val ?? "—"}</div>
          </button>
        ))}
      </div>
      <div className="mb-8">
        <LeadsChart stats={{
          total: stats.leads_total || 0,
          contacted: stats.leads_contacted || 0,
          converted: stats.leads_converted || 0,
          conversion: stats.leads_total ? Math.round(((stats.leads_converted || 0) / stats.leads_total) * 1000) / 10 : 0,
        }} title="Overall Lead Performance" />
      </div>
      <div className="card-premium p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500">
        <div className="text-2xl font-bold mb-3">Quick actions</div>
        <p className="text-blue-50 text-sm mb-6 max-w-2xl">Manage every listing, project and lead in one place — no code required.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
          {actions.map(a => (
            <button key={a.tid} data-testid={a.tid} onClick={a.onClick} className="text-center py-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 text-slate-900 font-semibold shadow-sm">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
