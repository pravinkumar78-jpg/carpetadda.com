import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

/**
 * Mobile collapsible dashboard navigation.
 * - Mobile (< lg): sidebar hidden by default; a floating arrow pill at the
 *   RIGHT-middle edge slides it in/out as an overlay drawer (backdrop tap closes).
 * - Desktop (lg+): renders inline exactly as before (static grid child).
 * Wraps the dashboard's EXISTING nav markup — no duplication.
 */
export function DashNavToggle({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="dash-nav-toggle"
      aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
      aria-expanded={open}
      className={`lg:hidden fixed top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1 bg-blue-600 text-white py-4 shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-[right,background-color] duration-300 ${open ? "right-[min(18rem,85vw)] rounded-l-none rounded-r-xl pl-2.5 pr-2" : "right-0 rounded-l-xl pl-2 pr-2.5"}`}
    >
      {open ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
      <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl]">{open ? "Close" : "Menu"}</span>
    </button>
  );
}

export function DashSidebar({ open, onClose, children, testid = "dash-sidebar" }) {
  return (
    <>
      {open && (
        <div onClick={onClose} data-testid="dash-nav-backdrop" aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden" />
      )}
      <div
        data-testid={testid}
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto overscroll-contain bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"} lg:static lg:z-auto lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:shadow-none lg:transform-none`}
      >
        <div className="flex justify-end p-3 lg:hidden">
          <button type="button" onClick={onClose} data-testid="dash-nav-close" aria-label="Close menu"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <X size={18} weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
