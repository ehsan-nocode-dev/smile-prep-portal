import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useChallenges } from "@/contexts/ChallengesContext";
import { useStore } from "@/lib/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCrowns } from "@/lib/crowns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { TargetBar } from "./ChallengeBits";
import {
  Challenge,
  boostTaskLabel,
  challengeChip,
  fmtDay,
  fmtDayTime,
  fmtMultiplier,
  goalProgress,
  shortTimeLeft,
  startsIn,
  timeLeft,
  userGoalStatus,
} from "@/lib/challenges";

type Portal = "admin" | "staff";

function Ring({ pct, done }: { pct: number; done: boolean }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90 shrink-0" aria-hidden>
      <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2.5" className="stroke-muted" />
      <circle
        cx="9" cy="9" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round"
        className={done ? "stroke-success" : "stroke-primary"}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
    </svg>
  );
}

const boostTag = (boosts: Challenge[]) => {
  const top = Math.max(...boosts.map((b) => b.multiplier ?? 1));
  return boosts.length === 1 ? `${fmtMultiplier(top)} Boost` : `${boosts.length} Boosts · ${fmtMultiplier(top)}`;
};

/** Header chip shown on every page while a Team Goal or Boost is live, starting soon, or a goal was met today. */
export function ChallengeChip({ portal }: { portal: Portal }) {
  const { submissions, tasks, currentUserId } = useStore();
  const { challenges, now } = useChallenges();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  // Staff never see a challenge before it starts; admins keep the muted "Starts in …" chip.
  const state = challengeChip(challenges, submissions, now, { showUpcoming: portal === "admin" });

  // One-time glow when the live goal moves forward (e.g. after an approval).
  const goal = state?.goal;
  const progressKey = goal ? goalProgress(goal.challenge, submissions).targets.reduce((n, r) => n + r.achieved, 0) : null;
  const prev = useRef<{ id: string; v: number } | null>(null);
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (!goal || progressKey === null) { prev.current = null; return; }
    const p = prev.current;
    prev.current = { id: goal.challenge.id, v: progressKey };
    if (p && p.id === goal.challenge.id && progressKey > p.v) {
      setGlow(true);
      const id = setTimeout(() => setGlow(false), 2300);
      return () => clearTimeout(id);
    }
  }, [goal?.challenge.id, progressKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;
  const { met, boosts, upcoming } = state;

  /* ---------- Collapsed chip ---------- */
  let tone = "bg-card text-foreground";
  let body: ReactNode;
  if (goal) {
    const g = goal.challenge;
    const time = goal.awaitingReviews ? "In review" : shortTimeLeft(g.endAt, now);
    body = (
      <>
        <Ring pct={goal.pct} done={goal.pct >= 100} />
        {isMobile ? (
          <span className="text-sm font-medium tabular-nums">{time}</span>
        ) : (
          <span className="text-sm whitespace-nowrap">
            <span className="font-semibold">{g.name}</span>
            <span className="text-muted-foreground tabular-nums"> · {goal.pct}% · {time}</span>
          </span>
        )}
        {!isMobile && boosts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-crown/15 text-crown whitespace-nowrap">{boostTag(boosts)}</span>
        )}
      </>
    );
  } else if (met) {
    tone = "bg-success/10 text-success";
    body = (
      <span className="text-sm font-semibold whitespace-nowrap">
        Goal met!{!isMobile && ` +${formatCrowns(met.bonusPerPerson ?? 0)} crowns`}
      </span>
    );
    if (!isMobile && boosts.length > 0) {
      body = (
        <>
          {body}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-crown/15 text-crown whitespace-nowrap">{boostTag(boosts)}</span>
        </>
      );
    }
  } else if (boosts.length > 0) {
    body = <span className="text-sm font-bold text-crown whitespace-nowrap">{isMobile ? fmtMultiplier(Math.max(...boosts.map((b) => b.multiplier ?? 1))) : boostTag(boosts)}</span>;
  } else {
    tone = "bg-card text-muted-foreground";
    body = <span className="text-sm font-medium whitespace-nowrap">{startsIn(upcoming[0].startAt, now)}</span>;
  }

  const trigger = (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full card-shadow px-4 h-10 hover:bg-muted transition-colors",
        tone,
        glow && "animate-chip-glow"
      )}
      aria-label="Challenges"
    >
      {body}
    </button>
  );

  /* ---------- Details ---------- */
  const taskName = (id: string) => tasks.find((t) => t.id === id)?.name ?? "Task";
  const close = () => setOpen(false);

  const goalDetails = goal && (() => {
    const g = goal.challenge;
    const p = goalProgress(g, submissions);
    const status = userGoalStatus(g, submissions, currentUserId);
    return (
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Team Goal</div>
            {portal === "admin" ? (
              <Link to={`/admin/challenges/${g.id}`} onClick={close} className="font-bold hover:text-primary transition-colors">
                {g.name}
              </Link>
            ) : (
              <div className="font-bold">{g.name}</div>
            )}
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {goal.awaitingReviews ? "Waiting on reviews" : timeLeft(g.endAt, now)}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {p.targets.map((r) => <TargetBar key={r.taskId} row={r} label={taskName(r.taskId)} />)}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Hit all targets: <span className="font-semibold text-crown">{formatCrowns(g.bonusPerPerson ?? 0)} crowns</span> each for everyone who helped
        </p>
        {portal === "staff" && (
          <p className={cn("text-sm font-medium mt-2", status === "helped" ? "text-success" : "text-foreground")}>
            {status === "helped"
              ? "You've helped ✓"
              : status === "pending"
              ? "Your log is awaiting review. You'll qualify once it's approved."
              : "Log any goal task to qualify"}
          </p>
        )}
      </section>
    );
  })();

  const metDetails = met && (() => {
    const mine = met.payouts.find((p) => p.userId === currentUserId);
    return (
      <section>
        <div className="text-xs font-medium text-muted-foreground">Team Goal</div>
        {portal === "admin" ? (
          <Link to={`/admin/challenges/${met.id}`} onClick={close} className="font-bold hover:text-primary transition-colors">{met.name}</Link>
        ) : (
          <div className="font-bold">{met.name}</div>
        )}
        <p className="text-sm font-semibold text-success mt-2">Goal met!</p>
        <p className="text-sm text-muted-foreground mt-1">
          {portal === "staff"
            ? mine
              ? `You earned ${formatCrowns(mine.amount)} bonus crowns.`
              : `Everyone who helped earned ${formatCrowns(met.bonusPerPerson ?? 0)} bonus crowns.`
            : `${met.payouts.length} ${met.payouts.length === 1 ? "person" : "people"} earned ${formatCrowns(met.bonusPerPerson ?? 0)} bonus crowns each.`}
        </p>
      </section>
    );
  })();

  const boostRow = (b: Challenge, when: string) => (
    <li key={b.id} className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold">{b.name}</div>
        <div className="text-sm text-muted-foreground">{boostTaskLabel(b, tasks)} · {when}</div>
      </div>
      <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-crown/15 text-crown">{fmtMultiplier(b.multiplier ?? 1)}</span>
    </li>
  );

  const boostDetails = boosts.length > 0 && (
    <section>
      <div className="text-xs font-medium text-muted-foreground mb-2">{boosts.length === 1 ? "Boost" : "Boosts"}</div>
      <ul className="space-y-3">{boosts.map((b) => boostRow(b, `until ${fmtDay(b.endAt)}`))}</ul>
    </section>
  );

  const upcomingDetails = upcoming.length > 0 && (
    <section>
      <div className="text-xs font-medium text-muted-foreground mb-2">Coming up</div>
      <ul className="space-y-3">
        {upcoming.map((c) =>
          c.kind === "boost" ? (
            boostRow(c, `starts ${fmtDayTime(c.startAt)}`)
          ) : (
            <li key={c.id}>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-muted-foreground">
                Team Goal · starts {fmtDayTime(c.startAt)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {(c.targets ?? []).map((x) => `${x.quantity} ${taskName(x.taskId)}`).join(", ")} · {formatCrowns(c.bonusPerPerson ?? 0)} crowns each
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );

  const details = (
    <div className="space-y-5">
      {goalDetails}
      {metDetails}
      {boostDetails}
      {upcomingDetails}
      <div className="pt-1">
        {portal === "staff" ? (
          <Button asChild className="w-full"><Link to="/staff/tasks" onClick={close}>Log a task</Link></Button>
        ) : (
          <Button asChild variant="outline" className="w-full"><Link to="/admin/challenges" onClick={close}>Manage challenges</Link></Button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left pb-0">
            <DrawerTitle>Challenges</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">{details}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-5">{details}</PopoverContent>
    </Popover>
  );
}
