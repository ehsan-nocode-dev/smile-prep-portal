import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TierDot } from "@/components/TierDot";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { SubmissionSuccessModal } from "@/components/SubmissionSuccessModal";
import { Task, BadgeTier, Tier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Award, CheckCircle2, FileStack, Sparkles, Zap } from "lucide-react";

type Tab = "all" | "Pending" | "Approved" | "Rejected";

function nextBadge(badges: BadgeTier[], completed: number): { next: BadgeTier | null; current: BadgeTier | null } {
  const sorted = [...badges].sort((a, b) => a.tracks - b.tracks);
  const current = [...sorted].reverse().find((b) => completed >= b.tracks) || null;
  const next = sorted.find((b) => b.tracks > completed) || null;
  return { current, next };
}

export default function StaffTaskLog() {
  const { tasks, submissions, addSubmission, currentUserId, members } = useStore();
  const me = members.find((m) => m.id === currentUserId)!;
  const [tab, setTab] = useState<Tab>("all");
  const [submitFor, setSubmitFor] = useState<Task | null>(null);
  const [qty, setQty] = useState(1);
  const [successFor, setSuccessFor] = useState<{ task: Task; approvedCount: number } | null>(null);

  const mine = useMemo(() => submissions.filter((s) => s.submittedById === currentUserId), [submissions, currentUserId]);
  const totalXp = mine.filter((s) => s.status === "Approved").reduce((sum, s) => sum + s.xpEarned, 0);
  const approvedCount = mine.filter((s) => s.status === "Approved").length;
  const badgesEarned = Math.floor(approvedCount / 2);
  const bonusXp = badgesEarned * 25;

  const completionsByTask = (taskId: string) =>
    mine.filter((s) => s.taskId === taskId && s.status === "Approved").reduce((sum, s) => sum + s.quantity, 0);

  const earnedTiers = (task: Task): Tier[] => {
    const c = completionsByTask(task.id);
    return task.badges.filter((b) => c >= b.tracks).map((b) => b.tier);
  };

  const handleSubmit = () => {
    if (!submitFor) return;
    const xp = submitFor.baseXp * qty;
    const approvedCount = completionsByTask(submitFor.id);
    addSubmission({
      taskId: submitFor.id,
      taskName: submitFor.name,
      quantity: qty,
      submittedById: me.id,
      submittedByName: me.name,
      xpEarned: xp,
    });
    setSuccessFor({ task: submitFor, approvedCount });
    setSubmitFor(null);
    setQty(1);
  };

  const previewXp = submitFor ? submitFor.baseXp * qty : 0;

  return (
    <div>
      <PageHeader title="Task Log" subtitle="Track tasks, submit work, and earn XP." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main */}
        <div>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { k: "all", label: "All Tasks" },
              { k: "Pending", label: "Pending Submissions" },
              { k: "Approved", label: "Approved Submissions" },
              { k: "Rejected", label: "Rejected Submissions" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as Tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                  tab === t.k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "all" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {tasks.filter((t) => t.status === "Active").map((t) => {
                const completed = completionsByTask(t.id);
                const { current, next } = nextBadge(t.badges, completed);
                const remaining = next ? next.tracks - completed : 0;
                const progress = next
                  ? Math.min(100, ((completed - (current?.tracks || 0)) / (next.tracks - (current?.tracks || 0))) * 100)
                  : 100;

                return (
                  <div key={t.id} className="bg-card rounded-xl card-shadow p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{t.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                      </div>
                      <span className="text-xs font-bold text-xp bg-xp/10 px-2 py-1 rounded">+{t.baseXp} XP</span>
                    </div>

                    {next && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Next Badge: <span className="font-semibold text-foreground">{next.tier}</span></span>
                          <span>{completed} Completed</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Need {remaining} more to earn {next.tier}
                        </div>
                      </div>
                    )}

                    <Button className="mt-4 w-full" onClick={() => { setSubmitFor(t); setQty(1); }}>
                      Submit Task
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {mine.filter((s) => s.status === tab).map((s) => {
                const task = tasks.find((t) => t.id === s.taskId);
                const tiers = task ? earnedTiers(task) : [];
                return (
                  <div key={s.id} className="bg-card rounded-xl card-shadow p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="font-bold">{s.taskName}</h3>
                        <p className="text-xs text-muted-foreground">Submitted on {s.date}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-sm font-semibold">x{s.quantity}</span>
                      <span className="text-sm font-bold text-xp">+{s.xpEarned} XP</span>
                      <div className="flex-1 min-w-[120px]">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: s.status === "Approved" ? "100%" : "0%" }} />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {tiers.map((t) => <TierDot key={t} tier={t} size="md" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {mine.filter((s) => s.status === tab).length === 0 && (
                <div className="bg-card rounded-xl card-shadow p-10 text-center text-muted-foreground text-sm">
                  No {tab.toLowerCase()} submissions yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overview panel */}
        <aside className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wide px-1">Overview</h2>
          <StatCard label="Total Attempted Tasks" value={mine.length} tint="blue" icon={<FileStack className="h-6 w-6" />} />
          <StatCard label="Approved Submissions" value={approvedCount} tint="green" icon={<CheckCircle2 className="h-6 w-6" />} />
          <StatCard label="Total XP" value={totalXp} tint="yellow" valueClassName="text-xp" icon={<Zap className="h-6 w-6" />} />
          <StatCard label="Bonus XP" value={bonusXp} tint="purple" icon={<Sparkles className="h-6 w-6" />} />
          <StatCard label="Badges Earned" value={badgesEarned} tint="gray" icon={<Award className="h-6 w-6" />} />
        </aside>
      </div>

      <Dialog open={!!submitFor} onOpenChange={(o) => !o && setSubmitFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{submitFor?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{submitFor?.description}</p>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Quantity</div>
              <div className="text-6xl font-extrabold text-primary">{qty}</div>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[qty]}
              onValueChange={(v) => setQty(v[0])}
            />
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-xp bg-xp/10 px-3 py-1.5 rounded-full">
                <Zap className="h-4 w-4" /> +{previewXp} XP
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitFor(null)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
