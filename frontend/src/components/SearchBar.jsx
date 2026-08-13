import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const CITIES = ["mumbai", "thane", "navi-mumbai", "dombivli", "kalyan"];

export default function SearchBar({ compact = false }) {
  const nav = useNavigate();
  const [tab, setTab] = useState("sale");
  const [city, setCity] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [category, setCategory] = useState("");
  const [projStatus, setProjStatus] = useState("");
  const [q, setQ] = useState("");

  const submit = () => {
    const params = new URLSearchParams();
    if (tab === "new_projects") {
      if (projStatus) params.set("category", projStatus);
      if (city) params.set("city", city);
      if (q) params.set("q", q);
      nav(`/projects?${params.toString()}`);
      return;
    }
    params.set("listing_type", tab);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (priceMax) params.set("price_max", priceMax);
    if (q) params.set("q", q);
    nav(`/properties?${params.toString()}`);
  };

  const isProject = tab === "new_projects";

  return (
    <div data-testid="hero-search" className={`bg-[#C3CFF5] rounded-2xl border border-blue-200 shadow-xl shadow-blue-500/10 ${compact ? "p-4" : "p-5 lg:p-7"}`}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/70 rounded-xl p-1 h-auto mb-5 inline-flex">
          {[["sale", "Buy"], ["rent", "Rent"], ["new_projects", "Projects"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-600">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger data-testid="search-city" className="h-12 border-slate-200 rounded-lg"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-", " ")}</SelectItem>)}</SelectContent>
        </Select>

        {isProject ? (
          <Select value={projStatus} onValueChange={setProjStatus}>
            <SelectTrigger data-testid="search-project-status" className="h-12 border-slate-200 rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={priceMax} onValueChange={setPriceMax}>
            <SelectTrigger data-testid="search-budget" className="h-12 border-slate-200 rounded-lg"><SelectValue placeholder="Max Budget" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5000000">Under <span className="rupee">₹</span>50 L</SelectItem>
              <SelectItem value="10000000">Under <span className="rupee">₹</span>1 Cr</SelectItem>
              <SelectItem value="25000000">Under <span className="rupee">₹</span>2.5 Cr</SelectItem>
              <SelectItem value="50000000">Under <span className="rupee">₹</span>5 Cr</SelectItem>
              <SelectItem value="100000000">Under <span className="rupee">₹</span>10 Cr</SelectItem>
            </SelectContent>
          </Select>
        )}

        {!isProject && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="search-category" className="h-12 border-slate-200 rounded-lg"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Input data-testid="search-query" value={q} onChange={e => setQ(e.target.value)} placeholder={isProject ? "Project or developer…" : "Locality, project…"} className={`h-12 border-slate-200 rounded-lg ${isProject ? "md:col-span-2" : ""}`} onKeyDown={e => e.key === "Enter" && submit()} />
        <button data-testid="search-btn" onClick={submit} className="h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/25">
          <MagnifyingGlass size={18} weight="bold" /> Search
        </button>
      </div>
    </div>
  );
}
