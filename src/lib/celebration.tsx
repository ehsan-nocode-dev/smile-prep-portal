import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { CheckCircle2, Sparkles, Award, AlertCircle, X, Zap } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import { TIER_COLORS, Tier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type CelebrationEvent =
  | { type: "submitted"; taskName: string; xp: number }
  | { type: "approved"; taskName: string; xp: number }
  | { type: "rejected"; taskName: string }
  | { type: "badge"; tier: Tier; taskName: string; bonusXp: number };

interface CelebrationContextValue {
  celebrate: (event: CelebrationEvent) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be used within CelebrationProvider");
  return ctx;
}

interface QueuedEvent extends Object {
  id: number;
  event: CelebrationEvent;
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedEvent[]>([]);
  const idRef = useRef(0);

  const celebrate = useCallback((event: CelebrationEvent) => {
    idRef.current += 1;
    const id = idRef.current;
    setQueue((q) => [...q, { id, event }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setQueue((q) => q.filter((e) => e.id !== id));
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      <CelebrationLayer queue={queue} onDismiss={dismiss} />
    </CelebrationContext.Provider>
  );
}

/* ---------------- Rendering layer ---------------- */

function CelebrationLayer({ queue, onDismiss }: { queue: QueuedEvent[]; onDismiss: (id: number) => void }) {
  // Badge events use the centered modal; others stack as toasts top-right.
  const badgeEvent = queue.find((e) => e.event.type === "badge");
  const toasts = queue.filter((e) => e.event.type !== "badge");

  return (
    <>
      {/* Toast stack */}
      <div className="fixed top-5 right-5 z-[80] flex flex-col gap-3 w-[min(360px,calc(100vw-2.5rem))] pointer-events-none">
        {toasts.map((q) => (
          <ToastCard key={q.id} event={q.event} onClose={() => onDismiss(q.id)} />
        ))}
      </div>

      {/* Badge modal (only one at a time) */}
      {badgeEvent && badgeEvent.event.type === "badge" && (
        <BadgeModal
          tier={badgeEvent.event.tier}
          taskName={badgeEvent.event.taskName}
          bonusXp={badgeEvent.event.bonusXp}
          onClose={() => onDismiss(badgeEvent.id)}
        />
      )}
    </>
  );
}

/* ---------------- Toast variants ---------------- */

function ToastCard({ event, onClose }: { event: CelebrationEvent; onClose: () => void }) {
  // Auto-dismiss after a delay (longer for approval to enjoy the moment)
  useEffect(() => {
    const ms = event.type === "approved" ? 4500 : event.type === "rejected" ? 4500 : 3000;
    const t = setTimeout(onClose, ms);
    return () => clearTimeout(t);
  }, [event.type, onClose]);

  if (event.type === "submitted") {
    return (
      <Shell onClose={onClose} accent="primary">
        <div className="flex items-start gap-3">
          <IconBadge tone="primary"><Sparkles className="h-5 w-5" /></IconBadge>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground">Task Submitted</div>
            <div className="text-xs text-muted-foreground mt-0.5">Your log is now pending review.</div>
            <div className="mt-2 text-xs font-bold text-xp inline-flex items-center gap-1 bg-xp/10 px-2 py-1 rounded">
              <Zap className="h-3.5 w-3.5" /> +{event.xp} XP pending
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (event.type === "approved") {
    return (
      <Shell onClose={onClose} accent="success" glow confetti>
        <div className="flex items-start gap-3">
          <IconBadge tone="success" bounce><CheckCircle2 className="h-5 w-5" /></IconBadge>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground">Submission Approved</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Great work on <span className="font-medium text-foreground">{event.taskName}</span>. Your progress has been updated.
            </div>
            <div className="mt-2 text-sm font-bold text-xp inline-flex items-center gap-1 bg-xp/10 px-2 py-1 rounded">
              <Zap className="h-3.5 w-3.5" /> +{event.xp} XP earned
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // rejected
  return (
    <Shell onClose={onClose} accent="warning">
      <div className="flex items-start gap-3">
        <IconBadge tone="warning"><AlertCircle className="h-5 w-5" /></IconBadge>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground">Submission Needs Review</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Your <span className="font-medium text-foreground">{event.type === "rejected" ? event.taskName : ""}</span> entry wasn't approved this time. Please review and try again.
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  onClose,
  accent,
  glow,
  confetti,
}: {
  children: ReactNode;
  onClose: () => void;
  accent: "primary" | "success" | "warning";
  glow?: boolean;
  confetti?: boolean;
}) {
  const accentBar = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  }[accent];

  return (
    <div
      className={cn(
        "pointer-events-auto relative bg-card rounded-xl card-shadow border border-border overflow-hidden animate-pop-in",
        glow && "ring-1 ring-success/30 shadow-[0_0_24px_-4px_hsl(var(--success)/0.45)]"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", accentBar)} />
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          <Confetti count={18} variant="burst" />
        </div>
      )}
      <div className="relative pl-4 pr-3 py-3">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function IconBadge({
  children,
  tone,
  bounce,
}: {
  children: ReactNode;
  tone: "primary" | "success" | "warning";
  bounce?: boolean;
}) {
  const cls = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  }[tone];
  return (
    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", cls, bounce && "animate-bounce-soft")}>
      {children}
    </div>
  );
}

/* ---------------- Badge unlock modal ---------------- */

function BadgeModal({
  tier,
  taskName,
  bonusXp,
  onClose,
}: {
  tier: Tier;
  taskName: string;
  bonusXp: number;
  onClose: () => void;
}) {
  // Auto-dismiss after a longer delay for the milestone moment
  useEffect(() => {
    const t = setTimeout(onClose, 5500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card rounded-2xl card-shadow border border-border w-full max-w-sm p-8 text-center animate-pop-in overflow-visible">
        {/* Confetti spans well beyond the card */}
        <div className="absolute inset-0 pointer-events-none">
          <Confetti count={36} variant="burst" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col items-center gap-4">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Badge Unlocked</div>

          {/* Glowing badge */}
          <div className="relative">
            <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-60", TIER_COLORS[tier])} />
            <div
              className={cn(
                "relative h-24 w-24 rounded-full flex items-center justify-center ring-4 ring-card animate-glow-pulse",
                TIER_COLORS[tier]
              )}
            >
              <Award className="h-12 w-12 text-white drop-shadow" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-foreground">{tier}</div>
            <div className="text-sm text-muted-foreground mt-1">
              You earned <span className="font-semibold text-foreground">{tier}</span> in{" "}
              <span className="font-semibold text-foreground">{taskName}</span>.
            </div>
          </div>

          {bonusXp > 0 && (
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-xp bg-xp/10 px-3 py-1.5 rounded-full">
              <Zap className="h-4 w-4" /> +{bonusXp} bonus XP
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors text-sm"
          >
            Awesome
          </button>
        </div>
      </div>
    </div>
  );
}
