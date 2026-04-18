import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ToothIcon } from "@/components/ToothIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentUserId, members } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginAs = (role: "Admin" | "Staff") => {
    const user = members.find((m) => m.role === role);
    if (user) setCurrentUserId(user.id);
    navigate(role === "Admin" ? "/admin" : "/staff");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl card-shadow p-8 animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <ToothIcon className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">MolarUp</h1>
            <p className="text-sm text-muted-foreground">Dental Prestige</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              loginAs("Staff");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Login
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            Quick switch (prototype)
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => loginAs("Admin")} className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Login as Admin
            </Button>
            <Button variant="outline" onClick={() => loginAs("Staff")} className="gap-2">
              <UserRound className="h-4 w-4" /> Login as Staff
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Frontend prototype · No backend
        </p>
      </div>
    </div>
  );
}
