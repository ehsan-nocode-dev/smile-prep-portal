import { Link } from "react-router-dom";
import { useChallenges } from "@/contexts/ChallengesContext";
import { useStore } from "@/lib/store";
import { getPhase, goalProgress } from "@/lib/challenges";
import { cn } from "@/lib/utils";

/** Slim live Team Goal summary so admins see approvals move the goal. Hidden when no goal is running. */
export function LiveGoalStrip() {
  const { tasks, submissions } = useStore();
  const { challenges, now } = useChallenges();
  const goal = challenges.find((c) => c.kind === "team_goal" && getPhase(c, now) === "active");
  if (!goal) return null;
  const p = goalProgress(goal, submissions);

  return (
    <Link
      to={`/admin/challenges/${goal.id}`}
      className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 bg-card rounded-xl card-shadow px-5 py-4 hover:ring-1 hover:ring-primary/40 transition"
    >
      <div className="min-w-[140px]">
        <div className="text-xs font-medium text-muted-foreground">Team Goal</div>
        <div className="font-semibold">{goal.name}</div>
      </div>
      {p.targets.map((r) => {
        const pct = Math.min(100, Math.round((r.achieved / Math.max(1, r.target)) * 100));
        const done = r.achieved >= r.target;
        return (
          <div key={r.taskId} className="flex-1 min-w-[140px]">
            <div className="flex justify-between text-sm mb-1">
              <span>{tasks.find((t) => t.id === r.taskId)?.name}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className={cn("font-semibold", done ? "text-success" : "text-foreground")}>{r.achieved}</span> / {r.target}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", done ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </Link>
  );
}
