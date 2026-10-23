import { DEMO_ANCHORS, Department, Member, Submission, Task, getCrownValue } from "./mock-data";

/* ---------------- Types ---------------- */

export type ChallengeKind = "boost" | "team_goal";
export type BoostMultiplier = 1.5 | 2 | 3;
export const BOOST_MULTIPLIERS: BoostMultiplier[] = [1.5, 2, 3];

/** How a challenge closed. Boosts that simply reach their end date are "completed". */
export type ChallengeResult = "met" | "not_met" | "ended_early" | "completed";
export type ChallengePhase = "scheduled" | "active" | "past";

export interface GoalTarget {
  taskId: string;
  quantity: number;
}

export interface ChallengePayout {
  userId: string;
  userName: string;
  amount: number;
  at: string;
}

export interface Challenge {
  id: string;
  clinicId: string;
  kind: ChallengeKind;
  name: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  // Boost
  allTasks?: boolean;
  taskIds?: string[];
  multiplier?: BoostMultiplier;
  // Team Goal
  targets?: GoalTarget[];
  bonusPerPerson?: number;
  // Lifecycle
  result?: Exclude<ChallengeResult, "completed">;
  closedAt?: string;
  /** Quantity achieved per task, frozen when a Team Goal closes. */
  achieved?: Record<string, number>;
  payouts: ChallengePayout[];
  startEmailSent?: boolean;
}

export type EmailKind = "E1" | "E2" | "E3";

export interface EmailLogEntry {
  id: string;
  kind: EmailKind;
  challengeId: string;
  at: string;
  /** Display label, e.g. "All staff (4)" or a person's name */
  toLabel: string;
  recipients: string[];
  subject: string;
  body: string[];
}

/* ---------------- Time helpers ---------------- */

const t = (iso: string) => new Date(iso).getTime();

export const submittedAtOf = (s: Submission) => s.submittedAt ?? `${s.date}T12:00:00`;

/** When the challenge actually stopped accepting logs. */
export const effectiveEnd = (c: Challenge) =>
  c.result === "ended_early" && c.closedAt && t(c.closedAt) < t(c.endAt) ? c.closedAt : c.endAt;

export function getPhase(c: Challenge, now: number = Date.now()): ChallengePhase {
  if (c.result) return "past";
  if (now < t(c.startAt)) return "scheduled";
  if (c.kind === "boost" && now > t(c.endAt)) return "past";
  return "active"; // Team Goals stay active after end time until every log is reviewed
}

export function getResult(c: Challenge, now: number = Date.now()): ChallengeResult | null {
  if (c.result) return c.result;
  if (c.kind === "boost" && now > t(c.endAt)) return "completed";
  return null;
}

const inWindow = (iso: string, c: Challenge) => {
  const x = t(iso);
  return x >= t(c.startAt) && x <= t(effectiveEnd(c));
};

/* ---------------- Boost rules ---------------- */

export const boostTaskIds = (c: Challenge, tasks: Task[]) =>
  c.allTasks ? tasks.filter((x) => x.status === "Active").map((x) => x.id) : c.taskIds ?? [];

const boostCovers = (c: Challenge, taskId: string) => c.allTasks || (c.taskIds ?? []).includes(taskId);

/** Normal crowns × multiplier, rounded up. */
export const boostedCrowns = (normalCrowns: number, multiplier: number) => Math.ceil(normalCrowns * multiplier);

export const normalCrownsFor = (task: Task, quantity: number) => getCrownValue(task.baseXp) * quantity;

/** The Boost that applies to a log, judged by when it was SUBMITTED (approval time doesn't matter). */
export function findBoostFor(challenges: Challenge[], taskId: string, submittedAt: string): Challenge | null {
  return (
    challenges.find(
      (c) => c.kind === "boost" && boostCovers(c, taskId) && inWindow(submittedAt, c)
    ) ?? null
  );
}

/** Boost currently running for a task (used for the "Boosted 2x" tag). */
export function liveBoostFor(challenges: Challenge[], taskId: string, now: number = Date.now()): Challenge | null {
  return (
    challenges.find((c) => c.kind === "boost" && getPhase(c, now) === "active" && boostCovers(c, taskId)) ?? null
  );
}

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  t(aStart) <= t(bEnd) && t(bStart) <= t(aEnd);

