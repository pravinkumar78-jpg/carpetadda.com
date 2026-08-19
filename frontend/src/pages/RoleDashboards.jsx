import { Fragment, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, House, Buildings, ChatCircle, Heart, MagnifyingGlass, UserGear, Users, Archive, ArrowCounterClockwise, PencilSimple, GlobeHemisphereWest, CircleNotch, ChartBar, PaperPlaneTilt, FileDashed, UserCheck, CalendarBlank, Clock, WhatsappLogo, PhoneCall, SquaresFour } from "@phosphor-icons/react";
import { AccountPanel, MyListings } from "@/components/dashboard/AccountPanel";
import DraftsPanel from "@/components/dashboard/DraftsPanel";
import AssignedPanel from "@/components/dashboard/AssignedPanel";
import { waLink, waTo } from "@/lib/whatsapp";
import LeadsChart from "@/components/LeadsChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashNavToggle, DashSidebar } from "@/components/DashNav";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";

// Role-based dashboards. Admin uses /admin (AdminPanel).
const LEAD_STATUSES = ["new", "contacted", "site_visit", "converted", "lost"];
const leadLabel = (s) => ({ new: "New", contacted: "Contacted", site_visit: "Site Visit", converted: "Converted", lost: "Lost" })[s] || s;
const VISIT_STATUSES = ["requested", "confirmed", "rescheduled", "completed", "cancelled", "no_show"];
const fmtDay = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); };

