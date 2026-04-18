import { ProfileView } from "@/components/ProfileView";
import { StatCard } from "@/components/StatCard";
import { TierDot } from "@/components/TierDot";
import { useStore } from "@/lib/store";
import { Award, CheckCircle2, Star, Zap } from "lucide-react";

export default function StaffProfile() {
  const { submissions, tasks, currentUserId } = useStore();
  const mine = submissions.filter((s) => s.submittedById === currentUserId);
  const approved = mine.filter((s) => s.status === "Approved");
  const totalXp = approved.reduce((sum, s) => sum + s.xpEarned, 0);
  const badgesEarned = Math.floor(approved.length / 2);
  const level = Math.max(1, Math.floor(totalXp / 100));

  const taskStats = tasks.map((t) => {
    const subs = approved.filter((s) => s.taskId === t.id);
    const completions = subs.reduce((sum, s) => sum + s.quantity, 0);
    const xp = subs.reduce((sum, s) => sum + s.xpEarned, 0);
    const earned = t.badges.filter((b) => completions >= b.tracks);
    return { task: t, completions, xp, earned };
  });

  return (
    <ProfileView
      extraSection={
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard label="Approved Submissions" value={approved.length} tint="green" icon={<CheckCircle2 className="h-6 w-6" />} />
            <StatCard label="Total XP" value={totalXp} tint="yellow" valueClassName="text-xp" icon={<Zap className="h-6 w-6" />} />
            <StatCard label="Badges Earned" value={badgesEarned} tint="gray" icon={<Award className="h-6 w-6" />} />
            <StatCard label="Level" value={level} tint="purple" icon={<Star className="h-6 w-6" />} />
          </div>

          <section className="bg-card rounded-xl card-shadow p-6">
            <h2 className="text-lg font-bold mb-4">Overview</h2>
            <div className="space-y-3">
              {taskStats.map(({ task, completions, xp, earned }) => (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {earned.length}/{task.badges.length} badges earned · {completions} completions
                    </div>
                  </div>
                  <div className="text-sm font-bold text-xp">+{xp} XP</div>
                  <div className="flex gap-1">
                    {task.badges.map((b) => (
                      <TierDot
                        key={b.tier}
                        tier={b.tier}
                        size="md"
                        className={earned.find((e) => e.tier === b.tier) ? "" : "opacity-25"}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      }
    />
  );
}
