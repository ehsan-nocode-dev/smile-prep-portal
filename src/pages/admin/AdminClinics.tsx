import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clinic, useClinics } from "@/contexts/ClinicsContext";
import { useStore } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAVE_DELAY = 600;

type FormMode = { mode: "add" } | { mode: "edit"; clinic: Clinic } | null;

export default function AdminClinics() {
  const { clinics, addClinic, updateClinic, replaceAdmin, setStatus, findEmailOwner } = useClinics();
  const { members } = useStore();

  const [form, setForm] = useState<FormMode>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [resendFor, setResendFor] = useState<Clinic | null>(null);
  const [replaceFor, setReplaceFor] = useState<Clinic | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [deactivateFor, setDeactivateFor] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...clinics].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const simulate = (fn: () => void) => {
    setSaving(true);
    setTimeout(() => { fn(); setSaving(false); }, SAVE_DELAY);
  };

  const openAdd = () => {
    setName(""); setAddress(""); setPhone(""); setAdminName(""); setAdminEmail("");
    setForm({ mode: "add" });
  };
  const openEdit = (c: Clinic) => {
    setName(c.name); setAddress(c.address ?? ""); setPhone(c.phone ?? ""); setAdminName(""); setAdminEmail("");
    setForm({ mode: "edit", clinic: c });
  };
  const openReplace = (c: Clinic) => { setNewName(""); setNewEmail(""); setReplaceFor(c); };

  const formValid = form?.mode === "edit"
    ? !!name.trim()
    : !!name.trim() && !!adminName.trim() && EMAIL_RE.test(adminEmail.trim());

  const saveForm = () => {
    if (!form) return;
    simulate(() => {
      if (form.mode === "add") {
        const email = adminEmail.trim();
        if (findEmailOwner(email)) { toast.error("This email already has an account."); return; }
        addClinic({
          name: name.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined,
          adminName: adminName.trim(), adminEmail: email,
        });
        setForm(null);
        toast.success(`Clinic added. Invite sent to ${email}.`);
      } else {
        updateClinic(form.clinic.id, { name: name.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined });
        setForm(null);
        toast.success("Clinic updated.");
      }
    });
  };

  const saveReplace = () => {
    const c = replaceFor;
    if (!c) return;
    simulate(() => {
      const email = newEmail.trim();
      const owner = findEmailOwner(email);
      if (owner?.kind === "member" && c.isOwnClinic) {
        const m = members.find((x) => x.email.toLowerCase() === email.toLowerCase())!;
        replaceAdmin(c.id, m.name, m.email);
        setReplaceFor(null);
        toast.success(`${m.name} is now the admin of ${c.name}.`);
      } else if (owner) {
        toast.error("This email is already used by another account.");
      } else {
        replaceAdmin(c.id, newName.trim(), email);
        setReplaceFor(null);
        toast.success(`${newName.trim()} is now the admin of ${c.name}. Invite sent to ${email}.`);
      }
    });
  };

  const confirmResend = () => {
    const c = resendFor;
    if (!c) return;
    simulate(() => { setResendFor(null); toast.success(`New login sent to ${c.adminEmail}.`); });
  };

  const confirmDeactivate = () => {
    const c = deactivateFor;
    if (!c) return;
    simulate(() => { setStatus(c.id, "Inactive"); setDeactivateFor(null); toast.success(`${c.name} deactivated.`); });
  };

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle="Add clinics and manage their admins"
        actions={<Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Clinic</Button>}
      />

      {sorted.length === 0 ? (
        <div className="bg-card rounded-xl card-shadow p-12 text-center text-sm text-muted-foreground">
          No clinics yet. Add your first clinic.
        </div>
      ) : (
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                <th className="text-left px-4 py-3 font-semibold">Admin</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Added</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    {c.address && <div className="text-xs text-muted-foreground">{c.address}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.adminName}</div>
                    <div className="text-xs text-muted-foreground">{c.adminEmail}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">{format(new Date(c.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(c)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setResendFor(c)}>Resend Invite</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openReplace(c)}>Replace Admin</DropdownMenuItem>
                          {c.status === "Active" ? (
                            !c.isOwnClinic && <DropdownMenuItem onSelect={() => setDeactivateFor(c)}>Deactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => { setStatus(c.id, "Active"); toast.success(`${c.name} activated.`); }}>
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && !saving && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.mode === "edit" ? "Edit Clinic" : "Add Clinic"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Clinic Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            {form?.mode === "add" && (
              <>
                <div className="space-y-1.5"><Label>Admin Name</Label><Input value={adminName} onChange={(e) => setAdminName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Admin Email</Label><Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} /></div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button onClick={saveForm} disabled={!formValid || saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resendFor} onOpenChange={(o) => !o && !saving && setResendFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resend Invite</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a new login to {resendFor?.adminName}? Their old password will stop working.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResendFor(null)} disabled={saving}>Cancel</Button>
            <Button onClick={confirmResend} disabled={saving}>{saving ? "Saving…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replaceFor} onOpenChange={(o) => !o && !saving && setReplaceFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Replace Admin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current admin: <span className="text-foreground font-medium">{replaceFor?.adminName}</span> ({replaceFor?.adminEmail})
            </p>
            <div className="space-y-1.5"><Label>New Admin Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>New Admin Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplaceFor(null)} disabled={saving}>Cancel</Button>
              <Button onClick={saveReplace} disabled={!newName.trim() || !EMAIL_RE.test(newEmail.trim()) || saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivateFor} onOpenChange={(o) => !o && !saving && setDeactivateFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deactivate Clinic</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deactivate {deactivateFor?.name}? Nobody at this clinic will be able to log in until you activate it again.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateFor(null)} disabled={saving}>Cancel</Button>
            <Button onClick={confirmDeactivate} disabled={saving}>{saving ? "Saving…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
