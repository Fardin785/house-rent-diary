import { Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { number, money } from "../utils";

export default function DailyConsumption({ daily, monthTo, latestWeek, latestThirtyDays }) {
  if (daily.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5 backdrop-blur-md">
      <div className="mb-5 flex justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <Activity size={19} className="text-cyan" /> Daily consumption
          </h2>
          <p className="mt-1 text-xs text-text-secondary">Daily usage for {monthTo}</p>
        </div>
        <span className="text-xs font-semibold text-text-muted">7 days through yesterday</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <AreaChart data={latestWeek} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyUsageGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="period"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(x, _name, entry) => [
                `${number(x, 3)} units · ${money(entry.payload.taka)}`,
                "Daily consumption",
              ]}
            />
            <Area
              type="monotone"
              dataKey="units"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#dailyUsageGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 overflow-x-auto border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">30 days through yesterday</h3>
          <span className="text-xs text-text-muted">{latestThirtyDays.length} days reported</span>
        </div>
        <table className="min-w-[360px] text-left text-sm">
          <thead className="bg-input/40 text-[0.7rem] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="rounded-l-sm px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5 text-right">Units</th>
              <th className="rounded-r-sm px-3 py-2.5 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {latestThirtyDays.map((day, index) => (
              <tr
                key={`${day.period}-${index}`}
                className="border-b border-border/60 last:border-0 hover:bg-hover/50"
              >
                <td className="px-3 py-2.5 font-medium text-text-primary">{day.period}</td>
                <td className="px-3 py-2.5 text-right text-text-secondary">{number(day.units, 3)} units</td>
                <td className="px-3 py-2.5 text-right font-medium text-text-primary">{money(day.taka)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
