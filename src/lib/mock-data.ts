export type Department = "Assistant" | "Hygienist" | "Business Associate" | "Manager";
export type Status = "Active" | "Inactive";
export type Role = "Admin" | "Staff";
export type SubmissionStatus = "Approved" | "Rejected" | "Pending";

export const CROWN_MULTIPLIER = 0.4;

export const getCrownValue = (xp: number) => Math.ceil(xp * CROWN_MULTIPLIER);

export const TIERS = ["Novice", "Iron", "Bronze", "Silver", "Gold", "Purple", "Teal"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_COLORS: Record<Tier, string> = {
  Novice: "bg-tier-novice",
  Iron: "bg-tier-iron",
  Bronze: "bg-tier-bronze",
  Silver: "bg-tier-silver",
  Gold: "bg-tier-gold",
  Purple: "bg-tier-purple",
  Teal: "bg-tier-teal",
};

export interface BadgeTier {
  tier: Tier;
  tracks: number;
  bonusXp: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  department: Department;
  baseXp: number;
  status: Status;
  badges: BadgeTier[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  department: Department;
  role: Role;
  status: Status;
  joined: string;
  address?: string;
  company?: string;
}

export interface Submission {
  id: string;
  taskId: string;
  taskName: string;
  quantity: number;
  status: SubmissionStatus;
  submittedById: string;
  submittedByName: string;
  date: string;
  /** Exact submission time (ISO). Older seed rows only have `date`. */
  submittedAt?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  xpEarned: number;
}

const defaultBadges = (): BadgeTier[] => [
  { tier: "Novice", tracks: 1, bonusXp: 0 },
  { tier: "Iron", tracks: 5, bonusXp: 10 },
  { tier: "Bronze", tracks: 10, bonusXp: 25 },
  { tier: "Silver", tracks: 25, bonusXp: 50 },
  { tier: "Gold", tracks: 50, bonusXp: 100 },
  { tier: "Purple", tracks: 100, bonusXp: 250 },
  { tier: "Teal", tracks: 250, bonusXp: 500 },
];

export const initialTasks: Task[] = [
  {
    id: "t1",
    name: "Crown Prep",
    description: "Prepare a tooth for crown placement.",
    department: "Assistant",
    baseXp: 25,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t2",
    name: "Crown Delivery",
    description: "Deliver and seat a finished crown.",
    department: "Assistant",
    baseXp: 20,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t3",
    name: "Clean Windows",
    description: "Clean operatory windows thoroughly.",
    department: "Assistant",
    baseXp: 50,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t4",
    name: "Patient Call",
    description: "Call a patient to confirm, recall or follow up.",
    department: "Business Associate",
    baseXp: 5,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t5",
    name: "Insurance Claim",
    description: "Prepare and submit an insurance claim.",
    department: "Business Associate",
    baseXp: 10,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t6",
    name: "Filling",
    description: "Assist with a completed filling.",
    department: "Assistant",
    baseXp: 30,
    status: "Active",
    badges: defaultBadges(),
  },
];

export const initialMembers: Member[] = [
  { id: "m1", name: "Test", email: "elanleedds@gmail.com", department: "Assistant", role: "Staff", status: "Active", joined: "2024-01-15" },
  { id: "m2", name: "Ehsan", email: "ehsan@molarup.com", department: "Assistant", role: "Staff", status: "Active", joined: "2024-02-10" },
  { id: "m3", name: "Arham Ali", email: "arham@molarup.com", department: "Assistant", role: "Staff", status: "Active", joined: "2024-03-05" },
  { id: "m4", name: "Uzair Farhan", email: "uzair@molarup.com", department: "Assistant", role: "Staff", status: "Active", joined: "2024-03-20" },
  { id: "admin1", name: "Dr. Admin", email: "admin@molarup.com", department: "Manager", role: "Admin", status: "Active", joined: "2023-06-01" },
];

const baseSubmissions: Submission[] = [
  { id: "s1", taskId: "t1", taskName: "Crown Prep", quantity: 6, status: "Approved", submittedById: "m1", submittedByName: "Test", date: "2025-04-10", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-11", xpEarned: 150 },
  { id: "s2", taskId: "t2", taskName: "Crown Delivery", quantity: 5, status: "Approved", submittedById: "m2", submittedByName: "Ehsan", date: "2025-04-09", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-10", xpEarned: 100 },
  { id: "s3", taskId: "t3", taskName: "Clean Windows", quantity: 2, status: "Rejected", submittedById: "m3", submittedByName: "Arham Ali", date: "2025-04-08", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-09", xpEarned: 0 },
  { id: "s4", taskId: "t1", taskName: "Crown Prep", quantity: 3, status: "Pending", submittedById: "m1", submittedByName: "Test", date: "2025-04-15", xpEarned: 75 },
  { id: "s5", taskId: "t2", taskName: "Crown Delivery", quantity: 4, status: "Pending", submittedById: "m4", submittedByName: "Uzair Farhan", date: "2025-04-14", xpEarned: 80 },
  { id: "s6", taskId: "t1", taskName: "Crown Prep", quantity: 2, status: "Approved", submittedById: "m1", submittedByName: "Test", date: "2025-04-05", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-06", xpEarned: 50 },
];

// ---- Seeded recent history so trend charts have realistic data ----
const isoDay = (d: Date) => d.toISOString().split("T")[0];

function seedRecentSubmissions(): Submission[] {
  const out: Submission[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Deterministic pseudo-random
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const people: { id: string; name: string }[] = [
    { id: "m1", name: "Test" },
    { id: "m2", name: "Ehsan" },
    { id: "m3", name: "Arham Ali" },
    { id: "m4", name: "Uzair Farhan" },
  ];

  let n = 0;
  // 12 weeks back through today
  for (let dayBack = 83; dayBack >= 0; dayBack--) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayBack);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // weekdays only

    for (const person of people) {
      // main demo user logs more often; last week busier than this week
      let chance = person.id === "m1" ? 0.75 : 0.3;
      if (person.id === "m1" && dayBack < 7) chance = 0.5;
      if (rnd() > chance) continue;

      // history uses the original three tasks so existing demo charts stay unchanged
      const historyTasks = initialTasks.slice(0, 3);
      const task = historyTasks[Math.floor(rnd() * historyTasks.length)];
      const quantity = 1 + Math.floor(rnd() * 3);
      out.push({
        id: `sg${++n}`,
        taskId: task.id,
        taskName: task.name,
        quantity,
        status: "Approved",
        submittedById: person.id,
        submittedByName: person.name,
        date: isoDay(d),
        reviewedBy: "Dr. Admin",
        reviewedDate: isoDay(d),
        xpEarned: task.baseXp * quantity,
      });
    }
  }
  return out;
}

// ---- Challenges demo anchors (relative to "now" so the demo always looks live) ----
function startOfIsoWeek(d: Date) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const DEMO_ANCHORS = (() => {
  const now = new Date();
  const boostStart = startOfIsoWeek(now);
  const boostEnd = new Date(boostStart);
  boostEnd.setDate(boostEnd.getDate() + 6);
  boostEnd.setHours(23, 59, 0, 0);
  const goalStart = new Date(now);
  goalStart.setDate(goalStart.getDate() - 2);
  goalStart.setHours(8, 0, 0, 0);
  const goalEnd = new Date(now);
  goalEnd.setDate(goalEnd.getDate() + 2);
  goalEnd.setHours(18, 0, 0, 0);
  return { now, boostStart, boostEnd, goalStart, goalEnd };
})();

/** Logs for the live "Big Push" Team Goal: part approved, the rest pending so approvals complete it. */
function seedChallengeSubmissions(): Submission[] {
  const { now, boostStart, goalStart } = DEMO_ANCHORS;
  const people: Record<string, string> = { m1: "Test", m2: "Ehsan", m3: "Arham Ali", m4: "Uzair Farhan" };
  const at = (lo: Date, f: number) => {
    const span = Math.max(0, now.getTime() - lo.getTime() - 60 * 60000);
    return new Date(lo.getTime() + span * f);
  };
  const fillingFloor = boostStart > goalStart ? boostStart : goalStart;
  const rows: [string, string, number, SubmissionStatus, number][] = [
    // [taskId, userId, quantity, status, position in window 0..1]
    ["t4", "m1", 6, "Approved", 0.05], ["t4", "m2", 6, "Approved", 0.15], ["t4", "m3", 5, "Approved", 0.3], ["t4", "m4", 5, "Approved", 0.45],
    ["t5", "m2", 5, "Approved", 0.1], ["t5", "m3", 4, "Approved", 0.35], ["t5", "m4", 4, "Approved", 0.5],
    ["t6", "m1", 3, "Approved", 0.2], ["t6", "m4", 2, "Approved", 0.4],
    ["t4", "m1", 4, "Pending", 0.8], ["t4", "m2", 5, "Pending", 0.9],
    ["t5", "m1", 4, "Pending", 0.75], ["t5", "m3", 3, "Pending", 0.85],
    ["t6", "m1", 2, "Pending", 0.7], ["t6", "m2", 2, "Pending", 0.95],
  ];
  return rows.map(([taskId, userId, quantity, status, f], i) => {
    const task = initialTasks.find((t) => t.id === taskId)!;
    const when = at(taskId === "t6" ? fillingFloor : goalStart, f);
    return {
      id: `cg${i + 1}`,
      taskId, taskName: task.name, quantity, status,
      submittedById: userId, submittedByName: people[userId],
      date: isoDay(when),
      submittedAt: when.toISOString(),
      reviewedBy: status === "Approved" ? "Dr. Admin" : undefined,
      reviewedDate: status === "Approved" ? isoDay(when) : undefined,
      xpEarned: task.baseXp * quantity,
    };
  });
}

export const initialSubmissions: Submission[] = [...baseSubmissions, ...seedRecentSubmissions(), ...seedChallengeSubmissions()];

