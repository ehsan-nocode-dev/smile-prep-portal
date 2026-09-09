import { Submission, Task, Tier, TIERS } from "./mock-data";

export const effectiveDate = (s: Submission) => s.reviewedDate || s.date;

export const approvedFor = (submissions: Submission[], userId: string) =>
  submissions.filter((s) => s.submittedById === userId && s.status === "Approved");

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Monday-based start of the week containing d */
export const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
};

const iso = (d: Date) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export function xpBetween(subs: Submission[], from: Date, to: Date) {
  const a = iso(from);
  const b = iso(to);
  return subs
    .filter((s) => {
      const d = effectiveDate(s);
      return d >= a && d <= b;
    })
    .reduce((sum, s) => sum + s.xpEarned, 0);
}

export interface TrendPoint {
  label: string;
  xp: number;
}

/** Last 7 days, one point per day */
export function weeklyTrend(subs: Submission[], now = new Date()): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    out.push({
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      xp: xpBetween(subs, d, d),
    });
  }
  return out;
}

/** Last 12 weeks, one point per week */
export function monthlyTrend(subs: Submission[], now = new Date()): TrendPoint[] {
  const out: TrendPoint[] = [];
  const thisWeek = startOfWeek(now);
  for (let i = 11; i >= 0; i--) {
    const from = new Date(thisWeek);
    from.setDate(from.getDate() - i * 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    out.push({
      label: from.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      xp: xpBetween(subs, from, to),
    });
  }
  return out;
}

export interface WeekComparison {
  thisWeek: number;
  lastWeek: number;
  pct: number | null; // null when last week was zero
}

export function weekComparison(subs: Submission[], now = new Date()): WeekComparison {
  const thisStart = startOfWeek(now);
  const lastStart = new Date(thisStart);
  lastStart.setDate(lastStart.getDate() - 7);
  const lastEnd = new Date(thisStart);
  lastEnd.setDate(lastEnd.getDate() - 1);

  const thisWeek = xpBetween(subs, thisStart, now);
  const lastWeek = xpBetween(subs, lastStart, lastEnd);
  const pct = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, pct };
}

export interface TaskSlice {
  taskId: string;
  name: string;
  count: number;
  pct: number;
}

/** Approved completions (quantity) grouped by task */
export function taskDistribution(subs: Submission[], tasks: Task[]): TaskSlice[] {
  const totals = new Map<string, number>();
  subs.forEach((s) => totals.set(s.taskId, (totals.get(s.taskId) || 0) + s.quantity));
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return tasks
    .map((t) => {
      const count = totals.get(t.id) || 0;
      return { taskId: t.id, name: t.name, count, pct: total ? Math.round((count / total) * 100) : 0 };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

export const approvedCountForTask = (subs: Submission[], taskId: string) =>
  subs.filter((s) => s.taskId === taskId).reduce((n, s) => n + s.quantity, 0);

export interface BadgeRef {
  tier: Tier;
  taskName: string;
  bonusXp: number;
  remaining?: number;
}

/** The badge that needs the fewest additional completions */
export function closestBadge(subs: Submission[], tasks: Task[]): BadgeRef | null {
  let best: BadgeRef | null = null;
  tasks.forEach((t) => {
    const done = approvedCountForTask(subs, t.id);
    const next = t.badges.find((b) => done < b.tracks);
    if (!next) return;
    const remaining = next.tracks - done;
    if (!best || remaining < (best.remaining ?? Infinity)) {
      best = { tier: next.tier, taskName: t.name, bonusXp: next.bonusXp, remaining };
    }
  });
  return best;
}

/** The highest tier earned across all tasks */
export function highestBadge(subs: Submission[], tasks: Task[]): BadgeRef | null {
  let best: BadgeRef | null = null;
  let bestIdx = -1;
  tasks.forEach((t) => {
    const done = approvedCountForTask(subs, t.id);
    t.badges.forEach((b) => {
      if (done < b.tracks) return;
      const idx = TIERS.indexOf(b.tier);
      if (idx > bestIdx) {
        bestIdx = idx;
        best = { tier: b.tier, taskName: t.name, bonusXp: b.bonusXp };
      }
    });
  });
  return best;
}
