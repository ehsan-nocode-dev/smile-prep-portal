import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ChallengeFormDialog } from "@/components/challenges/ChallengeFormDialog";
import { ChallengeStatus, KindLabel, TargetBar } from "@/components/challenges/ChallengeBits";
import { EmailLog } from "@/components/challenges/EmailLog";
import { useChallenges } from "@/contexts/ChallengesContext";
import { useStore } from "@/lib/store";
import { formatCrowns } from "@/lib/crowns";
import {
  Challenge,
  boostTaskLabel,
  challengeDates,
  fmtMultiplier,
  paidStats,
  getPhase,
  goalProgress,
  timeLeft,
} from "@/lib/challenges";

export default function AdminChallenges() {
  const navigate = useNavigate();
  const { tasks, submissions } = useStore();
  const { challenges, emails, now } = useChallenges();
  const [creating, setCreating] = useState(false);

  const byStart = (a: Challenge, b: Challenge) => a.startAt.localeCompare(b.startAt);
  const active = challenges.filter((c) => getPhase(c, now) === "active").sort(byStart);
  const scheduled = challenges.filter((c) => getPhase(c, now) === "scheduled").sort(byStart);
  const past = challenges
    .filter((c) => getPhase(c, now) === "past")
    .sort((a, b) => (b.closedAt ?? b.endAt).localeCompare(a.closedAt ?? a.endAt));

  const taskName = (id: string) => tasks.find((t) => t.id === id)?.name ?? "Task";
  const open = (c: Challenge) => navigate(`/admin/challenges/${c.id}`);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Challenges"
        subtitle="Boosts and Team Goals for your clinic. Challenges only add crowns."
        actions={<Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New challenge</Button>}
      />

      <section>
        <h2 className="text-lg font-bold mb-3">Active</h2>
        {active.length === 0 ? (
          <div className="bg-card rounded-xl card-shadow p-8 text-center text-sm text-muted-foreground">Nothing running right now.</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {active.map((c) => {
              const progress = c.kind === "team_goal" ? goalProgress(c, submissions) : null;
              return (
                <button key={c.id} onClick={() => open(c)} className="flex flex-col text-left bg-card rounded-xl card-shadow p-6 hover:ring-1 hover:ring-primary/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <KindLabel kind={c.kind} />
                      <div className="text-lg font-bold mt-0.5">{c.name}</div>
                    </div>
                    <ChallengeStatus challenge={c} now={now} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {challengeDates(c)} · {timeLeft(c.endAt, now)}
                  </div>

                  {c.kind === "boost" ? (
                    <div className="mt-5 text-sm">
                      <span className="font-semibold text-crown">{fmtMultiplier(c.multiplier ?? 1)} crowns</span> on{" "}
                      <span className="font-semibold">{boostTaskLabel(c, tasks)}</span>
                      {paidStats(c).crowns > 0 && (
                        <span className="text-muted-foreground"> · {formatCrowns(paidStats(c).crowns)} extra paid so far</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {progress!.targets.map((r) => <TargetBar key={r.taskId} row={r} label={taskName(r.taskId)} />)}
                      <div className="text-sm text-muted-foreground pt-1">
                        {formatCrowns(c.bonusPerPerson ?? 0)} crowns each · {progress!.contributors.length} contributing so far
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Scheduled</h2>
        {scheduled.length === 0 ? (
          <div className="bg-card rounded-xl card-shadow p-8 text-center text-sm text-muted-foreground">Nothing scheduled.</div>
        ) : (
          <div className="bg-card rounded-xl card-shadow divide-y divide-border/60">
            {scheduled.map((c) => (
              <button key={c.id} onClick={() => open(c)} className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.kind === "boost"
                      ? `${boostTaskLabel(c, tasks)} · ${fmtMultiplier(c.multiplier ?? 1)}`
                      : (c.targets ?? []).map((t) => `${t.quantity} ${taskName(t.taskId)}`).join(", ")}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground hidden sm:block">{challengeDates(c)}</div>
                <ChallengeStatus challenge={c} now={now} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Past</h2>
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Challenge</th>
                <th className="text-left px-4 py-3 font-semibold">Dates</th>
                <th className="text-left px-4 py-3 font-semibold">Targets vs achieved</th>
                <th className="text-left px-4 py-3 font-semibold">Result</th>
                <th className="text-right px-4 py-3 font-semibold">Crowns paid</th>
                <th className="text-right px-4 py-3 font-semibold">People paid</th>
              </tr>
            </thead>
            <tbody>
              {past.map((c) => {
                const paid = paidStats(c);
                return (
                  <tr key={c.id} onClick={() => open(c)} className="border-t border-border/50 hover:bg-muted/30 cursor-pointer align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.name}</div>
                      <KindLabel kind={c.kind} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{challengeDates(c)}</td>
                    <td className="px-4 py-3">
                      {c.kind === "boost" ? (
                        <span>{boostTaskLabel(c, tasks)} · {fmtMultiplier(c.multiplier ?? 1)}</span>
                      ) : (
                        <div className="space-y-0.5">
                          {(c.targets ?? []).map((t) => (
                            <div key={t.taskId} className="tabular-nums whitespace-nowrap">
                              {taskName(t.taskId)}: {c.achieved?.[t.taskId] ?? 0} / {t.quantity}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><ChallengeStatus challenge={c} now={now} /></td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCrowns(paid.crowns)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{paid.people}</td>
                  </tr>
                );
              })}
              {past.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No past challenges yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <EmailLog emails={emails} />

      <ChallengeFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
