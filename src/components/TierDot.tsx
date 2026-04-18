import { cn } from "@/lib/utils";
import { TIER_COLORS, Tier } from "@/lib/mock-data";

export function TierDot({ tier, size = "sm", className }: { tier: Tier; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-3 w-3", md: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <span
      title={tier}
      className={cn("inline-block rounded-full ring-2 ring-white", TIER_COLORS[tier], sizes[size], className)}
    />
  );
}

export function TierGroup({ tiers, size = "sm" }: { tiers: Tier[]; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex -space-x-1">
      {tiers.map((t) => <TierDot key={t} tier={t} size={size} />)}
    </div>
  );
}
