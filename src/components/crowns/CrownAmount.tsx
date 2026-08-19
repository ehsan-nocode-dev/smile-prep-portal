import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCrowns } from "@/lib/crowns";

export function CrownAmount({
  value,
  className,
  iconClassName,
  sign,
}: {
  value: number;
  className?: string;
  iconClassName?: string;
  sign?: "+" | "-";
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-bold tabular-nums", className)}>
      <Crown className={cn("h-4 w-4 text-crown", iconClassName)} />
      {sign}
      {formatCrowns(value)}
    </span>
  );
}
