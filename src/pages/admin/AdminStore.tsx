import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCrowns } from "@/contexts/CrownsContext";
import { ProductType, StoreProduct, formatCrowns } from "@/lib/crowns";
import { Crown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Draft {
  title: string;
  description: string;
  thumbnailUrl: string;
  crownCost: number;
  quantity: number;
  productType: ProductType;
  active: boolean;
}

const emptyDraft: Draft = {
  title: "", description: "", thumbnailUrl: "https://picsum.photos/seed/reward/640/360",
  crownCost: 100, quantity: 1, productType: "digital", active: true,
};

export default function AdminStore() {
  const { products, addProduct, updateProduct, deleteProduct } = useCrowns();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleting, setDeleting] = useState<StoreProduct | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .filter((p) => (q ? p.title.toLowerCase().includes(q) : true));
  }, [products, query, statusFilter]);

  const openCreate = () => { setDraft(emptyDraft); setCreating(true); };
  const openEdit = (p: StoreProduct) => {
    setDraft({
      title: p.title, description: p.description, thumbnailUrl: p.thumbnailUrl,
      crownCost: p.crownCost, quantity: p.quantity, productType: p.productType,
      active: p.status === "active",
    });
    setEditing(p);
  };

  const save = () => {
    if (!draft.title.trim()) return toast.error("Title is required");
    if (draft.crownCost <= 0) return toast.error("Crown cost must be greater than zero");
    if (draft.quantity < 0) return toast.error("Quantity cannot be negative");

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      thumbnailUrl: draft.thumbnailUrl.trim(),
      crownCost: draft.crownCost,
      quantity: draft.quantity,
      productType: draft.productType,
      status: (draft.active && draft.quantity > 0 ? "active" : "inactive") as StoreProduct["status"],
    };

    if (editing) {
      updateProduct(editing.id, payload);
      toast.success("Product updated");
      setEditing(null);
    } else {
      addProduct(payload);
      toast.success("Product created");
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Store Management"
        subtitle="Create and manage the rewards your team can redeem with Crowns."
        actions={<Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> New Product</Button>}
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors",
                statusFilter === s ? "bg-card card-shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Product</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Cost</th>
              <th className="text-left px-4 py-3 font-semibold">Stock</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnailUrl} alt={p.title} loading="lazy" className="h-10 w-14 rounded object-cover" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-72">{p.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{p.productType}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-bold tabular-nums">
                    <Crown className="h-3.5 w-3.5 text-crown" />{formatCrowns(p.crownCost)}
                  </span>
                </td>
                <td className={cn("px-4 py-3 font-semibold", p.quantity === 0 && "text-destructive")}>{p.quantity}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    p.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {p.status === "active" ? "Active" : p.autoDeactivated ? "Out of stock" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="h-8 w-8 rounded-md bg-warning/15 text-warning-foreground hover:bg-warning/30 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      className="h-8 w-8 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Thumbnail URL</Label>
              <Input value={draft.thumbnailUrl} onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })} />
              {draft.thumbnailUrl && (
                <img src={draft.thumbnailUrl} alt="Preview" className="h-28 w-full object-cover rounded-lg mt-2" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Crown cost</Label>
                <Input type="number" min={1} value={draft.crownCost} onChange={(e) => setDraft({ ...draft, crownCost: +e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity in stock</Label>
                <Input type="number" min={0} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: +e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Product type</Label>
              <Select value={draft.productType} onValueChange={(v) => setDraft({ ...draft, productType: v as ProductType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium text-sm">Active in store</div>
                <div className="text-xs text-muted-foreground">Out-of-stock products are deactivated automatically.</div>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.title}?</DialogTitle>
            <DialogDescription>
              Past redemptions stay in the Crown ledger. This only removes the product from the store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleting) deleteProduct(deleting.id); setDeleting(null); toast.success("Product deleted"); }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
