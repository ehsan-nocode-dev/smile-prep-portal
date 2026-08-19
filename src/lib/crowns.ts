import { initialMembers } from "./mock-data";

/* ---------------- Types ---------------- */

export type CrownTransactionType = "earned" | "spent";

export type CrownTransactionSource =
  | "submission_approved"
  | "store_purchase"
  | "admin_bonus" // reserved
  | "level_up"; // reserved

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
  status: ProductStatus;
  autoDeactivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  type: "product_out_of_stock";
  productId: string;
  productTitle: string;
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

/* ---------------- Formatting helpers ---------------- */

export const formatCrowns = (n: number) => n.toLocaleString("en-US");

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${Math.round(mo / 12)} year(s) ago`;
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
    thumbnailUrl: img("costa"), crownCost: 250, quantity: 8, productType: "physical",
    status: "active", autoDeactivated: false, createdAt: daysAgo(80), updatedAt: daysAgo(6),
  },
  {
    id: "p2", title: "Extra 30 Minute Break", description: "Claim an additional half hour break on a day of your choosing.",
    thumbnailUrl: img("break"), crownCost: 150, quantity: 20, productType: "digital",
    status: "active", autoDeactivated: false, createdAt: daysAgo(80), updatedAt: daysAgo(12),
  },
  {
    id: "p3", title: "Early Finish Friday", description: "Leave one hour early on a Friday of your choice, subject to cover.",
    thumbnailUrl: img("friday"), crownCost: 600, quantity: 3, productType: "digital",
    status: "active", autoDeactivated: false, createdAt: daysAgo(75), updatedAt: daysAgo(4),
  },
  {
    id: "p4", title: "Choice of Surgery Playlist", description: "Control the music in the surgery for a full working day.",
    thumbnailUrl: img("playlist"), crownCost: 50, quantity: 30, productType: "digital",
    status: "active", autoDeactivated: false, createdAt: daysAgo(70), updatedAt: daysAgo(20),
  },
  {
    id: "p5", title: "Lunch On The Practice", description: "Lunch of your choice delivered to the practice, up to £15.",
    thumbnailUrl: img("lunch"), crownCost: 400, quantity: 2, productType: "physical",
    status: "active", autoDeactivated: false, createdAt: daysAgo(66), updatedAt: daysAgo(3),
  },
  {
    id: "p6", title: "Cinema Tickets (Pair)", description: "Two standard cinema tickets, valid at all major chains.",
    thumbnailUrl: img("cinema"), crownCost: 750, quantity: 5, productType: "physical",
    status: "active", autoDeactivated: false, createdAt: daysAgo(60), updatedAt: daysAgo(9),
  },
  {
    id: "p7", title: "MolarUp Branded Hoodie", description: "Premium heavyweight hoodie with embroidered MolarUp logo.",
    thumbnailUrl: img("hoodie"), crownCost: 1200, quantity: 6, productType: "physical",
    status: "active", autoDeactivated: false, createdAt: daysAgo(58), updatedAt: daysAgo(14),
  },
  {
    id: "p8", title: "Spa Day Voucher", description: "A full day pass at a local spa including treatment of choice.",
    thumbnailUrl: img("spa"), crownCost: 1500, quantity: 1, productType: "physical",
    status: "active", autoDeactivated: false, createdAt: daysAgo(55), updatedAt: daysAgo(2),
  },
  {
    id: "p9", title: "Exclusive Digital Badge", description: "A rare profile badge that shows off your Crown spending power.",
    thumbnailUrl: img("badge"), crownCost: 300, quantity: 50, productType: "digital",
    status: "active", autoDeactivated: false, createdAt: daysAgo(50), updatedAt: daysAgo(18),
  },
  {
    id: "p10", title: "Parking Space For A Week", description: "The best parking space at the practice reserved for you, all week.",
    thumbnailUrl: img("parking"), crownCost: 900, quantity: 0, productType: "digital",
    status: "inactive", autoDeactivated: true, createdAt: daysAgo(48), updatedAt: daysAgo(1),
  },
  {
    id: "p11", title: "Charity Donation In Your Name", description: "£20 donated to a charity of your choosing on behalf of the practice.",
    thumbnailUrl: img("charity"), crownCost: 500, quantity: 12, productType: "digital",
    status: "inactive", autoDeactivated: false, createdAt: daysAgo(40), updatedAt: daysAgo(5),
  },
  {
    id: "p12", title: "Amazon Gift Card £25", description: "A £25 Amazon gift card code delivered by email.",
    thumbnailUrl: img("amazon"), crownCost: 1000, quantity: 4, productType: "physical",
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

export function buildSeedTransactions(): { transactions: CrownTransaction[]; accounts: Record<string, CrownAccount> } {
  const rand = mulberry(42);
  const users = initialMembers;
  const accounts: Record<string, CrownAccount> = {};
  users.forEach((u) => (accounts[u.id] = { crownBalance: 0, totalCrownsEarned: 0, totalCrownsSpent: 0 }));

  const rows: Omit<CrownTransaction, "balanceAfter">[] = [];

  for (let i = 0; i < 120; i++) {
    const user = users[Math.floor(rand() * users.length)];
    const day = Math.floor(rand() * 90);
    const isSpend = rand() < 0.25;
    const createdAt = daysAgo(day, 8 + Math.floor(rand() * 10));

    if (isSpend) {
      const product = initialProducts[Math.floor(rand() * initialProducts.length)];
      rows.push({
        id: `ct${i}`, userId: user.id, userName: user.name, type: "spent", source: "store_purchase",
        amount: product.crownCost, referenceId: product.id, referenceLabel: product.title, createdAt,
      });
    } else {
      const label = EARN_LABELS[Math.floor(rand() * EARN_LABELS.length)];
      rows.push({
        id: `ct${i}`, userId: user.id, userName: user.name, type: "earned", source: "submission_approved",
        amount: [10, 15, 20, 25, 30, 40, 50][Math.floor(rand() * 7)] * (1 + Math.floor(rand() * 4)),
        referenceId: `seed-sub-${i}`, referenceLabel: label, createdAt,
      });
    }
  }

  rows.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const transactions: CrownTransaction[] = [];
  for (const r of rows) {
    const acc = accounts[r.userId];
    if (r.type === "earned") {
      acc.crownBalance += r.amount;
      acc.totalCrownsEarned += r.amount;
    } else if (acc.crownBalance >= r.amount + 400) {
      // only spend when the user comfortably affords it, so balances stay realistic
      acc.crownBalance -= r.amount;
      acc.totalCrownsSpent += r.amount;
    } else {
      continue;
    }
    transactions.push({ ...r, balanceAfter: acc.crownBalance });
  }

  return { transactions, accounts };
}

export const initialNotifications: AdminNotification[] = [
  {
    id: "n1", type: "product_out_of_stock", productId: "p10", productTitle: "Parking Space For A Week",
    message: "Parking Space For A Week is out of stock and has been deactivated.", read: false, createdAt: daysAgo(1, 9),
  },
  {
    id: "n2", type: "product_out_of_stock", productId: "p8", productTitle: "Spa Day Voucher",
    message: "Spa Day Voucher is running critically low — only 1 remaining.", read: false, createdAt: daysAgo(2, 15),
  },
  {
    id: "n3", type: "product_out_of_stock", productId: "p5", productTitle: "Lunch On The Practice",
    message: "Lunch On The Practice is running critically low — only 2 remaining.", read: false, createdAt: daysAgo(3, 11),
  },
];
