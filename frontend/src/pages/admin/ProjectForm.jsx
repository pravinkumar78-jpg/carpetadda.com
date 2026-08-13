import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FloppyDisk, Upload, Eye, Info, House, MapPin, Sparkle, Image as ImageIcon, MagnifyingGlass, Flag, Globe, CircleNotch } from "@phosphor-icons/react";
import ImageUpload from "@/components/ImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import AddAmenity from "@/components/AddAmenity";
import RegisterDeveloper from "@/components/RegisterDeveloper";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];
const PROJECT_FLAGS = [["featured", "Featured"], ["new_launch", "New Launch"], ["best_payment_plan", "Best Payment Plan"], ["best_performer", "Best Performer"]];
const AMENITIES = ["Swimming Pool", "Gym", "Clubhouse", "Landscaped Garden", "Children's Play Area", "Jogging Track", "24x7 Security", "CCTV", "Covered Parking", "Power Backup", "EV Charging", "Fire Safety", "Yoga Deck", "Multipurpose Hall", "Amphitheatre", "Senior Citizen Area", "Rainwater Harvesting"];

const empty = () => ({
  name: "", slug: "", description: "", developer_id: "",
  property_category: "residential",
  city: "dombivli", location: "dombivli-east", address: "", lat: null, lng: null,
  price_from: 5000000, price_to: 15000000, configurations: ["1 BHK", "2 BHK", "3 BHK"],
  area_from: 450, area_to: 1450,
  launch_date: "", possession_date: "Dec 2026", construction_status: "under_construction",
  rera_number: "", rera_link: "", rera_qr_url: "",
  total_towers: 3, total_units: 200, total_floors: 22,
  amenities: [], specifications: [], images: [], videos: [], brochure_url: "",
  payment_plan: "20:80 with bank finance", floor_plans: [],
  featured: false, verified: true, status: "draft",
  show_featured_residential: false, show_commercial_homepage: false, flags: [],
  import_source_url: "",
  seo: { title: "", description: "", slug: "", focus_keyword: "", canonical: "", og_title: "", og_description: "", og_image: "" },
});

