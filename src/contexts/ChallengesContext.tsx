import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useClinics } from "@/contexts/ClinicsContext";
import { useCrowns } from "@/contexts/CrownsContext";
import {
  Challenge,
  EmailLogEntry,
  buildCompletedEmail,
  buildNotMetEmail,
  buildSeedChallenges,
  buildStartEmail,
  evaluateGoal,
  findBoostFor,
  getPhase,
  goalProgress,
  staffOf,
} from "@/lib/challenges";
import { Submission } from "@/lib/mock-data";

export type ChallengeDraft = Omit<Challenge, "id" | "clinicId" | "createdAt" | "payouts" | "result" | "closedAt" | "achieved" | "startEmailSent">;

interface ChallengesContextValue {
  clinicId: string;
  challenges: Challenge[];
  emails: EmailLogEntry[];
  now: number;
  createChallenge: (d: ChallengeDraft) => Challenge;
  updateChallenge: (id: string, d: ChallengeDraft) => void;
  deleteChallenge: (id: string) => void;
  endEarly: (id: string) => void;
  boostForSubmission: (s: Submission) => Challenge | null;
  recordBoostPayout: (challengeId: string, userId: string, userName: string, amount: number) => void;
  /** Completed Team Goals where this user was paid but hasn't seen the celebration yet. */
  unseenWins: (userId: string) => { challenge: Challenge; amount: number }[];
  markWinSeen: (challengeId: string, userId: string) => void;
}

const ChallengesContext = createContext<ChallengesContextValue | null>(null);

const iso = () => new Date().toISOString();

