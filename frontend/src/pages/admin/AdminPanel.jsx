import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Buildings, ChartBar, UserCircle, ChatCircle, House, Package, ListChecks, Question, Star, Article, Users, Gear } from "@phosphor-icons/react";
import AdminProperties from "@/pages/admin/AdminProperties";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminFAQs from "@/pages/admin/AdminFAQs";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminBlogs from "@/pages/admin/AdminBlogs";
import AdminSettings from "@/pages/admin/AdminSettings";

export default function AdminPanel() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState(null);

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
        <Tabs defaultValue="overview">
          <TabsList className="bg-slate-100 p-1 h-auto rounded-lg mb-6 inline-flex flex-wrap gap-1">
            {[
              ["overview", "Overview", ChartBar],
              ["properties", "Properties", House],
              ["projects", "Projects", Buildings],
              ["leads", "Leads", ChatCircle],
              ["blogs", "Blog", Article],
              ["testimonials", "Testimonials", Star],
              ["faqs", "FAQs", Question],
              ["users", "Users", Users],
              ["settings", "Settings", Gear],
            ].map(([v, l, Icon]) => (
              <TabsTrigger key={v} value={v} data-testid={`admin-tab-${v}`} className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600 flex items-center gap-2">
                <Icon size={16} weight="bold" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <Overview stats={stats} />
          </TabsContent>
          <TabsContent value="properties">
            <AdminProperties />
          </TabsContent>
          <TabsContent value="projects">
            <AdminProjects />
          </TabsContent>
          <TabsContent value="leads">
            <AdminLeads />
          </TabsContent>
          <TabsContent value="blogs">
            <AdminBlogs />
          </TabsContent>
          <TabsContent value="testimonials">
            <AdminTestimonials />
          </TabsContent>
          <TabsContent value="faqs">
            <AdminFAQs />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Overview({ stats }) {
  if (!stats) return <div className="text-slate-500">Loading stats…</div>;
  const cards = [
    { icon: House, label: "Total Properties", val: stats.properties_total, color: "blue" },
    { icon: Package, label: "Active Listings", val: stats.properties_active, color: "emerald" },
    { icon: Buildings, label: "Total Projects", val: stats.projects_total, color: "blue" },
    { icon: ChatCircle, label: "New Leads", val: stats.leads_new, color: "amber" },
    { icon: ListChecks, label: "Total Leads", val: stats.leads_total, color: "blue" },
    { icon: ChartBar, label: "Site Visits", val: stats.site_visits_total, color: "blue" },
    { icon: UserCircle, label: "Users", val: stats.users_total, color: "blue" },
    { icon: Buildings, label: "Developers", val: stats.developers_total, color: "blue" },
    { icon: UserCircle, label: "Agents", val: stats.agents_total, color: "blue" },
  ];
  const styles = {
    blue: { bg: "#dbeafe", fg: "#2563eb" },
    emerald: { bg: "#d1fae5", fg: "#059669" },
    amber: { bg: "#fef3c7", fg: "#d97706" },
  };
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="card-premium p-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: styles[c.color].bg, color: styles[c.color].fg }}>
              <c.icon size={20} weight="bold" />
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{c.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{c.val ?? "—"}</div>
          </div>
        ))}
      </div>
      <div className="card-premium p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500">
        <div className="text-2xl font-bold mb-3">Quick actions</div>
        <p className="text-blue-50 text-sm mb-6 max-w-2xl">Manage every listing, project and lead in one place — no code required.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
          <a href="#" onClick={e => { e.preventDefault(); document.querySelector('[data-testid="admin-tab-properties"]')?.click(); }} className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors">Manage Properties</a>
          <a href="#" onClick={e => { e.preventDefault(); document.querySelector('[data-testid="admin-tab-projects"]')?.click(); }} className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors">Manage Projects</a>
          <a href="#" onClick={e => { e.preventDefault(); document.querySelector('[data-testid="admin-tab-leads"]')?.click(); }} className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors">Manage Leads</a>
          <a href="/api/sitemap" target="_blank" rel="noopener" className="text-center py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-colors">View Sitemap</a>
        </div>
      </div>
    </div>
  );
}
