import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  AdminNotification,
  CrownAccount,
  CrownTransaction,
  StoreProduct,
  TransactionFilters,
  buildSeedTransactions,
  initialNotifications,
  initialProducts,
  generateRedemptionReference,
} from "@/lib/crowns";

const STORAGE_KEY = "molarup.crowns.v3";

export interface RedeemResult {
  ok: boolean;
  error?: "insufficient" | "out_of_stock" | "inactive" | "not_found";
  transaction?: CrownTransaction;
}

interface CrownsContextValue {
  products: StoreProduct[];
  transactions: CrownTransaction[];
  notifications: AdminNotification[];
  unreadNotifications: number;
  pendingFulfilments: CrownTransaction[];
  getAccount: (userId: string) => CrownAccount;
  getBalance: (userId: string) => number;
  getTransactions: (filters?: TransactionFilters) => CrownTransaction[];
  awardCrowns: (args: {
    userId: string; userName: string; amount: number; referenceId: string; referenceLabel: string;
  }) => CrownTransaction | null;
  redeemProduct: (productId: string, userId: string, userName: string) => RedeemResult;
  markFulfilled: (transactionId: string, fulfilledBy: string) => void;
  addProduct: (p: Omit<StoreProduct, "id" | "createdAt" | "updatedAt" | "autoDeactivated">) => void;
  updateProduct: (id: string, p: Partial<StoreProduct>) => void;
  deleteProduct: (id: string) => void;
  markNotificationsRead: () => void;
  devTopUp: (userId: string, userName: string, amount?: number) => void;
}

const CrownsContext = createContext<CrownsContextValue | null>(null);

const EMPTY_ACCOUNT: CrownAccount = { crownBalance: 0, totalCrownsEarned: 0, totalCrownsSpent: 0 };
const now = () => new Date().toISOString();

interface Persisted {
  products: StoreProduct[];
  transactions: CrownTransaction[];
  accounts: Record<string, CrownAccount>;
  notifications: AdminNotification[];
}

function loadState(): Persisted {
  const seed = buildSeedTransactions();
  const fallback: Persisted = {
    products: initialProducts,
    transactions: seed.transactions,
    accounts: seed.accounts,
    notifications: initialNotifications,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!parsed.products || !parsed.transactions || !parsed.accounts) return fallback;
    return { ...fallback, ...parsed } as Persisted;
  } catch {
    return fallback;
  }
}

