import { useMemo } from "react";

interface ConfettiProps {
  count?: number;
  /** "burst" radiates outward, "fall" drops downward */
  variant?: "burst" | "fall";
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--xp))",
  "hsl(var(--tier-gold))",
  "hsl(var(--tier-purple))",
  "hsl(var(--tier-teal))",
  "hsl(var(--success))",
];

/**
 * Lightweight CSS-only confetti. Renders absolutely-positioned particles
 * that animate via the `confetti-fall` keyframe. Place inside a relative parent.
 */
export function Confetti({ count = 24, variant = "burst" }: ConfettiProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const distance = 80 + Math.random() * 120;
      const cx = variant === "burst" ? Math.cos(angle) * distance : (Math.random() - 0.5) * 260;
      const cy = variant === "burst" ? Math.sin(angle) * distance : 200 + Math.random() * 120;
      return {
        id: i,
        color: COLORS[i % COLORS.length],
        cx: `${cx}px`,
        cy: `${cy}px`,
        cr: `${(Math.random() - 0.5) * 720}deg`,
        delay: `${Math.random() * 120}ms`,
        size: 6 + Math.random() * 6,
        rounded: Math.random() > 0.5,
      };
    });
  }, [count, variant]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "2px",
            animationDelay: p.delay,
            // CSS vars consumed by the keyframe
            ["--cx" as string]: p.cx,
            ["--cy" as string]: p.cy,
            ["--cr" as string]: p.cr,
          }}
        />
      ))}
    </div>
  );
}