export function ChallengesProvider({ children }: { children: ReactNode }) {
  const { tasks, members, submissions } = useStore();
  const { clinics } = useClinics();
  const { awardCrowns } = useCrowns();
  const clinicId = clinics.find((c) => c.isOwnClinic)?.id ?? "c1";

  const [initial] = useState(() => buildSeedChallenges(clinicId, tasks, members));
  const [challenges, setChallenges] = useState<Challenge[]>(initial.challenges);
  const [emails, setEmails] = useState<EmailLogEntry[]>(initial.emails);
  const [seen, setSeen] = useState<Record<string, string[]>>({});
  const [now, setNow] = useState(() => Date.now());
  const closing = useRef(new Set<string>());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const staff = useMemo(() => staffOf(members), [members]);

  const addEmails = useCallback((rows: EmailLogEntry[]) => setEmails((p) => [...p, ...rows]), []);

  // Re-check every Team Goal on each approval/rejection (and on a timer): pay out as soon as all targets are met.
  useEffect(() => {
    const at = Date.now();
    for (const c of challenges) {
      if (c.clinicId !== clinicId) continue;

      // E1 for challenges whose start time has just passed
      if (!c.startEmailSent && !c.result && at >= new Date(c.startAt).getTime()) {
        closing.current.add(`${c.id}:e1`);
        setChallenges((p) => p.map((x) => (x.id === c.id ? { ...x, startEmailSent: true } : x)));
        if (!closing.current.has(`${c.id}:e1-sent`)) {
          closing.current.add(`${c.id}:e1-sent`);
          addEmails([buildStartEmail(c, tasks, staff, iso())]);
        }
      }

      if (c.kind !== "team_goal" || c.result || closing.current.has(c.id)) continue;
      const verdict = evaluateGoal(c, submissions, at);
      if (verdict === "open") continue;
      closing.current.add(c.id);

      const progress = goalProgress(c, submissions);
      const achieved = Object.fromEntries(progress.targets.map((r) => [r.taskId, r.achieved]));
      const closedAt = iso();

      if (verdict === "met") {
        const bonus = c.bonusPerPerson ?? 0;
        const payouts = progress.contributors.map((p) => ({ userId: p.userId, userName: p.userName, amount: bonus, at: closedAt }));
        payouts.forEach((p) =>
          awardCrowns({
            userId: p.userId, userName: p.userName, amount: p.amount,
            referenceId: c.id, referenceLabel: `${c.name} · Team Goal bonus`, source: "challenge_bonus",
          })
        );
        const closed: Challenge = { ...c, result: "met", closedAt, achieved, payouts };
        setChallenges((prev) => prev.map((x) => (x.id === c.id ? closed : x)));
        addEmails(
          payouts.map((p) => {
            const m = members.find((x) => x.id === p.userId) ?? { name: p.userName, email: "" };
            return buildCompletedEmail(closed, tasks, m, p.amount, closedAt);
          })
        );
        toast.success(`${c.name} complete!`, {
          description: `${payouts.length} ${payouts.length === 1 ? "person" : "people"} earned ${bonus} bonus crowns.`,
        });
      } else {
        const closed: Challenge = { ...c, result: "not_met", closedAt, achieved };
        setChallenges((prev) => prev.map((x) => (x.id === c.id ? closed : x)));
        addEmails([buildNotMetEmail(closed, tasks, staff, closedAt)]);
        toast(`${c.name} closed: not met`);
      }
    }
  }, [challenges, submissions, now, clinicId, tasks, members, staff, awardCrowns, addEmails]);

  const createChallenge: ChallengesContextValue["createChallenge"] = useCallback(
    (d) => {
      const startsNow = Date.now() >= new Date(d.startAt).getTime();
      const c: Challenge = { ...d, id: `ch-${Date.now()}`, clinicId, createdAt: iso(), payouts: [], startEmailSent: startsNow };
      setChallenges((p) => [...p, c]);
      if (startsNow) addEmails([buildStartEmail(c, tasks, staff, iso())]);
      return c;
    },
    [clinicId, tasks, staff, addEmails]
  );

  const value = useMemo<ChallengesContextValue>(
    () => ({
      clinicId,
      challenges: challenges.filter((c) => c.clinicId === clinicId),
      emails: [...emails].sort((a, b) => b.at.localeCompare(a.at)),
      now,
      createChallenge,
      updateChallenge: (id, d) =>
        setChallenges((p) => p.map((x) => (x.id === id && getPhase(x) === "scheduled" ? { ...x, ...d } : x))),
      deleteChallenge: (id) => setChallenges((p) => p.filter((x) => !(x.id === id && getPhase(x) === "scheduled"))),
      endEarly: (id) => {
        const c = challenges.find((x) => x.id === id);
        if (!c || getPhase(c) !== "active") return;
        closing.current.add(id);
        const achieved =
          c.kind === "team_goal"
            ? Object.fromEntries(goalProgress(c, submissions).targets.map((r) => [r.taskId, r.achieved]))
            : undefined;
        setChallenges((p) => p.map((x) => (x.id === id ? { ...x, result: "ended_early", closedAt: iso(), achieved } : x)));
      },
      boostForSubmission: (s) =>
        findBoostFor(challenges.filter((c) => c.clinicId === clinicId), s.taskId, s.submittedAt ?? `${s.date}T12:00:00`),
      recordBoostPayout: (challengeId, userId, userName, amount) =>
        setChallenges((p) =>
          p.map((x) => (x.id === challengeId ? { ...x, payouts: [...x.payouts, { userId, userName, amount, at: iso() }] } : x))
        ),
      unseenWins: (userId) =>
        challenges
          .filter((c) => c.kind === "team_goal" && c.result === "met" && c.closedAt && !(seen[c.id] ?? []).includes(userId))
          .filter((c) => Date.now() - new Date(c.closedAt!).getTime() < 7 * 86400000)
          .flatMap((c) => {
            const p = c.payouts.find((x) => x.userId === userId);
            return p ? [{ challenge: c, amount: p.amount }] : [];
          }),
      markWinSeen: (challengeId, userId) =>
        setSeen((p) => ({ ...p, [challengeId]: [...(p[challengeId] ?? []), userId] })),
    }),
    [clinicId, challenges, emails, now, createChallenge, submissions, seen]
  );

  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
