import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { useCrowns } from "@/contexts/CrownsContext";
import {
  CrownTransactionType, SOURCE_LABELS, exactDate, formatCrowns, relativeTime,
} from "@/lib/crowns";
import { Coins, Crown, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE = 20;

export default function AdminCrowns() {
  const { members } = useStore();
  const { products, getTransactions } = useCrowns();
  const [userId, setUserId] = useState("all");
  const [productId, setProductId] = useState("all");
  const [type, setType] = useState<CrownTransactionType | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const rows = useMemo(
    () =>
      getTransactions({
        userId: userId === "all" ? undefined : userId,
        productId: productId === "all" ? undefined : productId,
        type,
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
      }),
    [getTransactions, userId, productId, type, from, to, search]
  );

  const earned = rows.filter((r) => r.type === "earned").reduce((n, r) => n + r.amount, 0);
  const spent = rows.filter((r) => r.type === "spent").reduce((n, r) => n + r.amount, 0);

  const reset = () => {
    setUserId("all"); setProductId("all"); setType("all");
    setFrom(""); setTo(""); setSearch(""); setVisible(PAGE);
  };

  return (
    <div>
      <PageHeader title="Crown Ledger" subtitle="Every Crown earned and spent across the practice." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Transactions" value={rows.length} tint="blue" icon={<Coins className="h-6 w-6" />} />
        <StatCard label="Crowns Earned" value={formatCrowns(earned)} tint="green" icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard label="Crowns Spent" value={formatCrowns(spent)} tint="yellow" icon={<TrendingDown className="h-6 w-6" />} />
        <StatCard label="Net Crowns" value={formatCrowns(earned - spent)} tint="purple" icon={<Crown className="h-6 w-6" />} />
      </div>

      <div className="bg-card rounded-xl card-shadow p-5 mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-xs">User</Label>
          <Select value={userId} onValueChange={(v) => { setUserId(v); setVisible(PAGE); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Product</Label>
          <Select value={productId} onValueChange={(v) => { setProductId(v); setVisible(PAGE); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => { setType(v as CrownTransactionType | "all"); setVisible(PAGE); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="spent">Spent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Search</Label>
          <Input placeholder="User or item…" value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PAGE); }} />
        </div>
        <div className="md:col-span-3 xl:col-span-6">
          <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-bold">User</th>
              <th className="text-left px-4 py-3 font-bold">Type</th>
              <th className="text-left px-4 py-3 font-bold">Source</th>
              <th className="text-left px-4 py-3 font-bold">Reference</th>
              <th className="text-left px-4 py-3 font-bold">Date</th>
              <th className="text-right px-4 py-3 font-bold">Amount</th>
              <th className="text-right px-4 py-3 font-bold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, visible).map((t) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{t.userName}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    t.type === "earned" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{SOURCE_LABELS[t.source]}</td>
                <td className="px-4 py-3">{t.referenceLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild><span>{relativeTime(t.createdAt)}</span></TooltipTrigger>
                    <TooltipContent>{exactDate(t.createdAt)}</TooltipContent>
                  </Tooltip>
                </td>
                <td className={cn("px-4 py-3 text-right font-bold tabular-nums", t.type === "earned" ? "text-success" : "text-destructive")}>
                  {t.type === "earned" ? "+" : "−"}{formatCrowns(t.amount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCrowns(t.balanceAfter)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No transactions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {visible < rows.length && (
        <div className="pt-5 text-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>Load more</Button>
        </div>
      )}
    </div>
  );
}
