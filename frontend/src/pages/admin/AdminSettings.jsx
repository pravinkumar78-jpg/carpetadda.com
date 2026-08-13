import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FloppyDisk } from "@phosphor-icons/react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then(r => setS(r.data)).catch(() => toast.error("Failed to load settings"));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/admin/settings", s);
      setS(data);
      toast.success("Settings saved — live on site.");
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  };

  if (!s) return <div className="text-slate-500">Loading…</div>;

  const set = (k, v) => setS({ ...s, [k]: v });

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Website Settings</h2>
          <p className="text-sm text-slate-500">Contact details, socials, homepage & footer content, and site-wide SEO. Changes go live immediately.</p>
        </div>
        <button type="submit" disabled={saving} data-testid="settings-save" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-md shadow-blue-500/20 disabled:opacity-60">
          <FloppyDisk size={16} weight="bold" /> {saving ? "Saving…" : "Save all changes"}
        </button>
      </div>

      {/* Contact */}
      <Section title="Contact & Channels" subtitle="These fields power the header, footer, contact page and email dispatch.">
        <Grid>
          <Field label="Business email (lead recipient)"><Input data-testid="s-email" value={s.contact_email || ""} onChange={e => set("contact_email", e.target.value)} className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Contact phone"><Input value={s.contact_phone || ""} onChange={e => set("contact_phone", e.target.value)} placeholder="+91 22 0000 0000" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="WhatsApp number (digits only, incl. country code)"><Input data-testid="s-whatsapp" value={s.whatsapp_number || ""} onChange={e => set("whatsapp_number", e.target.value)} placeholder="919820000000" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Office address" full><Textarea rows={2} value={s.office_address || ""} onChange={e => set("office_address", e.target.value)} className="rounded-lg border-slate-200" /></Field>
        </Grid>
      </Section>

      {/* Socials */}
      <Section title="Social Links" subtitle="Shown in the footer social row. Leave blank to hide any platform.">
        <Grid>
          <Field label="Instagram URL"><Input value={s.instagram_url || ""} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="LinkedIn URL"><Input value={s.linkedin_url || ""} onChange={e => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/…" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Facebook URL"><Input value={s.facebook_url || ""} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="YouTube URL"><Input value={s.youtube_url || ""} onChange={e => set("youtube_url", e.target.value)} placeholder="https://youtube.com/…" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Twitter/X URL" full><Input value={s.twitter_url || ""} onChange={e => set("twitter_url", e.target.value)} placeholder="https://x.com/…" className="h-11 rounded-lg border-slate-200" /></Field>
        </Grid>
      </Section>

      {/* Homepage */}
      <Section title="Homepage Content" subtitle="The hero headline visitors see when they land on the homepage.">
        <Grid>
          <Field label="Hero headline"><Input data-testid="s-hero-headline" value={s.hero_headline || ""} onChange={e => set("hero_headline", e.target.value)} className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Highlighted word (rendered blue)"><Input value={s.hero_highlight || ""} onChange={e => set("hero_highlight", e.target.value)} placeholder="Address" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Hero subtitle" full><Textarea rows={2} value={s.hero_subtitle || ""} onChange={e => set("hero_subtitle", e.target.value)} className="rounded-lg border-slate-200" /></Field>
          <Field label="Hero image" full><ImageUpload value={s.hero_image || "/hero-carpetadda.png"} onChange={v => set("hero_image", v)} kind="general" dataTestid="hero-image-upload" allowUrl={false} /></Field>
        </Grid>
      </Section>


      {/* Email diagnostics */}
      <EmailDiagnostics />

      <Section title="Change Admin Password" subtitle="Change your own password securely. Your current password is required.">
        <AdminPasswordChange />
      </Section>

      {/* Footer */}
      <Section title="Footer Content" subtitle="The tagline that appears in the footer's left column.">
        <Field label="Footer tagline" full><Textarea rows={3} value={s.footer_tagline || ""} onChange={e => set("footer_tagline", e.target.value)} className="rounded-lg border-slate-200" /></Field>
      </Section>

      {/* SEO */}
      <Section title="Site-wide SEO Defaults" subtitle="Fallback meta values used for pages that don't set their own. Individual properties, projects and blog posts override these.">
        <Grid>
          <Field label="Site title suffix"><Input value={s.site_title_suffix || ""} onChange={e => set("site_title_suffix", e.target.value)} placeholder="CarpetAdda" className="h-11 rounded-lg border-slate-200" /></Field>
          <Field label="Default OG image" full>
            <ImageUpload value={s.default_og_image || ""} onChange={v => set("default_og_image", v)} kind="og" dataTestid="og-image-upload" />
          </Field>
          <Field label="Default meta description" full><Textarea rows={2} value={s.default_meta_description || ""} onChange={e => set("default_meta_description", e.target.value)} className="rounded-lg border-slate-200" /></Field>
        </Grid>
      </Section>

      <div className="pt-2">
        <button type="submit" disabled={saving} data-testid="settings-save-bottom" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-lg shadow-md shadow-blue-500/20 disabled:opacity-60">
          <FloppyDisk size={16} weight="bold" /> {saving ? "Saving…" : "Save all changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="card-premium p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }) { return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>; }

