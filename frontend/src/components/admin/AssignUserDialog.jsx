import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/** Super-admin: assign an existing user to a property/project (or remove assignment). */
export default function AssignUserDialog({ kind, item, onClose, onDone }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(item?.assigned_to || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/users?page_size=200").then(r => setUsers(r.data.items || r.data || [])).catch(() => setUsers([]));
  }, []);
  useEffect(() => { setUserId(item?.assigned_to || ""); }, [item]);

  if (!item) return null;
  const name = item.title || item.name;

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/${kind}/${item.id}/assign`, { user_id: userId || null });
      toast.success(userId ? "User assigned" : "Assignment removed");
      onDone?.(); onClose();
    } catch (err) { toast.error(err?.response?.data?.detail || "Assignment failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="assign-user-dialog">
        <DialogHeader><DialogTitle className="text-xl">Assign User</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-600">Assign <span className="font-semibold text-slate-900">{name}</span> to a user. They will see it in their dashboard and can edit it; edits to a live listing need your approval.</p>
        <Select value={userId || "none"} onValueChange={v => setUserId(v === "none" ? "" : v)}>
          <SelectTrigger data-testid="assign-user-select" className="h-11 rounded-lg border-slate-300"><SelectValue placeholder="Select user" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Unassigned —</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
          <button type="button" onClick={save} disabled={busy} data-testid="assign-user-save"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {busy ? "Saving…" : "Save Assignment"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
