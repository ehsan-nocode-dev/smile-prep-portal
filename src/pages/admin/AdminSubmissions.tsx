import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useCrowns } from "@/contexts/CrownsContext";
import { formatCrowns } from "@/lib/crowns";
import { toast } from "sonner";
import { getLevelInfo, getUserTotalXp } from "@/lib/levels";
import { getCrownValue } from "@/lib/mock-data";
import { Check, Pencil, X } from "lucide-react";

export default function AdminSubmissions() {
  const { submissions, tasks, updateSubmissionStatus, updateSubmissionQuantity, members, currentUserId } = useStore();
  const { celebrate } = useCelebration();
  const { awardCrowns } = useCrowns();
  const reviewer = members.find((m) => m.id === currentUserId)?.name || "Admin";
  const [editing, setEditing] = useState<{ id: string; quantity: number } | null>(null);

  const handleApprove = (submissionId: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const task = tasks.find((t) => t.id === sub.taskId);
    const before = submissions
      .filter((s) => s.submittedById === sub.submittedById && s.taskId === sub.taskId && s.status === "Approved")
      .reduce((n, s) => n + s.quantity, 0);
    const after = before + sub.quantity;

    // Level-up detection: compare totals before/after this approval
    const totalBefore = getUserTotalXp(submissions, sub.submittedById);
    const totalAfter = totalBefore + sub.xpEarned;
    const lvlBefore = getLevelInfo(totalBefore).level;
    const lvlAfter = getLevelInfo(totalAfter).level;

    updateSubmissionStatus(submissionId, "Approved", reviewer);

    // Crowns: awarded once, only on approval
    if (sub.status !== "Approved" && task) {
      const crowns = getCrownValue(task.baseXp) * sub.quantity;
      if (crowns > 0) {
        awardCrowns({
          userId: sub.submittedById,
          userName: sub.submittedByName,
          amount: crowns,
          referenceId: sub.id,
          referenceLabel: `${sub.taskName} x${sub.quantity}`,
        });
        toast.success(`${sub.submittedByName} earned ${formatCrowns(crowns)} Crowns`, {
          description: `${sub.taskName} x${sub.quantity} approved.`,
        });
      }
    }

    // Sequence the celebrations
    celebrate("task_approved", { taskName: sub.taskName });
    setTimeout(() => celebrate("xp_gained", { amount: sub.xpEarned }), 200);

    if (task) {
      const newlyEarned = task.badges.filter((b) => before < b.tracks && after >= b.tracks);
      newlyEarned.forEach((b, i) => {
        setTimeout(() => {
          celebrate("badge_unlocked", { badgeName: `${b.tier} — ${task.name}`, tier: b.tier });
        }, 900 + i * 1200);
      });
    }

    if (lvlAfter > lvlBefore) {
      setTimeout(() => celebrate("level_up", { level: lvlAfter }), 1200);
    }
  };

  const handleReject = (submissionId: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    updateSubmissionStatus(submissionId, "Rejected", reviewer);
    // Rejection: keep it lightweight via toast
    celebrate("task_submitted", { taskName: sub.taskName });
  };

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Review, approve, and manage all user submissions." />

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Task</th>
              <th className="text-left px-4 py-3 font-semibold">Quantity</th>
              <th className="text-left px-4 py-3 font-semibold">Crowns</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Submitted By</th>
              <th className="text-left px-4 py-3 font-semibold">Submission Date</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{s.taskName}</td>
                <td className="px-4 py-3">x{s.quantity}</td>
                <td className="px-4 py-3 font-bold text-crown">
                  {(() => {
                    const t = tasks.find((tk) => tk.id === s.taskId);
                    return t ? getCrownValue(t.baseXp) * s.quantity : 0;
                  })()}
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">{s.submittedByName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditing({ id: s.id, quantity: s.quantity })}
                      className="h-8 w-8 rounded-md bg-warning/15 text-warning-foreground hover:bg-warning/30 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="h-8 w-8 rounded-md bg-success/15 text-success hover:bg-success hover:text-success-foreground flex items-center justify-center"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(s.id)}
                      className="h-8 w-8 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Submission Quantity</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={editing?.quantity ?? 1}
              onChange={(e) => editing && setEditing({ ...editing, quantity: +e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editing) updateSubmissionQuantity(editing.id, editing.quantity);
                setEditing(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
