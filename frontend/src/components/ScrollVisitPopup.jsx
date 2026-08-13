import { useEffect, useRef, useState } from "react";
import { CalendarBlank, X } from "@phosphor-icons/react";
import ScheduleVisitDialog from "@/components/ScheduleVisitDialog";

// Shows a Schedule Visit prompt once per listing per session, after ~40% page scroll.
export default function ScrollVisitPopup({ propertyId, projectId, targetName }) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const fired = useRef(false);
  const storageKey = `svp_${propertyId || projectId}`;

  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return;
    const onScroll = () => {
      if (fired.current) return;
      const doc = document.documentElement;
      const scrolled = (window.scrollY + window.innerHeight) / doc.scrollHeight;
      if (scrolled >= 0.4) {
        fired.current = true;
        sessionStorage.setItem(storageKey, "1");
        setShow(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [storageKey]);

  if (!show) return null;

  return (
    <>
      <div data-testid="scroll-visit-popup" className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm card-premium bg-white p-5 shadow-2xl border-blue-200 animate-[slideUp_.35s_ease]">
        <button onClick={() => setShow(false)} data-testid="scroll-visit-close" aria-label="Close" className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors">
          <X size={16} weight="bold" />
        </button>
        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
          <CalendarBlank size={22} weight="bold" />
        </div>
        <div className="font-bold text-slate-900 text-lg leading-snug pr-6">Want to see {targetName} in person?</div>
        <p className="text-sm text-slate-500 mt-1 mb-4">Book a free guided site visit — pick a date and time that suits you.</p>
        <button onClick={() => setOpen(true)} data-testid="scroll-visit-open" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
          Schedule a Visit
        </button>
      </div>
      <ScheduleVisitDialog open={open} onOpenChange={setOpen} propertyId={propertyId} projectId={projectId} targetName={targetName} />
    </>
  );
}