/** Tasks in the draft that are already in another live or scheduled Boost with overlapping dates. */
export function boostConflicts(
  challenges: Challenge[],
  draft: { id?: string; clinicId: string; allTasks: boolean; taskIds: string[]; startAt: string; endAt: string },
  tasks: Task[],
  now: number = Date.now()
): { taskId: string; challenge: Challenge }[] {
  const draftIds = draft.allTasks ? tasks.filter((x) => x.status === "Active").map((x) => x.id) : draft.taskIds;
  const out: { taskId: string; challenge: Challenge }[] = [];
  for (const c of challenges) {
    if (c.kind !== "boost" || c.id === draft.id || c.clinicId !== draft.clinicId) continue;
    if (getPhase(c, now) === "past") continue;
    if (!overlaps(draft.startAt, draft.endAt, c.startAt, c.endAt)) continue;
    for (const id of draftIds) if (boostCovers(c, id)) out.push({ taskId: id, challenge: c });
  }
  return out;
}

/** Departments that have active tasks but none of them is in the Boost. */
export function departmentsWithoutBoost(tasks: Task[], allTasks: boolean, taskIds: string[]): Department[] {
  if (allTasks) return [];
  const active = tasks.filter((x) => x.status === "Active");
  const depts = Array.from(new Set(active.map((x) => x.department)));
  return depts.filter((d) => !active.some((x) => x.department === d && taskIds.includes(x.id)));
}

/* ---------------- Team Goal rules ---------------- */

/** Another unresolved Team Goal in the clinic whose window overlaps the draft. */
export function goalConflict(
  challenges: Challenge[],
  draft: { id?: string; clinicId: string; startAt: string; endAt: string },
  now: number = Date.now()
): Challenge | null {
  return (
    challenges.find(
      (c) =>
        c.kind === "team_goal" &&
        c.id !== draft.id &&
        c.clinicId === draft.clinicId &&
        getPhase(c, now) !== "past" &&
        overlaps(draft.startAt, draft.endAt, c.startAt, c.endAt)
    ) ?? null
  );
}

export interface TargetProgress {
  taskId: string;
  target: number;
  achieved: number;
  pending: number;
}

export interface GoalProgress {
  targets: TargetProgress[];
  allMet: boolean;
  pendingLogs: number;
  contributors: { userId: string; userName: string; logs: number; quantity: number }[];
}

/** Quantity (not number of logs) of APPROVED logs submitted inside the window. Rejected logs never count. */
export function goalProgress(goal: Challenge, submissions: Submission[]): GoalProgress {
  const targets = goal.targets ?? [];
  const ids = new Set(targets.map((x) => x.taskId));
  const windowLogs = submissions.filter((s) => ids.has(s.taskId) && inWindow(submittedAtOf(s), goal));
  const approved = windowLogs.filter((s) => s.status === "Approved");
  const pending = windowLogs.filter((s) => s.status === "Pending");

  const sum = (rows: Submission[], taskId: string) =>
    rows.filter((s) => s.taskId === taskId).reduce((n, s) => n + s.quantity, 0);

  const rows: TargetProgress[] = targets.map((x) => ({
    taskId: x.taskId,
    target: x.quantity,
    achieved: goal.achieved?.[x.taskId] ?? sum(approved, x.taskId),
    pending: goal.result ? 0 : sum(pending, x.taskId),
  }));

  const byUser = new Map<string, { userId: string; userName: string; logs: number; quantity: number }>();
  for (const s of approved) {
    const row = byUser.get(s.submittedById) ?? { userId: s.submittedById, userName: s.submittedByName, logs: 0, quantity: 0 };
    row.logs += 1;
    row.quantity += s.quantity;
    byUser.set(s.submittedById, row);
  }

  return {
    targets: rows,
    allMet: rows.length > 0 && rows.every((r) => r.achieved >= r.target),
    pendingLogs: pending.length,
    contributors: Array.from(byUser.values()).sort((a, b) => b.quantity - a.quantity),
  };
}

/** "met" as soon as every target is reached (even after end time); "not_met" once ended and nothing left to review. */
export function evaluateGoal(goal: Challenge, submissions: Submission[], now: number = Date.now()): "met" | "not_met" | "open" {
  if (goal.result || now < t(goal.startAt)) return "open";
  const p = goalProgress(goal, submissions);
  if (p.allMet) return "met";
  if (now > t(goal.endAt) && p.pendingLogs === 0) return "not_met";
  return "open";
}

export const staffOf = (members: Member[]) => members.filter((m) => m.role === "Staff" && m.status === "Active");

export const maxGoalCost = (staffCount: number, bonus: number) => staffCount * bonus;

