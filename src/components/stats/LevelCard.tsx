import { Progress } from "@/components/ui/progress";
import { getLevelInfo } from "@/lib/levels";
import { Star, Zap } from "lucide-react";

export function LevelCard({ totalXp }: { totalXp: number }) {
  const lvl = getLevelInfo(totalXp);
  const pct = lvl.isMax ? 100 : Math.round((lvl.currentLevelXp / lvl.nextLevelXp) * 100);

  return (
    <div className="bg-card rounded-xl card-shadow p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground font-medium">Overall level</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-9 w-9 rounded-lg tint-purple flex items-center justify-center">
              <Star className="h-5 w-5" />
            </span>
            <span className="text-3xl font-extrabold tracking-tight">Level {lvl.level}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground font-medium">Total XP</div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <Zap className="h-5 w-5 text-xp" />
            <span className="text-2xl font-bold text-xp tabular-nums">{lvl.totalXp}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>
            {lvl.isMax ? "Max level reached" : `${lvl.currentLevelXp} / ${lvl.nextLevelXp} XP`}
          </span>
          {!lvl.isMax && <span>Level {lvl.level + 1}</span>}
        </div>
        <Progress value={pct} className="h-2.5" />
        {!lvl.isMax && (
          <div className="text-sm text-muted-foreground mt-2">
            <span className="font-bold text-foreground">{lvl.xpToNext} XP</span> needed to advance
          </div>
        )}
      </div>
    </div>
  );
}
