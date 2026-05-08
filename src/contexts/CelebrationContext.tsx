import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import confetti from "canvas-confetti";
import { Award, Sparkles, Trophy, Zap, X, Rocket } from "lucide-react";
import { TIER_COLORS, Tier, TIERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ------------------ Types ------------------ */

export type CelebrationType =
  | "task_submitted"
  | "task_approved"
  | "badge_unlocked"
  | "level_up"
  | "xp_gained";

export interface CelebrationData {
  amount?: number;
  badgeName?: string;
  tier?: Tier;
  level?: number;
  taskName?: string;
}

interface CelebrationContextValue {
  celebrate: (type: CelebrationType, data?: CelebrationData) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be used within CelebrationProvider");
  return ctx;
}

/* ------------------ Message bank ------------------ */

const MESSAGES: Record<CelebrationType, { title: string; subtitle: string }[]> = {
  task_submitted: [
    { title: "Submitted! 💪", subtitle: "Your effort is noted." },
    { title: "On it!", subtitle: "That's how champions work." },
    { title: "Task logged", subtitle: "You're building momentum!" },
  ],
  task_approved: [
    { title: "Approved! 🔥", subtitle: "You're crushing it." },
    { title: "Nice work", subtitle: "Your work just paid off — literally." },
    { title: "Locked in", subtitle: "That's what dedication looks like!" },
  ],
  badge_unlocked: [
    { title: "New badge, who dis? 🏅", subtitle: "" },
    { title: "Badge unlocked!", subtitle: "You've leveled up your reputation!" },
    { title: "Earned it", subtitle: "Wear it with pride — you earned this." },
  ],
  level_up: [
    { title: "Level Up! 🚀", subtitle: "You just leveled up! The clinic feels it." },
    { title: "New Level", subtitle: "New level, new standard. Keep going!" },
    { title: "Unstoppable", subtitle: "Seriously. Don't stop now." },
  ],
  xp_gained: [{ title: "", subtitle: "" }],
};

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ------------------ Tier helper for levels ------------------ */
// Maps a numeric level to one of the existing tier color names so the
// LevelUpModal can use the same palette as badges.
export function levelToTier(level: number): Tier {
  const idx = Math.min(level - 1, TIERS.length - 1);
  return TIERS[Math.max(0, idx)];
}

/* ------------------ Provider ------------------ */

interface ToastItem {
  id: number;
  type: "task_submitted" | "task_approved";
  title: string;
  subtitle: string;
}
interface XpItem {
  id: number;
  amount: number;
  offset: number;
}
interface BadgeItem {
  id: number;
  badgeName: string;
  tier?: Tier;
}
interface LevelItem {
  id: number;
  level: number;
  tier: Tier;
  title: string;
  subtitle: string;
}

let nextId = 1;

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [xps, setXps] = useState<XpItem[]>([]);
  const [badge, setBadge] = useState<BadgeItem | null>(null);
  const [levelUp, setLevelUp] = useState<LevelItem | null>(null);
  const xpStackRef = useRef(0);

  const fireConfetti = useCallback((intense = false) => {
    const burst = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: intense ? 120 : 70,
        spread: intense ? 100 : 75,
        startVelocity: 45,
        origin,
        zIndex: 9999,
        colors: ["#00BCD4", "#FFA726", "#9C27B0", "#FFD54F", "#66BB6A", "#EF5350"],
      });
    burst({ x: 0.3, y: 0.6 });
    burst({ x: 0.7, y: 0.6 });
    if (intense) {
      setTimeout(() => burst({ x: 0.5, y: 0.4 }), 250);
    }
  }, []);

  const celebrate = useCallback(
    (type: CelebrationType, data: CelebrationData = {}) => {
      const id = nextId++;
      switch (type) {
        case "task_submitted":
        case "task_approved": {
          const m = pick(MESSAGES[type]);
          setToasts((q) => [...q, { id, type, title: m.title, subtitle: m.subtitle }]);
          break;
        }
        case "xp_gained": {
          const offset = (xpStackRef.current % 4) * 36;
          xpStackRef.current += 1;
          setXps((q) => [...q, { id, amount: data.amount ?? 0, offset }]);
          break;
        }
        case "badge_unlocked": {
          setBadge({ id, badgeName: data.badgeName ?? "New Badge", tier: data.tier });
          fireConfetti(false);
          break;
        }
        case "level_up": {
          const m = pick(MESSAGES.level_up);
          const lvl = data.level ?? 1;
          const tier = data.tier ?? levelToTier(lvl);
          setLevelUp({ id, level: lvl, tier, title: m.title, subtitle: m.subtitle });
          fireConfetti(true);
          break;
        }
      }
    },
    [fireConfetti]
  );

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}

      {/* Toast layer */}
      <div className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-3 w-[min(360px,calc(100vw-2.5rem))] pointer-events-none">
        {toasts.map((t) => (
          <ToastCelebration
            key={t.id}
            item={t}
            onClose={() => setToasts((q) => q.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>

      {/* XP popup layer — anchored near sidebar XP counter (bottom-left) */}
      <div className="fixed bottom-[110px] left-[70px] z-[9998] pointer-events-none">
        {xps.map((x) => (
          <XPGainPopup
            key={x.id}
            item={x}
            onDone={() => setXps((q) => q.filter((p) => p.id !== x.id))}
          />
        ))}
      </div>

      {badge && (
        <BadgeRevealModal
          item={badge}
          onClose={() => setBadge(null)}
        />
      )}

      {levelUp && (
        <LevelUpModal
          item={levelUp}
          onClose={() => setLevelUp(null)}
        />
      )}
    </CelebrationContext.Provider>
  );
}

/* ------------------ Components ------------------ */

function ToastCelebration({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 3200);
    const t2 = setTimeout(onClose, 3700);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [onClose]);

  const isApproved = item.type === "task_approved";
  const accent = isApproved ? "bg-success" : "bg-primary";
  const tone = isApproved ? "bg-success/15 text-success" : "bg-primary/15 text-primary";

  return (
    <div
      className={cn(
        "pointer-events-auto relative bg-card rounded-xl card-shadow border border-border overflow-hidden transition-all duration-300",
        leaving ? "opacity-0 translate-x-6" : "animate-pop-in"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", accent)} />
      <div className="relative pl-4 pr-8 py-3 flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", tone)}>
          {isApproved ? <Trophy className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground">{item.title}</div>
          {item.subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function XPGainPopup({ item, onDone }: { item: XpItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="absolute left-0 bottom-0 animate-xp-float"
      style={{ marginBottom: item.offset }}
    >
      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-xp text-white font-extrabold text-sm shadow-lg">
        <Zap className="h-4 w-4" />
        +{item.amount} XP
      </div>
    </div>
  );
}

function BadgeRevealModal({ item, onClose }: { item: BadgeItem; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      {/* Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--primary)/0.25) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-5 animate-pop-in">
        <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary">
          Badge Unlocked!
        </div>
        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-3xl opacity-70",
              item.tier ? TIER_COLORS[item.tier] : "bg-primary"
            )}
          />
          <div
            className={cn(
              "relative h-32 w-32 rounded-full flex items-center justify-center ring-4 ring-white/30 animate-glow-pulse",
              item.tier ? TIER_COLORS[item.tier] : "bg-primary"
            )}
          >
            <Award className="h-16 w-16 text-white drop-shadow-lg" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-white drop-shadow">{item.badgeName}</div>
          <div className="text-sm text-white/70 mt-1">Tap anywhere to dismiss</div>
        </div>
      </div>
    </div>
  );
}

function LevelUpModal({ item, onClose }: { item: LevelItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Background pulse */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none animate-bg-pulse",
          TIER_COLORS[item.tier]
        )}
        style={{ opacity: 0.18 }}
      />
      <div className="relative bg-card rounded-2xl card-shadow border border-border w-full max-w-md p-10 text-center animate-pop-in">
        <div className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2">
          Level Up
        </div>
        <div className="flex items-center justify-center gap-3 my-4">
          <div
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center text-white text-4xl font-extrabold ring-4 ring-card animate-glow-pulse",
              TIER_COLORS[item.tier]
            )}
          >
            {item.level}
          </div>
        </div>
        <div className="text-3xl font-extrabold text-foreground">{item.tier}</div>
        <div className="text-base font-semibold text-muted-foreground mt-1">
          Level {item.level}
        </div>
        <p className="text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
          {item.subtitle}
        </p>
        <button
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover transition-colors"
        >
          <Rocket className="h-4 w-4" />
          Let's Go!
        </button>
      </div>
    </div>
  );
}