/* ---------------- Formatting ---------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

export const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtDayTime = (iso: string) => {
  const d = new Date(iso);
  return `${fmtDay(iso)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtMultiplier = (m: number) => `${m}x`;

export function timeLeft(iso: string, now: number = Date.now()) {
  const ms = t(iso) - now;
  if (ms <= 0) return "Ended";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}

export const RESULT_LABELS: Record<ChallengeResult, string> = {
  met: "Met",
  not_met: "Not met",
  ended_early: "Ended early",
  completed: "Completed",
};

export const challengeDates = (c: Challenge) =>
  c.kind === "boost" ? `${fmtDay(c.startAt)} – ${fmtDay(c.endAt)}` : `${fmtDayTime(c.startAt)} – ${fmtDayTime(c.endAt)}`;

export const boostTaskLabel = (c: Challenge, tasks: Task[]) =>
  c.allTasks ? "All tasks" : boostTaskIds(c, tasks).map((id) => tasks.find((t) => t.id === id)?.name ?? "Task").join(", ");

export const paidStats = (c: Challenge) => ({
  crowns: c.payouts.reduce((n, p) => n + p.amount, 0),
  people: new Set(c.payouts.map((p) => p.userId)).size,
});

/* ---------------- Emails (simulated) ---------------- */

const taskName = (tasks: Task[], id: string) => tasks.find((x) => x.id === id)?.name ?? "Task";

export function buildStartEmail(c: Challenge, tasks: Task[], staff: Member[], at: string): EmailLogEntry {
  const base = { id: `em-${c.id}-e1`, kind: "E1" as const, challengeId: c.id, at, toLabel: `All staff (${staff.length})`, recipients: staff.map((m) => m.email) };
  if (c.kind === "boost") {
    const names = c.allTasks ? "all tasks" : (c.taskIds ?? []).map((id) => taskName(tasks, id)).join(", ");
    return {
      ...base,
      subject: `${c.name} is live: ${fmtMultiplier(c.multiplier ?? 1)} crowns`,
      body: [
        "Hi team,",
        `${c.name} has started. Until ${fmtDay(c.endAt)}, ${names} earn ${fmtMultiplier(c.multiplier ?? 1)} crowns.`,
        "Log your work as usual. The extra crowns land as soon as each log is approved.",
      ],
    };
  }
  const list = (c.targets ?? []).map((x) => `${x.quantity} × ${taskName(tasks, x.taskId)}`).join(", ");
  return {
    ...base,
    subject: `New Team Goal: ${c.name}`,
    body: [
      "Hi team,",
      `${c.name} is on. Together, hit ${list} by ${fmtDayTime(c.endAt)}.`,
      `Hit every target and everyone who helped gets ${c.bonusPerPerson} bonus crowns.`,
    ],
  };
}

export function buildCompletedEmail(c: Challenge, tasks: Task[], m: { name: string; email: string }, amount: number, at: string): EmailLogEntry {
  const list = (c.targets ?? []).map((x) => `${taskName(tasks, x.taskId)}: ${c.achieved?.[x.taskId] ?? x.quantity} / ${x.quantity}`);
  return {
    id: `em-${c.id}-e2-${m.email}`,
    kind: "E2",
    challengeId: c.id,
    at,
    toLabel: m.name,
    recipients: [m.email],
    subject: `You earned ${amount} bonus crowns: ${c.name} complete`,
    body: [
      `Hi ${m.name},`,
      `The team hit every target in ${c.name}. Because you helped, ${amount} bonus crowns have been added to your balance.`,
      ...list,
    ],
  };
}

export function buildNotMetEmail(c: Challenge, tasks: Task[], staff: Member[], at: string): EmailLogEntry {
  const list = (c.targets ?? []).map((x) => `${taskName(tasks, x.taskId)}: ${c.achieved?.[x.taskId] ?? 0} / ${x.quantity}`);
  return {
    id: `em-${c.id}-e3`,
    kind: "E3",
    challengeId: c.id,
    at,
    toLabel: `All staff (${staff.length})`,
    recipients: staff.map((m) => m.email),
    subject: `${c.name} has ended`,
    body: ["Hi team,", `${c.name} has ended and the targets weren't all reached this time.`, ...list, "Thanks to everyone who logged. On to the next one."],
  };
}

export const EMAIL_LABELS: Record<EmailKind, string> = {
  E1: "Challenge started",
  E2: "Team Goal completed",
  E3: "Team Goal not met",
};

/* ---------------- Seed data ---------------- */

