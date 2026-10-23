import { useChallenges } from "@/contexts/ChallengesContext";
import { useStore } from "@/lib/store";
import { formatCrowns } from "@/lib/crowns";
import { TargetBar } from "./ChallengeBits";
import { boostTaskLabel, fmtDay, fmtMultiplier, getPhase, goalProgress, timeLeft } from "@/lib/challenges";

/** Staff dashboard: live Team Goal + running Boosts. Renders nothing when no challenge is running. */
export function StaffChallengesSection() {
  const { tasks, submissions } = useStore();
  const { challenges, now } = useChallenges();
  const live = challenges.filter((c) => getPhase(c, now) === "active");
  const goal = live.find((c) => c.kind === "team_goal");
  const boosts = live.filter((c) => c.kind === "boost");
  if (!goal && boosts.length === 0) return null;

  const progress = goal ? goalProgress(goal, submissions) : null;
  const taskName = (id: string) => tasks.find((t) => t.id === id)?.name ?? "Task";
  const ended = goal ? now > new Date(goal.endAt).getTime() : false;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-3">Challenges</h2>
      <div className={goal && boosts.length ? "grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start" : "grid gap-5"}>
        {goal && progress && (
          <div className="bg-card rounded-xl card-shadow p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Team Goal</div>
                <div className="text-lg font-bold mt-0.5">{goal.name}</div>
              </div>
              <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {ended ? "Waiting on reviews" : timeLeft(goal.endAt, now)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Hit every target and everyone who helped gets{" "}
              <span className="font-semibold text-crown">{formatCrowns(goal.bonusPerPerson ?? 0)} crowns</span>.
            </p>
            <div className="mt-5 space-y-4">
              {progress.targets.map((r) => <TargetBar key={r.taskId} row={r} label={taskName(r.taskId)} />)}
            </div>
          </div>
        )}

        {boosts.length > 0 && (
          <div className="bg-card rounded-xl card-shadow p-6">
            <div className="text-xs font-medium text-muted-foreground mb-3">Boosts</div>
            <ul className="space-y-3">
              {boosts.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {boostTaskLabel(b, tasks)} · until {fmtDay(b.endAt)}
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-crown/15 text-crown">
                    {fmtMultiplier(b.multiplier ?? 1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
