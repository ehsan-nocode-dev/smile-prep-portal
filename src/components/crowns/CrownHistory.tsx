import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Crown } from "lucide-react";
import { useCrowns } from "@/contexts/CrownsContext";
import { CrownTransactionType, SOURCE_LABELS, exactDate, formatCrowns, relativeTime } from "@/lib/crowns";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PAGE = 15;

export function CrownHistory({ userId }: { userId: string }) {
  const { getTransactions, getAccount } = useCrowns();
  const [type, setType] = useState<CrownTransactionType | "all">("all");
  const [visible, setVisible] = useState(PAGE);
  const account = getAccount(userId);

  const rows = useMemo(() => getTransactions({ userId, type }), [getTransactions, userId, type]);
  const shown = rows.slice(0, visible);

  return (
    <section className="bg-card rounded-xl card-shadow p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2 className="text-lg font-bold">Crown History</h2>
          <p className="text-sm text-muted-foreground">Every Crown earned and spent.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["all", "earned", "spent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setVisible(PAGE); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors",
                type === t ? "bg-card card-shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Balance", value: account.crownBalance },
          { label: "Total earned", value: account.totalCrownsEarned },
          { label: "Total spent", value: account.totalCrownsSpent },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xl font-bold tabular-nums">
              <Crown className="h-4 w-4 text-crown" />
              {formatCrowns(s.value)}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No Crown activity yet — approved submissions will start earning Crowns.
        </div>
      ) : (
        <>
          <div className="divide-y">
            {shown.map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    t.type === "earned" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}
                >
                  {t.type === "earned" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{t.referenceLabel}</div>
                  <div className="text-xs text-muted-foreground">{SOURCE_LABELS[t.source]}</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(t.createdAt)}</span>
                  </TooltipTrigger>
                  <TooltipContent>{exactDate(t.createdAt)}</TooltipContent>
                </Tooltip>
                <div className="text-right w-32 shrink-0">
                  <div className={cn("font-bold tabular-nums", t.type === "earned" ? "text-success" : "text-destructive")}>
                    {t.type === "earned" ? "+" : "−"}{formatCrowns(t.amount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    Balance {formatCrowns(t.balanceAfter)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visible < rows.length && (
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>Load more</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
