import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { MapPin } from "@phosphor-icons/react";

/**
 * Address autocomplete backed by the site's existing OSM-based geocoding (/api/geo/search — no API key).
 * onSelect receives { address, lat, lng, city, locality, postcode } so forms can auto-fill location fields.
 */
export default function AddressSearchInput({ value, onChange, onSelect, dataTestid, placeholder }) {
  const [q, setQ] = useState(value || "");
  const [opts, setOpts] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debRef = useRef(null);

  useEffect(() => { setQ(value || ""); }, [value]);
  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const search = (text) => {
    setQ(text);
    onChange(text);
    clearTimeout(debRef.current);
    if (text.trim().length < 3) { setOpts([]); setOpen(false); return; }
    debRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/geo/search?q=${encodeURIComponent(text.trim())}`);
        setOpts(data || []);
        setOpen(true);
      } catch { setOpts([]); }
    }, 350);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Input data-testid={dataTestid} value={q} onChange={e => search(e.target.value)} onFocus={() => opts.length > 0 && setOpen(true)} placeholder={placeholder || "Start typing the address…"} autoComplete="off" />
      {open && opts.length > 0 && (
        <ul className="absolute z-30 inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" data-testid={`${dataTestid}-suggestions`}>
          {opts.map((o, i) => (
            <li key={i}>
              <button type="button" data-testid={`${dataTestid}-option-${i}`} className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 flex items-start gap-2 transition-colors"
                onClick={() => { setQ(o.address); onChange(o.address); setOpen(false); onSelect && onSelect(o); }}>
                <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <span>{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
