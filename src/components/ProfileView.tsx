import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Mail, MapPin, Briefcase, Calendar, Camera, Pencil, ArrowLeft, Star, Zap } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getLevelInfo, getUserTotalXp } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrownHistory } from "@/components/crowns/CrownHistory";

interface ProfileViewProps {
  extraSection?: ReactNode;
  userId?: string; // If provided, shows that user (read-only). Otherwise, current user (editable).
  showBack?: boolean;
}

export function ProfileView({ extraSection, userId, showBack }: ProfileViewProps) {
  const { members, currentUserId, submissions, updateMember } = useStore();
  const navigate = useNavigate();
  const targetId = userId ?? currentUserId;
  const me = members.find((m) => m.id === targetId)!;
  const isSelf = targetId === currentUserId;

  const totalXp = getUserTotalXp(submissions, targetId);
  const lvl = getLevelInfo(totalXp);
  const pct = lvl.isMax ? 100 : Math.round((lvl.currentLevelXp / lvl.nextLevelXp) * 100);

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
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

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
            {isSelf && (
              <Button onClick={openModal} className="gap-2 mb-2">
                <Pencil className="h-4 w-4" /> Edit Profile
              </Button>
            )}
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

          {/* Level + XP progress */}
          <div className="mt-6 rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-semibold">Level {lvl.level}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Zap className="h-4 w-4 text-xp" />
                <span className="font-bold text-xp">{lvl.totalXp} XP</span>
                {!lvl.isMax && (
                  <span className="text-muted-foreground ml-2">
                    {lvl.currentLevelXp} / {lvl.nextLevelXp} to Level {lvl.level + 1}
                  </span>
                )}
                {lvl.isMax && <span className="text-muted-foreground ml-2">Max level</span>}
              </div>
            </div>
            <Progress value={pct} className="h-2" />
            {!lvl.isMax && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">{lvl.xpToNext} XP</span> until next level
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crowns">Crowns</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">{extraSection}</TabsContent>
        <TabsContent value="crowns" className="mt-4">
          <CrownHistory userId={targetId} />
        </TabsContent>
      </Tabs>

      {isSelf && (
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
      )}
    </div>
  );
}
