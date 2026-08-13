import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { formatINR } from "@/lib/format";

// Fix Leaflet marker default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PropertyMap({ items = [], center = [19.076, 72.8777], zoom = 11, height = 500 }) {
  const valid = items.filter(p => p.lat && p.lng);
  const centerToUse = valid.length ? [valid[0].lat, valid[0].lng] : center;

  return (
    <div data-testid="property-map" style={{ height }} className="w-full overflow-hidden border border-border">
      <MapContainer center={centerToUse} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <img src={p.images?.[0]} alt="" style={{ width: "100%", height: 100, objectFit: "cover", marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                <div style={{ color: "#0A192F", fontWeight: 600 }}>{formatINR(p.listing_type === "rent" ? p.rent : p.price)}</div>
                <Link to={`/property/${p.slug}`} style={{ color: "#C8A97E", fontSize: 12, marginTop: 6, display: "inline-block" }}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
