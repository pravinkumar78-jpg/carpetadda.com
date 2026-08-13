import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { FloppyDisk, ArrowLeft, Article } from "@phosphor-icons/react";

export const MAJOR_PAGES = [
  ["/", "Home"],
  ["/properties", "Properties (Buy/Rent)"],
  ["/projects", "New Launches"],
  ["/blog", "Blog"],
  ["/about", "About Us"],
  ["/contact", "Contact"],
  ["/faqs", "FAQs"],
  ["/home-loan", "Home Loan"],
  ["/post-property", "List Property"],
  ["/ai-search", "AI Search"],
  ["/emi-calculator", "EMI Calculator"],
  ["/agents", "Agents"],
  ["/developers", "Developers"],
];

const EMPTY = { meta_title: "", meta_description: "", meta_keywords: "", og_title: "", og_description: "", og_image: "", canonical_url: "", robots: "index,follow" };

export default function AdminSeo({ page = null, onSelectPage = null }) {
  const [form, setForm] = useState(EMPTY);
  const [savedPages, setSavedPages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    api.get("/admin/seo-pages").then(r => setSavedPages(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!page) return;
    setLoadErr(false);
    api.get(`/seo?page=${encodeURIComponent(page)}`)
      .then(r => setForm({ ...EMPTY, ...(r.data || {}) }))
      .catch(() => { setForm(EMPTY); setLoadErr(true); });
  }, [page]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!page) return;
    setBusy(true);
    try {
      await api.put("/admin/seo-pages", { page, ...form });
      const { data } = await api.get("/admin/seo-pages");
      setSavedPages(data || []);
      toast.success("SEO saved — live on the site now");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  // No page selected → show the SEO page list (selection happens via left sidebar)
  if (!page) {
    return (
      <div data-testid="admin-seo">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">SEO → Pages</h2>
          <p className="text-sm text-slate-500">Select a page from the left SEO navigation to edit its settings.</p>
        </div>
        <div className="card-premium divide-y divide-slate-100 max-w-3xl" data-testid="seo-page-list">
          {MAJOR_PAGES.map(([v, l]) => {
            const has = savedPages.some(s => s.page === v);
            return (
              <button key={v} onClick={() => onSelectPage?.(v)} data-testid={`seo-open-${v.replace(/\//g, "_") || "_home"}`}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-blue-50/50 transition-colors group">
                <span className="flex items-center gap-3">
                  <Article size={16} className="text-slate-400 group-hover:text-blue-600" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{l}</span>
                    <span className="block text-xs text-slate-400">{v}</span>
                  </span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${has ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {has ? "Configured" : "Not set"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const label = MAJOR_PAGES.find(([v]) => v === page)?.[1] || page;

  return (
    <div data-testid="admin-seo-edit">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        {onSelectPage && (
          <button onClick={() => onSelectPage(null)} data-testid="seo-back" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={14} weight="bold" /> All pages
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">SEO · {label}</h2>
          <p className="text-sm text-slate-500">{page} {loadErr && <span className="text-amber-600">· No saved data yet — defaults loaded, save to create.</span>}</p>
        </div>
      </div>

      <div className="card-premium p-6 lg:p-8 space-y-4 max-w-3xl">
        <F label="Meta Title"><Input data-testid="seo-meta-title" value={form.meta_title || ""} onChange={e => set("meta_title", e.target.value)} placeholder="Page title shown in search results" /></F>
        <F label="Meta Description"><Textarea rows={2} data-testid="seo-meta-description" value={form.meta_description || ""} onChange={e => set("meta_description", e.target.value)} placeholder="155-character summary for search results" /></F>
        <F label="Meta Keywords"><Input data-testid="seo-meta-keywords" value={form.meta_keywords || ""} onChange={e => set("meta_keywords", e.target.value)} placeholder="2 bhk dombivli, buy flat mumbai" /></F>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Robots">
            <Select value={form.robots || "index,follow"} onValueChange={v => set("robots", v)}>
              <SelectTrigger data-testid="seo-robots" className="border-slate-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="index,follow">index, follow</SelectItem>
                <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Canonical URL"><Input data-testid="seo-canonical" value={form.canonical_url || ""} onChange={e => set("canonical_url", e.target.value)} placeholder="https://carpetadda.com/…" /></F>
        </div>
        <F label="OG Title"><Input data-testid="seo-og-title" value={form.og_title || ""} onChange={e => set("og_title", e.target.value)} /></F>
        <F label="OG Description"><Textarea rows={2} data-testid="seo-og-description" value={form.og_description || ""} onChange={e => set("og_description", e.target.value)} /></F>
        <F label="OG Image"><ImageUpload value={form.og_image || ""} onChange={v => set("og_image", v)} kind="og" dataTestid="seo-og-image-upload" /></F>
        <button onClick={save} disabled={busy} data-testid="seo-save" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors">
          <FloppyDisk size={15} weight="bold" /> {busy ? "Saving…" : "Save SEO"}
        </button>
      </div>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
