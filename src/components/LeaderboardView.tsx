import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trophy } from "lucide-react";

type Period = "Daily" | "Weekly" | "Monthly";
type SortBy = "Total XP" | "Badges" | "Task Completed";

export function LeaderboardView({ title, subtitle }: { title: string; subtitle?: string }) {
  const { members, submissions, tasks } = useStore();
  const [period, setPeriod] = useState<Period>("Monthly");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("Total XP");

  const ranked = useMemo(() => {
    const staff = members.filter((m) => m.role === "Staff");
    const data = staff.map((m) => {
      const subs = submissions.filter(
        (s) => s.submittedById === m.id && s.status === "Approved" && (taskFilter === "all" || s.taskId === taskFilter)
      );
      const xp = subs.reduce((sum, s) => sum + s.xpEarned, 0);
      const completed = subs.length;
      const badges = Math.floor(completed / 2);
      return { member: m, xp, completed, badges };
    });
    return data.sort((a, b) => {
      if (sortBy === "Total XP") return b.xp - a.xp;
      if (sortBy === "Badges") return b.badges - a.badges;
      return b.completed - a.completed;
    });
  }, [members, submissions, taskFilter, sortBy]);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="bg-card rounded-xl card-shadow p-5 mb-6 flex flex-wrap items-end gap-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">Filter By Time Period</div>
          <div className="flex gap-2">
            {(["Daily", "Weekly", "Monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-[200px]">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Filter By Task</div>
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              {tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">Sort By</div>
          <div className="flex gap-2">
            {(["Total XP", "Badges", "Task Completed"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  sortBy === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {ranked.map((r, idx) => {
          const trophyColor = idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground";
          return (
            <div key={r.member.id} className="bg-card rounded-xl card-shadow p-4 flex items-center gap-4">
              <div className="w-8 text-center font-bold text-muted-foreground">#{idx + 1}</div>
              <Trophy className={cn("h-6 w-6", trophyColor)} />
              <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                {r.member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{r.member.name}</div>
                <div className="text-xs text-muted-foreground">{r.member.department}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-xp">{r.xp} XP</div>
                <div className="text-xs text-muted-foreground">{r.completed} tasks · {r.badges} badges</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
