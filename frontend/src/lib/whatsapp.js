import { formatINR } from "@/lib/format";

export const WA_NUMBER = "918828830707";

export const waLink = (msg) =>
  `https://wa.me/${WA_NUMBER}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

export const waPropertyMsg = (p) => waLink([
  `Hello, I am interested in your property listing: ${p.title}`,
  p.id ? `(ID: ${p.id})` : "",
  [p.location, p.city].filter(Boolean).length ? `Location: ${[p.location, p.city].filter(Boolean).map(s => String(s).replace(/-/g, " ")).join(", ")}` : "",
  p.bhk ? `Configuration: ${p.bhk} BHK` : "",
  p.price ? `Price: ${formatINR(p.price)}${p.listing_type === "rent" ? "/month" : ""}` : "",
  "Please share more details.",
].filter(Boolean).join(". ").replace(/\.\./g, "."));

export const waProjectMsg = (p) => waLink([
  `Hello, I am interested in ${p.name}`,
  p.developer_name ? `by ${p.developer_name}` : "",
  [p.location, p.city].filter(Boolean).length ? `Location: ${[p.location, p.city].filter(Boolean).map(s => String(s).replace(/-/g, " ")).join(", ")}` : "",
  (p.configurations || []).length ? `Configurations: ${p.configurations.join(", ")}` : "",
  p.price_from ? `Starting at ${formatINR(p.price_from)}` : "",
  "Please share more details.",
].filter(Boolean).join(". ").replace(/\.\./g, "."));

export const waAgentMsg = (a) => waLink(
  `Hello, I found ${a.name} on CarpetAdda and would like to enquire about their property listings. Please connect us.`
);