export function CrownsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState<Persisted>(loadState);
  const [products, setProducts] = useState<StoreProduct[]>(initial.products);
  const [transactions, setTransactions] = useState<CrownTransaction[]>(initial.transactions);
  const [accounts, setAccounts] = useState<Record<string, CrownAccount>>(initial.accounts);
  const [notifications, setNotifications] = useState<AdminNotification[]>(initial.notifications);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ products, transactions, accounts, notifications })
      );
    } catch {
      /* storage unavailable — prototype continues in memory */
    }
  }, [products, transactions, accounts, notifications]);

  const getAccount = useCallback(
    (userId: string) => accounts[userId] ?? EMPTY_ACCOUNT,
    [accounts]
  );
  const getBalance = useCallback((userId: string) => getAccount(userId).crownBalance, [getAccount]);

  const getTransactions = useCallback(
    (f: TransactionFilters = {}) => {
      const search = f.search?.trim().toLowerCase();
      return transactions
        .filter((t) => (f.userId ? t.userId === f.userId : true))
        .filter((t) => (f.productId ? t.referenceId === f.productId : true))
        .filter((t) => (f.type && f.type !== "all" ? t.type === f.type : true))
        .filter((t) =>
          f.status && f.status !== "all"
            ? (t.fulfilmentStatus ?? (t.type === "spent" ? "not_required" : undefined)) === f.status
            : true
        )
        .filter((t) => (f.from ? new Date(t.createdAt) >= new Date(f.from) : true))
        .filter((t) => (f.to ? new Date(t.createdAt) <= new Date(`${f.to}T23:59:59`) : true))
        .filter((t) =>
          search
            ? t.userName.toLowerCase().includes(search) || t.referenceLabel.toLowerCase().includes(search)
            : true
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    [transactions]
  );

  const pendingFulfilments = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "spent" && t.fulfilmentStatus === "pending")
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [transactions]
  );

  const awardCrowns: CrownsContextValue["awardCrowns"] = useCallback(
    ({ userId, userName, amount, referenceId, referenceLabel }) => {
      if (amount <= 0) return null;
      let created: CrownTransaction | null = null;
      setAccounts((prev) => {
        const acc = prev[userId] ?? { ...EMPTY_ACCOUNT };
        const next: CrownAccount = {
          crownBalance: acc.crownBalance + amount,
          totalCrownsEarned: acc.totalCrownsEarned + amount,
          totalCrownsSpent: acc.totalCrownsSpent,
        };
        created = {
          id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId, userName, type: "earned", source: "submission_approved",
          amount, balanceAfter: next.crownBalance, referenceId, referenceLabel, createdAt: now(),
        };
        return { ...prev, [userId]: next };
      });
      setTransactions((prev) => (created ? [...prev, created] : prev));
      return created;
    },
    []
  );

  const redeemProduct: CrownsContextValue["redeemProduct"] = useCallback(
    (productId, userId, userName) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return { ok: false, error: "not_found" };
      if (product.status !== "active") return { ok: false, error: "inactive" };
      if (product.quantity <= 0) return { ok: false, error: "out_of_stock" };
      const acc = accounts[userId] ?? EMPTY_ACCOUNT;
      if (acc.crownBalance < product.crownCost) return { ok: false, error: "insufficient" };

      const balanceAfter = acc.crownBalance - product.crownCost;
      const redemptionReference = generateRedemptionReference();
      const tx: CrownTransaction = {
        id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId, userName, type: "spent", source: "store_purchase",
        amount: product.crownCost, balanceAfter,
        referenceId: product.id, referenceLabel: product.title,
        redemptionReference,
        fulfilmentStatus: product.requiresFulfilment ? "pending" : "not_required",
        createdAt: now(),
      };

      setAccounts((prev) => ({
        ...prev,
        [userId]: {
          crownBalance: balanceAfter,
          totalCrownsEarned: acc.totalCrownsEarned,
          totalCrownsSpent: acc.totalCrownsSpent + product.crownCost,
        },
      }));
      setTransactions((prev) => [...prev, tx]);

      const remaining = product.quantity - 1;
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                quantity: remaining,
                status: remaining === 0 ? "inactive" : p.status,
                autoDeactivated: remaining === 0 ? true : p.autoDeactivated,
                updatedAt: now(),
              }
            : p
        )
      );

      const newNotifications: AdminNotification[] = [];
      if (product.requiresFulfilment) {
        newNotifications.push({
          id: `n-${Date.now()}-f`,
          type: "redemption_pending",
          productId: product.id,
          productTitle: product.title,
          userName,
          message: `${userName} redeemed ${product.title} — awaiting fulfilment.`,
          read: false,
          createdAt: now(),
        });
      }
      if (remaining === 0) {
        newNotifications.push({
          id: `n-${Date.now()}-s`,
          type: "product_out_of_stock",
          productId: product.id,
          productTitle: product.title,
          message: `${product.title} is out of stock and has been deactivated.`,
          read: false,
          createdAt: now(),
        });
      }
      if (newNotifications.length) setNotifications((prev) => [...newNotifications, ...prev]);

      return { ok: true, transaction: tx };
    },
    [products, accounts]
  );

  const markFulfilled: CrownsContextValue["markFulfilled"] = useCallback((transactionId, fulfilledBy) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId && t.fulfilmentStatus === "pending"
          ? { ...t, fulfilmentStatus: "fulfilled", fulfilledAt: now(), fulfilledBy }
          : t
      )
    );
  }, []);

  const value = useMemo<CrownsContextValue>(
    () => ({
      products,
      transactions,
      notifications,
      unreadNotifications: notifications.filter((n) => !n.read).length,
      pendingFulfilments,
      getAccount,
      getBalance,
      getTransactions,
      awardCrowns,
      redeemProduct,
      markFulfilled,
      addProduct: (p) =>
        setProducts((prev) => [
          { ...p, id: `p-${Date.now()}`, autoDeactivated: false, createdAt: now(), updatedAt: now() },
          ...prev,
        ]),
      updateProduct: (id, patch) =>
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            const merged = { ...p, ...patch, updatedAt: now() };
            if ((patch.quantity ?? p.quantity) > 0 && p.autoDeactivated && patch.quantity !== undefined) {
              merged.autoDeactivated = false;
            }
            if (merged.quantity <= 0) {
              merged.status = "inactive";
              merged.autoDeactivated = true;
            }
            return merged;
          })
        ),
      deleteProduct: (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
      markNotificationsRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      devTopUp: (userId, userName, amount = 500) => {
        let balanceAfter = 0;
        setAccounts((prev) => {
          const acc = prev[userId] ?? { ...EMPTY_ACCOUNT };
          balanceAfter = acc.crownBalance + amount;
          return {
            ...prev,
            [userId]: {
              crownBalance: balanceAfter,
              totalCrownsEarned: acc.totalCrownsEarned + amount,
              totalCrownsSpent: acc.totalCrownsSpent,
            },
          };
        });
        setTransactions((prev) => [
          ...prev,
          {
            id: `ct-top-${Date.now()}`,
            userId, userName, type: "earned", source: "submission_approved",
            amount, balanceAfter,
            referenceId: "dev-top-up", referenceLabel: "Prototype top-up",
            createdAt: now(),
          },
        ]);
      },
    }),
    [products, transactions, notifications, pendingFulfilments, getAccount, getBalance, getTransactions, awardCrowns, redeemProduct, markFulfilled]
  );

  return <CrownsContext.Provider value={value}>{children}</CrownsContext.Provider>;
}

export function useCrowns() {
  const ctx = useContext(CrownsContext);
  if (!ctx) throw new Error("useCrowns must be used within CrownsProvider");
  return ctx;
}
