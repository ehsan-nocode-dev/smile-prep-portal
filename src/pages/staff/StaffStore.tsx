import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useCrowns } from "@/contexts/CrownsContext";
import { StoreProduct, formatCrowns } from "@/lib/crowns";
import { Check, Crown, PackageX, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StaffStore() {
  const { members, currentUserId } = useStore();
  const { products, getBalance, redeemProduct } = useCrowns();
  const me = members.find((m) => m.id === currentUserId);
  const balance = getBalance(currentUserId);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [confirming, setConfirming] = useState<StoreProduct | null>(null);
  const [success, setSuccess] = useState<{ product: StoreProduct; reference: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const list = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return products
      .filter((p) => p.status === "active" && p.quantity > 0)
      .filter((p) => (q ? p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [products, debounced]);

  const dialogProduct = success?.product ?? confirming;

  const handleRedeem = () => {
    if (!confirming || !me) return;
    const res = redeemProduct(confirming.id, me.id, me.name);
    if (res.ok && res.transaction) {
      setSuccess({ product: confirming, reference: res.transaction.redemptionReference ?? "" });
      setConfirming(null);
      return;
    }
    if (res.error === "insufficient") toast.error("Not enough Crowns", { description: "Keep logging tasks to earn more." });
    else if (res.error === "out_of_stock") toast.error("Out of stock", { description: "This reward has just sold out." });
    else toast.error("This reward is no longer available.");
    setConfirming(null);
  };

  const closeDialog = () => { setConfirming(null); setSuccess(null); };

  return (
    <div>
      <PageHeader title="Crown Store" subtitle="Spend the Crowns you've earned." />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search rewards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="bg-card rounded-xl card-shadow py-16 text-center">
          <PackageX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-semibold">No rewards available right now</div>
          <p className="text-sm text-muted-foreground mt-1">Check back soon — new rewards are added regularly.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {list.map((p) => {
            const affordable = balance >= p.crownCost;
            const low = p.quantity <= 3;
            return (
              <div key={p.id} className="bg-card rounded-xl card-shadow overflow-hidden flex flex-col">
                <div className="relative">
                  <img src={p.thumbnailUrl} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
                  {low && (
                    <span className="absolute top-3 left-3 rounded-full bg-warning text-warning-foreground text-[11px] font-bold px-2.5 py-1">
                      Only {p.quantity} left
                    </span>
                  )}
                  <span className="absolute top-3 right-3 rounded-full bg-card/95 text-[11px] font-semibold px-2.5 py-1">
                    {typeLabel(p)}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                      <Crown className="h-4 w-4 text-crown" />
                      {formatCrowns(p.crownCost)}
                    </span>
                    {affordable ? (
                      <Button onClick={() => setConfirming(p)}>Redeem</Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="opacity-50 cursor-not-allowed text-muted-foreground"
                      >
                        Not enough Crowns
                      </Button>
                    )}
                  </div>
                  {!affordable && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatCrowns(p.crownCost - balance)} more Crowns needed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!dialogProduct} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {dialogProduct && !success && (
            <>
              <DialogHeader>
                <DialogTitle>Redeem reward</DialogTitle>
              </DialogHeader>
              <img
                src={dialogProduct.thumbnailUrl}
                alt={dialogProduct.title}
                className="aspect-video w-full rounded-lg object-cover"
              />
              <div className="font-bold">{dialogProduct.title}</div>
              <div className="text-sm text-muted-foreground tabular-nums">
                Cost {formatCrowns(dialogProduct.crownCost)} · Balance after{" "}
                {formatCrowns(balance - dialogProduct.crownCost)}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleRedeem}>Confirm redemption</Button>
              </DialogFooter>
            </>
          )}

          {success && (
            <div className="text-center py-2">
              <DialogHeader className="sr-only">
                <DialogTitle>Redeemed</DialogTitle>
              </DialogHeader>
              <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center animate-pop-in">
                <Check className="h-7 w-7" strokeWidth={3} />
              </div>
              <h2 className="mt-4 text-xl font-extrabold">Redeemed</h2>
              <p className="mt-1 font-semibold">{success.product.title}</p>
              <div className="mt-3 inline-block rounded-full bg-muted px-3 py-1 font-mono text-sm font-semibold">
                {success.reference}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {success.product.productType === "physical"
                  ? "Show this reference to your practice manager to collect."
                  : "This has been added to your profile."}
              </p>
              <Button className="mt-6 w-full" onClick={closeDialog}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const typeLabel = (p: StoreProduct) => (p.productType === "physical" ? "Physical" : "Digital");
