import { Link, NavLink, useNavigate } from "react-router-dom";
import { List, MagnifyingGlass, Heart } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const LIGHT_LOGO = "https://customer-assets-jt897jd0.emergentagent.net/job_dombivli-properties-1/artifacts/n2hi2rgl_CarpetAdda%20Light%20Logo.png";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/properties?listing_type=sale", label: "Buy" },
  { to: "/properties?listing_type=rent", label: "Rent" },
  { to: "/projects", label: "New Launches" },
  { to: "/properties?category=commercial", label: "Commercial" },
  { to: "/blog", label: "Journal" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-testid="site-header" className={`sticky top-0 z-40 border-b transition-all duration-300 backdrop-blur-xl bg-[#0B0C0E]/70 ${scrolled ? "border-amber-500/20 py-2" : "border-amber-500/10 py-3.5"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-6">
        <Link to="/" data-testid="logo-link" aria-label="CarpetAdda.com — Home" className="flex items-center shrink-0">
          <img src={LIGHT_LOGO} alt="CarpetAdda.com" width="457" height="140" className="h-9 sm:h-10 md:h-11 w-auto select-none" draggable="false" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `font-cinzel text-[11px] tracking-[0.2em] uppercase px-3 py-2 rounded-md transition-colors duration-300 ${
                  isActive ? "text-[#E6C665]" : "text-stone-400 hover:text-[#E6C665]"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button data-testid="ai-search-btn" onClick={() => nav("/ai-search")}
            className="flex items-center gap-2 font-cinzel text-[11px] tracking-[0.2em] uppercase px-3 py-2 text-stone-400 hover:text-[#E6C665] transition-colors">
            <MagnifyingGlass size={15} weight="bold" /> AI Search
          </button>
          {user ? (
            <>
              <Link to="/favorites" data-testid="header-favorites" className="p-2 text-stone-400 hover:text-[#E6C665] transition-colors"><Heart size={19} /></Link>
              <Link to="/dashboard" data-testid="header-dashboard" className="text-sm px-3 py-2 text-stone-300 hover:text-[#E6C665] font-medium">{user.name.split(" ")[0]}</Link>
              <button data-testid="header-logout" onClick={() => { logout(); nav("/"); }} className="text-sm text-stone-500 hover:text-stone-200 px-2">Logout</button>
            </>
          ) : (
            <Link to="/login" data-testid="header-login" className="font-cinzel text-[11px] tracking-[0.2em] uppercase px-3 py-2 text-stone-400 hover:text-[#E6C665] transition-colors">Sign In</Link>
          )}
          <Link to="/post-property" data-testid="header-post-property" className="lux-btn-gold text-xs px-5 py-2.5">Post Property</Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button data-testid="mobile-menu-btn" className="lg:hidden p-2 text-stone-300"><List size={26} /></button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-[#0B0C0E] border-l border-amber-500/15">
            <div className="mt-8 flex flex-col gap-1">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} data-testid={`mobile-nav-${l.label.toLowerCase().replace(/\s/g, "-")}`} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300 hover:text-[#E6C665]">{l.label}</Link>
              ))}
              <div className="h-px bg-amber-500/15 my-2" />
              <Link to="/ai-search" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">AI Search</Link>
              <Link to="/emi-calculator" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">EMI Calculator</Link>
              <Link to="/compare" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">Compare</Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">Dashboard</Link>
                  <button onClick={() => { logout(); setOpen(false); nav("/"); }} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 text-left rounded-md hover:bg-amber-500/10 text-stone-300">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">Sign In</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="font-cinzel text-xs tracking-[0.2em] uppercase py-3.5 px-3 rounded-md hover:bg-amber-500/10 text-stone-300">Register</Link>
                </>
              )}
              <Link to="/post-property" onClick={() => setOpen(false)} className="lux-btn-gold mt-4 text-sm py-3.5 px-4">Post Property</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
