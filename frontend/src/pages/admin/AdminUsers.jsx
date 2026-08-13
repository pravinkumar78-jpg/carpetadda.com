import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Key, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

const ROLES = ["user", "agent", "developer", "owner", "admin", "super_admin"];

const roleBadge = (r) => ({
  super_admin: "bg-rose-50 text-rose-700",
  admin: "bg-blue-50 text-blue-700",
  agent: "bg-amber-50 text-amber-700",
  developer: "bg-violet-50 text-violet-700",
  owner: "bg-emerald-50 text-emerald-700",
  user: "bg-slate-100 text-slate-600",
}[r] || "bg-slate-100 text-slate-600");

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [editing, setEditing] = useState(null);
  const [pwUser, setPwUser] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setRows(data || []);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  const remove = async (u) => {
    if (u.id === me.id) return toast.error("You cannot delete your own account");
    if (!confirm(`Delete ${u.name} (${u.email})? This is permanent.`)) return;
    try { await api.delete(`/admin/users/${u.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Delete failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users & Roles</h2>
          <p className="text-sm text-slate-500">Manage admins, agents, developers and customers. Reset passwords securely.</p>
        </div>
        <button data-testid="user-add" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20">
          <Plus size={15} weight="bold" /> Add User
        </button>
      </div>

      <div className="card-premium p-4 mb-4 flex items-center gap-3 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); load(); }} className="flex-1 min-w-[220px] max-w-sm relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or email…" className="pl-9 h-10 rounded-lg border-slate-200" data-testid="users-search" />
        </form>
        <Select value={role || "all"} onValueChange={v => setRole(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 h-10 rounded-lg border-slate-200" data-testid="users-filter-role"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Verified</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-500">No users found.</td></tr>}
              {!loading && rows.map(u => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge(u.role)}`}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.verified ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{u.active === false ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">Inactive</span> : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Active</span>}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(u)} data-testid={`user-edit-${u.id}`} title="Change role" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setPwUser(u)} data-testid={`user-pw-${u.id}`} title="Reset password" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Key size={14} /></button>
                      <button onClick={() => remove(u)} data-testid={`user-del-${u.id}`} title="Delete user" className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <RoleDialog user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {pwUser && <PasswordDialog user={pwUser} onClose={() => setPwUser(null)} />}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function CreateUserDialog({ onClose, onSaved }) {
  const [form, setForm] = useState({ role: "user", name: "", phone: "", email: "", password: "", active: true, verified: true });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email required"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      await api.post("/admin/users", form);
      toast.success(`User created — ${form.role} account for ${form.email}`);
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.detail || "Create failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="create-user-dialog">
        <DialogHeader><DialogTitle className="text-2xl">Add User</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">Role *</div>
            <Select value={form.role} onValueChange={v => set("role", v)}>
              <SelectTrigger data-testid="create-user-role" className="h-11 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-slate-400 mt-1">
              {form.role === "admin" || form.role === "super_admin" ? "Full admin panel access" :
               form.role === "agent" ? "Can list & manage own properties and leads" :
               form.role === "developer" ? "Can list & manage own projects and units" :
               "Can browse, save favorites and list own property"}
            </p>
          </div>
          <div><div className="text-xs font-semibold text-slate-600 mb-1">Name *</div><Input data-testid="create-user-name" value={form.name} onChange={e => set("name", e.target.value)} className="h-11 rounded-lg border-slate-200" /></div>
          <div><div className="text-xs font-semibold text-slate-600 mb-1">Mobile</div><Input data-testid="create-user-phone" value={form.phone} onChange={e => set("phone", e.target.value)} className="h-11 rounded-lg border-slate-200" /></div>
          <div><div className="text-xs font-semibold text-slate-600 mb-1">Email *</div><Input data-testid="create-user-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} className="h-11 rounded-lg border-slate-200" /></div>
          <div><div className="text-xs font-semibold text-slate-600 mb-1">Password *</div><Input data-testid="create-user-password" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" className="h-11 rounded-lg border-slate-200" /></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" data-testid="create-user-active" checked={form.active} onChange={e => set("active", e.target.checked)} /> Active</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" data-testid="create-user-verified" checked={form.verified} onChange={e => set("verified", e.target.checked)} /> Email verified (skip verification email)</label>
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="create-user-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Creating…" : "Create User"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role);
  const [verified, setVerified] = useState(!!user.verified);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/admin/users/${user.id}`, { role, verified });
      toast.success("User updated");
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="role-dialog">
        <DialogHeader><DialogTitle className="text-2xl">Change role · {user.name}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">Role</div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="role-select" className="h-11 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /> Verified
          </label>
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="role-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ user, onClose }) {
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/admin/users/${user.id}/reset-password`);
      toast.success("Password reset link sent to the user email.");
      onClose();
    } catch (err) { toast.error(err?.response?.data?.detail || "Reset failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="pw-dialog">
        <DialogHeader><DialogTitle className="text-2xl">Reset password · {user.name}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-500">A secure, one-time reset link will be sent to the user’s registered email. The link expires in 30 minutes.</p>
          
          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} data-testid="pw-save" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-60">{busy ? "Sending…" : "Send reset link"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
