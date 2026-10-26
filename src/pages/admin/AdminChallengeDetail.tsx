import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChallengeFormDialog } from "@/components/challenges/ChallengeFormDialog";
import { ChallengeStatus, KindLabel, TargetBar } from "@/components/challenges/ChallengeBits";
import { useChallenges } from "@/contexts/ChallengesContext";
import { useStore } from "@/lib/store";
import { formatCrowns } from "@/lib/crowns";
import {
  boostTaskLabel,
  challengeDates,
  fmtMultiplier,
  fmtStart,
  getPhase,
  goalProgress,
  isEditable,
  maxGoalCost,
  paidStats,
  staffOf,
  timeLeft,
} from "@/lib/challenges";

export default function AdminChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { tasks, members, submissions } = useStore();
  const { challenges, now, endEarly, deleteChallenge } = useChallenges();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"end" | "delete" | null>(null);

  const c = challenges.find((x) => x.id === challengeId);
  if (!c) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        This challenge no longer exists. <Link to="/admin/challenges" className="text-primary font-medium">Back to Challenges</Link>
      </div>
    );
  }

  const phase = getPhase(c, now);
  const paid = paidStats(c);
  const taskName = (id: string) => tasks.find((t) => t.id === id)?.name ?? "Task";
  const staff = staffOf(members);
  const progress = c.kind === "team_goal" ? goalProgress(c, submissions) : null;

  const startedNotice = () => toast.error(`${c.name} has started, so it can't be edited or deleted. You can end it early.`);

  const openEdit = () => (isEditable(c) ? setEditing(true) : startedNotice());

  const doConfirm = () => {
    if (confirm === "end") {
      endEarly(c.id);
      toast.success(`${c.name} ended.`, { description: `Email sent to all staff (${staff.length}).` });
    } else if (confirm === "delete") {
      if (deleteChallenge(c.id)) {
        toast.success(`${c.name} deleted.`);
        navigate("/admin/challenges");
      } else {
        startedNotice();
      }
    }
    setConfirm(null);
  };

  return (
    <div className="max-w-4xl">
      <Link to="/admin/challenges" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Challenges
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <KindLabel kind={c.kind} />
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
            <ChallengeStatus challenge={c} now={now} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {challengeDates(c)}
            {phase === "active" && ` · ${timeLeft(c.endAt, now)}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {phase === "active" && <Button variant="outline" onClick={() => setConfirm("end")}>End early</Button>}
          {phase === "scheduled" && (
            <>
              <Button variant="outline" onClick={() => setConfirm("delete")}>Delete</Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </div>
      </div>

      {c.kind === "team_goal" && progress && (
        <div className="space-y-6">
          <section className="bg-card rounded-xl card-shadow p-6">
            <h2 className="font-bold mb-4">Progress</h2>
            <div className="space-y-4">
              {progress.targets.map((r) => (
                <TargetBar key={r.taskId} row={r} label={taskName(r.taskId)} showPending={phase === "active"} />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border/60 text-sm text-muted-foreground">
              {phase === "past" ? (
                <>Paid <span className="font-semibold text-foreground">{formatCrowns(paid.crowns)} crowns</span> to {paid.people} {paid.people === 1 ? "person" : "people"}.</>
              ) : (
                <>
                  {formatCrowns(c.bonusPerPerson ?? 0)} crowns each when every target is met. {staff.length} staff × {formatCrowns(c.bonusPerPerson ?? 0)} = up to{" "}
                  {formatCrowns(maxGoalCost(staff.length, c.bonusPerPerson ?? 0))} crowns.
                </>
              )}
            </div>
          </section>

          <section className="bg-card rounded-xl card-shadow overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="font-bold">Contributors</h2>
              <p className="text-sm text-muted-foreground">Anyone with at least one approved log of a goal task.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-2 font-semibold">Staff</th>
                  <th className="text-right px-6 py-2 font-semibold">Approved logs</th>
                  <th className="text-right px-6 py-2 font-semibold">Quantity</th>
                  <th className="text-right px-6 py-2 font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {progress.contributors.map((p) => {
                  const payout = c.payouts.find((x) => x.userId === p.userId);
                  return (
                    <tr key={p.userId} className="border-t border-border/50">
                      <td className="px-6 py-3 font-medium">{p.userName}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{p.logs}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{p.quantity}</td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {payout ? <span className="font-semibold text-crown">+{formatCrowns(payout.amount)}</span> : <span className="text-muted-foreground">{phase === "past" ? "—" : "If met"}</span>}
                      </td>
                    </tr>
                  );
                })}
                {progress.contributors.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No approved logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {c.kind === "boost" && (
        <section className="bg-card rounded-xl card-shadow p-6 grid sm:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Tasks</div>
            <div className="font-semibold mt-1">{boostTaskLabel(c, tasks)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Multiplier</div>
            <div className="font-semibold mt-1 text-crown">{fmtMultiplier(c.multiplier ?? 1)} crowns</div>
          </div>
          {phase === "scheduled" ? (
            <div>
              <div className="text-sm text-muted-foreground">Starts</div>
              <div className="font-semibold mt-1 tabular-nums">{fmtStart(c.startAt)}</div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-muted-foreground">Extra crowns paid</div>
              <div className="font-semibold mt-1 tabular-nums">
                {paid.crowns === 0
                  ? "None yet"
                  : `${formatCrowns(paid.crowns)} crowns · ${paid.people} ${paid.people === 1 ? "person" : "people"}`}
              </div>
            </div>
          )}
        </section>
      )}

      <ChallengeFormDialog open={editing} onClose={() => setEditing(false)} editing={c} />

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{confirm === "end" ? `End ${c.name}?` : `Delete ${c.name}?`}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirm === "end"
              ? c.kind === "team_goal"
                ? "Logs submitted from now on won't count and no bonus will be paid. It stays in Past as ended early."
                : "Logs submitted from now on won't earn extra crowns. Logs already submitted keep their boost."
              : "It hasn't started yet, so it will be removed completely."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm === "delete" ? "destructive" : "default"} onClick={doConfirm}>
              {confirm === "end" ? "End now" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
