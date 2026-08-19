import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useCrowns } from "@/contexts/CrownsContext";
import { StoreProduct, formatCrowns } from "@/lib/crowns";
import { Crown, PackageX, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "cost-asc" | "cost-desc";

export default function StaffStore() {
  const { members, currentUserId } = useStore();
  const { products, getBalance, redeemProduct } = useCrowns();
  const me = members.find((m) => m.id === currentUserId);
  const balance = getBalance(currentUserId);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [confirming, setConfirming] = useState<StoreProduct | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products
      .filter((p) => p.status === "active" && p.quantity > 0)
      .filter((p) => (q ? p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) : true));
    if (sort === "cost-asc") return [...filtered].sort((a, b) => a.crownCost - b.crownCost);
    if (sort === "cost-desc") return [...filtered].sort((a, b) => b.crownCost - a.crownCost);
    return [...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [products, query, sort]);

  const handleRedeem = () => {
    if (!confirming || !me) return;
    const res = redeemProduct(confirming.id, me.id, me.name);
    if (res.ok) {
      toast.success(`Redeemed ${confirming.title}!`, {
        description: `${formatCrowns(confirming.crownCost)} Crowns spent. Your reward is on its way.`,
      });
    } else if (res.error === "insufficient") {
      toast.error("Not enough Crowns", { description: "Keep logging tasks to earn more." });
    } else if (res.error === "out_of_stock") {
      toast.error("Out of stock", { description: "This reward has just sold out." });
    } else {
      toast.error("This reward is no longer available.");
    }
    setConfirming(null);
  };

  return (
    <div>
      <PageHeader
        title="Crown Store"
        subtitle={`Spend the Crowns you've earned — you have ${formatCrowns(balance)} available.`}
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search rewards…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([["newest", "Newest"], ["cost-asc", "Cost ↑"], ["cost-desc", "Cost ↓"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                sort === k ? "bg-card card-shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
                  <span className="absolute top-3 right-3 rounded-full bg-card/95 text-[11px] font-semibold px-2.5 py-1 capitalize">
                    {p.productType}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                      <Crown className="h-4 w-4 text-crown" />
                      {formatCrowns(p.crownCost)}
                    </span>
                    <Button disabled={!affordable} onClick={() => setConfirming(p)}>
                      {affordable ? "Redeem" : "Not enough Crowns"}
                    </Button>
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

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {confirming?.title}?</DialogTitle>
            <DialogDescription>This will deduct Crowns from your balance immediately.</DialogDescription>
          </DialogHeader>
          {confirming && (
            <div className="rounded-lg border divide-y text-sm">
              <Row label="Cost" value={`${formatCrowns(confirming.crownCost)} Crowns`} />
              <Row label="Your balance" value={`${formatCrowns(balance)} Crowns`} />
              <Row label="Balance after" value={`${formatCrowns(balance - confirming.crownCost)} Crowns`} bold />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button onClick={handleRedeem}>Confirm redemption</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
