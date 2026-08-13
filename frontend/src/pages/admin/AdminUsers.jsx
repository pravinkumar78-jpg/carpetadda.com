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
                <th className="px-4 py-3 text-left font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-500">No users found.</td></tr>}
              {!loading && rows.map(u => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge(u.role)}`}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.verified ? "✓" : "—"}</td>
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
    </div>
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
