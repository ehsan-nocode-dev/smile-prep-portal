import { useEffect, useMemo, useState } from "react";
import { Check, Rocket } from "lucide-react";
import { Task, TIER_COLORS, Tier } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOTIVATIONAL = [
  "Every log counts. You're building something great.",
  "That's how champions show up — consistently.",
  "Submitted and noted. Keep the momentum going!",
  "One more step toward the top. Let's go.",
];

interface Props {
  open: boolean;
  task: Task | null;
  /** Approved completions count for this task BEFORE this submission. */
  approvedCount: number;
  onClose: () => void;
}

export function SubmissionSuccessModal({ open, task, approvedCount, onClose }: Props) {
  const [progress, setProgress] = useState(0);
  const subtitle = useMemo(
    () => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)],
    [open, task?.id]
  );

  const tierInfo = useMemo(() => {
    if (!task) return null;
    const sorted = [...task.badges].sort((a, b) => a.tracks - b.tracks);
    const current = [...sorted].reverse().find((b) => approvedCount >= b.tracks) || null;
    const next = sorted.find((b) => b.tracks > approvedCount) || null;
    return { current, next };
  }, [task, approvedCount]);

  useEffect(() => {
    if (!open) return;
    setProgress(0);
    if (!tierInfo?.next) return;
    const start = tierInfo.current?.tracks ?? 0;
    const end = tierInfo.next.tracks;
    const pct = Math.min(100, Math.max(0, ((approvedCount - start) / (end - start)) * 100));
    const t = setTimeout(() => setProgress(pct), 80);
    return () => clearTimeout(t);
  }, [open, tierInfo, approvedCount]);

  if (!open || !task) return null;

  const next = tierInfo?.next;
  const current = tierInfo?.current;
  const remaining = next ? next.tracks - approvedCount : 0;
  const currentTier: Tier = current?.tier ?? "Novice";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] bg-card text-foreground rounded-2xl shadow-2xl p-7 animate-pop-in"
      >
        {/* Checkmark */}
        <div className="flex justify-center -mt-1 mb-4">
          <div className="relative h-20 w-20 rounded-full bg-success flex items-center justify-center animate-check-pop shadow-lg shadow-success/40">
            <svg viewBox="0 0 52 52" className="h-12 w-12">
              <path
                d="M14 27 l8 8 l16 -18"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
                style={{
                  strokeDasharray: 48,
                  strokeDashoffset: 48,
                }}
              />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Task Submitted! 💪</h2>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        </div>

        {/* Pending pill */}
        <div className="flex justify-center mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            ⏳ Pending admin approval — XP will be awarded once approved.
          </span>
        </div>

        {/* Badge progress */}
        <div className="mt-6">
          {next ? (
            <>
              <div className="text-sm font-semibold text-center mb-2">
                {remaining} more {remaining === 1 ? "submission" : "submissions"} until your next badge 🏅
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-700 ease-out", TIER_COLORS[currentTier])}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span className="font-semibold">{currentTier}</span>
                <span className="font-semibold">{next.tier}</span>
              </div>
            </>
          ) : (
            <div className="text-center text-sm font-semibold py-2">
              You're at the top! 🌟 Legend status.
            </div>
          )}
        </div>

        {/* Close */}
        <Button onClick={onClose} className="w-full mt-6 h-11 rounded-xl text-base font-bold">
          <Rocket className="h-4 w-4 mr-1" />
          Got it! 🚀
        </Button>
      </div>
    </div>
  );
}
