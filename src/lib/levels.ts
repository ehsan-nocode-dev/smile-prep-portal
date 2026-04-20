import { Submission } from "./mock-data";

// Level thresholds: cumulative XP required to REACH that level.
// Level 1: 0–100, Level 2: 101–250, Level 3: 251–500, Level 4: 501–1000,
// Level 5: 1001–2000, Level 6: 2001–3500, Level 7: 3501–5500, Level 8: 5501–8000,
// Level 9: 8001–12000, Level 10: 12001+
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];

export interface LevelInfo {
  level: number;
  currentLevelXp: number; // XP into the current level
  nextLevelXp: number; // XP span of the current level (for progress bar denominator)
  xpToNext: number; // remaining XP to reach next level
  totalXp: number;
  isMax: boolean;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceiling = isMax ? floor : LEVEL_THRESHOLDS[level];
  const span = isMax ? 1 : ceiling - floor;
  const into = totalXp - floor;
  return {
    level,
    currentLevelXp: into,
    nextLevelXp: span,
    xpToNext: isMax ? 0 : ceiling - totalXp,
    totalXp,
    isMax,
  };
}

export function getUserTotalXp(submissions: Submission[], userId: string): number {
  return submissions
    .filter((s) => s.submittedById === userId && s.status === "Approved")
    .reduce((sum, s) => sum + s.xpEarned, 0);
}
