import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { BadgePortfolio } from "@/components/BadgePortfolio";
import { LevelCard } from "@/components/stats/LevelCard";
import { ClosestBadgeCard, HighestBadgeCard } from "@/components/stats/BadgeHighlights";
import { XpTrendCard } from "@/components/stats/XpTrendCard";
import { LogDistributionCard } from "@/components/stats/LogDistributionCard";
import { useStore } from "@/lib/store";
import { StaffChallengesSection } from "@/components/challenges/StaffChallengesSection";
import { FileStack, CheckCircle2, Clock, Award } from "lucide-react";
import { approvedFor, closestBadge, highestBadge, taskDistribution } from "@/lib/stats";

export default function StaffDashboard() {
  const { submissions, tasks, currentUserId } = useStore();
  const mine = submissions.filter((s) => s.submittedById === currentUserId);
  const total = mine.length;
  const approvedSubs = approvedFor(submissions, currentUserId);
  const approved = approvedSubs.length;
  const pending = mine.filter((s) => s.status === "Pending").length;
  const totalXp = approvedSubs.reduce((sum, s) => sum + s.xpEarned, 0);

  // Badges earned across all tasks (approved-only)
  const approvedByTask = (taskId: string) =>
    mine.filter((s) => s.taskId === taskId && s.status === "Approved").reduce((n, s) => n + s.quantity, 0);
  const badges = tasks.reduce((sum, t) => {
    const a = approvedByTask(t.id);
    return sum + t.badges.filter((b) => a >= b.tracks).length;
  }, 0);

  const nearest = closestBadge(approvedSubs, tasks);
  const best = highestBadge(approvedSubs, tasks);
  const slices = taskDistribution(approvedSubs, tasks);

  const recent = [...mine]
    .filter((s) => s.status === "Approved")
    .sort((a, b) => (b.reviewedDate || "").localeCompare(a.reviewedDate || ""))
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="View your activity and progress at a glance." />

      <StaffChallengesSection />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Total Submissions" value={total} tint="blue" icon={<FileStack className="h-6 w-6" />} />
        <StatCard label="Approved Submissions" value={approved} tint="green" icon={<CheckCircle2 className="h-6 w-6" />} />
        <StatCard label="Pending Submissions" value={pending} tint="yellow" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Badges Earned" value={badges} tint="gray" icon={<Award className="h-6 w-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <LevelCard totalXp={totalXp} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ClosestBadgeCard badge={nearest} />
          <HighestBadgeCard badge={best} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        <div className="lg:col-span-3">
          <XpTrendCard subs={approvedSubs} />
        </div>
        <div className="lg:col-span-2">
          <LogDistributionCard slices={slices} />
        </div>
      </div>

      <div className="mb-8">
        <BadgePortfolio tasks={tasks} submissions={submissions} userId={currentUserId} />
      </div>


      <section className="bg-card rounded-xl card-shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <ul className="divide-y divide-border">
          {recent.map((s) => (
            <li key={s.id} className="py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold">{s.taskName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Submitted x{s.quantity}</div>
              </div>
              <div className="text-sm font-semibold text-muted-foreground">x{s.quantity}</div>
              <div className="text-sm font-bold text-xp">+{s.xpEarned} XP</div>
              <StatusBadge status={s.status} />
              <div className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-2">
                Approved by: <span className="font-medium text-foreground">{s.reviewedBy}</span> on {s.reviewedDate}
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground text-center">No activity yet — submit your first task!</li>
          )}
        </ul>
      </section>
    </div>
  );
}
