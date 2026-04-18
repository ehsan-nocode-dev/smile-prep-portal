import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Check, Pencil, X } from "lucide-react";

export default function AdminSubmissions() {
  const { submissions, updateSubmissionStatus, updateSubmissionQuantity, members, currentUserId } = useStore();
  const reviewer = members.find((m) => m.id === currentUserId)?.name || "Admin";
  const [editing, setEditing] = useState<{ id: string; quantity: number } | null>(null);

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Review, approve, and manage all user submissions." />

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Task</th>
              <th className="text-left px-4 py-3 font-bold">Quantity</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="text-left px-4 py-3 font-bold">Submitted By</th>
              <th className="text-left px-4 py-3 font-bold">Submission Date</th>
              <th className="text-right px-4 py-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{s.taskName}</td>
                <td className="px-4 py-3">x{s.quantity}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">{s.submittedByName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditing({ id: s.id, quantity: s.quantity })}
                      className="h-8 w-8 rounded-md bg-warning/15 text-warning-foreground hover:bg-warning/30 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateSubmissionStatus(s.id, "Approved", reviewer)}
                      className="h-8 w-8 rounded-md bg-success/15 text-success hover:bg-success hover:text-success-foreground flex items-center justify-center"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateSubmissionStatus(s.id, "Rejected", reviewer)}
                      className="h-8 w-8 rounded-md bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Submission Quantity</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={editing?.quantity ?? 1}
              onChange={(e) => editing && setEditing({ ...editing, quantity: +e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editing) updateSubmissionQuantity(editing.id, editing.quantity);
                setEditing(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
