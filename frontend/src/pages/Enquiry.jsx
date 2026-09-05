import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FunnelSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import ProjectCard from "@/components/ProjectCard";
import ProjectFilters, { PRICE_CAP } from "@/components/ProjectFilters";

/**
 * Public Enquiry page — form submits into the existing Leads/CRM system
 * (POST /api/leads, source "enquiry_page") with the existing email routing
 * (business inbox + assigned agent/developer). Below the form, the existing
 * listed projects render via ProjectCard with the shared ProjectFilters bar.
 */
export default function Enquiry() {
  const [f, setF] = useState({ name: "", phone: "", location: "", budget: "", loan: "", email: "", visited: "", property_id: "", project_id: "" });
  const [busy, setBusy] = useState(false);
  const [listedProps, setListedProps] = useState([]);
  const [listedProjects, setListedProjects] = useState([]);

  // projects browser (below the form) — same API + filters as the Projects page
  const [params, setParams] = useState({});
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [keyword, setKeyword] = useState("");
  const priceMax = Number(params.price_max || PRICE_CAP);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get("/properties?page_size=100").then(r => setListedProps(r.data.items || [])).catch(() => {});
    api.get("/projects?page_size=60").then(r => setListedProjects(r.data.items || [])).catch(() => {});
    api.get("/locations?type=locality&limit=100").then(r => {
      const d = r.data;
      setLocations(Array.isArray(d) ? d : d.items || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qp = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    if (qp.get("category") === "commercial") qp.delete("bhk"); // BHK never applies to commercial
    else qp.delete("config");
    qp.set("page_size", "60");
    api.get(`/projects?${qp.toString()}`)
      .then(r => { if (!cancelled) { setItems(r.data.items || []); setTotal(r.data.total || 0); } })
      .catch(() => { if (!cancelled) { setItems([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params]);

  const update = (k, v) => setParams(p => {
    const n = { ...p };
    if (v === "" || v === undefined || v === null) delete n[k];
    else n[k] = v;
    return n;
  });
  const search = () => update("q", keyword.trim());
  const locOptions = useMemo(() => locations.map(l => [l.slug, l.name]), [locations]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const digits = f.phone.replace(/\D/g, "");
    if (digits.length < 10) { toast.error("Valid 10-digit mobile number required"); return; }
    setBusy(true);
    try {
      const [visitDate, visitTime] = (f.visited || "").split("T");
      await api.post("/leads", {
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        preferred_location: f.location.trim(),
        budget_max: Number(f.budget),
        loan_amount: Number(f.loan),
        property_id: f.property_id || undefined,
        project_id: f.project_id || undefined,
        preferred_visit_date: visitDate || undefined,
        preferred_visit_time: visitTime || undefined,
        source: "enquiry_page",
      });
      toast.success("Enquiry submitted. Our team will contact you shortly.");
      setF({ name: "", phone: "", location: "", budget: "", loan: "", email: "", visited: "", property_id: "", project_id: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not submit enquiry");
    } finally { setBusy(false); }
  };

  return (
    <div>
      {/* Enquiry form */}
      <div className="section-blue py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Enquiry</h1>
          <p className="text-slate-600">Tell us what you're looking for — our team will reach out with matched options.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <form onSubmit={submit} className="card-premium p-6 sm:p-8 space-y-4" data-testid="enquiry-form">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Name *</label>
              <Input required data-testid="enq-name" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Full name" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Number *</label>
              <Input required data-testid="enq-phone" type="tel" value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile" className="h-11 rounded-lg border-slate-200" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Location *</label>
              <Input required data-testid="enq-location" value={f.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Dombivli East" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Budget (₹) *</label>
              <Input required data-testid="enq-budget" type="number" min="1" value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="e.g. 7500000" className="h-11 rounded-lg border-slate-200" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Loan Amount (₹) *</label>
              <Input required data-testid="enq-loan" type="number" min="0" value={f.loan} onChange={e => set("loan", e.target.value)} placeholder="e.g. 5000000" className="h-11 rounded-lg border-slate-200" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Email</label>
              <Input data-testid="enq-email" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="Optional" className="h-11 rounded-lg border-slate-200" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Visited Date & Time</label>
            <Input data-testid="enq-visited" type="datetime-local" value={f.visited} onChange={e => set("visited", e.target.value)} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Select Listed Property</label>
              <Select value={f.property_id} onValueChange={v => set("property_id", v === "none" ? "" : v)}>
                <SelectTrigger data-testid="enq-property" className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Optional — choose a listed property" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {listedProps.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Select Listed Project</label>
              <Select value={f.project_id} onValueChange={v => set("project_id", v === "none" ? "" : v)}>
                <SelectTrigger data-testid="enq-project" className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Optional — choose a listed project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {listedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <button type="submit" disabled={busy} data-testid="enq-submit" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 transition-colors">
            <PaperPlaneTilt size={16} weight="bold" /> {busy ? "Submitting…" : "Submit Enquiry"}
          </button>
        </form>
      </div>

      {/* Listed projects with the shared filter bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-16">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Listed Projects</h2>
            <div className="text-sm text-slate-600 mt-1" data-testid="enquiry-project-count">{loading ? "Searching…" : `${total} project${total === 1 ? "" : "s"} found`}</div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button data-testid="enquiry-filters-btn" className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700"><FunnelSimple size={16} /> Filters</button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto bg-white"><div className="mt-8"><ProjectFilters params={params} update={update} keyword={keyword} setKeyword={setKeyword} search={search} locOptions={locOptions} priceMax={priceMax} /></div></SheetContent>
          </Sheet>
        </div>
        <div className="flex gap-8 items-start">
          <aside className="hidden lg:block w-72 flex-shrink-0 card-premium p-5 sticky top-24" data-testid="enquiry-filter-bar">
            <ProjectFilters params={params} update={update} keyword={keyword} setKeyword={setKeyword} search={search} locOptions={locOptions} priceMax={priceMax} />
          </aside>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="enquiry-projects-grid">
              {items.map(p => <ProjectCard key={p.id} p={p} />)}
            </div>
            {loading && <div className="text-center py-10 text-slate-500">Loading…</div>}
            {!loading && items.length === 0 && (
              <div className="text-center py-20 text-slate-500 bg-blue-50 rounded-xl border border-blue-100" data-testid="enquiry-projects-empty">No projects match your filters. Try adjusting them.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
