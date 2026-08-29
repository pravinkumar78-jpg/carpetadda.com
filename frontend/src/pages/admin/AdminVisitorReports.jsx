import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, UserCheck, Eye, ChatCircle, WhatsappLogo, PhoneCall, CalendarCheck, Buildings, House, Link as LinkIcon, DeviceMobile, MapPin } from "@phosphor-icons/react";

const RANGES = [["today", "Today"], ["7d", "7 Days"], ["30d", "30 Days"], ["custom", "Custom"]];

export default function AdminVisitorReports() {
  const [range, setRange] = useState("7d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const dates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (range === "today") return { from: today, to: today };
    if (range === "custom") return (custom.from && custom.to) ? custom : null;
    const d = new Date();
    d.setDate(d.getDate() - (range === "30d" ? 29 : 6));
    return { from: d.toISOString().slice(0, 10), to: today };
  }, [range, custom]);

  useEffect(() => {
    if (!dates) { setData(null); return; }
    setLoading(true);
    api.get(`/admin/analytics/summary?date_from=${dates.from}&date_to=${dates.to}`)
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load visitor report"))
      .finally(() => setLoading(false));
  }, [dates]);

  const maxTrend = Math.max(1, ...(data?.trend || []).map(t => t.page_views));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Visitor Reports</h2>
          <p className="text-sm text-slate-500">Anonymous visitor activity and site performance. No personal data is collected or shown.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap" data-testid="report-ranges">
          {RANGES.map(([v, l]) => (
            <button key={v} data-testid={`range-${v}`} onClick={() => setRange(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${range === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"}`}>{l}</button>
          ))}
          {range === "custom" && (
            <>
              <Input type="date" data-testid="range-from" value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} className="h-10 w-40 rounded-lg border-slate-200" />
              <span className="text-slate-400 text-sm">to</span>
              <Input type="date" data-testid="range-to" value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} className="h-10 w-40 rounded-lg border-slate-200" />
            </>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>}
      {!loading && !data && <div className="text-sm text-slate-500 py-12 text-center">Pick a start and end date.</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6" data-testid="report-stats">
            <Stat icon={<Users size={18} />} label="Total Visitors" value={data.total_visitors} />
            <Stat icon={<UserCheck size={18} />} label="Unique Visitors" value={data.unique_visitors} />
            <Stat icon={<Eye size={18} />} label="Page Views" value={data.page_views} />
            <Stat icon={<Users size={18} />} label="Sessions" value={data.sessions} />
            <Stat icon={<UserPlus size={18} />} label="New Visitors" value={data.new_visitors} />
            <Stat icon={<UserCheck size={18} />} label="Returning Visitors" value={data.returning_visitors} />
            <Stat icon={<ChatCircle size={18} />} label="Enquiries" value={data.enquiries} />
            <Stat icon={<WhatsappLogo size={18} />} label="WhatsApp Clicks" value={data.whatsapp_clicks} />
            <Stat icon={<PhoneCall size={18} />} label="Call Clicks" value={data.call_clicks} />
            <Stat icon={<CalendarCheck size={18} />} label="Site Visit Enquiries" value={data.site_visits} />
          </div>

          <div className="card-premium p-5 mb-6" data-testid="report-trend">
            <h3 className="font-semibold text-slate-900 mb-1">Daily Trend</h3>
            <p className="text-xs text-slate-500 mb-4">{dates.from} → {dates.to} · bars = page views, line label = unique visitors</p>
            {data.trend.length === 0 && <div className="text-sm text-slate-500 py-6 text-center">No visitor activity in this range yet.</div>}
            <div className="flex items-end gap-1.5 h-32">
              {data.trend.map(t => (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${t.date}: ${t.page_views} views · ${t.visitors} visitors`}>
                  <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${Math.max(3, (t.page_views / maxTrend) * 100)}%` }} />
                  <div className="text-[10px] text-slate-400 truncate w-full text-center">{t.date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RankCard icon={<House size={16} />} title="Top Viewed Properties" rows={data.top_properties} testid="report-top-properties" linkPrefix="/property/" />
            <RankCard icon={<Buildings size={16} />} title="Top Viewed Projects" rows={data.top_projects} testid="report-top-projects" linkPrefix="/project/" />
            <RankCard icon={<Eye size={16} />} title="Top Pages" rows={data.top_pages} testid="report-top-pages" />
            <RankCard icon={<LinkIcon size={16} />} title="Traffic Sources / Referrers" rows={data.top_referrers} testid="report-referrers" />
            <RankCard icon={<DeviceMobile size={16} />} title="Devices" rows={data.devices} testid="report-devices" />
            <RankCard icon={<MapPin size={16} />} title="Locations (where available)" rows={data.cities} testid="report-cities" />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{icon} {label}</div>
      <div className="text-2xl font-bold text-slate-900">{value ?? 0}</div>
    </div>
  );
}

function RankCard({ icon, title, rows, testid, linkPrefix }) {
  const max = Math.max(1, ...(rows || []).map(r => r.count));
  return (
    <div className="card-premium p-5" data-testid={testid}>
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">{icon} {title}</h3>
      {(!rows || rows.length === 0) && <div className="text-sm text-slate-400 py-4 text-center">No data in this range yet.</div>}
      <div className="space-y-2">
        {(rows || []).map((r, i) => (
          <div key={i} className="relative">
            <div className="absolute inset-y-0 left-0 bg-blue-50 rounded" style={{ width: `${(r.count / max) * 100}%` }} />
            <div className="relative flex items-center justify-between gap-2 px-2 py-1 text-sm">
              <span className="truncate text-slate-700">
                {linkPrefix && r.slug ? <a href={`${linkPrefix}${r.slug}`} target="_blank" rel="noopener" className="hover:text-blue-600">{r.name}</a> : (r.name || "—")}
              </span>
              <span className="font-semibold text-slate-900 shrink-0">{r.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
