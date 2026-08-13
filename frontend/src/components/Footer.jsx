import { Link } from "react-router-dom";
import { EnvelopeSimple, WhatsappLogo, InstagramLogo, LinkedinLogo, FacebookLogo, YoutubeLogo, TwitterLogo, MapPin } from "@phosphor-icons/react";
import { useSettings } from "@/lib/useSettings";

function formatWa(num) {
  if (!num) return "";
  const digits = String(num).replace(/\D/g, "");
  if (digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return num;
}

export default function Footer() {
  const s = useSettings();
  const whatsappDigits = (s?.whatsapp_number || "919820000000").replace(/\D/g, "");
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
    <footer className="bg-[#0B0C0E] text-stone-300 border-t border-amber-500/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="lux-overline mb-4">The MMR Real Estate Archive</div>
          <p className="text-sm text-stone-400 leading-relaxed" data-testid="footer-tagline">
            Verified listings, elite agents and market intelligence across Mumbai, Thane, Navi Mumbai, Dombivli &amp; Kalyan.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-6">
              {socials.map(([I, url], i) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="w-9 h-9 rounded-full border border-amber-500/20 flex items-center justify-center text-stone-400 hover:text-[#E6C665] hover:border-amber-500/50 transition-colors" aria-label="social">
                  <I size={16} weight="regular" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="lux-overline mb-5">Explore</div>
          <ul className="space-y-2.5 text-sm text-stone-400">
            <li><Link to="/properties?listing_type=sale" className="hover:text-[#E6C665] transition-colors">Buy</Link></li>
            <li><Link to="/properties?listing_type=rent" className="hover:text-[#E6C665] transition-colors">Rent</Link></li>
            <li><Link to="/projects" className="hover:text-[#E6C665] transition-colors">New Launches</Link></li>
            <li><Link to="/properties?category=commercial" className="hover:text-[#E6C665] transition-colors">Commercial</Link></li>
            <li><Link to="/agents" className="hover:text-[#E6C665] transition-colors">Agents</Link></li>
            <li><Link to="/developers" className="hover:text-[#E6C665] transition-colors">Developers</Link></li>
            <li><Link to="/ai-search" className="hover:text-[#E6C665] transition-colors">AI Search</Link></li>
            <li><Link to="/emi-calculator" className="hover:text-[#E6C665] transition-colors">EMI Calculator</Link></li>
          </ul>
        </div>
        <div>
          <div className="lux-overline mb-5">Localities</div>
          <ul className="space-y-2.5 text-sm text-stone-400">
            <li><Link to="/location/mumbai" data-testid="footer-link-mumbai" className="hover:text-[#E6C665] transition-colors">Mumbai</Link></li>
            <li><Link to="/location/thane" data-testid="footer-link-thane" className="hover:text-[#E6C665] transition-colors">Thane</Link></li>
            <li><Link to="/location/navi-mumbai" className="hover:text-[#E6C665] transition-colors">Navi Mumbai</Link></li>
            <li><Link to="/location/dombivli" className="hover:text-[#E6C665] transition-colors">Dombivli</Link></li>
            <li><Link to="/location/kalyan" className="hover:text-[#E6C665] transition-colors">Kalyan</Link></li>
          </ul>
        </div>
        <div>
          <div className="lux-overline mb-5">Concierge</div>
          <ul className="space-y-3 text-sm text-stone-400">
            <li className="flex items-center gap-2"><WhatsappLogo size={16} className="text-[#E6C665]" /> <a data-testid="footer-whatsapp" href={`https://wa.me/${whatsappDigits}`} className="hover:text-[#E6C665] transition-colors">{formatWa(whatsappDigits)}</a></li>
            <li className="flex items-center gap-2"><EnvelopeSimple size={16} className="text-[#E6C665]" /> <a data-testid="footer-email" href={`mailto:${email}`} className="hover:text-[#E6C665] transition-colors">{email}</a></li>
            <li className="flex items-start gap-2 pt-2 text-stone-500 leading-relaxed" data-testid="footer-address"><MapPin size={16} className="text-[#E6C665] mt-1 flex-shrink-0" /> {address}</li>
          </ul>
        </div>
      </div>

      <div className="select-none pointer-events-none px-2" aria-hidden="true">
        <div data-testid="footer-logo-text" className="gold-text font-display font-bold text-center leading-[0.85] tracking-tight text-[11.5vw] whitespace-nowrap opacity-90">
          CARPETADDA
        </div>
      </div>

      <div className="border-t border-amber-500/10 mt-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-spacemono">
          <div>© {new Date().getFullYear()} CARPETADDA — EVERY DREAM DESERVES AN ADDRESS</div>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-[#E6C665] transition-colors">About</Link>
            <Link to="/contact" className="hover:text-[#E6C665] transition-colors">Contact</Link>
            <Link to="/blog" className="hover:text-[#E6C665] transition-colors">Journal</Link>
            <Link to="/about" data-testid="footer-link-privacy" className="hover:text-[#E6C665] transition-colors">Privacy</Link>
            <Link to="/about" data-testid="footer-link-terms" className="hover:text-[#E6C665] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
