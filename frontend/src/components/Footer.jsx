import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { EnvelopeSimple, WhatsappLogo, InstagramLogo, LinkedinLogo, FacebookLogo, YoutubeLogo, TwitterLogo, MapPin, PhoneCall, Sun, Moon } from "@phosphor-icons/react";
import { useSettings } from "@/lib/useSettings";
import api from "@/lib/api";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem("eh_theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("eh_theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      onClick={() => setDark(d => !d)}
      data-testid="theme-toggle"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-300 bg-white text-slate-600 text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors"
    >
      {dark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

const LIGHT_LOGO = "https://customer-assets-jt897jd0.emergentagent.net/job_dombivli-properties-1/artifacts/doh3cm7v_CarpetAdda%20Dark%20Logo.png";

function formatWa(num) {
  const digits = String(num || "").replace(/\D/g, "");
  if (digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return num;
}

export default function Footer() {
  const s = useSettings();
  const [pages, setPages] = useState([]);
  useEffect(() => { api.get("/pages").then(r => setPages(r.data || [])).catch(() => {}); }, []);
  const whatsappDigits = (s?.whatsapp_number || "918828830707").replace(/\D/g, "");
  const email = s?.contact_email || "contact@carpetadda.com";
  const address = s?.office_address || "A-502, BSEL Tech Park, Sector 30A, Opp. Vashi Railway Station, Navi Mumbai, Maharashtra.";
  const socials = [
    [InstagramLogo, s?.instagram_url],
    [LinkedinLogo, s?.linkedin_url],
    [FacebookLogo, s?.facebook_url],
    [YoutubeLogo, s?.youtube_url],
    [TwitterLogo, s?.twitter_url],
  ].filter(([, url]) => !!url);

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-700 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <Link to="/" aria-label="CarpetAdda.com — Home" className="inline-block mb-4">
            <img src={LIGHT_LOGO} alt="CarpetAdda.com" width="457" height="140" className="logo-light h-10 w-auto select-none" draggable="false" />
            <img src="/logo-dark.png" alt="CarpetAdda.com" width="457" height="140" className="logo-dark h-10 w-auto select-none" draggable="false" />
          </Link>
          <p className="text-sm text-slate-500 leading-relaxed" data-testid="footer-tagline">
            Verified listings, expert agents and market intelligence across Mumbai, Thane, Navi Mumbai, Dombivli &amp; Kalyan.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-5">
              {socials.map(([I, url], i) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors" aria-label="social">
                  <I size={16} weight="regular" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-4">Explore</div>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
            <li><Link to="/properties?listing_type=sale" data-testid="footer-link-buy" className="hover:text-blue-600">Buy</Link></li>
            <li><Link to="/properties?listing_type=rent" className="hover:text-blue-600">Rent</Link></li>
            <li><Link to="/projects?category=residential" className="hover:text-blue-600">Residential Projects</Link></li>
            <li><Link to="/projects?category=commercial" className="hover:text-blue-600">Commercial Projects</Link></li>
            <li><Link to="/home-loan" data-testid="footer-link-home-loan" className="hover:text-blue-600">Home Loan</Link></li>
            <li><Link to="/blog" className="hover:text-blue-600">Blog</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-4">Company</div>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li><Link to="/about" data-testid="footer-link-about" className="hover:text-blue-600">About Us</Link></li>
            <li><Link to="/contact" data-testid="footer-link-contact" className="hover:text-blue-600">Contact</Link></li>
            <li><Link to="/faqs" data-testid="footer-link-faqs" className="hover:text-blue-600">FAQs</Link></li>
            {pages.map(pg => (
              <li key={pg.id}><Link to={`/page/${pg.slug}`} data-testid={`footer-page-${pg.slug}`} className="hover:text-blue-600">{pg.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-4">Contact</div>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2"><PhoneCall size={16} className="text-blue-500" /> <a data-testid="footer-phone" href={`tel:+${whatsappDigits}`} className="hover:text-blue-600">{formatWa(whatsappDigits)}</a></li>
            <li className="flex items-center gap-2"><WhatsappLogo size={16} className="text-blue-500" /> <a data-testid="footer-whatsapp" href={`https://wa.me/${whatsappDigits}`} className="hover:text-blue-600">{formatWa(whatsappDigits)}</a></li>
            <li className="flex items-center gap-2"><EnvelopeSimple size={16} className="text-blue-500" /> <a data-testid="footer-email" href={`mailto:${email}`} className="hover:text-blue-600 break-all">{email}</a></li>
            <li className="flex items-start gap-2 pt-1 text-slate-500 leading-relaxed" data-testid="footer-address"><MapPin size={16} className="text-blue-500 mt-1 flex-shrink-0" /> {address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div data-testid="footer-copyright">© {new Date().getFullYear()} CarpetAdda. All rights reserved.</div>
          <div className="flex gap-5 items-center">
            <Link to="/about" className="hover:text-blue-600">About</Link>
            <Link to="/contact" className="hover:text-blue-600">Contact</Link>
            <Link to="/faqs" className="hover:text-blue-600">FAQs</Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