function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );
}


function EmailDiagnostics() {
  const [diag, setDiag] = useState(null);
  const [testing, setTesting] = useState(false);
  const load = () => api.get("/admin/email/status").then(r => setDiag(r.data)).catch(() => setDiag(null));
  useEffect(() => { load(); }, []);

  const sendTest = async () => {
    setTesting(true);
    try {
      const { data } = await api.post("/admin/email/test");
      toast.success(data.message || "Test email sent successfully");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Test email failed");
      load();
    } finally { setTesting(false); }
  };

  const badge = diag?.smtp_status === "CONNECTED"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : diag?.provider === "emergent-proxy"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  const label = diag?.smtp_status === "CONNECTED" ? "CONNECTED" : diag?.provider === "emergent-proxy" ? "MANAGED EMAIL ACTIVE" : "NOT CONFIGURED";
  const last = diag?.last_email;

  return (
    <div className="card-premium p-6" data-testid="email-diagnostics">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Email Delivery Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">All enquiries are emailed to {diag?.recipient || "contact@carpetadda.com"}{" "}(agent/developer CC on linked listings).</p>
        </div>
        {diag && <span data-testid="email-status-badge" className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${badge}`}>{label}</span>}
      </div>
      {diag && (
        <div className="space-y-3 text-sm">
          <div className="text-slate-600" data-testid="email-provider-detail">{diag.detail}</div>
          {last && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500" data-testid="email-last">
              <span>Last email: <span className={`font-semibold ${last.status === "sent" ? "text-emerald-600" : "text-rose-600"}`}>{(last.status || "").toUpperCase()}</span></span>
              <span>Type: <span className="font-medium text-slate-700">{last.kind}</span></span>
              <span>At: <span className="font-medium text-slate-700">{new Date(last.at).toLocaleString("en-IN")}</span></span>
              {last.error && <span className="text-rose-600" data-testid="email-last-error">{String(last.error).slice(0, 120)}</span>}
            </div>
          )}
          <button type="button" onClick={sendTest} disabled={testing} data-testid="send-test-email"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {testing ? "Sending…" : "Send Test Email"}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminPasswordChange() {  const [f,setF]=useState({current_password:"",new_password:"",confirm_password:""}); const [busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();if(f.new_password.length<8){toast.error("New password must be at least 8 characters");return;}if(f.new_password!==f.confirm_password){toast.error("Passwords do not match");return;}setBusy(true);try{await api.post("/auth/change-password",f);setF({current_password:"",new_password:"",confirm_password:""});toast.success("Password changed successfully");}catch(err){toast.error(err?.response?.data?.detail||"Password change failed");}finally{setBusy(false);}};
  return <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4"><Input required type="password" placeholder="Current password" value={f.current_password} onChange={e=>setF({...f,current_password:e.target.value})}/><Input required minLength={8} type="password" placeholder="New password" value={f.new_password} onChange={e=>setF({...f,new_password:e.target.value})}/><div className="flex gap-2"><Input required minLength={8} type="password" placeholder="Confirm new password" value={f.confirm_password} onChange={e=>setF({...f,confirm_password:e.target.value})}/><button disabled={busy} className="px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60">{busy?"Saving…":"Update"}</button></div></form>;
}
