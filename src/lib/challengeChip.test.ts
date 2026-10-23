import { describe, expect, it } from "vitest";
import { Challenge, challengeChip, goalPercent, goalProgress, shortTimeLeft, startsIn, userGoalStatus } from "./challenges";
import { Submission } from "./mock-data";

const H = 3600000;
const NOW = new Date(2026, 9, 23, 12, 0).getTime(); // local noon
const at = (offsetH: number) => new Date(NOW + offsetH * H).toISOString();

const goal = (p: Partial<Challenge> = {}): Challenge => ({
  id: "g1", clinicId: "c1", kind: "team_goal", name: "Friday Push",
  startAt: at(-4), endAt: at(3), createdAt: at(-30),
  targets: [{ taskId: "call", quantity: 100 }, { taskId: "claim", quantity: 10 }],
  bonusPerPerson: 100, payouts: [], ...p,
});
const boost = (p: Partial<Challenge> = {}): Challenge => ({
  id: "b1", clinicId: "c1", kind: "boost", name: "Filling Week",
  startAt: at(-24), endAt: at(48), createdAt: at(-30), taskIds: ["fill"], multiplier: 2, payouts: [], ...p,
});
const sub = (p: Partial<Submission> & { taskId: string }): Submission => ({
  id: Math.random().toString(36), taskName: p.taskId, quantity: 1, status: "Approved",
  submittedById: "u1", submittedByName: "U1", date: at(-1).slice(0, 10), submittedAt: at(-1), xpEarned: 0, ...p,
});

describe("Challenge chip", () => {
  it("averages target % and caps each target at 100", () => {
    const subs = [sub({ taskId: "call", quantity: 250 }), sub({ taskId: "claim", quantity: 2 })];
    // call capped at 100%, claim 20% → 60%
    expect(goalPercent(goalProgress(goal(), subs))).toBe(60);
  });

  it("shows nothing when nothing is live, upcoming or met today", () => {
    expect(challengeChip([], [], NOW)).toBeNull();
    expect(challengeChip([boost({ startAt: at(30), endAt: at(60) })], [], NOW)).toBeNull(); // starts in 30h
  });

  it("shows a live goal and live boosts together", () => {
    const s = challengeChip([goal(), boost(), boost({ id: "b2", multiplier: 3 })], [], NOW)!;
    expect(s.goal?.challenge.id).toBe("g1");
    expect(s.boosts).toHaveLength(2);
    expect(s.upcoming).toHaveLength(0);
  });

  it("shows a challenge starting within 24h only when nothing is live", () => {
    const soon = boost({ id: "b3", startAt: at(5), endAt: at(50) });
    expect(challengeChip([soon], [], NOW)!.upcoming.map((c) => c.id)).toEqual(["b3"]);
    expect(challengeChip([soon, goal()], [], NOW)!.upcoming).toHaveLength(0);
  });

  it("keeps a met goal for the rest of that day, then hides it", () => {
    const met = goal({ result: "met", closedAt: at(-1) });
    expect(challengeChip([met], [], NOW)!.met?.id).toBe("g1");
    const tomorrow = new Date(2026, 9, 24, 0, 30).getTime();
    expect(challengeChip([met], [], tomorrow)).toBeNull();
  });

  it("never shows a not-met goal", () => {
    expect(challengeChip([goal({ result: "not_met", closedAt: at(-1) })], [], NOW)).toBeNull();
  });

  it("tells staff whether they qualify yet", () => {
    expect(userGoalStatus(goal(), [sub({ taskId: "claim" })], "u1")).toBe("helped");
    expect(userGoalStatus(goal(), [sub({ taskId: "claim", status: "Pending" })], "u1")).toBe("pending");
    expect(userGoalStatus(goal(), [sub({ taskId: "fill" })], "u1")).toBe("none");
    expect(userGoalStatus(goal(), [sub({ taskId: "claim", status: "Rejected" })], "u1")).toBe("none");
  });

  it("formats compact times", () => {
    expect(shortTimeLeft(at(3.5), NOW)).toBe("3h left");
    expect(shortTimeLeft(at(50), NOW)).toBe("2d left");
    expect(startsIn(at(5), NOW)).toBe("Starts in 5h");
  });
});
