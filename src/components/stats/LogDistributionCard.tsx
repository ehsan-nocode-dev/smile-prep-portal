import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TaskSlice } from "@/lib/stats";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--xp))",
  "hsl(var(--tier-purple))",
  "hsl(var(--tier-gold))",
  "hsl(var(--tier-bronze))",
  "hsl(var(--tier-iron))",
];

export function LogDistributionCard({ slices }: { slices: TaskSlice[] }) {
  const total = slices.reduce((n, s) => n + s.count, 0);

  return (
    <div className="bg-card rounded-xl card-shadow p-6">
      <h2 className="text-lg font-bold mb-1">Log distribution</h2>
      <p className="text-sm text-muted-foreground mb-4">Approved completions by task type.</p>

      {total === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          No approved logs yet.
        </div>
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <div className="h-44 w-44 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="count" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none">
                  {slices.map((s, i) => (
                    <Cell key={s.taskId} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number, n: string) => [`${v} logs`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold tabular-nums">{total}</span>
              <span className="text-[11px] text-muted-foreground">logs</span>
            </div>
          </div>

          <ul className="flex-1 min-w-[180px] space-y-2.5">
            {slices.map((s, i) => (
              <li key={s.taskId} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="font-semibold tabular-nums">{s.count}</span>
                <span className="text-muted-foreground tabular-nums w-10 text-right">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
