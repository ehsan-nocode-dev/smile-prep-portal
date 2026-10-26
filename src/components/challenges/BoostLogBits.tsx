import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Challenge, boostMath, fmtMultiplier } from "@/lib/challenges";

/** Small "2x Boost" tag shown next to the task name on a log submitted during a Boost. */
export function BoostTag({ boost }: { boost: Challenge }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-crown/15 text-crown whitespace-nowrap align-middle cursor-default">
          {fmtMultiplier(boost.multiplier ?? 1)} Boost
        </span>
      </TooltipTrigger>
      <TooltipContent>{boost.name}</TooltipContent>
    </Tooltip>
  );
}

/** Crowns for a boosted log as simple maths: "4 × 2 = 8". */
export function BoostCrowns({ normal, boost, className }: { normal: number; boost: Challenge; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums whitespace-nowrap", className)}>
      <Crown className="h-4 w-4 text-crown" />
      {boostMath(normal, boost.multiplier ?? 1)}
    </span>
  );
}
