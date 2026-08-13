import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Reject modal: requires a reason, emails the owner, keeps the listing for resubmission.
export default function RejectDialog({ row, kind, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!row) return null;
  const name = row.title || row.name;

  const submit = async () => {
    if (!reason.trim()) { toast.error("Please enter a rejection reason — it is emailed to the owner"); return; }
    setBusy(true);
    try {
      await api.put(`/admin/${kind}/${row.id}/reject`, { reason: reason.trim() });
      toast.success("Rejected — owner notified by email and can resubmit");
      onDone();
      onClose();
    } catch (err) { toast.error(err?.response?.data?.detail || "Reject failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="reject-dialog">
        <DialogHeader><DialogTitle className="text-xl">Reject · {name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">The listing stays saved for the owner to correct and resubmit. The owner receives an email with your reason.</p>
          <Textarea data-testid="reject-reason" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Photos are blurry, please upload clear interior shots and a valid RERA number." className="rounded-lg border-slate-200" />
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={busy} data-testid="reject-confirm" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60">{busy ? "Rejecting…" : "Reject & Notify Owner"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
