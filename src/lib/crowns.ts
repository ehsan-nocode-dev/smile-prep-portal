import { initialMembers } from "./mock-data";

/* ---------------- Types ---------------- */

export type CrownTransactionType = "earned" | "spent";

export type CrownTransactionSource =
  | "submission_approved"
  | "store_purchase"
  | "admin_bonus" // reserved
  | "level_up"; // reserved

export type FulfilmentStatus = "not_required" | "pending" | "fulfilled";

export interface CrownTransaction {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  type: CrownTransactionType;
  source: CrownTransactionSource;
  amount: number;
  balanceAfter: number;
  referenceId: string;
  referenceLabel: string;
  redemptionReference?: string;
  fulfilmentStatus?: FulfilmentStatus;
  fulfilledAt?: string;
  fulfilledBy?: string;
  createdAt: string;
}

export type ProductType = "digital" | "physical";
export type ProductStatus = "active" | "inactive";

export interface StoreProduct {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  crownCost: number;
  quantity: number;
  productType: ProductType;
  requiresFulfilment: boolean;
  status: ProductStatus;
  autoDeactivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  type: "product_out_of_stock" | "redemption_pending";
  productId: string;
  productTitle: string;
  userName?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CrownAccount {
  crownBalance: number;
  totalCrownsEarned: number;
  totalCrownsSpent: number;
}

export interface TransactionFilters {
  userId?: string;
  productId?: string;
  type?: CrownTransactionType | "all";
  status?: FulfilmentStatus | "all";
  from?: string;
  to?: string;
  search?: string;
}

export const SOURCE_LABELS: Record<CrownTransactionSource, string> = {
  submission_approved: "Submission approved",
  store_purchase: "Store purchase",
  admin_bonus: "Admin bonus",
  level_up: "Level up reward",
};

export const FULFILMENT_LABELS: Record<FulfilmentStatus, string> = {
  not_required: "No fulfilment needed",
  pending: "Pending",
  fulfilled: "Fulfilled",
};

/* ---------------- Formatting helpers ---------------- */

export const formatCrowns = (n: number) => n.toLocaleString("en-GB");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Day-first UK format: 14 Aug 2026 · 09:32 */
export function formatTxDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const daysBetween = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
export function generateRedemptionReference(): string {
  let out = "";
  for (let i = 0; i < 4; i++) out += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return `#MU-${out}`;
}

export const exactDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ---------------- Mock seed data ---------------- */

const img = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

const daysAgo = (d: number, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(hour, (d * 7) % 60, 0, 0);
  return dt.toISOString();
};

export const initialProducts: StoreProduct[] = [
  {
    id: "p1", title: "Costa Coffee Voucher", description: "A £5 Costa voucher — your caffeine fix, on the practice.",
    thumbnailUrl: img("costa"), crownCost: 250, quantity: 8, productType: "physical", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(80), updatedAt: daysAgo(6),
  },
  {
    id: "p2", title: "Extra 30 Minute Break", description: "Claim an additional half hour break on a day of your choosing.",
    thumbnailUrl: img("break"), crownCost: 150, quantity: 20, productType: "digital", requiresFulfilment: false,
    status: "active", autoDeactivated: false, createdAt: daysAgo(80), updatedAt: daysAgo(12),
  },
  {
    id: "p3", title: "Extra Day Off", description: "A full additional day of paid leave, booked with your manager.",
    thumbnailUrl: img("dayoff"), crownCost: 2000, quantity: 3, productType: "digital", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(75), updatedAt: daysAgo(4),
  },
  {
    id: "p4", title: "Choice of Surgery Playlist", description: "Control the music in the surgery for a full working day.",
    thumbnailUrl: img("playlist"), crownCost: 50, quantity: 30, productType: "digital", requiresFulfilment: false,
    status: "active", autoDeactivated: false, createdAt: daysAgo(70), updatedAt: daysAgo(20),
  },
  {
    id: "p5", title: "Lunch On The Practice", description: "Lunch of your choice delivered to the practice, up to £15.",
    thumbnailUrl: img("lunch"), crownCost: 400, quantity: 2, productType: "physical", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(66), updatedAt: daysAgo(3),
  },
  {
    id: "p6", title: "Cinema Tickets (Pair)", description: "Two standard cinema tickets, valid at all major chains.",
    thumbnailUrl: img("cinema"), crownCost: 750, quantity: 5, productType: "physical", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(60), updatedAt: daysAgo(9),
  },
  {
    id: "p7", title: "MolarUp Branded Hoodie", description: "Premium heavyweight hoodie with embroidered MolarUp logo.",
    thumbnailUrl: img("hoodie"), crownCost: 1200, quantity: 6, productType: "physical", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(58), updatedAt: daysAgo(14),
  },
  {
    id: "p8", title: "Spa Day Voucher", description: "A full day pass at a local spa including treatment of choice.",
    thumbnailUrl: img("spa"), crownCost: 1500, quantity: 1, productType: "physical", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(55), updatedAt: daysAgo(2),
  },
  {
    id: "p9", title: "Exclusive Profile Frame", description: "A rare in-app profile frame that shows off your Crown spending power.",
    thumbnailUrl: img("badge"), crownCost: 300, quantity: 50, productType: "digital", requiresFulfilment: false,
    status: "active", autoDeactivated: false, createdAt: daysAgo(50), updatedAt: daysAgo(18),
  },
  {
    id: "p10", title: "Parking Space For A Week", description: "The best parking space at the practice reserved for you, all week.",
    thumbnailUrl: img("parking"), crownCost: 900, quantity: 0, productType: "digital", requiresFulfilment: true,
    status: "inactive", autoDeactivated: true, createdAt: daysAgo(48), updatedAt: daysAgo(1),
  },
  {
    id: "p11", title: "Charity Donation In Your Name", description: "£20 donated to a charity of your choosing on behalf of the practice.",
    thumbnailUrl: img("charity"), crownCost: 500, quantity: 12, productType: "digital", requiresFulfilment: true,
    status: "inactive", autoDeactivated: false, createdAt: daysAgo(40), updatedAt: daysAgo(5),
  },
  {
    id: "p12", title: "Amazon Gift Card £25", description: "A £25 Amazon gift card code, issued by the practice manager.",
    thumbnailUrl: img("amazon"), crownCost: 1000, quantity: 4, productType: "digital", requiresFulfilment: true,
    status: "active", autoDeactivated: false, createdAt: daysAgo(35), updatedAt: daysAgo(7),
  },
];

const EARN_LABELS = ["Crown Prep", "Crown Delivery", "Clean Windows", "Hygiene Check Logged", "Sterilisation Round"];

/* Deterministic pseudo-random so the demo data is stable */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SpendSpec = {
  userId: string;
  productId: string;
  day: number;
  hour: number;
  ref: string;
  status: FulfilmentStatus;
  fulfilledDay?: number;
  fulfilledBy?: string;
};

/* 5 pending (4+ users, one over 7 days), 9 fulfilled, 5 not_required */
const SPEND_SPECS: SpendSpec[] = [
  // pending
  { userId: "m1", productId: "p8", day: 11, hour: 9, ref: "#MU-4821", status: "pending" },
  { userId: "m2", productId: "p12", day: 5, hour: 14, ref: "#MU-7C13", status: "pending" },
  { userId: "m3", productId: "p1", day: 4, hour: 11, ref: "#MU-9K02", status: "pending" },
  { userId: "m4", productId: "p6", day: 3, hour: 16, ref: "#MU-2H77", status: "pending" },
  { userId: "m1", productId: "p5", day: 1, hour: 12, ref: "#MU-5R41", status: "pending" },
  // fulfilled
  { userId: "m1", productId: "p1", day: 62, hour: 10, ref: "#MU-1A08", status: "fulfilled", fulfilledDay: 60, fulfilledBy: "Dr. Admin" },
  { userId: "m2", productId: "p7", day: 55, hour: 15, ref: "#MU-3B21", status: "fulfilled", fulfilledDay: 52, fulfilledBy: "Dr. Admin" },
  { userId: "m3", productId: "p12", day: 48, hour: 9, ref: "#MU-4C55", status: "fulfilled", fulfilledDay: 46, fulfilledBy: "Dr. Admin" },
  { userId: "m4", productId: "p1", day: 44, hour: 13, ref: "#MU-6D19", status: "fulfilled", fulfilledDay: 43, fulfilledBy: "Dr. Admin" },
  { userId: "m2", productId: "p5", day: 38, hour: 12, ref: "#MU-8E73", status: "fulfilled", fulfilledDay: 37, fulfilledBy: "Dr. Admin" },
  { userId: "m1", productId: "p6", day: 30, hour: 17, ref: "#MU-9F30", status: "fulfilled", fulfilledDay: 28, fulfilledBy: "Dr. Admin" },
  { userId: "m3", productId: "p3", day: 25, hour: 10, ref: "#MU-0G64", status: "fulfilled", fulfilledDay: 22, fulfilledBy: "Dr. Admin" },
  { userId: "m4", productId: "p11", day: 20, hour: 11, ref: "#MU-2J88", status: "fulfilled", fulfilledDay: 18, fulfilledBy: "Dr. Admin" },
  { userId: "m2", productId: "p1", day: 14, hour: 16, ref: "#MU-7L26", status: "fulfilled", fulfilledDay: 13, fulfilledBy: "Dr. Admin" },
  // no fulfilment needed
  { userId: "m1", productId: "p4", day: 50, hour: 9, ref: "#MU-3M11", status: "not_required" },
  { userId: "m2", productId: "p2", day: 33, hour: 14, ref: "#MU-5N47", status: "not_required" },
  { userId: "m3", productId: "p9", day: 21, hour: 15, ref: "#MU-6P90", status: "not_required" },
  { userId: "m4", productId: "p2", day: 12, hour: 10, ref: "#MU-8Q52", status: "not_required" },
  { userId: "m1", productId: "p9", day: 6, hour: 13, ref: "#MU-1S05", status: "not_required" },
];

export function buildSeedTransactions(): { transactions: CrownTransaction[]; accounts: Record<string, CrownAccount> } {
  const rand = mulberry(42);
  const users = initialMembers;
  const accounts: Record<string, CrownAccount> = {};
  users.forEach((u) => (accounts[u.id] = { crownBalance: 0, totalCrownsEarned: 0, totalCrownsSpent: 0 }));

  const rows: Omit<CrownTransaction, "balanceAfter">[] = [];

  // ~3 earned per 1 spend
  for (let i = 0; i < 60; i++) {
    const user = users[Math.floor(rand() * users.length)];
    const day = Math.floor(rand() * 90);
    const label = EARN_LABELS[Math.floor(rand() * EARN_LABELS.length)];
    rows.push({
      id: `ct-e${i}`,
      userId: user.id, userName: user.name, type: "earned", source: "submission_approved",
      amount: [10, 15, 20, 25, 30, 40, 50][Math.floor(rand() * 7)] * (1 + Math.floor(rand() * 4)),
      referenceId: `seed-sub-${i}`, referenceLabel: label,
      createdAt: daysAgo(day, 8 + Math.floor(rand() * 10)),
    });
  }

  SPEND_SPECS.forEach((s, i) => {
    const product = initialProducts.find((p) => p.id === s.productId)!;
    const user = users.find((u) => u.id === s.userId)!;
    rows.push({
      id: `ct-s${i}`,
      userId: user.id, userName: user.name, type: "spent", source: "store_purchase",
      amount: product.crownCost, referenceId: product.id, referenceLabel: product.title,
      redemptionReference: s.ref,
      fulfilmentStatus: s.status,
      fulfilledAt: s.fulfilledDay !== undefined ? daysAgo(s.fulfilledDay, 12) : undefined,
      fulfilledBy: s.fulfilledBy,
      createdAt: daysAgo(s.day, s.hour),
    });
  });

  rows.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const transactions: CrownTransaction[] = [];
  let topUp = 0;
  for (const r of rows) {
    const acc = accounts[r.userId];
    if (r.type === "earned") {
      acc.crownBalance += r.amount;
      acc.totalCrownsEarned += r.amount;
    } else {
      if (acc.crownBalance < r.amount) {
        // keep balances coherent: credit an earlier approved submission
        const gap = r.amount - acc.crownBalance + 200;
        acc.crownBalance += gap;
        acc.totalCrownsEarned += gap;
        const boost: CrownTransaction = {
          id: `ct-b${topUp++}`,
          userId: r.userId, userName: r.userName, type: "earned", source: "submission_approved",
          amount: gap, balanceAfter: acc.crownBalance,
          referenceId: `seed-boost-${topUp}`,
          referenceLabel: EARN_LABELS[topUp % EARN_LABELS.length],
          createdAt: new Date(+new Date(r.createdAt) - 86400000).toISOString(),
        };
        transactions.push(boost);
      }
      acc.crownBalance -= r.amount;
      acc.totalCrownsSpent += r.amount;
    }
    transactions.push({ ...r, balanceAfter: acc.crownBalance });
  }

  return { transactions, accounts };
}

export const initialNotifications: AdminNotification[] = [
  {
    id: "n1", type: "redemption_pending", productId: "p5", productTitle: "Lunch On The Practice",
    userName: "Test",
    message: "Test redeemed Lunch On The Practice — awaiting fulfilment.",
    read: false, createdAt: daysAgo(1, 12),
  },
  {
    id: "n2", type: "redemption_pending", productId: "p6", productTitle: "Cinema Tickets (Pair)",
    userName: "Uzair Farhan",
    message: "Uzair Farhan redeemed Cinema Tickets (Pair) — awaiting fulfilment.",
    read: false, createdAt: daysAgo(3, 16),
  },
  {
    id: "n3", type: "product_out_of_stock", productId: "p10", productTitle: "Parking Space For A Week",
    message: "Parking Space For A Week is out of stock and has been deactivated.",
    read: false, createdAt: daysAgo(1, 9),
  },
];
