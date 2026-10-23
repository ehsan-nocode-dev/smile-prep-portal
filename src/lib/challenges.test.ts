import { describe, expect, it } from "vitest";
import {
  Challenge,
  boostConflicts,
  boostedCrowns,
  departmentsWithoutBoost,
  evaluateGoal,
  findBoostFor,
  goalConflict,
  goalProgress,
  maxGoalCost,
} from "./challenges";
import { Submission, Task, getCrownValue } from "./mock-data";

const task = (id: string, department: Task["department"], baseXp = 10): Task => ({
  id, name: id, description: "", department, baseXp, status: "Active", badges: [],
});
const tasks = [task("fill", "Assistant", 30), task("call", "Business Associate", 5), task("claim", "Business Associate", 10)];

const sub = (p: Partial<Submission> & { taskId: string; submittedAt: string }): Submission => ({
  id: Math.random().toString(36), taskName: p.taskId, quantity: 1, status: "Approved",
  submittedById: "u1", submittedByName: "U1", date: p.submittedAt.slice(0, 10), xpEarned: 0, ...p,
});

const boost: Challenge = {
  id: "b1", clinicId: "c1", kind: "boost", name: "Filling Week", taskIds: ["fill"], multiplier: 2,
  startAt: "2026-10-19T00:00:00.000Z", endAt: "2026-10-25T23:59:00.000Z", createdAt: "", payouts: [],
};

const goal: Challenge = {
  id: "g1", clinicId: "c1", kind: "team_goal", name: "Push", bonusPerPerson: 100,
  targets: [{ taskId: "call", quantity: 50 }, { taskId: "claim", quantity: 10 }],
  startAt: "2026-10-23T08:00:00.000Z", endAt: "2026-10-23T18:00:00.000Z", createdAt: "", payouts: [],
};
const DURING = "2026-10-23T10:00:00.000Z";
const AFTER = Date.parse("2026-10-24T09:00:00.000Z");

describe("Boost", () => {
  it("pays normal crowns × multiplier, rounded up", () => {
    expect(boostedCrowns(getCrownValue(30) * 1, 2)).toBe(24); // 12 × 2
    expect(boostedCrowns(getCrownValue(5) * 1, 1.5)).toBe(3); // 2 × 1.5
    expect(boostedCrowns(getCrownValue(10) * 3, 1.5)).toBe(18); // 12 × 1.5
  });

  it("applies when the log was submitted during the Boost, even if approved after it ends", () => {
    expect(findBoostFor([boost], "fill", "2026-10-25T20:00:00.000Z")?.id).toBe("b1");
    expect(findBoostFor([boost], "fill", "2026-10-26T08:00:00.000Z")).toBeNull();
    expect(findBoostFor([boost], "call", DURING)).toBeNull();
  });

  it("does not apply to logs submitted after a Boost was ended early", () => {
    const ended = { ...boost, result: "ended_early" as const, closedAt: "2026-10-21T12:00:00.000Z" };
    expect(findBoostFor([ended], "fill", "2026-10-21T11:00:00.000Z")?.id).toBe("b1");
    expect(findBoostFor([ended], "fill", "2026-10-22T11:00:00.000Z")).toBeNull();
  });

  it("blocks a task that is already in another overlapping Boost", () => {
    const now = Date.parse("2026-10-20T09:00:00.000Z");
    const draft = { clinicId: "c1", allTasks: false, taskIds: ["fill"], startAt: "2026-10-22T00:00:00.000Z", endAt: "2026-10-28T00:00:00.000Z" };
    expect(boostConflicts([boost], draft, tasks, now)).toHaveLength(1);
    expect(boostConflicts([boost], { ...draft, taskIds: ["call"] }, tasks, now)).toHaveLength(0);
  });

  it("lists departments with no boosted task", () => {
    expect(departmentsWithoutBoost(tasks, false, ["fill"])).toEqual(["Business Associate"]);
    expect(departmentsWithoutBoost(tasks, true, [])).toEqual([]);
  });
});

describe("Team Goal", () => {
  it("counts quantity of approved logs inside the window, never rejected ones", () => {
    const subs = [
      sub({ taskId: "call", quantity: 20, submittedAt: DURING }),
      sub({ taskId: "call", quantity: 30, submittedAt: DURING, status: "Rejected" }),
      sub({ taskId: "call", quantity: 30, submittedAt: "2026-10-23T19:00:00.000Z" }), // outside window
    ];
    expect(goalProgress(goal, subs).targets[0].achieved).toBe(20);
  });

  it("needs every target met", () => {
    const subs = [sub({ taskId: "call", quantity: 50, submittedAt: DURING }), sub({ taskId: "claim", quantity: 9, submittedAt: DURING })];
    expect(goalProgress(goal, subs).allMet).toBe(false);
    expect(goalProgress(goal, [...subs, sub({ taskId: "claim", quantity: 1, submittedAt: DURING })]).allMet).toBe(true);
  });

  it("pays out after the end time if late approvals complete it", () => {
    const subs = [sub({ taskId: "call", quantity: 50, submittedAt: DURING }), sub({ taskId: "claim", quantity: 10, submittedAt: DURING })];
    expect(evaluateGoal(goal, subs, AFTER)).toBe("met");
  });

  it("closes as not met only after the end time once every window log is reviewed", () => {
    const pending = [sub({ taskId: "call", quantity: 5, submittedAt: DURING, status: "Pending" })];
    expect(evaluateGoal(goal, pending, AFTER)).toBe("open");
    expect(evaluateGoal(goal, [], Date.parse("2026-10-23T12:00:00.000Z"))).toBe("open");
    expect(evaluateGoal(goal, [{ ...pending[0], status: "Rejected" }], AFTER)).toBe("not_met");
  });

  it("pays everyone with at least one approved log of any goal task", () => {
    const subs = [
      sub({ taskId: "call", quantity: 50, submittedAt: DURING, submittedById: "a" }),
      sub({ taskId: "claim", quantity: 10, submittedAt: DURING, submittedById: "b" }),
      sub({ taskId: "fill", quantity: 1, submittedAt: DURING, submittedById: "c" }), // not a goal task
      sub({ taskId: "claim", quantity: 1, submittedAt: DURING, submittedById: "d", status: "Rejected" }),
    ];
    expect(goalProgress(goal, subs).contributors.map((c) => c.userId).sort()).toEqual(["a", "b"]);
  });

  it("allows only one Team Goal at a time per clinic", () => {
    const now = Date.parse("2026-10-23T09:00:00.000Z");
    expect(goalConflict([goal], { clinicId: "c1", startAt: "2026-10-23T12:00:00.000Z", endAt: "2026-10-24T12:00:00.000Z" }, now)?.id).toBe("g1");
    expect(goalConflict([goal], { clinicId: "c1", startAt: "2026-10-24T08:00:00.000Z", endAt: "2026-10-24T18:00:00.000Z" }, now)).toBeNull();
  });

  it("shows max cost as staff × bonus", () => {
    expect(maxGoalCost(11, 100)).toBe(1100);
  });
});
