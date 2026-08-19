import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TierGroup, TierDot } from "@/components/TierDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { BadgeTier, Department, Status, TIERS, Task } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

const departments: Department[] = ["Assistant", "Hygienist", "Business Associate", "Manager"];

const blankBadges: BadgeTier[] = TIERS.map((t, i) => ({
  tier: t,
  tracks: [1, 5, 10, 25, 50, 100, 250][i],
  bonusXp: [0, 10, 25, 50, 100, 250, 500][i],
}));

function TaskForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Task;
  onSubmit: (t: Omit<Task, "id">) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [baseXp, setBaseXp] = useState<number>(initial?.baseXp || 10);
  const [crownValue, setCrownValue] = useState<number>(initial?.crownValue ?? 5);
  const [department, setDepartment] = useState<Department>(initial?.department || "Assistant");
  const [status, setStatus] = useState<Status>(initial?.status || "Active");
  const [badges, setBadges] = useState<BadgeTier[]>(initial?.badges || blankBadges);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>XP</Label>
          <Input type="number" value={baseXp} onChange={(e) => setBaseXp(+e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Crowns per completion</Label>
          <Input type="number" min={0} value={crownValue} onChange={(e) => setCrownValue(+e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Badges</Label>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Tier</th>
                <th className="text-left px-3 py-2 font-semibold">Badge</th>
                <th className="text-left px-3 py-2 font-semibold">No of tracks</th>
                <th className="text-left px-3 py-2 font-semibold">Bonus XP</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((b, idx) => (
                <tr key={b.tier} className="border-t">
                  <td className="px-3 py-2 font-medium">{b.tier}</td>
                  <td className="px-3 py-2"><TierDot tier={b.tier} size="md" /></td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      className="h-8 w-24"
                      value={b.tracks}
                      onChange={(e) => {
                        const next = [...badges];
                        next[idx] = { ...b, tracks: +e.target.value };
                        setBadges(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      className="h-8 w-24"
                      value={b.bonusXp}
                      onChange={(e) => {
                        const next = [...badges];
                        next[idx] = { ...b, bonusXp: +e.target.value };
                        setBadges(next);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSubmit({ name, description, baseXp, crownValue, department, status, badges })}
          disabled={!name.trim()}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminTasks() {
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Manage tasks, XP rewards, and badge tiers."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Task</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <TaskForm
                onCancel={() => setCreateOpen(false)}
                submitLabel="Create"
                onSubmit={(t) => { addTask(t); setCreateOpen(false); }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Task</th>
              <th className="text-left px-4 py-3 font-bold">Department</th>
              <th className="text-left px-4 py-3 font-bold">Badges</th>
              <th className="text-left px-4 py-3 font-bold">XP</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="text-right px-4 py-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </td>
                <td className="px-4 py-3">{t.department}</td>
                <td className="px-4 py-3"><TierGroup tiers={t.badges.map((b) => b.tier)} size="sm" /></td>
                <td className="px-4 py-3 font-bold text-xp">{t.baseXp} XP</td>
                <td className="px-4 py-3 font-bold text-crown">{t.crownValue} Crowns</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditing(t)}
                      className="h-8 w-8 rounded-md bg-warning/15 text-warning-foreground hover:bg-warning/30 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="h-8 w-8 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editing && (
            <TaskForm
              initial={editing}
              submitLabel="Update"
              onCancel={() => setEditing(null)}
              onSubmit={(t) => { updateTask(editing.id, t); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
