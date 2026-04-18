import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ListChecks, Clock, CheckCircle2, Users } from "lucide-react";

export default function AdminDashboard() {
  const { tasks, submissions, members } = useStore();
  const activeTasks = tasks.filter((t) => t.status === "Active").length;
  const pending = submissions.filter((s) => s.status === "Pending").length;
  const approved = submissions.filter((s) => s.status === "Approved").length;
  const activeMembers = members.filter((m) => m.status === "Active" && m.role === "Staff").length;

  const recent = [...submissions]
    .filter((s) => s.status !== "Pending")
    .sort((a, b) => (b.reviewedDate || "").localeCompare(a.reviewedDate || ""))
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="System-wide insights and real-time platform overview."
        actions={
          <Button className="gap-2">
            <Users className="h-4 w-4" /> {activeMembers} Active Members
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard label="Active Tasks" value={activeTasks} tint="blue" icon={<ListChecks className="h-6 w-6" />} />
        <StatCard label="Pending Submissions" value={pending} tint="yellow" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Approved Submissions" value={approved} tint="green" icon={<CheckCircle2 className="h-6 w-6" />} />
      </div>

      <section className="bg-card rounded-xl card-shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <ul className="divide-y divide-border">
          {recent.map((s) => (
            <li key={s.id} className="py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold">{s.taskName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Task submission · quantity x{s.quantity}</div>
              </div>
              <div className="text-sm font-semibold text-muted-foreground">x{s.quantity}</div>
              <div className="text-sm font-bold text-xp">+{s.xpEarned} XP</div>
              <StatusBadge status={s.status} />
              <div className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-2">
                {s.status} by: <span className="font-medium text-foreground">{s.reviewedBy}</span> on {s.reviewedDate}
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground text-center">No recent activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