export function AgentDashboard() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadStats, setLeadStats] = useState(null);
  const [visits, setVisits] = useState([]);
  const [assigned, setAssigned] = useState({ properties: [], projects: [] });
  const [tab, setTab] = useState("overview");
  const [leadFilter, setLeadFilter] = useState("all");
  const [visitFilter, setVisitFilter] = useState("upcoming");
  const [openLead, setOpenLead] = useState(null);
  const [noteText, setNoteText] = useState("");

  const loadListings = () => { if (user) api.get(`/properties?owner_id=${user.id}&include_archived=true&page_size=50`).then(r => setItems(r.data.items || [])).catch(() => {}); };
  const loadLeads = () => { api.get("/leads?limit=100").then(r => setLeads(Array.isArray(r.data) ? r.data : [])).catch(() => {}); };
  const loadLeadStats = () => { api.get("/stats/leads").then(r => setLeadStats(r.data)).catch(() => setLeadStats({ total: 0, contacted: 0, converted: 0, conversion: 0 })); };
  const loadVisits = () => { api.get("/site-visits?limit=100").then(r => setVisits(Array.isArray(r.data) ? r.data : [])).catch(() => {}); };
  const loadAssigned = () => { api.get("/my/assigned").then(r => setAssigned({ properties: r.data.properties || [], projects: r.data.projects || [] })).catch(() => {}); };

  useEffect(() => {
    if (!user) return;
    loadListings();
    loadLeads();
    loadLeadStats();
    loadVisits();
    loadAssigned();
  }, [user]);

  if (!ready) return null;
  if (!user || user.role !== "agent") return <Navigate to="/login" />;

  const today = new Date().toISOString().slice(0, 10);
  const isOpenLead = (l) => !["converted", "lost"].includes(l.status);
  const followDue = leads.filter(l => isOpenLead(l) && l.next_follow_up && l.next_follow_up <= today);
  const followUps = leads.filter(l => isOpenLead(l) && l.next_follow_up);
  const upcomingVisits = visits.filter(v => ["requested", "confirmed", "rescheduled"].includes(v.status) && v.visit_date >= today);
  const assignedAll = [...assigned.properties, ...assigned.projects];
  const pendingApprovals = [...items, ...assignedAll].filter(x => x.pending_approval);

  const listingName = (l) => {
    const p = items.find(x => x.id === l.property_id) || assigned.properties.find(x => x.id === l.property_id);
    if (p) return p.title;
    const j = assigned.projects.find(x => x.id === l.project_id);
    return j ? j.name : "—";
  };

  const setLeadStatus = async (l, status) => {
    try { await api.put(`/leads/${l.id}`, { status }); toast.success(`Lead marked ${leadLabel(status)}`); loadLeads(); loadLeadStats(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
  };
  const setFollowUp = async (l, date) => {
    try { await api.put(`/leads/${l.id}`, { next_follow_up: date || null }); toast.success(date ? `Follow-up set for ${date}` : "Follow-up cleared"); loadLeads(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
  };
  const addNote = async (l) => {
    if (!noteText.trim()) return;
    try {
      await api.put(`/leads/${l.id}`, { notes: [...(l.notes || []), { text: noteText.trim(), by: user.name, at: new Date().toISOString() }] });
      setNoteText(""); toast.success("Note added"); loadLeads();
    } catch (err) { toast.error(err?.response?.data?.detail || "Note failed"); }
  };
  const setVisit = async (v, patch) => {
    try { await api.put(`/site-visits/${v.id}`, patch); toast.success("Visit updated"); loadVisits(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
  };
  const waLead = (l) => waTo(l.phone, `Hello ${l.name}, this is ${user.name} from CarpetAdda following up on your property enquiry${l.property_id ? ` (${listingName(l)})` : ""}.`);
  const waVisit = (v) => waTo(v.phone, `Hello ${v.name}, this is ${user.name} from CarpetAdda regarding your site visit${v.property_title || v.project_name ? ` for ${v.property_title || v.project_name}` : ""} on ${v.visit_date} ${v.visit_time || ""}.`);

  const filteredLeads = leadFilter === "all" ? leads
    : leadFilter === "followup" ? followUps
    : leads.filter(l => (l.status || "new") === leadFilter);

  const filteredVisits = visitFilter === "upcoming" ? visits.filter(v => ["requested", "confirmed", "rescheduled"].includes(v.status))
    : visitFilter === "completed" ? visits.filter(v => v.status === "completed")
    : visits.filter(v => ["cancelled", "no_show"].includes(v.status));

  const activity = [
    ...leads.map(l => ({ at: l.created_at, Icon: ChatCircle, text: `New lead: ${l.name} (${(l.source || "website").replace(/_/g, " ")})`, cls: "text-blue-600 bg-blue-50" })),
    ...visits.map(v => ({ at: v.updated_at || v.created_at, Icon: CalendarBlank, text: `Site visit ${String(v.status).replace(/_/g, " ")}: ${v.name} — ${v.property_title || v.project_name || "listing"}`, cls: "text-amber-600 bg-amber-50" })),
    ...assignedAll.map(a => ({ at: a.updated_at || a.created_at, Icon: UserCheck, text: `Assigned to you: ${a.title || a.name}${a.pending_approval ? " — edits pending approval" : ""}`, cls: "text-violet-600 bg-violet-50" })),
    ...items.filter(p => p.pending_approval).map(p => ({ at: p.updated_at, Icon: Clock, text: `Your edits to "${p.title}" are pending approval`, cls: "text-rose-600 bg-rose-50" })),
  ].filter(a => a.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8);

  return (
    <DashShell user={user} title="Agent Workspace" tab={tab} setTab={setTab} menu={[
      ["overview", "Overview", SquaresFour],
      ["leads", `Leads (${leads.length})`, ChatCircle],
      ["followups", `Follow-ups${followDue.length ? ` (${followDue.length})` : ""}`, Clock],
      ["visits", `Site Visits (${upcomingVisits.length})`, CalendarBlank],
      ["assigned", `Assigned (${assignedAll.length})`, UserCheck],
      ["listings", `My Listings (${items.length})`, House],
      ["drafts", "Drafts", FileDashed],
      ["clients", "Clients", Users],
      ["account", "Profile & Security", UserGear],
    ]} actions={[
      { to: "/agent/list-property?category=residential", label: "List Residential", primary: true, tid: "agent-list-residential" },
      { to: "/agent/list-property?category=commercial", label: "List Commercial", tid: "agent-list-commercial" },
    ]}>

      {tab === "overview" && (
        <div className="space-y-5" data-testid="agent-overview">
          <LeadsChart stats={leadStats} title="My Lead Performance" />
          <StatGrid stats={[
            ["Total Leads", leads.length],
            ["New Leads", leads.filter(l => (l.status || "new") === "new").length],
            ["Follow-ups Due", followDue.length],
            ["Site Visits", visits.length],
            ["Upcoming Visits", upcomingVisits.length],
            ["Assigned Listings", assignedAll.length],
            ["Pending Approvals", pendingApprovals.length],
          ]} />
          <div className="card-premium p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
            {activity.length === 0 && <div className="text-sm text-slate-500">No activity yet — new leads, site visits, assignments and approval updates will show here.</div>}
            <div className="space-y-2.5">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm" data-testid={`activity-${i}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.cls}`}><a.Icon size={15} /></span>
                  <span className="text-slate-700 flex-1 line-clamp-1">{a.text}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{fmtDay(a.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-5">
          <div className="flex gap-2 flex-wrap" data-testid="lead-filters">
            {[["all", `All Leads (${leads.length})`], ["new", "New"], ["contacted", "Contacted"], ["followup", `Follow-up (${followUps.length})`], ["site_visit", "Site Visit"], ["converted", "Converted"], ["lost", "Lost"]].map(([k, label]) => (
              <button key={k} onClick={() => setLeadFilter(k)} data-testid={`lead-filter-${k}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${leadFilter === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
            ))}
          </div>
          <div className="card-premium overflow-hidden" data-testid="agent-leads">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 text-left font-semibold">Client</th><th className="px-4 py-3 text-left font-semibold">Contact</th><th className="px-4 py-3 text-left font-semibold">Listing</th><th className="px-4 py-3 text-left font-semibold">Next Follow-up</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Details</th></tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-500">No leads in this view.</td></tr>}
                {filteredLeads.map(l => (
                  <Fragment key={l.id}>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{l.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{(l.source || "").replace(/_/g, " ")} · {fmtDay(l.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a href={`tel:${l.phone}`} title="Call" data-testid={`lead-call-${l.id}`} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"><PhoneCall size={15} /></a>
                          <a href={waLead(l)} target="_blank" rel="noopener" title="WhatsApp" data-testid={`lead-wa-${l.id}`} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"><WhatsappLogo size={15} /></a>
                          <span className="text-xs text-slate-600 ml-1">{l.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-40 truncate">{listingName(l)}</td>
                      <td className="px-4 py-3">
                        <input type="date" value={l.next_follow_up || ""} data-testid={`lead-followup-${l.id}`}
                          onChange={e => setFollowUp(l, e.target.value)}
                          className={`h-8 text-xs border rounded-lg px-2 bg-white ${l.next_follow_up && l.next_follow_up < today && isOpenLead(l) ? "border-rose-300 text-rose-600 font-semibold" : "border-slate-200"}`} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          data-testid={`agent-lead-status-${l.id}`}
                          value={l.status || "new"}
                          onChange={e => setLeadStatus(l, e.target.value)}
                          className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white"
                        >
                          {LEAD_STATUSES.map(s => <option key={s} value={s}>{leadLabel(s)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setOpenLead(openLead === l.id ? null : l.id); setNoteText(""); }} data-testid={`lead-details-${l.id}`} title="Details & notes"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"><PencilSimple size={15} /></button>
                      </td>
                    </tr>
                    {openLead === l.id && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={6} className="px-4 py-4">
                          {l.message && <div className="text-xs text-slate-600 mb-3"><span className="font-semibold">Enquiry:</span> {l.message}</div>}
                          <div className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Notes ({(l.notes || []).length})</div>
                          {(l.notes || []).length === 0 && <div className="text-xs text-slate-400 mb-2">No notes yet.</div>}
                          {(l.notes || []).map((n, i) => (
                            <div key={i} className="text-xs text-slate-600 mb-1"><span className="font-medium">{n.by || "You"}</span> · {fmtDay(n.at)} — {n.text}</div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…" data-testid={`lead-note-input-${l.id}`}
                              className="h-9 flex-1 text-xs border border-slate-200 rounded-lg px-3 bg-white" />
                            <button onClick={() => addNote(l)} data-testid={`lead-note-add-${l.id}`}
                              className="h-9 px-3 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Note</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === "followups" && (
        <div className="space-y-5" data-testid="agent-followups">
          {[["Overdue / Due Today", followUps.filter(l => l.next_follow_up <= today), true], ["Upcoming", followUps.filter(l => l.next_follow_up > today), false]].map(([label, list, overdue]) => (
            <div key={label} className="card-premium p-6">
              <h3 className={`text-lg font-bold mb-4 ${overdue ? "text-rose-600" : "text-slate-900"}`}>{label} Follow-ups ({list.length})</h3>
              {list.length === 0 && <div className="text-sm text-slate-500">None.</div>}
              <div className="space-y-3">
                {list.map(l => (
                  <div key={l.id} className="flex items-center gap-4 flex-wrap border border-slate-100 rounded-lg p-3" data-testid={`followup-row-${l.id}`}>
                    <div className="flex-1 min-w-40">
                      <div className="font-medium text-slate-900 text-sm">{l.name} <span className="text-xs font-normal text-slate-400">· {leadLabel(l.status || "new")}</span></div>
                      <div className="text-xs text-slate-500">{listingName(l)} · follow-up {l.next_follow_up}</div>
                      {(l.notes || []).length > 0 && <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Last note: {l.notes[l.notes.length - 1].text}</div>}
                    </div>
                    <input type="date" value={l.next_follow_up || ""} onChange={e => setFollowUp(l, e.target.value)} data-testid={`followup-date-${l.id}`} className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white" />
                    <a href={`tel:${l.phone}`} title="Call" data-testid={`followup-call-${l.id}`} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"><PhoneCall size={15} /></a>
                    <a href={waLead(l)} target="_blank" rel="noopener" title="WhatsApp follow-up" data-testid={`followup-wa-${l.id}`} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"><WhatsappLogo size={15} /></a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "visits" && (
        <div className="space-y-5" data-testid="agent-visits">
          <div className="flex gap-2 flex-wrap">
            {[["upcoming", `Upcoming (${visits.filter(v => ["requested", "confirmed", "rescheduled"].includes(v.status)).length})`], ["completed", `Completed (${visits.filter(v => v.status === "completed").length})`], ["cancelled", `Cancelled (${visits.filter(v => ["cancelled", "no_show"].includes(v.status)).length})`]].map(([k, label]) => (
              <button key={k} onClick={() => setVisitFilter(k)} data-testid={`visit-filter-${k}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${visitFilter === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
            ))}
          </div>
          <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 text-left font-semibold">Date & Time</th><th className="px-4 py-3 text-left font-semibold">Client</th><th className="px-4 py-3 text-left font-semibold">Property / Project</th><th className="px-4 py-3 text-left font-semibold">Notes</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Follow-up</th></tr>
              </thead>
              <tbody>
                {filteredVisits.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-500">No {visitFilter} site visits.</td></tr>}
                {filteredVisits.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0" data-testid={`visit-row-${v.id}`}>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap"><span className="font-semibold">{v.visit_date}</span> {v.visit_time || ""}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{v.name}</div>
                      <a href={`tel:${v.phone}`} className="text-xs text-blue-600">{v.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-44 truncate">{v.property_title || v.project_name || "—"}</td>
                    <td className="px-4 py-3">
                      <input defaultValue={v.notes || ""} placeholder="Add note…" data-testid={`visit-notes-${v.id}`}
                        onBlur={e => { if ((e.target.value || "") !== (v.notes || "")) setVisit(v, { notes: e.target.value }); }}
                        className="h-8 w-36 text-xs border border-slate-200 rounded-lg px-2 bg-white" />
                    </td>
                    <td className="px-4 py-3">
                      <select value={v.status} data-testid={`visit-status-${v.id}`} onChange={e => setVisit(v, { status: e.target.value })}
                        className="h-8 text-xs border border-slate-200 rounded-lg px-2 bg-white capitalize">
                        {VISIT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={waVisit(v)} target="_blank" rel="noopener" title="WhatsApp follow-up" data-testid={`visit-wa-${v.id}`} className="inline-block p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"><WhatsappLogo size={15} /></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === "assigned" && <AssignedPanel editPropertyBase="/agent/list-property" editProjectBase="/dashboard/edit-project" />}

      {tab === "listings" && (
        <div className="space-y-5">
          <StatGrid stats={[["My Listings", items.length], ["Active", items.filter(p => p.status === "active").length], ["Archived", items.filter(p => p.status === "archived").length], ["Featured", items.filter(p => p.featured).length]]} />
          <MyListings items={items} onChanged={loadListings} editBase="/agent/list-property" />
        </div>
      )}

      {tab === "drafts" && <DraftsPanel editPropertyBase="/agent/list-property" onChanged={loadListings} />}

      {tab === "clients" && (
        <div className="card-premium p-8 text-center text-slate-500" data-testid="agent-clients">
          Clients are your converted leads — mark a lead as "Converted" in Leads to build your client book.
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
      ["assigned", "Assigned to Me", UserCheck],
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

      {tab === "drafts" && <DraftsPanel editProjectBase="/developer/projects" onChanged={loadProjects} />}

      {tab === "assigned" && <AssignedPanel editProjectBase="/developer/projects" editPropertyBase="/dashboard/list-property" />}

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
