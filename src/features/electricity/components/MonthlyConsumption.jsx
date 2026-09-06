import { ChartNoAxesCombined } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { number, money, formatMonthPeriod } from "../utils";

export default function MonthlyConsumption({ rows }) {
  if (rows.length === 0) return null;

  return (
    <>
      <section className="rounded-lg border border-border bg-card p-5 backdrop-blur-md">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <ChartNoAxesCombined size={19} className="text-accent" /> Consumption trend
            </h2>
            <p className="mt-1 text-xs text-text-secondary">Monthly electricity usage in units</p>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {number(Math.max(...rows.map((x) => x.units)))} peak
          </span>
        </div>
        <div className="h-60">
          <ResponsiveContainer>
            <AreaChart data={rows} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(x) => [`${number(x)} units`, "Usage"]}
              />
              <Area
                type="monotone"
                dataKey="units"
                stroke="#818cf8"
                strokeWidth={2.5}
                fill="url(#usageGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card backdrop-blur-md">
        <div className="border-b border-border p-5">
          <h2 className="font-bold">Consumption history</h2>
          <p className="text-xs text-text-secondary">Latest DESCO usage records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] text-left text-sm">
            <thead className="bg-input/40 text-[.7rem] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Consumption</th>
                <th className="px-5 py-3 text-right">Bill amount</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .reverse()
                .map((r, i) => (
                  <tr key={`${r.period}-${i}`} className="border-t border-border/70 hover:bg-hover/60">
                    <td className="px-5 py-3.5 font-semibold">{formatMonthPeriod(r.period)}</td>
                    <td className="px-5 py-3.5 text-right text-text-secondary">{number(r.units)} units</td>
                    <td className="px-5 py-3.5 text-right text-text-secondary">
                      {r.amount === null ? "—" : money(r.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
