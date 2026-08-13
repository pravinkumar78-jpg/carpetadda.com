export const formatINR = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const num = Number(n);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
};

export const formatArea = (n, unit = "sqft") =>
  n ? `${Math.round(n)} ${unit === "sqft" ? "sq.ft." : unit}` : "—";
