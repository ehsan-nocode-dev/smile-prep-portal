import { ToothIcon } from "@/components/ToothIcon";
import { TIERS, TIER_COLORS, Task, Submission, Tier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  submissions: Submission[];
  userId: string;
}

export function BadgePortfolio({ tasks, submissions, userId }: Props) {
  const approvedByTask = (taskId: string) =>
    submissions
      .filter((s) => s.submittedById === userId && s.taskId === taskId && s.status === "Approved")
      .reduce((sum, s) => sum + s.quantity, 0);

  return (
    <section className="bg-card rounded-xl card-shadow p-6">
      <h2 className="text-lg font-bold mb-1">Badge Portfolio</h2>
      <p className="text-sm text-muted-foreground mb-5">Your badge progress per task — earn more to unlock the next tier.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const approved = approvedByTask(task.id);
          const tiers = task.badges; // ordered Novice -> Teal
          const earnedIdx = tiers.reduce(
            (max, b, i) => (approved >= b.tracks ? i : max),
            -1
          );
          const nextIdx = tiers.findIndex((b) => approved < b.tracks);
          const next = nextIdx >= 0 ? tiers[nextIdx] : null;
          const remaining = next ? Math.max(0, next.tracks - approved) : 0;

          return (
            <div key={task.id} className="rounded-lg border border-border p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                  <ToothIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{task.name}</div>
                  <div className="text-xs text-muted-foreground">{approved} approved</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                {TIERS.map((tier, i) => {
                  const earned = i <= earnedIdx;
                  return (
                    <div key={tier} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full ring-2 transition",
                          TIER_COLORS[tier as Tier],
                          earned ? "ring-white opacity-100" : "ring-border opacity-25 grayscale"
                        )}
                        title={tier}
                      />
                      <span
                        className={cn(
                          "text-[10px] truncate w-full text-center",
                          earned ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        {tier}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                {next ? (
                  <>
                    Next badge: <span className="font-semibold text-foreground">{next.tier}</span>{" "}
                    in <span className="font-semibold text-primary">{remaining}</span> more
                  </>
                ) : (
                  <span className="font-semibold text-primary">All badges earned 🎉</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
