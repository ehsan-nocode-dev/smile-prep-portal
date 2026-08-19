import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useCrowns } from "@/contexts/CrownsContext";
import { CrownTransactionType, SOURCE_LABELS, formatCrowns, formatTxDate } from "@/lib/crowns";
import { cn } from "@/lib/utils";

const PAGE = 25;

export default function AdminCrowns() {
  const { members } = useStore();
  const { products, getTransactions, transactions } = useCrowns();
  const [userId, setUserId] = useState("all");
  const [productId, setProductId] = useState("all");
  const [type, setType] = useState<CrownTransactionType | "all">("all");
  const [page, setPage] = useState(0);

  const productDisabled = type === "earned";

  const rows = useMemo(
    () =>
      getTransactions({
        userId: userId === "all" ? undefined : userId,
        productId: productId === "all" || productDisabled ? undefined : productId,
        type,
      }),
    [getTransactions, userId, productId, type, productDisabled]
  );

  const filtered = userId !== "all" || productId !== "all" || type !== "all";
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE);

  const reset = () => { setUserId("all"); setProductId("all"); setType("all"); setPage(0); };

  return (
    <div>
      <PageHeader title="Crown History" subtitle="Every Crown earned and spent across the practice." />

      <div className="grid gap-4 sm:grid-cols-3 pb-4 border-b border-border/60">
        <div className="space-y-1.5">
          <Label className="text-xs">User</Label>
          <Select value={userId} onValueChange={(v) => { setUserId(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Product</Label>
          <Select
            value={productId}
            disabled={productDisabled}
            onValueChange={(v) => { setProductId(v); setPage(0); }}
          >
            <SelectTrigger className={cn(productDisabled && "opacity-50 cursor-not-allowed")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => { setType(v as CrownTransactionType | "all"); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="spent">Spent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 py-3 text-sm text-muted-foreground">
        <span>
          {filtered
            ? `${formatCrowns(rows.length)} of ${formatCrowns(transactions.length)} transactions`
            : `${formatCrowns(rows.length)} transactions`}
        </span>
        {filtered && (
          <button onClick={reset} className="font-semibold text-foreground hover:text-primary transition-colors">
            Reset filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">User</th>
              <th className="text-left px-4 py-2 font-semibold">Activity</th>
              <th className="text-left px-4 py-2 font-semibold">Date</th>
              <th className="text-right px-4 py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 h-16 align-middle">
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <span className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {t.userName.charAt(0)}
                    </span>
                    <span className="font-medium">{t.userName}</span>
                  </div>
                </td>
                <td className="px-4 h-16 align-middle">
                  <div className="font-medium">{t.referenceLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {SOURCE_LABELS[t.source]}
                    {t.redemptionReference && (
                      <> · <span className="font-mono">{t.redemptionReference}</span></>
                    )}
                  </div>
                </td>
                <td className="px-4 h-16 align-middle text-muted-foreground whitespace-nowrap">
                  {formatTxDate(t.createdAt)}
                </td>
                <td
                  className={cn(
                    "px-4 h-16 align-middle text-right font-semibold tabular-nums",
                    t.type === "earned" ? "text-success" : "text-destructive"
                  )}
                >
                  {t.type === "earned" ? "+" : "−"}{formatCrowns(t.amount)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 pt-4 text-sm">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </Button>
          <span className="text-muted-foreground">Page {current + 1} of {pages}</span>
          <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
