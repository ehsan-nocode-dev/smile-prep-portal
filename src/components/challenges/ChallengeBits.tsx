import { cn } from "@/lib/utils";
import { Challenge, ChallengeResult, RESULT_LABELS, TargetProgress, getPhase, getResult } from "@/lib/challenges";

type Tone = "live" | "scheduled" | "good" | "bad" | "neutral";

const TONES: Record<Tone, string> = {
  live: "border-primary/40 text-primary bg-primary/5",
  scheduled: "border-border text-muted-foreground bg-muted/50",
  good: "border-success/40 text-success bg-success/5",
  bad: "border-destructive/40 text-destructive bg-destructive/5",
  neutral: "border-border text-muted-foreground bg-card",
};

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

const resultTone = (r: ChallengeResult): Tone => (r === "met" ? "good" : r === "not_met" ? "bad" : "neutral");

export function ChallengeStatus({ challenge, now }: { challenge: Challenge; now: number }) {
  const phase = getPhase(challenge, now);
  if (phase === "scheduled") return <Pill tone="scheduled">Scheduled</Pill>;
  if (phase === "active") {
    const awaiting = challenge.kind === "team_goal" && now > new Date(challenge.endAt).getTime();
    return <Pill tone="live">{awaiting ? "Awaiting reviews" : "Live"}</Pill>;
  }
  const r = getResult(challenge, now)!;
  return <Pill tone={resultTone(r)}>{RESULT_LABELS[r]}</Pill>;
}

export function KindLabel({ kind }: { kind: Challenge["kind"] }) {
  return <span className="text-xs font-medium text-muted-foreground">{kind === "boost" ? "Boost" : "Team Goal"}</span>;
}

export function TargetBar({ row, label, showPending = false }: { row: TargetProgress; label: string; showPending?: boolean }) {
  const pct = Math.min(100, Math.round((row.achieved / Math.max(1, row.target)) * 100));
  const done = row.achieved >= row.target;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className={cn("font-semibold", done ? "text-success" : "text-foreground")}>{row.achieved}</span> / {row.target}
          {showPending && row.pending > 0 && <span className="ml-2">({row.pending} awaiting review)</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", done ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
