import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FloppyDisk, Upload, Eye, Info, House, MapPin, Sparkle, Image as ImageIcon, MagnifyingGlass, Flag, Camera, Crosshair, X, CircleNotch } from "@phosphor-icons/react";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import AddAmenity from "@/components/AddAmenity";

const RES_TYPES = ["apartment", "studio_apartment", "penthouse", "duplex", "independent_house", "villa", "farmhouse", "builder_floor", "plot", "residential_land"];
const COM_TYPES = ["office_space", "doctor_space", "coworker_space", "retail_shop", "showroom", "business_centre", "warehouse", "industrial_shed", "industrial_space", "commercial_land", "industrial_land"];
const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];
const DIRECTIONS = ["east", "west", "north", "south", "north-east", "north-west", "south-east", "south-west"];
const FURNISHING = ["furnished", "semi", "unfurnished"];
const OWNERSHIP = ["freehold", "leasehold", "co_operative"];
const PARKING_TYPES = ["open", "covered", "podium", "mlcp", "other"];
const MARKETING_FLAGS = [["low_cost", "Low Cost"], ["hot_inventory", "Hot Inventory"], ["best_seller", "Best Seller"]];
const AMENITIES_DEFAULT = ["Lift", "Swimming Pool", "Gym", "Clubhouse", "Garden", "Children's Play Area", "Security", "CCTV", "Power Backup", "Parking", "EV Charging", "Fire Safety", "Jogging Track", "Intercom", "Visitor Parking", "Gas Pipeline", "Rainwater Harvesting", "Solar", "Sewage Treatment"];

const empty = () => ({
  title: "", slug: "", description: "", listing_type: "sale", property_category: "residential",
  property_type: "apartment", bhk: 2, bathrooms: 2, balcony: 1, parking: 1,
  floor: null, total_floors: null, furnishing: "semi", construction_status: "ready",
  possession: "Ready to move", price: 5000000, rent: null, deposit: null,
  carpet_area: 800, builtup_area: 960,
  city: "dombivli", location: "dombivli-east", address: "", lat: null, lng: null,
  amenities: [], features: [], images: [], main_image: "",
  unit_plan: "", video_url: "", youtube_url: "", google_map_link: "", nearby_locations: [], verification: {},
  rera_number: "", status: "draft", verified: true, featured: false,
  investor_property: false, best_resale: false, flags: [],
  seo: { title: "", description: "", slug: "", focus_keyword: "", canonical: "", og_title: "", og_description: "", og_image: "" },
});

