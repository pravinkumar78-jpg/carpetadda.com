import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Archive, ArrowCounterClockwise, PencilSimple } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";

export function AccountPanel({ user }) {
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [busyP, setBusyP] = useState(false);
  const [busyPw, setBusyPw] = useState(false);
  const { logout, refresh } = useAuth();

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusyP(true);
    try {
      await api.put("/auth/profile", profile);
      await refresh?.();
      toast.success("Profile updated");
    } catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
    finally { setBusyP(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.new_password.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (pw.new_password !== pw.confirm_password) { toast.error("New passwords do not match"); return; }
    setBusyPw(true);
    try {
      await api.post("/auth/change-password", pw);
      toast.success("Password updated");
      setPw({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
    finally { setBusyPw(false); }
  };

  const resendVerification = async () => {
    try {
      const { data } = await api.post("/auth/resend-verification");
      toast.success(data.message || "Verification email sent");
      await refresh?.();
    } catch { toast.error("Could not send verification email"); }
  };

  return (
    <div className="space-y-6" data-testid="account-panel">
      <div className="card-premium p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h3 className="text-lg font-bold text-slate-900">Account Status</h3>
          {user.verified
            ? <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">Email verified</span>
            : <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">Email not verified
                <button onClick={resendVerification} data-testid="resend-verification" className="underline">Resend link</button>
              </span>}
        </div>
        <div className="text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-900">{user.email}</span> · <span className="capitalize">{user.role.replace("_", " ")}</span></div>
      </div>

      <div className="card-premium p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-5">Manage Profile</h3>
        <form onSubmit={saveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name</label>
            <Input data-testid="profile-name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Mobile</label>
            <Input data-testid="profile-phone" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busyP} data-testid="profile-save" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">{busyP ? "Saving…" : "Save Profile"}</button>
          </div>
        </form>
      </div>

      <div className="card-premium p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-5">Change Password</h3>
        <form onSubmit={changePw} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Current Password</label>
            <Input required type="password" data-testid="pw-current" value={pw.current_password} onChange={e => setPw({ ...pw, current_password: e.target.value })} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">New Password</label>
            <Input required type="password" data-testid="pw-new" value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirm New</label>
            <Input required type="password" data-testid="pw-confirm" value={pw.confirm_password} onChange={e => setPw({ ...pw, confirm_password: e.target.value })} className="h-11 rounded-lg border-slate-200" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={busyPw} data-testid="pw-change-save" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">{busyPw ? "Updating…" : "Update Password"}</button>
          </div>
        </form>
      </div>

      <button onClick={logout} data-testid="dashboard-logout" className="w-full card-premium p-4 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
        Logout →
      </button>
    </div>
  );
}

export function MyListings({ items, onChanged, editBase = "/dashboard/list-property", nameKey = "title" }) {
  const act = async (p, action) => {
    const verb = action === "archive" ? "Archive" : "Restore";
    if (action === "archive" && !confirm("Archive this listing? It will be hidden from the site. You can restore it anytime.")) return;
    try {
      await api.put(`/admin/properties/${p.id}/${action}`);
      toast.success(`${verb}d successfully`);
      onChanged();
    } catch (err) { toast.error(err?.response?.data?.detail || `${verb} failed`); }
  };

  return (
    <div className="card-premium overflow-hidden" data-testid="my-listings">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3 text-left font-semibold">Listing</th><th className="px-4 py-3 text-left font-semibold">Price</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No listings yet.</td></tr>}
            {items.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3"><div className="font-medium text-slate-900 line-clamp-1">{p[nameKey]}</div><div className="text-xs text-slate-500 capitalize">{p.location?.replace("-", " ")}</div></td>
                <td className="px-4 py-3 rupee">{formatINR(p.listing_type === "rent" ? p.rent : p.price)}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : p.status === "pending_review" ? "bg-amber-50 text-amber-700" : p.status === "rejected" ? "bg-rose-50 text-rose-600" : p.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-500"}`}>{({ active: "Approved · Live", pending_review: "Pending Review", rejected: "Rejected", archived: "Archived", draft: "Draft" })[p.status] || p.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`${editBase}/${p.id}/edit`} data-testid={`mylist-edit-${p.id}`} title="Edit" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><PencilSimple size={14} /></Link>
                    {p.status === "archived"
                      ? <button onClick={() => act(p, "restore")} data-testid={`mylist-restore-${p.id}`} title="Restore" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><ArrowCounterClockwise size={14} /></button>
                      : <button onClick={() => act(p, "archive")} data-testid={`mylist-archive-${p.id}`} title="Archive" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Archive size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
