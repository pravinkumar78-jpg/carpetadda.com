import { useState } from "react";
import { Sparkle, MagnifyingGlass } from "@phosphor-icons/react";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { toast } from "sonner";

const EXAMPLES = [
  "2 BHK under 80 lakh in Dombivli East with parking",
  "3 BHK apartment for rent in Andheri West under 1 lakh",
  "Commercial office in Thane between 50 lakh and 1.5 crore",
  "Luxury villa in Kharghar with 4 bedrooms",
];

export default function AISearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (query) => {
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post("/ai/search", { query: query || q });
      setResult(data);
    } catch { toast.error("AI search failed, try again"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="hero-blue-bg hero-decor relative py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 relative">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-6"><Sparkle size={14} weight="fill" /> Powered by Claude AI</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">Ask, and we'll find it.</h1>
          <p className="text-slate-600 mb-8 max-w-2xl">Describe your dream home in plain English. Our AI understands budget, BHK, location and amenities.</p>
          <form onSubmit={e => { e.preventDefault(); run(); }} className="flex gap-2 mb-4">
            <input data-testid="ai-search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. 2 BHK under 80 lakh in Dombivli with parking"
              className="flex-1 px-5 py-4 border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder:text-slate-400" />
            <button data-testid="ai-search-submit" disabled={loading || !q.trim()} className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center gap-2">
              {loading ? "Thinking…" : <><MagnifyingGlass size={16} weight="bold" /> Search</>}
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex} data-testid={`example-${ex.slice(0,10)}`} onClick={() => { setQ(ex); run(ex); }} className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
      {result && (
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
          <div className="card-premium bg-blue-50 border-blue-100 p-5 mb-8">
            <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">AI Understood</div>
            <div className="font-mono text-xs text-slate-700 bg-white p-3 rounded-lg border border-blue-100 overflow-x-auto">{JSON.stringify(result.filters, null, 2)}</div>
            <div className="text-slate-600 mt-3 text-sm">{result.explanation}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.items.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
          {result.items.length === 0 && <div className="text-center py-16 text-slate-500 card-premium p-8">No matches. Try adjusting your query.</div>}
        </div>
      )}
    </div>
  );
}
