import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";

const STATIC_PAGES = ["/", "/properties", "/projects", "/blog", "/about", "/contact", "/faqs", "/home-loan", "/post-property", "/ai-search", "/emi-calculator", "/compare", "/agents", "/developers"];
const DEFAULT_TITLE = "CarpetAdda — Every Dream Deserves an Address";

function setMeta(selector, attrs, content) {
  let el = document.head.querySelector(selector);
  if (!content) { el?.remove(); return; }
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  if (el.tagName === "LINK") el.setAttribute("href", content);
  else el.setAttribute("content", content);
}

export function applySeo(seo, page) {
  document.title = seo?.meta_title || DEFAULT_TITLE;
  setMeta('meta[name="description"]', { name: "description" }, seo?.meta_description);
  setMeta('meta[name="keywords"]', { name: "keywords" }, seo?.meta_keywords);
  setMeta('meta[property="og:title"]', { property: "og:title" }, seo?.og_title || seo?.meta_title);
  setMeta('meta[property="og:description"]', { property: "og:description" }, seo?.og_description || seo?.meta_description);
  setMeta('meta[property="og:image"]', { property: "og:image" }, seo?.og_image);
  setMeta('link[rel="canonical"]', { rel: "canonical" }, seo?.canonical_url);
  setMeta('meta[name="robots"]', { name: "robots" }, seo?.robots);
}

export default function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!STATIC_PAGES.includes(pathname)) return;
    let cancelled = false;
    api.get(`/seo?page=${encodeURIComponent(pathname)}`)
      .then(r => { if (!cancelled) applySeo(r.data, pathname); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);
  return null;
}
