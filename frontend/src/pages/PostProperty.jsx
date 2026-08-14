import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function PostProperty() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    title: "", description: "", listing_type: "sale", property_category: "residential",
    property_type: "apartment", bhk: 2, price: 5000000, carpet_area: 800,
    city: "dombivli", location: "dombivli-east", address: "",
  });

  // List Property flow: not logged in → Login page preserving the intended
  // destination (login page links to Register, both carry ?next= back here).
  // Logged in → the form renders directly.
  if (ready && !user) return <Navigate to="/login?next=/post-property" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { nav("/login?next=/post-property"); return; }
    try {
      const payload = { ...f, slug: f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now(),
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=940"] };
      await api.post("/properties", payload);
      toast.success("Property submitted for review!");
      nav("/dashboard");
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to submit"); }
  };

  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Post Your Property</h1>
          <p className="text-slate-600">List your property free and reach thousands of verified buyers.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {!ready ? null : (
        <form onSubmit={submit} className="card-premium p-8 space-y-4" data-testid="post-property-form">
          <Input data-testid="post-title" required placeholder="Property title" value={f.title} onChange={e => setF({...f, title: e.target.value})} className="rounded-lg border-slate-200 h-11" />
          <Textarea data-testid="post-desc" required rows={4} placeholder="Detailed description" value={f.description} onChange={e => setF({...f, description: e.target.value})} className="rounded-lg border-slate-200" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={f.listing_type} onValueChange={v => setF({...f, listing_type: v})}>
              <SelectTrigger data-testid="post-listing" className="rounded-lg border-slate-200 h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="sale">Sale</SelectItem><SelectItem value="rent">Rent</SelectItem></SelectContent>
            </Select>
            <Select value={f.property_type} onValueChange={v => setF({...f, property_type: v})}>
              <SelectTrigger data-testid="post-type" className="rounded-lg border-slate-200 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="plot">Plot</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input data-testid="post-bhk" required type="number" placeholder="BHK" value={f.bhk} onChange={e => setF({...f, bhk: Number(e.target.value)})} className="rounded-lg border-slate-200 h-11" />
            <Input data-testid="post-price" required type="number" placeholder="Price ₹" value={f.price} onChange={e => setF({...f, price: Number(e.target.value)})} className="rounded-lg border-slate-200 h-11" />
            <Input data-testid="post-area" type="number" placeholder="Carpet area (sqft)" value={f.carpet_area} onChange={e => setF({...f, carpet_area: Number(e.target.value)})} className="rounded-lg border-slate-200 h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={f.city} onValueChange={v => setF({...f, city: v})}>
              <SelectTrigger data-testid="post-city" className="rounded-lg border-slate-200 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["mumbai","thane","navi-mumbai","dombivli","kalyan"].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input data-testid="post-loc" placeholder="Locality slug" value={f.location} onChange={e => setF({...f, location: e.target.value})} className="rounded-lg border-slate-200 h-11" />
          </div>
          <Input data-testid="post-address" placeholder="Full address" value={f.address} onChange={e => setF({...f, address: e.target.value})} className="rounded-lg border-slate-200 h-11" />
          <button data-testid="post-submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">Submit for Review</button>
        </form>
        )}
      </div>
    </div>
  );
}