const daysFrom = (base: Date, d: number, h = 0, m = 0) => {
  const x = new Date(base);
  x.setDate(x.getDate() + d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

export function buildSeedChallenges(clinicId: string, tasks: Task[], members: Member[]): { challenges: Challenge[]; emails: EmailLogEntry[] } {
  const { now, boostStart, boostEnd, goalStart, goalEnd } = DEMO_ANCHORS;
  const staff = staffOf(members);
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const payout = (userId: string, amount: number, at: string): ChallengePayout => ({ userId, userName: name(userId), amount, at });

  const filling: Challenge = {
    id: "ch-filling-week", clinicId, kind: "boost", name: "Filling Week",
    startAt: boostStart.toISOString(), endAt: boostEnd.toISOString(), createdAt: daysFrom(boostStart, -2, 10),
    taskIds: ["t6"], multiplier: 2, payouts: [], startEmailSent: true,
  };

  const bigPush: Challenge = {
    id: "ch-big-push", clinicId, kind: "team_goal", name: "Big Push",
    startAt: goalStart.toISOString(), endAt: goalEnd.toISOString(), createdAt: daysFrom(goalStart, -1, 16),
    targets: [{ taskId: "t4", quantity: 30 }, { taskId: "t5", quantity: 20 }, { taskId: "t6", quantity: 8 }],
    bonusPerPerson: 100, payouts: [], startEmailSent: true,
  };

  const claimsWeek: Challenge = {
    id: "ch-claims-week", clinicId, kind: "boost", name: "Claims Week",
    startAt: daysFrom(boostStart, 7), endAt: daysFrom(boostStart, 13, 23, 59), createdAt: now.toISOString(),
    taskIds: ["t5"], multiplier: 1.5, payouts: [],
  };

  // Past: met
  const spring: Challenge = {
    id: "ch-spring-sprint", clinicId, kind: "team_goal", name: "Spring Sprint",
    startAt: daysFrom(boostStart, -35, 8), endAt: daysFrom(boostStart, -31, 18), createdAt: daysFrom(boostStart, -37, 9),
    targets: [{ taskId: "t4", quantity: 40 }, { taskId: "t5", quantity: 25 }],
    bonusPerPerson: 50, result: "met", closedAt: daysFrom(boostStart, -31, 15, 20),
    achieved: { t4: 46, t5: 27 },
    payouts: ["m1", "m2", "m3", "m4"].map((id) => payout(id, 50, daysFrom(boostStart, -31, 15, 20))),
    startEmailSent: true,
  };

  // Past: not met
  const catchUp: Challenge = {
    id: "ch-claims-catchup", clinicId, kind: "team_goal", name: "Claims Catch-up",
    startAt: daysFrom(boostStart, -14, 8), endAt: daysFrom(boostStart, -10, 18), createdAt: daysFrom(boostStart, -15, 11),
    targets: [{ taskId: "t5", quantity: 30 }, { taskId: "t4", quantity: 20 }],
    bonusPerPerson: 75, result: "not_met", closedAt: daysFrom(boostStart, -9, 10, 5),
    achieved: { t5: 21, t4: 24 }, payouts: [], startEmailSent: true,
  };

  // Past: ended early
  const prep: Challenge = {
    id: "ch-prep-double", clinicId, kind: "boost", name: "Crown Prep Double",
    startAt: daysFrom(boostStart, -28), endAt: daysFrom(boostStart, -22, 23, 59), createdAt: daysFrom(boostStart, -29, 14),
    taskIds: ["t1"], multiplier: 2, result: "ended_early", closedAt: daysFrom(boostStart, -25, 12, 30),
    payouts: [payout("m1", 40, daysFrom(boostStart, -27, 11)), payout("m2", 30, daysFrom(boostStart, -26, 14)), payout("m3", 20, daysFrom(boostStart, -26, 16))],
    startEmailSent: true,
  };

  const challenges = [filling, bigPush, claimsWeek, spring, catchUp, prep];

  const emails: EmailLogEntry[] = [
    buildStartEmail(spring, tasks, staff, spring.startAt),
    ...spring.payouts.map((p) => {
      const m = members.find((x) => x.id === p.userId)!;
      return buildCompletedEmail(spring, tasks, m, p.amount, p.at);
    }),
    buildStartEmail(prep, tasks, staff, prep.startAt),
    buildStartEmail(catchUp, tasks, staff, catchUp.startAt),
    buildNotMetEmail(catchUp, tasks, staff, catchUp.closedAt!),
    buildStartEmail(filling, tasks, staff, filling.startAt),
    buildStartEmail(bigPush, tasks, staff, bigPush.startAt),
  ];

  return { challenges, emails };
}
