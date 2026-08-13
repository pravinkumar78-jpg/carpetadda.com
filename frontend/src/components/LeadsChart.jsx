import { ChartBar } from "@phosphor-icons/react";

/**
 * Lightweight CSS-isometric 3D bar chart for lead/conversion stats.
 * No chart library — renders instantly, no performance cost.
 * Props: stats { total, contacted, converted, conversion } | null (loading)
 */
export default function LeadsChart({ stats, title = "Lead Performance" }) {
  return (
    <div className="card-premium p-6" data-testid="leads-chart">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{title}</div>
          <div className="text-lg font-bold text-slate-900 mt-1">Leads → Conversion Funnel</div>
        </div>
        {stats && stats.total > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600" data-testid="leads-conversion">{stats.conversion}%</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Conversion</div>
          </div>
        )}
      </div>

      {!stats ? (
        <div className="h-44 flex items-center justify-center text-slate-400 text-sm">Loading chart…</div>
      ) : stats.total === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-400 gap-2" data-testid="leads-chart-empty">
          <ChartBar size={28} />
          <div className="text-sm">Not enough data yet — leads assigned to you will appear here.</div>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-around gap-6 px-4 pt-4 pb-2" style={{ minHeight: 200 }}>
            <Bar3d label="Total Leads" value={stats.total} max={stats.total} colors={["#8CA5EA", "#708DE6", "#5C76D4"]} tid="bar-total" />
            <Bar3d label="Contacted" value={stats.contacted} max={stats.total} colors={["#fbbf24", "#f59e0b", "#b45309"]} tid="bar-contacted" />
            <Bar3d label="Converted" value={stats.converted} max={stats.total} colors={["#34d399", "#10b981", "#047857"]} tid="bar-converted" />
          </div>
          <div className="flex justify-around gap-6 px-4 pt-3 border-t border-slate-100 mt-2 text-center">
            {[["Total Leads", stats.total], ["Contacted", stats.contacted], ["Converted", stats.converted]].map(([l, v]) => (
              <div key={l} className="flex-1">
                <div className="text-xl font-bold text-slate-900">{v}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{l}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Bar3d({ label, value, max, colors, tid }) {
  const h = Math.max(10, Math.round((value / Math.max(max, 1)) * 140));
  return (
    <div className="flex flex-col items-center gap-2" data-testid={`leads-${tid}`}>
      <div className="text-xs font-bold text-slate-700">{value}</div>
      <div className="relative" style={{ width: 46, height: h, background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`, borderRadius: "4px 4px 0 0" }}>
        {/* top face */}
        <div style={{ position: "absolute", top: -12, left: 6, width: 46, height: 12, transform: "skewX(-45deg)", background: colors[0], borderRadius: "4px 2px 0 0" }} />
        {/* side face */}
        <div style={{ position: "absolute", top: -6, right: -12, width: 12, height: h, transform: "skewY(-45deg)", background: colors[2], borderRadius: "0 2px 0 0" }} />
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold whitespace-nowrap">{label}</div>
    </div>
  );
}
