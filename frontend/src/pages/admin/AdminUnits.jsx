import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";
import ImageUpload from "@/components/ImageUpload";
import {
  ArrowLeft, Plus, Trash, PencilSimple, Package, MagnifyingGlass, ClockCounterClockwise, Rows,
} from "@phosphor-icons/react";

const STATUSES = [
  { key: "available", label: "Available", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { key: "limited",   label: "Limited Units", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "hold",      label: "Hold",      cls: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: "token",     label: "Token",     cls: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "booked",    label: "Booked",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "sold",      label: "Sold Out",  cls: "bg-rose-100 text-rose-700 border-rose-200" },
];
const statusMeta = (k) => STATUSES.find(s => s.key === k) || STATUSES[0];

export default function AdminUnits() {
  const { id: projectId } = useParams();
  const { user, ready } = useAuth();

  const [project, setProject] = useState(null);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ available: 0, hold: 0, token: 0, booked: 0, sold: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterTower, setFilterTower] = useState("");
  const [filterTypology, setFilterTypology] = useState("");
  const [q, setQ] = useState("");

  const [showBulk, setShowBulk] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null); // full unit row
  const [historyOf, setHistoryOf] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterTower) params.set("tower", filterTower);
      if (filterTypology) params.set("typology", filterTypology);
      if (q) params.set("q", q);
      const { data } = await api.get(`/projects/${projectId}/units?${params.toString()}`);
      setRows(data.items || []);
      setCounts(data.counts || {});
    } catch (e) {
      toast.error("Failed to load units");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    api.get(`/projects/${projectId}`).then(r => setProject(r.data)).catch(() => setProject(false));
  }, [projectId]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId, filterStatus, filterTower, filterTypology]);

  const towers = useMemo(() => Array.from(new Set(rows.map(r => r.tower).filter(Boolean))), [rows]);
  const typologies = useMemo(() => Array.from(new Set(rows.map(r => r.typology).filter(Boolean))), [rows]);

  const onSearch = (e) => { e.preventDefault(); load(); };

  const changeStatus = async (row, newStatus) => {
    if (newStatus === row.status) return;
    try {
      await api.put(`/units/${row.id}`, { status: newStatus, status_note: `Quick change from ${row.status}` });
      toast.success(`Marked ${statusMeta(newStatus).label}`);
      load();
    } catch { toast.error("Update failed"); }
  };

  const remove = async (row) => {
    if (!confirm(`Delete unit ${row.unit_no}? This cannot be undone.`)) return;
    try { await api.delete(`/units/${row.id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  if (!ready) return null;
  if (!user || (user.role !== "admin" && user.role !== "super_admin" && user.role !== "developer")) return <Navigate to="/login" />;
  if (project === false) return <div className="p-20 text-center text-slate-500">Project not found</div>;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="section-blue py-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 mb-3">
            <ArrowLeft size={14} /> Back to Admin
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-1">Inventory Manager</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {project?.name || "Loading…"}
              </h1>
              <p className="text-slate-600 text-sm mt-1 capitalize">
                {project ? `${project.location?.replace("-"," ")}, ${project.city}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button data-testid="units-bulk-add" onClick={() => setShowBulk(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-sm font-medium shadow-sm">
                <Rows size={16} weight="bold" /> Bulk Add
              </button>
              <button data-testid="units-add" onClick={() => { setEditing(null); setShowAdd(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
                <Plus size={16} weight="bold" /> Add Unit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} icon={Package} tone="slate" active={!filterStatus} onClick={() => setFilterStatus("")} testid="stat-total" />
          {STATUSES.map(s => (
            <StatCard key={s.key} label={s.label} value={counts[s.key]} tone={s.key} active={filterStatus===s.key} onClick={() => setFilterStatus(filterStatus===s.key ? "" : s.key)} testid={`stat-${s.key}`} />
          ))}
        </div>

        {/* Filters */}
        <div className="card-premium p-4 mb-4 flex items-center gap-3 flex-wrap">
          <form onSubmit={onSearch} className="flex-1 min-w-[220px] max-w-sm relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search unit no. or buyer…" className="pl-9 h-10 border-slate-200 rounded-lg" data-testid="units-search" />
          </form>
          <Select value={filterTower || "all"} onValueChange={v => setFilterTower(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40 h-10 border-slate-200 rounded-lg" data-testid="units-filter-tower"><SelectValue placeholder="All towers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All towers</SelectItem>
              {towers.map(t => <SelectItem key={t} value={t}>Tower {t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTypology || "all"} onValueChange={v => setFilterTypology(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40 h-10 border-slate-200 rounded-lg" data-testid="units-filter-typology"><SelectValue placeholder="All typologies" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All typologies</SelectItem>
              {typologies.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterStatus || filterTower || filterTypology || q) && (
            <button onClick={() => { setFilterStatus(""); setFilterTower(""); setFilterTypology(""); setQ(""); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
          )}
        </div>

        {/* Table */}
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-left font-semibold">Tower / Floor</th>
                  <th className="px-4 py-3 text-left font-semibold">Typology</th>
                  <th className="px-4 py-3 text-left font-semibold">Carpet</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Buyer</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="text-center py-16 text-slate-500">Loading…</td></tr>}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 text-slate-500">
                    No units yet. Click <b>Bulk Add</b> to generate units across floors.
                  </td></tr>
                )}
                {!loading && rows.map(r => {
                  const m = statusMeta(r.status);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.unit_no}</td>
                      <td className="px-4 py-3 text-slate-600">{r.tower ? `Tower ${r.tower}` : "—"} · Floor {r.floor ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{r.typology || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.carpet_area ? `${r.carpet_area} sqft` : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{r.price ? formatINR(r.price) : "—"}</td>
                      <td className="px-4 py-3">
                        <Select value={r.status} onValueChange={v => changeStatus(r, v)}>
                          <SelectTrigger data-testid={`unit-status-${r.id}`} className={`h-8 px-3 py-1 text-xs font-semibold border rounded-full w-[110px] ${m.cls}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {r.buyer_name ? (
                          <div>
                            <div className="font-medium text-slate-800">{r.buyer_name}</div>
                            <div className="text-slate-500">{r.buyer_phone || ""}</div>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setHistoryOf(r)} title="Audit log" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <ClockCounterClockwise size={14} />
                          </button>
                          <button onClick={() => { setEditing(r); setShowAdd(true); }} data-testid={`unit-edit-${r.id}`} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <PencilSimple size={14} />
                          </button>
                          <button onClick={() => remove(r)} data-testid={`unit-del-${r.id}`} title="Delete" className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showBulk && <BulkAddDialog open={showBulk} onClose={() => setShowBulk(false)} projectId={projectId} onDone={load} />}
      {showAdd && <UnitFormDialog open={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} projectId={projectId} unit={editing} onDone={load} />}
      {historyOf && <HistoryDialog unit={historyOf} onClose={() => setHistoryOf(null)} />}
    </div>
  );
}

function StatCard({ label, value, tone = "slate", active, onClick, testid }) {
  const toneMap = {
    slate:     "bg-white text-slate-900",
    available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hold:      "bg-slate-50 text-slate-700 border-slate-200",
    token:     "bg-amber-50 text-amber-700 border-amber-200",
    booked:    "bg-blue-50 text-blue-700 border-blue-200",
    sold:      "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`card-premium p-4 text-left transition-all ${toneMap[tone]} ${active ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="text-xs uppercase tracking-widest font-semibold opacity-75">{label}</div>
      <div className="text-3xl font-bold mt-1">{value ?? 0}</div>
    </button>
  );
}

function BulkAddDialog({ open, onClose, projectId, onDone }) {
  const [form, setForm] = useState({
    tower: "A", floor_from: 1, floor_to: 10, units_per_floor: 4,
    unit_no_prefix: "A-", start_index: 1, typology: "2 BHK",
    carpet_area: 750, price: 9500000,
  });
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    const rows = [];
    const from = Math.max(1, parseInt(form.floor_from) || 1);
    const to = Math.max(from, parseInt(form.floor_to) || from);
    const upf = Math.max(1, Math.min(50, parseInt(form.units_per_floor) || 1));
    const start = parseInt(form.start_index) || 1;
    for (let f = from; f <= to; f++) {
      for (let i = 0; i < upf; i++) {
        rows.push(`${form.unit_no_prefix}${String(f).padStart(2,"0")}${String(start + i).padStart(2,"0")}`);
      }
    }
    return rows;
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (preview.length === 0) return;
    if (preview.length > 2000 && !confirm(`Create ${preview.length} units. Continue?`)) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/units/bulk`, {
        ...form,
        floor_from: parseInt(form.floor_from),
        floor_to: parseInt(form.floor_to),
        units_per_floor: parseInt(form.units_per_floor),
        start_index: parseInt(form.start_index),
        carpet_area: form.carpet_area ? parseFloat(form.carpet_area) : null,
        price: form.price ? parseFloat(form.price) : null,
      });
      toast.success(`Created ${data.created} units${data.skipped_duplicates ? ` · Skipped ${data.skipped_duplicates} duplicates` : ""}`);
      onDone(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Bulk create failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="bulk-add-dialog">
        <DialogHeader><DialogTitle className="text-2xl">Bulk-generate units</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tower"><Input data-testid="bulk-tower" value={form.tower} onChange={e => setForm({...form, tower: e.target.value})} /></Field>
            <Field label="Unit no. prefix"><Input data-testid="bulk-prefix" value={form.unit_no_prefix} onChange={e => setForm({...form, unit_no_prefix: e.target.value})} /></Field>
            <Field label="Floor from"><Input data-testid="bulk-floor-from" type="number" min={1} value={form.floor_from} onChange={e => setForm({...form, floor_from: e.target.value})} /></Field>
            <Field label="Floor to"><Input data-testid="bulk-floor-to" type="number" min={1} value={form.floor_to} onChange={e => setForm({...form, floor_to: e.target.value})} /></Field>
            <Field label="Units / floor"><Input data-testid="bulk-upf" type="number" min={1} max={50} value={form.units_per_floor} onChange={e => setForm({...form, units_per_floor: e.target.value})} /></Field>
            <Field label="Starting unit index"><Input type="number" min={1} value={form.start_index} onChange={e => setForm({...form, start_index: e.target.value})} /></Field>
            <Field label="Typology"><Input placeholder="e.g. 2 BHK" value={form.typology} onChange={e => setForm({...form, typology: e.target.value})} /></Field>
            <Field label="Carpet area (sqft)"><Input type="number" value={form.carpet_area} onChange={e => setForm({...form, carpet_area: e.target.value})} /></Field>
            <Field label="Price (₹)" className="col-span-2"><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></Field>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-slate-700">
            <div className="font-semibold text-blue-700 mb-1">Preview · {preview.length} units will be created</div>
            <div className="font-mono text-slate-600">{preview.slice(0, 12).join(", ")}{preview.length > 12 ? `, … (+${preview.length - 12} more)` : ""}</div>
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={busy} data-testid="bulk-submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
              {busy ? "Creating…" : `Create ${preview.length} units`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnitFormDialog({ open, onClose, projectId, unit, onDone }) {
  const [form, setForm] = useState(unit || {
    unit_no: "", tower: "A", floor: 1, typology: "2 BHK",
    carpet_area: "", balcony: "", parking: "", price: "", status: "available",
    notes: "", facing: "", unit_plan: "", description: "", published: true,
  });
  const [busy, setBusy] = useState(false);
  const isEdit = !!unit;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        unit_no: form.unit_no?.trim() || `U-${Date.now().toString(36).toUpperCase()}`,
        floor: form.floor === "" || form.floor === null ? null : parseInt(form.floor),
        carpet_area: form.carpet_area === "" || form.carpet_area === null ? null : parseFloat(form.carpet_area),
        balcony: form.balcony === "" || form.balcony === null ? null : parseInt(form.balcony),
        parking: form.parking === "" || form.parking === null ? null : parseInt(form.parking),
        price: form.price === "" || form.price === null ? null : parseFloat(form.price),
      };
      if (isEdit) {
        await api.put(`/units/${unit.id}`, payload);
        toast.success("Unit updated");
      } else {
        await api.post(`/projects/${projectId}/units`, payload);
        toast.success(form.published ? "Unit saved & published" : "Unit saved as draft");
      }
      onDone(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="unit-form-dialog">
        <DialogHeader><DialogTitle className="text-2xl">{isEdit ? "Edit unit" : "Add unit"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Configuration"><Input data-testid="unit-form-config" placeholder="e.g. 2 BHK" value={form.typology || ""} onChange={e => setForm({...form, typology: e.target.value})} /></Field>
            <Field label="Unit no. (auto if blank)"><Input data-testid="unit-form-no" value={form.unit_no || ""} onChange={e => setForm({...form, unit_no: e.target.value})} /></Field>
            <Field label="Carpet (sqft)"><Input type="number" value={form.carpet_area ?? ""} onChange={e => setForm({...form, carpet_area: e.target.value})} /></Field>
            <Field label="Balcony"><Input type="number" value={form.balcony ?? ""} onChange={e => setForm({...form, balcony: e.target.value})} /></Field>
            <Field label="Parking"><Input type="number" value={form.parking ?? ""} onChange={e => setForm({...form, parking: e.target.value})} /></Field>
            <Field label="Price (₹)"><Input type="number" value={form.price ?? ""} onChange={e => setForm({...form, price: e.target.value})} /></Field>
            <Field label="Tower"><Input value={form.tower || ""} onChange={e => setForm({...form, tower: e.target.value})} /></Field>
            <Field label="Floor"><Input type="number" value={form.floor ?? ""} onChange={e => setForm({...form, floor: e.target.value})} /></Field>
            <Field label="Status">
              <Select value={form.status || "available"} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger data-testid="unit-form-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Facing"><Input value={form.facing || ""} onChange={e => setForm({...form, facing: e.target.value})} /></Field>
          </div>
          <Field label="Upload Unit Plan">
            <ImageUpload value={form.unit_plan || ""} onChange={v => setForm({...form, unit_plan: v})} kind="projects" dataTestid="unit-plan-upload" allowUrl={false} />
          </Field>
          <Field label="Description"><Textarea rows={2} data-testid="unit-form-description" value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} placeholder="Corner unit, east facing, deck view…" /></Field>
          <Field label="Notes (internal)"><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" data-testid="unit-form-published" checked={!!form.published} onChange={e => setForm({...form, published: e.target.checked})} /> Published (visible on project page)
          </label>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={busy} data-testid="unit-form-submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
              {busy ? "Saving…" : (form.published ? "Save & Publish" : "Save changes")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ unit, onClose }) {
  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-xl">Audit log · Unit {unit.unit_no}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {(unit.history || []).slice().reverse().map((h, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span className="font-medium capitalize">{h.from || "—"}</span>
                  <span className="mx-1">→</span>
                  <span className="font-semibold capitalize text-blue-600">{h.to}</span>
                </div>
                <div className="text-xs text-slate-500">{new Date(h.at).toLocaleString()}</div>
              </div>
              {h.note && <div className="text-xs text-slate-600 mt-1">{h.note}</div>}
            </div>
          ))}
          {(!unit.history || unit.history.length === 0) && <div className="text-slate-500 text-sm">No history yet.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
