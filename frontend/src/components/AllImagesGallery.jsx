import { useCallback, useEffect, useState } from "react";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * "All Images" gallery — aggregates every existing image field of a listing
 * (deduped by URL) into a responsive grid with a full lightbox
 * (prev/next/close, keyboard arrows + Esc, touch swipe).
 * Pass pre-built items via `items` ([{src, label}]) — no fetching here.
 */
export default function AllImagesGallery({ items = [], testid = "all-images" }) {
  const [open, setOpen] = useState(null); // index | null
  const [touchX, setTouchX] = useState(null);

  // Dedupe by URL, keep first occurrence's label
  const images = [];
  for (const it of items) {
    if (it && it.src && !images.some(x => x.src === it.src)) images.push(it);
  }

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d) => setOpen(i => (i === null ? null : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, close, step]);

  if (!images.length) return null;

  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
    setTouchX(null);
  };

  const current = open !== null ? images[open] : null;

  return (
    <section data-testid={`${testid}-section`}>
      <h2 className="text-2xl font-bold text-slate-900 mb-5">All Images <span className="text-sm font-normal text-slate-500">({images.length})</span></h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button key={img.src} type="button" onClick={() => setOpen(i)} data-testid={`${testid}-img-${i}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <img src={img.src} alt={img.label || `Image ${i + 1}`} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {img.label && (
              <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-slate-900/70 text-white px-2 py-1 rounded-md backdrop-blur-sm">{img.label}</span>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div data-testid={`${testid}-lightbox`} role="dialog" aria-modal="true" aria-label="Image viewer"
          className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={close} onTouchStart={e => setTouchX(e.changedTouches[0].clientX)} onTouchEnd={onTouchEnd}>
          <button type="button" onClick={close} data-testid={`${testid}-lightbox-close`} aria-label="Close"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <X size={20} weight="bold" />
          </button>
          <div className="text-white/70 text-xs font-medium tracking-widest uppercase mb-3" data-testid={`${testid}-lightbox-counter`}>
            Image {open + 1} of {images.length}{current.label ? ` · ${current.label}` : ""}
          </div>
          <img src={current.src} alt={current.label || `Image ${open + 1}`} onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl select-none" draggable={false} />
          {images.length > 1 && (
            <div className="flex items-center gap-4 mt-4" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => step(-1)} data-testid={`${testid}-lightbox-prev`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white text-sm font-semibold transition-colors">
                <CaretLeft size={16} weight="bold" /> Previous
              </button>
              <button type="button" onClick={() => step(1)} data-testid={`${testid}-lightbox-next`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white text-sm font-semibold transition-colors">
                Next <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
