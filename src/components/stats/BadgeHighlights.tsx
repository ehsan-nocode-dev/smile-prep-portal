import { TierDot } from "@/components/TierDot";
import { BadgeRef } from "@/lib/stats";
import { Target, Trophy } from "lucide-react";

export function ClosestBadgeCard({ badge }: { badge: BadgeRef | null }) {
  return (
    <div className="bg-card rounded-xl card-shadow p-5 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Target className="h-4 w-4 text-primary" /> Closest badge
      </div>
      {badge ? (
        <>
          <div className="flex items-center gap-3 mt-3">
            <TierDot tier={badge.tier} size="lg" />
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight">{badge.tier}</div>
              <div className="text-xs text-muted-foreground truncate">{badge.taskName}</div>
            </div>
          </div>
          <div className="text-sm mt-4 pt-3 border-t border-border">
            <span className="font-bold text-primary">{badge.remaining}</span> more to unlock ·{" "}
            <span className="font-bold text-xp">+{badge.bonusXp} XP</span> bonus
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground mt-4">Every badge earned — nothing left to chase.</div>
      )}
    </div>
  );
}

export function HighestBadgeCard({ badge }: { badge: BadgeRef | null }) {
  return (
    <div className="bg-card rounded-xl card-shadow p-5 flex flex-col">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Trophy className="h-4 w-4 text-xp" /> Your highest badge
      </div>
      {badge ? (
        <>
          <div className="flex items-center gap-3 mt-3">
            <TierDot tier={badge.tier} size="lg" />
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight">{badge.tier}</div>
              <div className="text-xs text-muted-foreground truncate">{badge.taskName}</div>
            </div>
          </div>
          <div className="text-sm mt-4 pt-3 border-t border-border text-muted-foreground">
            Worth <span className="font-bold text-xp">+{badge.bonusXp} XP</span> bonus
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground mt-4">No badges yet — log your first approved task.</div>
      )}
    </div>
  );
}
