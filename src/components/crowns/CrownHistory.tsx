import { useMemo, useState } from "react";
import { useCrowns } from "@/contexts/CrownsContext";
import { CrownTransactionType, SOURCE_LABELS, formatCrowns, formatTxDate } from "@/lib/crowns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE = 25;

export function CrownHistory({ userId }: { userId: string }) {
  const { getTransactions, getAccount } = useCrowns();
  const [type, setType] = useState<CrownTransactionType | "all">("all");
  const [page, setPage] = useState(0);
  const account = getAccount(userId);

  const rows = useMemo(() => getTransactions({ userId, type }), [getTransactions, userId, type]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <section>
      {/* Summary */}
      <div className="flex flex-wrap items-end gap-x-12 gap-y-4 mb-6">
        {[
          { label: "Balance", value: account.crownBalance },
          { label: "Earned", value: account.totalCrownsEarned },
          { label: "Spent", value: account.totalCrownsSpent },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-xl font-bold tabular-nums">{formatCrowns(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit mb-4">
        {(["all", "earned", "spent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setPage(0); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors",
              type === t ? "bg-card card-shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="py-14 text-center text-sm text-muted-foreground">
          No Crown activity yet. Log a task to start earning.
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Activity</th>
                <th className="text-left px-4 py-2 font-semibold">Date</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
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
            </tbody>
          </table>

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
        </>
      )}
    </section>
  );
}