export default function PropertyForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const [f, setF] = useState(() => {
    const e = empty();
    const cat = new URLSearchParams(window.location.search).get("category");
    if (cat === "commercial") { e.property_category = "commercial"; e.listing_type = "sale"; }
    return e;
  });
  const [tab, setTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [fetchingNearby, setFetchingNearby] = useState(false);
  const [loaded, setLoaded] = useState(!id);
  const [amenityOptions, setAmenityOptions] = useState(AMENITIES_DEFAULT);
  const [newAmenity, setNewAmenity] = useState("");
  const inAdmin = window.location.pathname.startsWith("/admin");
  const backTo = inAdmin ? "/admin" : window.location.pathname.startsWith("/agent") ? "/agent" : "/dashboard";

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
      toast.success(`"${name}" added — available on all future listings`);
    } catch { toast.error("Could not add amenity"); }
  };

  useEffect(() => {
    if (id) {
      api.get(`/my/properties/${id}`).then(r => {
        setF({ ...empty(), ...r.data, seo: { ...empty().seo, ...(r.data.seo || {}) } });
        setLoaded(true);
      }).catch(() => {
        api.get(`/properties/${id}`).then(r => {
          setF({ ...empty(), ...r.data, seo: { ...empty().seo, ...(r.data.seo || {}) } });
          setLoaded(true);
        }).catch(() => { toast.error("Property not found"); nav(backTo); });
      });
    }
  }, [id, nav]);

  if (!ready) return null;
  if (!user || !["admin", "super_admin", "agent", "developer", "owner", "user"].includes(user.role)) return <Navigate to="/login" />;
  if (!loaded) return <div className="p-20 text-center text-slate-500">Loading…</div>;

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const setSeo = (k, v) => setF(prev => ({ ...prev, seo: { ...prev.seo, [k]: v } }));

  // Fetch real nearby landmarks (OpenStreetMap). Merges with existing entries —
  // never overwrites anything the user typed manually.
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

  const toggleFlag = (flag) => {
    const current = f.flags || [];
    if (current.includes(flag)) return set("flags", current.filter(x => x !== flag));
    if (current.length >= 2) { toast.error("Max 2 marketing flags allowed"); return; }
    set("flags", [...current, flag]);
  };

  const save = async (publish) => {
    if (!f.title.trim()) { toast.error("Title required"); setTab("basic"); return; }
    setSaving(true);
    try {
      const payload = { ...f };
      if (!payload.slug) payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
      if (!payload.main_image && payload.images?.[0]) payload.main_image = payload.images[0];
      payload.status = publish ? "active" : "draft";
      if (id) {
        const pid = payload.id; ["id", "created_at", "updated_at", "views", "developer", "agent", "project", "similar"].forEach(k => delete payload[k]);
        await api.put(`/properties/${pid}`, payload);
      } else {
        await api.post("/properties", payload);
      }
      toast.success(id ? "Property updated" : publish ? (inAdmin ? "Property published" : "Submitted for admin review") : "Draft saved");
      nav(backTo);
    } catch (err) {
      // Transient server/network failure while publishing → preserve data as a draft
      if (publish && (!err.response || err.response.status >= 500)) {
        try {
          const draftPayload = { ...f };
          if (!draftPayload.slug) draftPayload.slug = draftPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
          draftPayload.status = "draft";
          if (id) {
            const pid = draftPayload.id; ["id", "created_at", "updated_at", "views", "developer", "agent", "project", "similar"].forEach(k => delete draftPayload[k]);
            await api.put(`/properties/${pid}`, draftPayload);
          } else {
            await api.post("/properties", draftPayload);
          }
          toast.error("Unable to publish. Your information has been saved as a draft.");
          nav(backTo);
          return;
        } catch { /* fall through to the real error */ }
      }
      toast.error(err.response?.data?.detail || "Save failed");
    }
    finally { setSaving(false); }
  };

  const typologyOptions = f.property_category === "commercial" ? COM_TYPES : RES_TYPES;

  const sections = [
    { k: "basic", label: "Basic", icon: Info },
    { k: "details", label: "Details", icon: House },
    { k: "location", label: "Location", icon: MapPin },
    { k: "amenities", label: "Amenities", icon: Sparkle },
    { k: "media", label: "Media", icon: ImageIcon },
    { k: "seo", label: "SEO", icon: MagnifyingGlass },
    ...(inAdmin ? [{ k: "flags", label: "Flags", icon: Flag }] : []),
  ];

  return (
    <div className="min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link to={backTo} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ArrowLeft size={18} /></Link>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold">{id ? "Edit Property" : "New Property"}</div>
              <div className="font-semibold text-slate-900 truncate max-w-md">{f.title || "Untitled"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {id && f.status === "active" && <Link to={`/property/${f.slug}`} target="_blank" className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-1.5"><Eye size={14} /> View Live</Link>}
            <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-1.5 disabled:opacity-50" data-testid="save-draft"><FloppyDisk size={14} /> Save Draft</button>
            <button onClick={() => save(true)} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50" data-testid="publish">
              <Upload size={14} weight="bold" /> {saving ? "Saving…" : (inAdmin ? "Publish" : "Submit for Admin Review")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-8">
        {/* Section nav */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <nav className="card-premium p-3 space-y-1">
            {sections.map(s => (
              <button key={s.k} onClick={() => setTab(s.k)} data-testid={`tab-${s.k}`} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === s.k ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                <s.icon size={16} weight={tab === s.k ? "bold" : "regular"} /> {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="card-premium p-6 lg:p-8">
          {tab === "basic" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Basic Information</h2>
              <p className="text-sm text-slate-500 mb-4">Core details buyers see first.</p>
              <F label="Property Title *"><Input data-testid="property-title" value={f.title} onChange={e => set("title", e.target.value)} placeholder="Luxurious 3 BHK …" /></F>
              <F label="Description"><RichTextEditor value={f.description || ""} onChange={v => set("description", v)} dataTestid="property-description-editor" /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Sell / Rent"><Sel value={f.listing_type} onChange={v => set("listing_type", v)} options={[["sale","Sell"],["rent","Rent"]]} /></F>
                <F label="Category"><Sel value={f.property_category} onChange={v => set("property_category", v)} options={[["residential","Residential"],["commercial","Commercial"]]} /></F>
              </div>
              <F label="Property Typology">
                <Sel value={f.property_type} onChange={v => set("property_type", v)} options={typologyOptions.map(t => [t, t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())])} />
              </F>
              {f.listing_type === "sale" ? (
                <F label="Starting Price (₹)"><Input type="number" value={f.price ?? 0} onChange={e => set("price", Number(e.target.value))} /></F>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <F label="Monthly Rent (₹)"><Input type="number" value={f.rent ?? 0} onChange={e => set("rent", Number(e.target.value))} /></F>
                  <F label="Security Deposit (₹)"><Input type="number" value={f.deposit ?? 0} onChange={e => set("deposit", Number(e.target.value))} /></F>
                </div>
              )}
            </div>
          )}

          {tab === "details" && f.property_category === "residential" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Residential Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <F label="Configuration / BHK"><Input type="number" value={f.bhk ?? ""} onChange={e => set("bhk", Number(e.target.value) || null)} /></F>
                <F label="Carpet Area (sq.ft.)"><Input type="number" value={f.carpet_area ?? ""} onChange={e => set("carpet_area", Number(e.target.value) || null)} /></F>
                <F label="Built-up Area (sq.ft.)"><Input type="number" value={f.builtup_area ?? ""} onChange={e => set("builtup_area", Number(e.target.value) || null)} /></F>
                <F label="Bathrooms"><Input type="number" value={f.bathrooms ?? ""} onChange={e => set("bathrooms", Number(e.target.value) || null)} /></F>
                <F label="Balconies"><Input type="number" value={f.balcony ?? ""} onChange={e => set("balcony", Number(e.target.value) || null)} /></F>
                <F label="Parking (count)"><Input type="number" value={f.parking ?? ""} onChange={e => set("parking", Number(e.target.value) || null)} /></F>
                <F label="Floor"><Input type="number" value={f.floor ?? ""} onChange={e => set("floor", Number(e.target.value) || null)} /></F>
                <F label="Total Floors"><Input type="number" value={f.total_floors ?? ""} onChange={e => set("total_floors", Number(e.target.value) || null)} /></F>
                <F label="Direction"><Sel value={f.direction || ""} onChange={v => set("direction", v)} options={DIRECTIONS.map(d => [d, d.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())])} placeholder="Any" /></F>
                <F label="Furnishing"><Sel value={f.furnishing} onChange={v => set("furnishing", v)} options={FURNISHING.map(x => [x, x.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())])} /></F>
                <F label="Ownership"><Sel value={f.ownership || ""} onChange={v => set("ownership", v)} options={OWNERSHIP.map(x => [x, x.replace(/_/g, "-").replace(/\b\w/g, c => c.toUpperCase())])} placeholder="Freehold" /></F>
                <F label="Possession"><Input value={f.possession || ""} onChange={e => set("possession", e.target.value)} placeholder="Ready to move / Dec 2026" /></F>
                <F label="Age of Property"><Input value={f.property_age || ""} onChange={e => set("property_age", e.target.value)} placeholder="0-5 years" /></F>
                <F label="Available Units"><Input type="number" value={f.available_units || ""} onChange={e => set("available_units", Number(e.target.value) || null)} /></F>
                <F label="Parking Type"><Sel value={f.parking_type || ""} onChange={v => set("parking_type", v)} options={PARKING_TYPES.map(p => [p, p.toUpperCase()])} placeholder="Any" /></F>
              </div>
            </div>
          )}

          {tab === "details" && f.property_category === "commercial" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Commercial Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <F label="Carpet Area (sq.ft.)"><Input type="number" value={f.carpet_area ?? ""} onChange={e => set("carpet_area", Number(e.target.value) || null)} /></F>
                <F label="Built-up Area (sq.ft.)"><Input type="number" value={f.builtup_area ?? ""} onChange={e => set("builtup_area", Number(e.target.value) || null)} /></F>
                <F label="Washrooms"><Input type="number" value={f.bathrooms ?? ""} onChange={e => set("bathrooms", Number(e.target.value) || null)} /></F>
                <F label="Parking (count)"><Input type="number" value={f.parking ?? ""} onChange={e => set("parking", Number(e.target.value) || null)} /></F>
                <F label="Floor"><Input type="number" value={f.floor ?? ""} onChange={e => set("floor", Number(e.target.value) || null)} /></F>
                <F label="Total Floors"><Input type="number" value={f.total_floors ?? ""} onChange={e => set("total_floors", Number(e.target.value) || null)} /></F>
                <F label="Furnishing"><Sel value={f.furnishing} onChange={v => set("furnishing", v)} options={FURNISHING.map(x => [x, x.replace(/\b\w/g, c => c.toUpperCase())])} /></F>
                <F label="Ownership"><Sel value={f.ownership || ""} onChange={v => set("ownership", v)} options={OWNERSHIP.map(x => [x, x.replace(/_/g, "-").replace(/\b\w/g, c => c.toUpperCase())])} placeholder="Freehold" /></F>
                <F label="Possession"><Input value={f.possession || ""} onChange={e => set("possession", e.target.value)} /></F>
              </div>
            </div>
          )}

          {tab === "location" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <F label="City"><Sel value={f.city} onChange={v => set("city", v)} options={CITIES.map(c => [c, c.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase())])} /></F>
                <F label="Locality slug"><Input value={f.location} onChange={e => set("location", e.target.value)} placeholder="e.g. dombivli-east" /></F>
              </div>
              <F label="Full Address"><Input value={f.address} onChange={e => set("address", e.target.value)} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Latitude"><Input type="number" step="0.0001" value={f.lat ?? ""} onChange={e => set("lat", Number(e.target.value) || null)} /></F>
                <F label="Longitude"><Input type="number" step="0.0001" value={f.lng ?? ""} onChange={e => set("lng", Number(e.target.value) || null)} /></F>
              </div>
              <F label="Google Maps Link"><Input value={f.google_map_link} onChange={e => set("google_map_link", e.target.value)} placeholder="https://maps.google.com/…" /></F>
              <F label="Nearby Locations (one per line: Name | Distance | Category)">
                <Textarea rows={4} data-testid="property-nearby" value={(f.nearby_locations || []).map(n => `${n.name} | ${n.distance || ""} | ${n.category || ""}`).join("\n")}
                  onChange={e => set("nearby_locations", e.target.value.split("\n").filter(Boolean).map(l => {
                    const [name, distance, category] = l.split("|").map(s => s.trim());
                    return { name, distance, category };
                  }))} placeholder="DMart | 500m | Shopping&#10;Metro Station | 1.2km | Transit" />
              </F>
              <button type="button" onClick={fetchNearby} disabled={fetchingNearby} data-testid="fetch-nearby-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors -mt-1">
                {fetchingNearby ? <CircleNotch size={14} className="animate-spin" /> : <MapPin size={14} weight="bold" />}
                {fetchingNearby ? "Fetching nearby places…" : "Fetch Nearby Locations"}
              </button>

              {/* Optional on-site verification: camera capture + current location */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5">
                <div className="text-sm font-semibold text-slate-900 mb-1">On-Site Verification <span className="text-xs font-normal text-slate-500">(optional — can be done any time before/after approval)</span></div>
                <p className="text-xs text-slate-500 mb-4">Capture interior photos on-site and pin the live location. Admin reviews these to grant the Verified Property badge.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                    <Camera size={15} weight="bold" /> Open Camera / Capture Interior
                    <input type="file" accept="image/*" capture="environment" className="hidden" data-testid="verify-camera-input" multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const imgs = [...(f.verification?.images || [])];
                        for (const file of files) {
                          const fd = new FormData();
                          fd.append("file", file);
                          try {
                            const { data } = await api.post("/admin/uploads?kind=verifications", fd, { headers: { "Content-Type": "multipart/form-data" } });
                            imgs.push(data.url);
                          } catch { toast.error("Upload failed for one image"); }
                        }
                        set("verification", { ...(f.verification || {}), images: imgs, captured_at: new Date().toISOString() });
                        toast.success("Verification photos attached");
                        e.target.value = "";
                      }} />
                  </label>
                  <button type="button" data-testid="verify-location-btn" onClick={() => {
                    if (!navigator.geolocation) { toast.error("Geolocation not supported on this device"); return; }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        set("lat", Number(pos.coords.latitude.toFixed(6)));
                        set("lng", Number(pos.coords.longitude.toFixed(6)));
                        set("verification", { ...(f.verification || {}), lat: pos.coords.latitude, lng: pos.coords.longitude, captured_at: new Date().toISOString() });
                        toast.success("Current location captured");
                      },
                      () => toast.error("Location permission denied"),
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                    <Crosshair size={15} weight="bold" /> Use Current Location
                  </button>
                </div>
                {(f.verification?.images || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {f.verification.images.map((src, i) => (
                      <img key={i} src={src} alt={`Verification ${i + 1}`} className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                    ))}
                  </div>
                )}
                {f.verification?.lat && <div className="text-xs text-emerald-700 font-medium mt-2">Location captured: {f.verification.lat.toFixed(5)}, {f.verification.lng.toFixed(5)}</div>}
                {f.verified && <div className="text-xs font-semibold text-emerald-700 mt-2">✓ Verified Property (by admin)</div>}
              </div>
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
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                      {on ? "✓ " : ""}{a}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Media</h2>
              <F label="Main Image *"><ImageUpload value={f.main_image || ""} onChange={v => set("main_image", v)} kind="properties" dataTestid="property-main-image-upload" allowUrl={false} /></F>
              <F label="Property Gallery Images">
                {(f.images || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                    {(f.images || []).map((url, i) => (
                      <div key={`${url}-${i}`} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => set("images", (f.images || []).filter((_, j) => j !== i))} data-testid={`gallery-remove-${i}`} aria-label={`Remove gallery image ${i + 1}`}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors">
                          <X size={12} weight="bold" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-slate-900/60 text-white px-1.5 py-0.5 rounded">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                <MultiImageUpload kind="properties" dataTestid="property-gallery-multi" onAdd={urls => set("images", [...(f.images || []), ...urls])} />
              </F>
              <F label="Upload Unit Plan"><ImageUpload value={f.unit_plan || ""} onChange={v => set("unit_plan", v)} kind="properties" dataTestid="property-unit-plan-upload" allowUrl={false} /></F>
              <F label="Video URL"><Input value={f.video_url || ""} onChange={e => set("video_url", e.target.value)} placeholder="YouTube / Vimeo" /></F>
              <F label="YouTube Video Link"><Input data-testid="property-youtube-url" value={f.youtube_url || ""} onChange={e => set("youtube_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" /></F>
              <F label="Brochure URL"><Input value={f.brochure_url || ""} onChange={e => set("brochure_url", e.target.value)} /></F>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">SEO</h2>
              <F label="URL Slug"><Input value={f.slug || ""} onChange={e => set("slug", e.target.value)} placeholder="auto if blank" /></F>
              <F label="Meta Title"><Input value={f.seo?.title || ""} onChange={e => setSeo("title", e.target.value)} /></F>
              <F label="Meta Description"><Textarea rows={2} value={f.seo?.description || ""} onChange={e => setSeo("description", e.target.value)} /></F>
              <F label="Meta Keywords"><Input value={f.seo?.keywords || ""} onChange={e => setSeo("keywords", e.target.value)} placeholder="2 bhk dombivli, buy flat dombivli" /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Focus Keyword"><Input value={f.seo?.focus_keyword || ""} onChange={e => setSeo("focus_keyword", e.target.value)} /></F>
                <F label="Canonical URL"><Input value={f.seo?.canonical || ""} onChange={e => setSeo("canonical", e.target.value)} /></F>
              </div>
              <F label="OG Title"><Input value={f.seo?.og_title || ""} onChange={e => setSeo("og_title", e.target.value)} /></F>
              <F label="OG Description"><Textarea rows={2} value={f.seo?.og_description || ""} onChange={e => setSeo("og_description", e.target.value)} /></F>
              <F label="OG Image"><ImageUpload value={f.seo?.og_image || ""} onChange={v => setSeo("og_image", v)} kind="og" dataTestid="property-og-image-upload" /></F>
              <F label="RERA Number"><Input value={f.rera_number || ""} onChange={e => set("rera_number", e.target.value)} /></F>
            </div>
          )}

          {tab === "flags" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Marketing Flags</h2>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Property Flags (max 2)</div>
                <div className="flex flex-wrap gap-2">
                  {MARKETING_FLAGS.map(([key, label]) => {
                    const on = (f.flags || []).includes(key);
                    return (
                      <button key={key} type="button" onClick={() => toggleFlag(key)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                        {on ? "✓ " : ""}{label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FlagRow label="Featured on Homepage" v={f.featured} onChange={v => set("featured", v)} />
                <FlagRow label="Verified Listing" v={f.verified} onChange={v => set("verified", v)} />
                <FlagRow label="Show in Investor Gallery (max 3)" v={f.investor_property} onChange={v => set("investor_property", v)} />
                <FlagRow label="Show in Best Resale (max 3)" v={f.best_resale} onChange={v => set("best_resale", v)} />
              </div>
            </div>
          )}
        </div>
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
function Sel({ value, onChange, options, placeholder }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="border-slate-200"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function FlagRow({ label, v, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-lg bg-white cursor-pointer">
      <span className="text-sm text-slate-800 font-medium">{label}</span>
      <Switch checked={!!v} onCheckedChange={onChange} />
    </label>
  );
}
