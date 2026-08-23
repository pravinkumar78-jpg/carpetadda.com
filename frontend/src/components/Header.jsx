import { Link, NavLink, useNavigate } from "react-router-dom";
import { List, CaretDown, Heart } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DARK_LOGO = "https://customer-assets-jt897jd0.emergentagent.net/job_dombivli-properties-1/artifacts/doh3cm7v_CarpetAdda%20Dark%20Logo.png";

const PROPERTY_MENU = [
  { to: "/properties?listing_type=sale", label: "Buy", tid: "nav-prop-buy" },
  { to: "/properties?listing_type=rent", label: "Rent", tid: "nav-prop-rent" },
  { to: "/commercial-properties", label: "Commercial Properties", tid: "nav-prop-commercial-properties" },
  { to: "/projects?category=residential", label: "Residential Projects", tid: "nav-prop-residential" },
  { to: "/projects?category=commercial", label: "Commercial Projects", tid: "nav-prop-commercial" },
];

const linkCls = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200 ${isActive ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"}`;

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);

  return (
    <header data-testid="site-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-6 py-3">
        <Link to="/" data-testid="logo-link" aria-label="CarpetAdda.com — Home" className="flex items-center shrink-0">
          <img src={DARK_LOGO} alt="CarpetAdda.com" width="457" height="140" className="logo-light h-9 sm:h-10 md:h-11 w-auto select-none" draggable="false" />
          <img src="/logo-dark.png" alt="CarpetAdda.com" width="457" height="140" className="logo-dark h-9 sm:h-10 md:h-11 w-auto select-none" draggable="false" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/" end data-testid="nav-home" className={linkCls}>Home</NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger data-testid="nav-properties" className={`text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1 outline-none`}>
              Properties <CaretDown size={12} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {PROPERTY_MENU.map(i => (
                <DropdownMenuItem key={i.to} asChild>
                  <Link to={i.to} data-testid={i.tid} className="cursor-pointer">{i.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink to="/home-loan" data-testid="nav-home-loan" className={linkCls}>Loans</NavLink>
          <NavLink to="/new-launch" data-testid="nav-new-launch" className={linkCls}>New Launch</NavLink>
          <NavLink to="/rtmi" data-testid="nav-rtmi" className={linkCls}>RTMI</NavLink>
          <NavLink to="/blog" data-testid="nav-blog" className={linkCls}>Blog</NavLink>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/favorites" data-testid="header-favorites" className="p-2 text-slate-700 hover:text-blue-600 transition-colors"><Heart size={20} /></Link>
              <Link to="/dashboard" data-testid="header-dashboard" className="text-sm px-3 py-2 rounded-md text-slate-700 hover:text-blue-600 font-medium">{user.name.split(" ")[0]}</Link>
              <button data-testid="header-logout" onClick={() => { logout(); nav("/"); }} className="text-sm text-slate-500 hover:text-slate-900 px-2">Logout</button>
            </>
          ) : (
            <Link to="/login" data-testid="header-login" className="text-sm font-medium px-3 py-2 rounded-md text-slate-700 hover:text-blue-600 transition-colors">Sign-in</Link>
          )}
          <Link to="/post-property" data-testid="header-post-property" className="text-sm px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all">List Property</Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button data-testid="mobile-menu-btn" className="lg:hidden p-2 text-slate-700"><List size={26} /></button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-white flex flex-col p-0 overflow-hidden">
            <div className="mt-8 flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 flex flex-col gap-1" data-testid="mobile-menu-scroll">
              <Link to="/" onClick={() => setOpen(false)} data-testid="mobile-nav-home" className="text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">Home</Link>

              {/* Collapsible Properties submenu */}
              <div>
                <button
                  type="button"
                  onClick={() => setPropOpen(o => !o)}
                  data-testid="mobile-nav-properties-toggle"
                  aria-expanded={propOpen}
                  className="w-full flex items-center justify-between text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800"
                >
                  Properties
                  <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${propOpen ? "rotate-180" : ""}`} />
                </button>
                {propOpen && (
                  <div className="flex flex-col gap-0.5 pb-1">
                    {PROPERTY_MENU.map(i => (
                      <Link key={i.to} to={i.to} onClick={() => setOpen(false)} data-testid={`mobile-${i.tid}`} className="text-sm py-2.5 px-6 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-700">{i.label}</Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/home-loan" onClick={() => setOpen(false)} data-testid="mobile-nav-home-loan" className="text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">Loans</Link>
              <Link to="/new-launch" onClick={() => setOpen(false)} data-testid="mobile-nav-new-launch" className="text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">New Launch</Link>
              <Link to="/rtmi" onClick={() => setOpen(false)} data-testid="mobile-nav-rtmi" className="text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">RTMI</Link>
              <Link to="/blog" onClick={() => setOpen(false)} data-testid="mobile-nav-blog" className="text-base font-medium py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">Blog</Link>
              <div className="h-px bg-slate-200 my-2" />
              <Link to="/emi-calculator" onClick={() => setOpen(false)} className="text-base py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">EMI Calculator</Link>
              <Link to="/faqs" onClick={() => setOpen(false)} className="text-base py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">FAQs</Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="text-base py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">Dashboard</Link>
                  <button onClick={() => { logout(); setOpen(false); nav("/"); }} className="text-base py-3 px-3 text-left rounded-md hover:bg-blue-50 text-slate-800">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} data-testid="mobile-nav-signin" className="text-base py-3 px-3 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-800">Sign-in</Link>
              )}
              <Link to="/post-property" onClick={() => setOpen(false)} data-testid="mobile-nav-list-property" className="mt-4 text-center bg-blue-600 text-white py-3 px-4 rounded-lg font-medium">List Property</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
