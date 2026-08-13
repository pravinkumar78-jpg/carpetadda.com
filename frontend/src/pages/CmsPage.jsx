import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";

export default function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);

  useEffect(() => {
    setPage(null);
    api.get(`/pages/${slug}`).then(r => setPage(r.data)).catch(() => setPage(false));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    document.title = page.seo?.title || `${page.title} | CarpetAdda`;
    if (page.seo?.description) {
      let el = document.head.querySelector('meta[name="description"]');
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", "description"); document.head.appendChild(el); }
      el.setAttribute("content", page.seo.description);
    }
  }, [page]);

  if (page === false) return <div className="max-w-4xl mx-auto p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Page not found</h1><Link to="/" className="text-blue-600 mt-4 inline-block font-medium">Go home →</Link></div>;
  if (!page) return <div className="max-w-4xl mx-auto p-20 text-center text-slate-500">Loading…</div>;

  return (
    <div data-testid="cms-page">
      <div className="section-blue py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{page.title}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="rich-content text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content || "" }} />
      </div>
    </div>
  );
}
