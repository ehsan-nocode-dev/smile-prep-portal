export type Department = "Assistant" | "Hygienist" | "Business Associate" | "Manager";
export type Status = "Active" | "Inactive";
export type Role = "Admin" | "Staff";
export type SubmissionStatus = "Approved" | "Rejected" | "Pending";

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
  crownValue: number;
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
    crownValue: 12,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t2",
    name: "Crown Delivery",
    description: "Deliver and seat a finished crown.",
    department: "Assistant",
    baseXp: 20,
    crownValue: 10,
    status: "Active",
    badges: defaultBadges(),
  },
  {
    id: "t3",
    name: "Clean Windows",
    description: "Clean operatory windows thoroughly.",
    department: "Assistant",
    baseXp: 50,
    crownValue: 25,
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

export const initialSubmissions: Submission[] = [
  { id: "s1", taskId: "t1", taskName: "Crown Prep", quantity: 6, status: "Approved", submittedById: "m1", submittedByName: "Test", date: "2025-04-10", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-11", xpEarned: 150 },
  { id: "s2", taskId: "t2", taskName: "Crown Delivery", quantity: 5, status: "Approved", submittedById: "m2", submittedByName: "Ehsan", date: "2025-04-09", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-10", xpEarned: 100 },
  { id: "s3", taskId: "t3", taskName: "Clean Windows", quantity: 2, status: "Rejected", submittedById: "m3", submittedByName: "Arham Ali", date: "2025-04-08", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-09", xpEarned: 0 },
  { id: "s4", taskId: "t1", taskName: "Crown Prep", quantity: 3, status: "Pending", submittedById: "m1", submittedByName: "Test", date: "2025-04-15", xpEarned: 75 },
  { id: "s5", taskId: "t2", taskName: "Crown Delivery", quantity: 4, status: "Pending", submittedById: "m4", submittedByName: "Uzair Farhan", date: "2025-04-14", xpEarned: 80 },
  { id: "s6", taskId: "t1", taskName: "Crown Prep", quantity: 2, status: "Approved", submittedById: "m1", submittedByName: "Test", date: "2025-04-05", reviewedBy: "Dr. Admin", reviewedDate: "2025-04-06", xpEarned: 50 },
];
