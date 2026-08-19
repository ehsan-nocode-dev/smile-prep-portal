import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { Department, Member, Role, Status } from "@/lib/mock-data";
import { Crown, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useCrowns } from "@/contexts/CrownsContext";
import { formatCrowns } from "@/lib/crowns";

const departments: Department[] = ["Assistant", "Hygienist", "Business Associate", "Manager"];

function MemberForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  initial?: Member;
  onCancel: () => void;
  onSubmit: (m: Omit<Member, "id" | "joined">) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [role, setRole] = useState<Role>(initial?.role || "Staff");
  const [department, setDepartment] = useState<Department>(initial?.department || "Assistant");
  const [status, setStatus] = useState<Status>(initial?.status || "Active");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Staff">Staff</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
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
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSubmit({ name, email, role, department, status })}
          disabled={!name.trim() || !email.trim()}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminTeam() {
  const { members, addMember, updateMember, deleteMember } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle="Manage team members and their access."
        actions={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create Member
          </Button>
        }
      />

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Profile</th>
              <th className="text-left px-4 py-3 font-semibold">Department</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Crowns</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{m.department}</td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                    <Crown className="h-3.5 w-3.5 text-crown" />
                    {formatCrowns(getBalance(m.id))}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setViewing(m)}
                      className="h-8 w-8 rounded-md bg-accent text-accent-foreground hover:bg-accent/70 flex items-center justify-center"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(m)}
                      className="h-8 w-8 rounded-md bg-warning/15 text-warning-foreground hover:bg-warning/30 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteMember(m.id)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Member</DialogTitle></DialogHeader>
          <MemberForm
            submitLabel="Create"
            onCancel={() => setCreateOpen(false)}
            onSubmit={(m) => { addMember(m); setCreateOpen(false); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
          {editing && (
            <MemberForm
              initial={editing}
              submitLabel="Update"
              onCancel={() => setEditing(null)}
              onSubmit={(m) => { updateMember(editing.id, m); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Member Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                  {viewing.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-lg">{viewing.name}</div>
                  <div className="text-muted-foreground">{viewing.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div><div className="text-xs text-muted-foreground">Department</div><div className="font-medium">{viewing.department}</div></div>
                <div><div className="text-xs text-muted-foreground">Role</div><div className="font-medium">{viewing.role}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><StatusBadge status={viewing.status} /></div>
                <div><div className="text-xs text-muted-foreground">Joined</div><div className="font-medium">{viewing.joined}</div></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
