import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Submission } from "@/lib/mock-data";
import { monthlyTrend, weekComparison, weeklyTrend } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export function XpTrendCard({ subs }: { subs: Submission[] }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const data = range === "week" ? weeklyTrend(subs) : monthlyTrend(subs);
  const cmp = weekComparison(subs);
  const up = cmp.pct !== null && cmp.pct >= 0;

  return (
    <div className="bg-card rounded-xl card-shadow p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-bold">XP over time</h2>
          <div className="flex items-center gap-2 mt-1 text-sm">
            {cmp.pct === null ? (
              <span className="text-muted-foreground">
                {cmp.thisWeek} XP this week · no XP last week
              </span>
            ) : (
              <>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-bold",
                    up ? "text-success" : "text-destructive"
                  )}
                >
                  {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {up ? "+" : ""}
                  {cmp.pct}%
                </span>
                <span className="text-muted-foreground">
                  vs last week ({cmp.thisWeek} XP vs {cmp.lastWeek} XP)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition",
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} XP`, "XP gained"]}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#xpFill)"
              dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
