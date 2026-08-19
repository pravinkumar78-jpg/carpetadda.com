import { useCallback, useEffect, useRef, useState } from "react";
import { X, CaretLeft, CaretRight, MagnifyingGlassPlus, MagnifyingGlassMinus } from "@phosphor-icons/react";

/**
 * "All Images" gallery — aggregates every existing image field of a listing
 * (deduped by URL, labeled) into a responsive grid with a full lightbox:
 * prev/next/close, keyboard arrows + Esc, touch swipe, and zoom
 * (click/double-tap toggle, wheel, +/- buttons, drag pan, pinch on touch).
 * Pass pre-built items via `items` ([{src, label}]) — no fetching here.
 */
export default function AllImagesGallery({ items = [], testid = "all-images", title = "All Images" }) {
  const [open, setOpen] = useState(null); // index | null
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const dragStart = useRef(null);
  const lastTap = useRef(0);
  const touchX = useRef(null);

  // Dedupe by URL, keep first occurrence's label
  const images = [];
  for (const it of items) {
    if (it && it.src && !images.some(x => x.src === it.src)) images.push(it);
  }

  const resetZoom = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }); }, []);
  const close = useCallback(() => { resetZoom(); setOpen(null); }, [resetZoom]);
  const step = useCallback((d) => { resetZoom(); setOpen(i => (i === null ? null : (i + d + images.length) % images.length)); }, [images.length, resetZoom]);

  const zoomTo = useCallback((next) => {
    const s = Math.min(4, Math.max(1, next));
    setScale(s);
    if (s === 1) setPan({ x: 0, y: 0 });
  }, []);

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

  const clampPan = (p, s) => {
    const max = (s - 1) * 300;
    return { x: Math.max(-max, Math.min(max, p.x)), y: Math.max(-max, Math.min(max, p.y)) };
  };

  const onWheel = (e) => {
    e.preventDefault();
    zoomTo(scale + (e.deltaY < 0 ? 0.5 : -0.5));
  };

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b2] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b2.x, a.y - b2.y), scale };
      dragStart.current = null;
    } else if (scale > 1) {
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b2] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b2.x, a.y - b2.y);
      zoomTo(pinchStart.current.scale * (dist / pinchStart.current.dist));
    } else if (dragStart.current && scale > 1) {
      setPan(clampPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }, scale));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    dragStart.current = null;
  };

  const onImgClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) { zoomTo(scale > 1 ? 1 : 2.5); lastTap.current = 0; return; }
    lastTap.current = now;
    // single click (mouse) toggles zoom; touch waits for double-tap window
    if (e.pointerType !== "touch") zoomTo(scale > 1 ? 1 : 2.5);
  };

  const onTouchStartSwipe = (e) => {
    if (e.touches.length === 1 && scale === 1) touchX.current = e.touches[0].clientX;
    else touchX.current = null;
  };
  const onTouchEndSwipe = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
    touchX.current = null;
  };

  const current = open !== null ? images[open] : null;

  return (
    <section data-testid={`${testid}-section`} id={`${testid}-section`}>
      <h2 className="text-2xl font-bold text-slate-900 mb-5">{title} <span className="text-sm font-normal text-slate-500">({images.length})</span></h2>
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
          className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-hidden"
          onClick={close}
          onTouchStart={onTouchStartSwipe} onTouchEnd={onTouchEndSwipe}>
          <button type="button" onClick={close} data-testid={`${testid}-lightbox-close`} aria-label="Close"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <X size={20} weight="bold" />
          </button>
          {/* zoom controls */}
          <div className="absolute top-4 left-4 z-10 flex gap-2" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => zoomTo(scale + 0.5)} data-testid={`${testid}-zoom-in`} aria-label="Zoom in"
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors disabled:opacity-40" disabled={scale >= 4}>
              <MagnifyingGlassPlus size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => zoomTo(scale - 0.5)} data-testid={`${testid}-zoom-out`} aria-label="Zoom out"
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors disabled:opacity-40" disabled={scale <= 1}>
              <MagnifyingGlassMinus size={18} weight="bold" />
            </button>
          </div>
          <div className="text-white/70 text-xs font-medium tracking-widest uppercase mb-3" data-testid={`${testid}-lightbox-counter`}>
            Image {open + 1} of {images.length}{current.label ? ` · ${current.label}` : ""}{scale > 1 ? ` · ${Math.round(scale * 100)}%` : ""}
          </div>
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={current.src} alt={current.label || `Image ${open + 1}`}
              onClick={onImgClick} onWheel={onWheel}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, touchAction: "none", transition: dragStart.current || pinchStart.current ? "none" : "transform 0.2s ease" }}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              draggable={false} data-testid={`${testid}-lightbox-img`} />
          </div>
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
