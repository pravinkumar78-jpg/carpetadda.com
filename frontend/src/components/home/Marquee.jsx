const PHRASES = [
  "MUMBAI SKYLINE COLLECTION",
  "THANE LUXURY ESTATES",
  "NAVI MUMBAI WATERFRONT",
  "KALYAN-DOMBIVLI TOWNSHIPS",
  "RERA VERIFIED DEVELOPERS",
  "ZERO BROKERAGE ON SELECT NEW LAUNCHES",
];

export default function Marquee() {
  const row = [...PHRASES, ...PHRASES];
  return (
    <div data-testid="editorial-marquee" className="bg-[#0B0C0E] border-y border-amber-500/15 py-5 overflow-hidden select-none">
      <div className="animate-lux-marquee flex whitespace-nowrap w-max">
        {[0, 1].map(half => (
          <div key={half} className="flex">
            {row.map((p, i) => (
              <span key={`${half}-${i}`} className="flex items-center">
                <span className="font-cinzel text-sm tracking-[0.3em] text-stone-400 px-8">{p}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