export default function ProjectForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const [f, setF] = useState(empty());
  const [tab, setTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!id);
  const [developers, setDevelopers] = useState([]);
  const [amenityOptions, setAmenityOptions] = useState(AMENITIES);
  const [newAmenity, setNewAmenity] = useState("");
  const [devModal, setDevModal] = useState(false);
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchingNearby, setFetchingNearby] = useState(false);
  const inAdmin = window.location.pathname.startsWith("/admin");
  const backTo = inAdmin ? "/admin" : "/developer";

  const loadDevelopers = () => api.get("/developers?limit=200").then(r => setDevelopers(r.data || [])).catch(() => {});
  useEffect(() => { loadDevelopers(); }, []);
  useEffect(() => {
    api.get("/amenities").then(r => {
      const names = (r.data || []).map(a => a.name);
      setAmenityOptions(prev => Array.from(new Set([...prev, ...names])));
    }).catch(() => {});
  }, []);

  const amenityAdded = (name) => {
    setAmenityOptions(prev => prev.includes(name) ? prev : [...prev, name]);
    if (!(f.amenities || []).includes(name)) set("amenities", [...(f.amenities || []), name]);
  };

  const addAmenity = async () => {
    const name = newAmenity.trim();
    if (!name) return;
    try {
      await api.post("/admin/amenities", { name });
      amenityAdded(name);
      setNewAmenity("");
      toast.success(`"${name}" added — available on all future projects`);
    } catch { toast.error("Could not add amenity"); }
  };

  useEffect(() => {
    if (id) {
      api.get(`/my/projects/${id}`).then(r => {
        setF({ ...empty(), ...r.data, seo: { ...empty().seo, ...(r.data.seo || {}) } });
        setLoaded(true);
      }).catch(() => {
        api.get(`/projects/${id}`).then(r => {
          setF({ ...empty(), ...r.data, seo: { ...empty().seo, ...(r.data.seo || {}) } });
          setLoaded(true);
        }).catch(() => { toast.error("Project not found"); nav(backTo); });
      });
    }
  }, [id, nav]);

  if (!ready) return null;
  if (!user || !["admin", "super_admin", "developer"].includes(user.role)) return <Navigate to="/login" />;
  if (!loaded) return <div className="p-20 text-center text-slate-500">Loading…</div>;

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setSeo = (k, v) => setF(p => ({ ...p, seo: { ...p.seo, [k]: v } }));

  const fetchDetails = async () => {
    if (fetching) return; // prevent duplicate requests
    const url = fetchUrl.trim();
    if (!url) { toast.error("Please enter the developer landing page URL"); return; }
    setFetching(true);
    try {
      const { data } = await api.post("/projects/fetch-details", { url });
      const F_ = data.fields || {};
      const isNew = !id;
      const mapped = [];
      const fill = (key, val, fillDefault = false) => {
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && !val.length)) return;
        const cur = f[key];
        const empty = Array.isArray(cur) ? cur.length === 0 : (cur === "" || cur === null || cur === undefined || cur === 0);
        // Never overwrite admin-entered data; on a NEW form, factory defaults aren't user data
        if (empty || (isNew && fillDefault)) { set(key, val); mapped.push(key); }
      };
      fill("name", F_.name);
      fill("description", F_.description);
      fill("city", F_.city, true);
      fill("location", F_.location, true);
      fill("address", F_.address);
      fill("price_from", F_.price_from, true);
      fill("price_to", F_.price_to, true);
      fill("configurations", F_.configurations, true);
      fill("area_from", F_.area_from, true);
      fill("area_to", F_.area_to, true);
      fill("rera_number", F_.rera_number);
      fill("rera_link", data.source_url);
      fill("brochure_url", F_.brochure_url);
      fill("possession_date", F_.possession_date);
      fill("construction_status", F_.construction_status);
      fill("images", F_.images);
      fill("main_image", F_.main_image);
      fill("amenities", F_.amenities);
      fill("import_source_url", data.source_url);
      if (!f.developer_id && data.developer_match) { set("developer_id", data.developer_match.id); mapped.push("developer"); }
      if (mapped.length) toast.success(`Fetched: ${mapped.join(", ")} — review every field, then Save Draft or Publish`);
      else toast.info("Page fetched, but everything found is already filled in the form");
      if (!data.developer_match && data.developer_guess) toast.info(`Developer "${data.developer_guess}" isn't registered — use "Register New Developer" below`);
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not fetch project details");
    } finally { setFetching(false); }
  };

  // Fetch real nearby landmarks (OpenStreetMap). Merges — never overwrites manual entries.
  const fetchNearby = async () => {
    if (fetchingNearby) return;
    setFetchingNearby(true);
    try {
      const { data } = await api.post("/nearby/fetch", { lat: f.lat, lng: f.lng, address: f.address, location: f.location, city: f.city });
      const places = data.places || [];
      const merged = [...(f.nearby_locations || [])];
      let added = 0;
      for (const p of places) {
        if (!merged.some(x => (x.name || "").toLowerCase() === (p.name || "").toLowerCase())) { merged.push(p); added++; }
      }
      if (added === 0) {
        toast.info("No new places found — your existing entries were kept");
      } else {
        set("nearby_locations", merged);
        if (!f.lat && data.center) { set("lat", data.center.lat); set("lng", data.center.lng); }
        toast.success(`Found ${added} nearby place${added === 1 ? "" : "s"} — review and edit below before saving`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not fetch nearby locations — you can enter them manually");
    } finally { setFetchingNearby(false); }
  };

  const toggleFlag = (fl) => {
    const cur = f.flags || [];
    if (cur.includes(fl)) return set("flags", cur.filter(x => x !== fl));
    if (cur.length >= 2) { toast.error("Max 2 flags allowed"); return; }
    set("flags", [...cur, fl]);
  };

  const save = async (publish) => {
    if (!f.name.trim()) { toast.error("Project name required"); setTab("basic"); return; }
    if (!f.developer_id) { toast.error("Please select a developer"); setTab("basic"); return; }
    setSaving(true);
    try {
      const payload = { ...f };
      if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
      if (!payload.main_image && payload.images?.[0]) payload.main_image = payload.images[0];
      payload.status = publish ? "active" : "draft";
      if (id) {
        const pid = payload.id; ["id","created_at","updated_at","developer","properties","similar"].forEach(k => delete payload[k]);
        await api.put(`/projects/${pid}`, payload);
      } else {
        await api.post("/projects", payload);
      }
      toast.success(id ? "Project updated" : publish ? (inAdmin ? "Project published" : "Submitted for admin review") : "Draft saved");
      nav(backTo);
    } catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  };

  const sections = [
    { k: "basic", label: "Basic", icon: Info },
    { k: "details", label: "Details", icon: House },
    { k: "location", label: "Location", icon: MapPin },
    { k: "rera", label: "RERA", icon: Sparkle },
    { k: "amenities", label: "Amenities", icon: Sparkle },
    { k: "media", label: "Media", icon: ImageIcon },
    { k: "seo", label: "SEO", icon: MagnifyingGlass },
    ...(inAdmin ? [{ k: "flags", label: "Flags & Homepage", icon: Flag }] : []),
  ];

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link to={backTo} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ArrowLeft size={18} /></Link>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold">{id ? "Edit Project" : "New Project"}</div>
              <div className="font-semibold text-slate-900 truncate max-w-md">{f.name || "Untitled Project"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id && <Link to={`/admin/projects/${id}/units`} data-testid="manage-units-btn" className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-1.5">Manage Units</Link>}
            {id && f.status === "active" && <Link to={`/project/${f.slug}`} target="_blank" className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-1.5"><Eye size={14} /> View Live</Link>}
            <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-1.5 disabled:opacity-50"><FloppyDisk size={14} /> Save Draft</button>
            <button onClick={() => save(true)} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50">
              <Upload size={14} weight="bold" /> {saving ? "Saving…" : (inAdmin ? "Publish" : "Submit for Admin Review")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <nav className="card-premium p-3 space-y-1">
            {sections.map(s => (
              <button key={s.k} onClick={() => setTab(s.k)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${tab === s.k ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                <s.icon size={16} weight={tab === s.k ? "bold" : "regular"} /> {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="card-premium p-6 lg:p-8">
          {tab === "basic" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Basic Information</h2>

              {/* Fetch Project Details — admin time-saver */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4" data-testid="fetch-details-panel">
                <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm mb-1"><Globe size={16} className="text-blue-600" weight="bold" /> Fetch Project Details</div>
                <p className="text-xs text-slate-500 mb-3">Paste the developer landing page URL to auto-fill this form. Nothing is saved until you review and publish.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={fetchUrl} onChange={e => setFetchUrl(e.target.value)} data-testid="fetch-url-input"
                    placeholder="Developer Landing Page URL — https://developer.com/project"
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), fetchDetails())}
                    className="h-11 rounded-lg border-slate-300 bg-white flex-1" />
                  <button type="button" onClick={fetchDetails} disabled={fetching} data-testid="fetch-details-btn"
                    className="h-11 px-5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2 whitespace-nowrap">
                    {fetching && <CircleNotch size={15} className="animate-spin" />} {fetching ? "Fetching…" : "Fetch Project Details"}
                  </button>
                </div>
                {f.import_source_url && <div className="text-xs text-slate-500 mt-2">Imported from: <span className="font-medium text-slate-700">{f.import_source_url}</span></div>}
              </div>
              <F label="Project Title *"><Input value={f.name} onChange={e => set("name", e.target.value)} /></F>
              <F label="Description"><RichTextEditor value={f.description || ""} onChange={v => set("description", v)} dataTestid="project-description-editor" /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Developer *">
                  <Sel value={f.developer_id} onChange={v => { if (v === "__register_new__") { setDevModal(true); } else { set("developer_id", v); } }}
                    options={[...developers.map(d => [d.id, d.name]), ["__register_new__", "+ Register New Developer"]]} placeholder="Select developer" />
                  <button type="button" onClick={() => setDevModal(true)} data-testid="register-developer-btn" className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold">Developer not listed? Register New Developer →</button>
                </F>
                <F label="Category"><Sel value={f.property_category} onChange={v => set("property_category", v)} options={[["residential","Residential"],["commercial","Commercial"]]} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Price From (₹)"><Input type="number" value={f.price_from ?? 0} onChange={e => set("price_from", Number(e.target.value))} /></F>
                <F label="Price To (₹)"><Input type="number" value={f.price_to ?? 0} onChange={e => set("price_to", Number(e.target.value))} /></F>
              </div>
              <F label="Configurations (comma-separated)"><Input value={(f.configurations || []).join(", ")} onChange={e => set("configurations", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="1 BHK, 2 BHK, 3 BHK" /></F>
              <F label="Payment Plan"><Input value={f.payment_plan || ""} onChange={e => set("payment_plan", e.target.value)} /></F>
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Project Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <F label="Total Units"><Input type="number" value={f.total_units ?? 0} onChange={e => set("total_units", Number(e.target.value))} /></F>
                <F label="Total Towers"><Input type="number" value={f.total_towers ?? 0} onChange={e => set("total_towers", Number(e.target.value))} /></F>
                <F label="Total Floors"><Input type="number" value={f.total_floors ?? ""} onChange={e => set("total_floors", Number(e.target.value) || null)} /></F>
                <F label="Area From (sq.ft.)"><Input type="number" value={f.area_from ?? ""} onChange={e => set("area_from", Number(e.target.value) || null)} /></F>
                <F label="Area To (sq.ft.)"><Input type="number" value={f.area_to ?? ""} onChange={e => set("area_to", Number(e.target.value) || null)} /></F>
                <F label="Construction Status"><Sel value={f.construction_status} onChange={v => set("construction_status", v)} options={[["new_launch","New Launch"],["under_construction","Under Construction"],["ready","Ready to Move"]]} /></F>
                <F label="Launch Date"><Input value={f.launch_date || ""} onChange={e => set("launch_date", e.target.value)} placeholder="Q1 2026" /></F>
                <F label="Possession Date"><Input value={f.possession_date || ""} onChange={e => set("possession_date", e.target.value)} /></F>
              </div>
            </div>
          )}

          {tab === "location" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <F label="City"><Sel value={f.city} onChange={v => set("city", v)} options={CITIES.map(c => [c, c.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase())])} /></F>
                <F label="Locality slug"><Input value={f.location} onChange={e => set("location", e.target.value)} /></F>
              </div>
              <F label="Address"><Input value={f.address || ""} onChange={e => set("address", e.target.value)} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Latitude"><Input type="number" step="0.0001" value={f.lat ?? ""} onChange={e => set("lat", Number(e.target.value) || null)} /></F>
                <F label="Longitude"><Input type="number" step="0.0001" value={f.lng ?? ""} onChange={e => set("lng", Number(e.target.value) || null)} /></F>
              </div>
              <F label="Location Link (Google Maps)"><Input data-testid="project-map-link" value={f.google_map_link || ""} onChange={e => set("google_map_link", e.target.value)} placeholder="https://maps.google.com/…" /></F>
              <F label="Nearby Locations (one per line: Name | Distance | Category)">
                <Textarea rows={4} data-testid="project-nearby" value={(f.nearby_locations || []).map(n => `${n.name} | ${n.distance || ""} | ${n.category || ""}`).join("\n")}
                  onChange={e => set("nearby_locations", e.target.value.split("\n").filter(Boolean).map(l => {
                    const [name, distance, category] = l.split("|").map(s => s.trim());
                    return { name, distance, category };
                  }))} placeholder="Metro Station | 1.2km | Transit&#10;DMart | 500m | Shopping" />
              </F>
              <button type="button" onClick={fetchNearby} disabled={fetchingNearby} data-testid="fetch-nearby-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors">
                {fetchingNearby ? <CircleNotch size={14} className="animate-spin" /> : <MapPin size={14} weight="bold" />}
                {fetchingNearby ? "Fetching nearby places…" : "Fetch Nearby Locations"}
              </button>
            </div>
          )}

          {tab === "rera" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">RERA</h2>
              <F label="RERA Number"><Input value={f.rera_number || ""} onChange={e => set("rera_number", e.target.value)} placeholder="P51700xxxxx" /></F>
              <F label="RERA Website Link"><Input value={f.rera_link || ""} onChange={e => set("rera_link", e.target.value)} placeholder="https://maharera.mahaonline.gov.in/…" /></F>
              <F label="Upload RERA QR"><ImageUpload value={f.rera_qr_url || ""} onChange={v => set("rera_qr_url", v)} kind="projects" dataTestid="project-rera-qr-upload" allowUrl={false} /></F>
            </div>
          )}

          {tab === "amenities" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Amenities</h2>
              <div className="flex gap-2 mb-2">
                <Input data-testid="new-amenity-quick-input" value={newAmenity} onChange={e => setNewAmenity(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), newAmenity.trim() ? addAmenity() : toast.error("Please enter an amenity name"))} placeholder="Quick add, e.g. Sky Deck" className="h-11 rounded-lg border-slate-300 max-w-xs" />
                <AddAmenity existing={amenityOptions} onAdded={amenityAdded} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {amenityOptions.map(a => {
                  const on = (f.amenities || []).includes(a);
                  return (
                    <button key={a} type="button" onClick={() => set("amenities", on ? f.amenities.filter(x => x !== a) : [...(f.amenities || []), a])}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                      {on ? "✓ " : ""}{a}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Media</h2>
              <F label="Upload Main Image *"><ImageUpload value={f.main_image || ""} onChange={v => set("main_image", v)} kind="projects" dataTestid="project-main-image-upload" allowUrl={false} /></F>
              <F label="Project Gallery Images">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(f.images || []).map((url, i) => <ImageUpload key={`${url}-${i}`} value={url} onChange={v => set("images", (f.images || []).map((x,j) => j===i ? v : x).filter(Boolean))} kind="projects" dataTestid={`project-image-upload-${i}`} allowUrl={false} />)}
                  <ImageUpload value="" onChange={v => v && set("images", [...(f.images || []), v])} kind="projects" dataTestid="project-add-image-upload" allowUrl={false} />
                </div>
              </F>
              <F label="Brochure URL"><Input value={f.brochure_url || ""} onChange={e => set("brochure_url", e.target.value)} /></F>
              <F label="Video URLs (one per line)"><Textarea rows={2} value={(f.videos || []).join("\n")} onChange={e => set("videos", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))} /></F>
              <F label="Virtual Tour URL"><Input value={f.virtual_tour_url || ""} onChange={e => set("virtual_tour_url", e.target.value)} /></F>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">SEO</h2>
              <F label="URL Slug"><Input value={f.slug || ""} onChange={e => set("slug", e.target.value)} placeholder="auto if blank" /></F>
              <F label="Meta Title"><Input value={f.seo?.title || ""} onChange={e => setSeo("title", e.target.value)} /></F>
              <F label="Meta Description"><Textarea rows={2} value={f.seo?.description || ""} onChange={e => setSeo("description", e.target.value)} /></F>
              <F label="Meta Keywords"><Input value={f.seo?.keywords || ""} onChange={e => setSeo("keywords", e.target.value)} placeholder="new launch thane, 2 bhk project" /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Focus Keyword"><Input value={f.seo?.focus_keyword || ""} onChange={e => setSeo("focus_keyword", e.target.value)} /></F>
                <F label="Canonical URL"><Input value={f.seo?.canonical || ""} onChange={e => setSeo("canonical", e.target.value)} /></F>
              </div>
              <F label="OG Title"><Input value={f.seo?.og_title || ""} onChange={e => setSeo("og_title", e.target.value)} /></F>
              <F label="OG Description"><Textarea rows={2} value={f.seo?.og_description || ""} onChange={e => setSeo("og_description", e.target.value)} /></F>
              <F label="OG Image"><ImageUpload value={f.seo?.og_image || ""} onChange={v => setSeo("og_image", v)} kind="og" dataTestid="project-og-image-upload" /></F>
            </div>
          )}

          {tab === "flags" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Marketing Flags & Homepage Placement</h2>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Project Flags (max 2)</div>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_FLAGS.map(([k, l]) => {
                    const on = (f.flags || []).includes(k);
                    return (
                      <button key={k} type="button" onClick={() => toggleFlag(k)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                        {on ? "✓ " : ""}{l}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Flag_ label="Show in Featured Residential (homepage, max 6)" v={f.show_featured_residential} onChange={v => set("show_featured_residential", v)} />
                <Flag_ label="Show in Commercial Projects (homepage, max 3)" v={f.show_commercial_homepage} onChange={v => set("show_commercial_homepage", v)} />
                <Flag_ label="Featured badge on cards" v={f.featured} onChange={v => set("featured", v)} />
                <Flag_ label="Verified" v={f.verified} onChange={v => set("verified", v)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <RegisterDeveloper
        open={devModal}
        onClose={() => setDevModal(false)}
        onRegistered={(d) => {
          setDevelopers(prev => prev.some(x => x.id === d.id) ? prev : [...prev, d]);
          set("developer_id", d.id);
        }}
      />
    </div>
  );
}

function F({ label, children }) { return <div><label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">{label}</label>{children}</div>; }
function Sel({ value, onChange, options, placeholder }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="border-slate-200"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function Flag_({ label, v, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-lg bg-white cursor-pointer">
      <span className="text-sm text-slate-800 font-medium">{label}</span>
      <Switch checked={!!v} onCheckedChange={onChange} />
    </label>
  );
}
