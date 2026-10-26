import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useChallenges } from "@/contexts/ChallengesContext";
import { formatCrowns } from "@/lib/crowns";
import {
  BOOST_MULTIPLIERS,
  BoostMultiplier,
  Challenge,
  ChallengeKind,
  GoalTarget,
  boostConflicts,
  departmentsWithoutBoost,
  fmtDay,
  fmtDayTime,
  goalConflict,
  isEditable,
  maxGoalCost,
  staffOf,
} from "@/lib/challenges";

const toDay = (d: Date) => format(d, "yyyy-MM-dd");
const toLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");
const dayStart = (s: string) => new Date(`${s}T00:00`).toISOString();
const dayEnd = (s: string) => new Date(`${s}T23:59`).toISOString();
const localIso = (s: string) => new Date(s).toISOString();

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Challenge | null;
  onSaved?: (c: Challenge | null) => void;
}

export function ChallengeFormDialog({ open, onClose, editing, onSaved }: Props) {
  const { tasks, members } = useStore();
  const { challenges, clinicId, createChallenge, updateChallenge, now } = useChallenges();
  const activeTasks = tasks.filter((t) => t.status === "Active");
  const staff = staffOf(members);

  const [kind, setKind] = useState<ChallengeKind | null>(null);
  const [name, setName] = useState("");
  // boost
  const [allTasks, setAllTasks] = useState(false);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [multiplier, setMultiplier] = useState<BoostMultiplier>(2);
  const [startDay, setStartDay] = useState("");
  const [endDay, setEndDay] = useState("");
  // goal
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [bonus, setBonus] = useState(100);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const week = new Date(now);
    week.setDate(week.getDate() + 6);
    const evening = new Date(now);
    evening.setHours(18, 0, 0, 0);
    if (evening <= now) evening.setDate(evening.getDate() + 1);

    if (editing) {
      setKind(editing.kind);
      setName(editing.name);
      setAllTasks(!!editing.allTasks);
      setTaskIds(editing.taskIds ?? []);
      setMultiplier(editing.multiplier ?? 2);
      setStartDay(toDay(new Date(editing.startAt)));
      setEndDay(toDay(new Date(editing.endAt)));
      setTargets(editing.targets ?? []);
      setStartAt(toLocal(new Date(editing.startAt)));
      setEndAt(toLocal(new Date(editing.endAt)));
      setBonus(editing.bonusPerPerson ?? 100);
    } else {
      setKind(null);
      setName("");
      setAllTasks(false);
      setTaskIds([]);
      setMultiplier(2);
      setStartDay(toDay(now));
      setEndDay(toDay(week));
      setTargets([{ taskId: "", quantity: 10 }]);
      setStartAt(toLocal(now));
      setEndAt(toLocal(evening));
      setBonus(100);
    }
  }, [open, editing]);

  /* ---------- Boost validation ---------- */
  const boostRange = startDay && endDay ? { startAt: dayStart(startDay), endAt: dayEnd(endDay) } : null;

  const conflictFor = useMemo(() => {
    const map = new Map<string, Challenge>();
    if (!boostRange) return map;
    for (const t of activeTasks) {
      const hit = boostConflicts(challenges, { id: editing?.id, clinicId, allTasks: false, taskIds: [t.id], ...boostRange }, tasks);
      if (hit[0]) map.set(t.id, hit[0].challenge);
    }
    return map;
  }, [challenges, clinicId, editing?.id, boostRange?.startAt, boostRange?.endAt, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIds = allTasks ? activeTasks.map((t) => t.id) : taskIds;
  const selectedConflicts = selectedIds.filter((id) => conflictFor.has(id));
  const gaps = departmentsWithoutBoost(tasks, allTasks, taskIds);

  const boostError = (() => {
    if (!boostRange) return null;
    if (new Date(boostRange.endAt) < new Date(boostRange.startAt)) return "End date must be on or after the start date.";
    if (new Date(boostRange.endAt) < new Date()) return "End date is in the past.";
    if (selectedConflicts.length) {
      const id = selectedConflicts[0];
      const c = conflictFor.get(id)!;
      const tName = tasks.find((t) => t.id === id)?.name;
      return `${tName} is already in ${c.name} (${fmtDay(c.startAt)} to ${fmtDay(c.endAt)}). A task can only be in one Boost at a time.`;
    }
    return null;
  })();
  const boostValid = !!name.trim() && selectedIds.length > 0 && !!boostRange && !boostError;

  /* ---------- Goal validation ---------- */
  const goalRange = startAt && endAt ? { startAt: localIso(startAt), endAt: localIso(endAt) } : null;
  const otherGoal = goalRange ? goalConflict(challenges, { id: editing?.id, clinicId, ...goalRange }) : null;
  const cleanTargets = targets.filter((t) => t.taskId && t.quantity > 0);
  const goalError = (() => {
    if (!goalRange) return null;
    if (new Date(goalRange.endAt) <= new Date(goalRange.startAt)) return "End time must be after the start time.";
    if (new Date(goalRange.endAt) < new Date()) return "End time is in the past.";
    return null;
  })();
  const goalValid =
    !!name.trim() && cleanTargets.length > 0 && cleanTargets.length === targets.length && bonus > 0 && !!goalRange && !goalError && !otherGoal;

  // Editing is only allowed before the start time; once started it can only be ended early.
  const locked = !!editing && !isEditable(editing, now);

  const save = () => {
    if (!kind) return;
    const draft =
      kind === "boost"
        ? { kind, name: name.trim(), allTasks, taskIds: allTasks ? [] : taskIds, multiplier, ...boostRange! }
        : { kind, name: name.trim(), targets: cleanTargets, bonusPerPerson: bonus, ...goalRange! };
    if (editing) {
      if (!updateChallenge(editing.id, draft)) {
        toast.error(`${editing.name} has started, so it can't be edited. You can end it early.`);
        onClose();
        return;
      }
      toast.success(`${draft.name} updated.`);
      onSaved?.(null);
    } else {
      const c = createChallenge(draft);
      const live = new Date(c.startAt) <= new Date();
      toast.success(live ? `${c.name} is live.` : `${c.name} scheduled for ${fmtDay(c.startAt)}.`, {
        description: live ? `Email sent to all staff (${staff.length}).` : "Staff will be emailed when it starts.",
      });
      onSaved?.(c);
    }
    onClose();
  };

  const title = editing ? `Edit ${editing.name}` : kind === "boost" ? "New Boost" : kind === "team_goal" ? "New Team Goal" : "New challenge";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!kind && (
          <div className="grid gap-3 py-1">
            {[
              { k: "boost" as const, t: "Boost", d: "Selected tasks earn more crowns for a set time." },
              { k: "team_goal" as const, t: "Team Goal", d: "The clinic works toward shared targets. Everyone who helps gets a bonus." },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => setKind(o.k)}
                className="text-left rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-semibold">{o.t}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{o.d}</div>
              </button>
            ))}
          </div>
        )}

        {kind === "boost" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Filling Week" />
            </div>

            <div className="space-y-2">
              <Label>Tasks</Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                  <Checkbox checked={allTasks} onCheckedChange={(v) => setAllTasks(!!v)} />
                  <span className="text-sm font-medium">All tasks</span>
                </label>
                {activeTasks.map((t) => {
                  const clash = conflictFor.get(t.id);
                  const checked = allTasks || taskIds.includes(t.id);
                  return (
                    <label key={t.id} className={cn("flex items-center gap-3 px-3 py-2.5", allTasks ? "opacity-60" : "cursor-pointer")}>
                      <Checkbox
                        checked={checked}
                        disabled={allTasks}
                        onCheckedChange={(v) => setTaskIds((p) => (v ? [...p, t.id] : p.filter((x) => x !== t.id)))}
                      />
                      <span className="text-sm flex-1">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{clash ? `In ${clash.name}` : t.department}</span>
                    </label>
                  );
                })}
              </div>
              {gaps.length > 0 && selectedIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {gaps.join(", ")} {gaps.length === 1 ? "has" : "have"} no boosted task.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Multiplier</Label>
              <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                {BOOST_MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors",
                      multiplier === m ? "bg-card card-shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={startDay} onChange={(e) => setStartDay(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" value={endDay} onChange={(e) => setEndDay(e.target.value)} />
              </div>
            </div>

            {boostError && <p className="text-sm text-destructive">{boostError}</p>}
          </div>
        )}

        {kind === "team_goal" && (
          <div className="space-y-5">
            {otherGoal && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2.5 text-sm">
                {otherGoal.name} runs until {fmtDayTime(otherGoal.endAt)}. Only one Team Goal can run at a time, so pick times
                after it ends or end it first.
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday Push" />
            </div>

            <div className="space-y-2">
              <Label>Targets</Label>
              <div className="space-y-2">
                {targets.map((row, i) => {
                  const used = targets.filter((_, j) => j !== i).map((x) => x.taskId);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Select
                        value={row.taskId}
                        onValueChange={(v) => setTargets((p) => p.map((x, j) => (j === i ? { ...x, taskId: v } : x)))}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Choose a task" /></SelectTrigger>
                        <SelectContent>
                          {activeTasks.filter((t) => !used.includes(t.id)).map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        className="w-24 tabular-nums"
                        value={row.quantity}
                        onChange={(e) => setTargets((p) => p.map((x, j) => (j === i ? { ...x, quantity: Math.max(0, +e.target.value) } : x)))}
                      />
                      <button
                        onClick={() => setTargets((p) => p.filter((_, j) => j !== i))}
                        disabled={targets.length === 1}
                        className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center"
                        aria-label="Remove target"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {targets.length < activeTasks.length && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTargets((p) => [...p, { taskId: "", quantity: 10 }])}>
                  <Plus className="h-3.5 w-3.5" /> Add target
                </Button>
              )}
              <p className="text-sm text-muted-foreground">Counts the quantity logged. Every target must be met.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ends</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bonus crowns per person</Label>
              <Input type="number" min={1} className="w-32 tabular-nums" value={bonus} onChange={(e) => setBonus(Math.max(0, +e.target.value))} />
            </div>

            <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              {staff.length} staff × {formatCrowns(bonus)} crowns ={" "}
              <span className="font-semibold">up to {formatCrowns(maxGoalCost(staff.length, bonus))} crowns</span>
            </div>

            {goalError && <p className="text-sm text-destructive">{goalError}</p>}
          </div>
        )}

        {locked && (
          <p className="text-sm text-destructive">This challenge has started, so it can't be edited. You can still end it early.</p>
        )}

        {kind && (
          <DialogFooter className="gap-2 sm:gap-2">
            {!editing && <Button variant="ghost" onClick={() => setKind(null)} className="mr-auto">Back</Button>}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={locked || (kind === "boost" ? !boostValid : !goalValid)}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
