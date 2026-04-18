import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Mail, MapPin, Briefcase, Calendar, Camera, Pencil } from "lucide-react";
import { ReactNode } from "react";

export function ProfileView({ extraSection }: { extraSection?: ReactNode }) {
  const { members, currentUserId, updateMember } = useStore();
  const me = members.find((m) => m.id === currentUserId)!;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(me.name);
  const [address, setAddress] = useState(me.address || "");
  const [company, setCompany] = useState(me.company || "MolarUp Dental");

  const openModal = () => {
    setName(me.name);
    setAddress(me.address || "");
    setCompany(me.company || "MolarUp Dental");
    setOpen(true);
  };

  return (
    <div>
      {/* Banner + avatar */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden mb-6">
        <div className="h-36 bg-gradient-to-r from-sidebar to-sidebar-accent" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground border-4 border-card flex items-center justify-center text-3xl font-bold">
                {me.name.charAt(0)}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-extrabold">{me.name}</h1>
                <p className="text-sm text-muted-foreground">{me.role} · {me.department}</p>
              </div>
            </div>
            <Button onClick={openModal} className="gap-2 mb-2">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" /> <span className="truncate">{me.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {me.address || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" /> {me.department}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Joined {me.joined}
            </div>
          </div>
        </div>
      </div>

      {extraSection}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative h-24 w-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold">
                {name.charAt(0) || "?"}
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                updateMember(me.id, { name, address, company });
                setOpen(false);
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
