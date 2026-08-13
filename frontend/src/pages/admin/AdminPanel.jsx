import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Buildings, ChartBar, UserCircle, ChatCircle, House, Package, ListChecks, Question, Star, Article, Users, Gear, MagnifyingGlass, Archive } from "@phosphor-icons/react";
import AdminProperties from "@/pages/admin/AdminProperties";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminFAQs from "@/pages/admin/AdminFAQs";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminBlogs from "@/pages/admin/AdminBlogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminSeo from "@/pages/admin/AdminSeo";
import AdminArchive from "@/pages/admin/AdminArchive";
import AdminPages from "@/pages/admin/AdminPages";

const TABS = [
  ["overview", "Overview", ChartBar],
  ["properties", "Properties", House],
  ["projects", "Projects", Buildings],
  ["leads", "Leads", ChatCircle],
  ["blogs", "Blog", Article],
  ["testimonials", "Testimonials", Star],
  ["faqs", "FAQs", Question],
  ["pages", "Pages", Article],
  ["seo", "SEO", MagnifyingGlass],
  ["archive", "Archive", Archive],
  ["users", "Users", Users],
  ["settings", "Settings", Gear],
];

export default function AdminPanel() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("overview");

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
        <Tabs value={tab} onValueChange={setTab} className="grid grid-cols-1 lg:grid-cols-[230px,1fr] gap-8 items-start">
          {/* Left-side navigation */}
          <TabsList className="flex flex-row lg:flex-col flex-wrap h-auto bg-white card-premium p-3 gap-1 lg:sticky lg:top-24 w-full items-stretch justify-start" data-testid="admin-left-nav">
            {TABS.map(([v, l, Icon]) => (
              <TabsTrigger key={v} value={v} data-testid={`admin-tab-${v}`} className="justify-start rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 flex items-center gap-2.5 w-auto lg:w-full">
                <Icon size={16} weight="bold" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-w-0">
            <TabsContent value="overview"><Overview stats={stats} go={setTab} nav={nav} /></TabsContent>
            <TabsContent value="properties"><AdminProperties /></TabsContent>
            <TabsContent value="projects"><AdminProjects /></TabsContent>
            <TabsContent value="leads"><AdminLeads /></TabsContent>
            <TabsContent value="blogs"><AdminBlogs /></TabsContent>
            <TabsContent value="testimonials"><AdminTestimonials /></TabsContent>
            <TabsContent value="faqs"><AdminFAQs /></TabsContent>
            <TabsContent value="pages"><AdminPages /></TabsContent>
            <TabsContent value="seo"><AdminSeo /></TabsContent>
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
    { icon: ListChecks, label: "Site Visits", val: stats.site_visits_total, color: "blue", go: "leads" },
    { icon: UserCircle, label: "Users", val: stats.users_total, color: "blue", go: "users" },
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
      <div className="card-premium p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500">
        <div className="text-2xl font-bold mb-3">Quick actions</div>
        <p className="text-blue-50 text-sm mb-6 max-w-2xl">Manage every listing, project and lead in one place — no code required.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
          {actions.map(a => (
            <button key={a.tid} data-testid={a.tid} onClick={a.onClick} className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
