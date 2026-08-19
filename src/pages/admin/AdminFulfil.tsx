import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCrowns } from "@/contexts/CrownsContext";
import { useStore } from "@/lib/store";
import { CrownTransaction, daysBetween, formatCrowns, formatTxDate } from "@/lib/crowns";
import { CheckCircle2, Crown, PackageCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminFulfil() {
  const { pendingFulfilments, products, markFulfilled } = useCrowns();
  const { members, currentUserId } = useStore();
  const admin = members.find((m) => m.id === currentUserId);
  const [confirming, setConfirming] = useState<CrownTransaction | null>(null);

  const confirm = () => {
    if (!confirming) return;
    markFulfilled(confirming.id, admin?.name ?? "Admin");
    setConfirming(null);
    toast.success("Marked fulfilled.");
  };

  return (
    <div>
      <PageHeader title="To Fulfil" subtitle="Redemptions waiting to be handed over." />

      {pendingFulfilments.length === 0 ? (
        <div className="py-20 text-center">
          <PackageCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-semibold">Nothing to fulfil</div>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pendingFulfilments.map((t) => {
            const product = products.find((p) => p.id === t.referenceId);
            const waiting = daysBetween(t.createdAt);
            return (
              <div key={t.id} className="bg-card rounded-xl card-shadow p-5 flex gap-4">
                {product && (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    loading="lazy"
                    className="h-20 w-28 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{t.referenceLabel}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    for <span className="font-medium text-foreground">{t.userName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    <span className="font-mono">{t.redemptionReference}</span> · {formatTxDate(t.createdAt)}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold tabular-nums">
                      <Crown className="h-4 w-4 text-crown" />
                      {formatCrowns(t.amount)}
                    </span>
                    <Button size="sm" onClick={() => setConfirming(t)}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Mark fulfilled
                    </Button>
                  </div>
                  {waiting > 7 && (
                    <div className="text-xs text-warning font-medium mt-2">
                      Waiting {waiting} days
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as fulfilled?</DialogTitle>
            <DialogDescription>
              {confirming?.referenceLabel} for {confirming?.userName}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button onClick={confirm}>Mark fulfilled</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
