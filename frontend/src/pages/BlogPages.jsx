import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

export function Blog() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/blogs?limit=100").then(r => setItems(r.data || [])).catch(() => {}); }, []);

  const categories = useMemo(() => [...new Set(items.map(b => b.category).filter(Boolean))], [items]);
  const filtered = items.filter(b =>
    (!cat || b.category === cat) &&
    (!q.trim() || (b.title || "").toLowerCase().includes(q.trim().toLowerCase()) || (b.excerpt || "").toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <div>
      <div className="section-blue py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">Newsroom</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">Real Estate Insights</h1>
          <p className="text-slate-600 max-w-2xl">Market intelligence, buying guides and neighbourhood spotlights.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8" data-testid="blog-filters">
          <div className="flex flex-wrap gap-2 flex-1">
            <button onClick={() => setCat("")} data-testid="blog-cat-all"
              className={`text-xs px-3.5 py-2 rounded-full border font-semibold transition-colors ${!cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-300 hover:text-blue-600"}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} data-testid={`blog-cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={`text-xs px-3.5 py-2 rounded-full border font-semibold capitalize transition-colors ${cat === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-300 hover:text-blue-600"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input data-testid="blog-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles…"
              className="h-11 pl-10 rounded-full border-slate-300 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(b => (
            <Link key={b.id} to={`/blog/${b.slug}`} data-testid={`blog-item-${b.slug}`} className="group card-premium overflow-hidden">
              <div className="img-zoom-wrapper aspect-[16/10] bg-slate-100"><img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" /></div>
              <div className="p-6">
                <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-2">{b.category}</div>
                <h3 className="text-lg font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{b.title}</h3>
                <p className="text-sm text-slate-600 mt-3 line-clamp-2">{b.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-blue-50 rounded-xl border border-blue-100" data-testid="blog-empty">No articles match your search.</div>
        )}
      </div>
    </div>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const [b, setB] = useState(null);
  useEffect(() => { api.get(`/blogs/${slug}`).then(r => setB(r.data)).catch(() => setB(false)); window.scrollTo(0,0); }, [slug]);
  if (b === false) return <div className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Post not found</h1></div>;
  if (!b) return <div className="p-20 text-center text-slate-500">Loading…</div>;
  return (
    <article className="max-w-3xl mx-auto px-6 py-14 bg-white">
      <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-3">{b.category}</div>
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">{b.title}</h1>
      <img src={b.cover_image} alt="" className="w-full aspect-[16/10] object-cover rounded-2xl mb-8" />
      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: b.content }} />
      {b.related?.length > 0 && (
        <div className="mt-16 pt-10 border-t border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Related reads</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {b.related.map(r => <Link key={r.id} to={`/blog/${r.slug}`} className="text-sm text-slate-700 hover:text-blue-600 font-medium">{r.title}</Link>)}
          </div>
        </div>
      )}
    </article>
  );
}
