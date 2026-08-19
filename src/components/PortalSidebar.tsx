import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ToothIcon } from "./ToothIcon";
import { Crown, LogOut, Star, Zap } from "lucide-react";
import { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { getLevelInfo, getUserTotalXp } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { useCrowns } from "@/contexts/CrownsContext";
import { formatCrowns } from "@/lib/crowns";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  badgeKey?: "fulfil";
}

export function PortalSidebar({ items }: { items: NavItem[] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { members, submissions, currentUserId } = useStore();
  const { getBalance, pendingFulfilments } = useCrowns();
  const isAdmin = pathname.startsWith("/admin");
  const balance = getBalance(currentUserId);
  const me = members.find((m) => m.id === currentUserId);
  const totalXp = me ? getUserTotalXp(submissions, me.id) : 0;
  const lvl = getLevelInfo(totalXp);
  const pct = lvl.isMax ? 100 : Math.round((lvl.currentLevelXp / lvl.nextLevelXp) * 100);

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <ToothIcon className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <div className="font-extrabold text-lg tracking-tight">MolarUp</div>
          <div className="text-[11px] text-sidebar-foreground/60 font-medium">Dental Prestige</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badgeKey === "fulfil" && pendingFulfilments.length > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingFulfilments.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Level + Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-3">
        {me && (
          <div className="px-2 pt-1">
            <div className="text-sm font-semibold truncate">{me.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/70 mt-0.5">
              <Star className="h-3 w-3 text-primary" />
              <span>Level: {lvl.level}</span>
            </div>
            <div className="mt-2">
              <Progress value={pct} className="h-1.5 bg-sidebar-accent" />
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-sidebar-foreground/60">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-xp" />
                  <span className="font-semibold text-xp">{lvl.totalXp} XP</span>
                </span>
                <span>
                  {lvl.isMax ? "Max" : `${lvl.xpToNext} to L${lvl.level + 1}`}
                </span>
              </div>
              <button
                onClick={() => navigate(isAdmin ? "/admin/crowns" : "/staff/profile")}
                className="mt-1.5 w-full flex items-center gap-1 text-[10px] text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              >
                <Crown className="h-3 w-3 text-crown" />
                <span className="font-semibold text-crown tabular-nums">{formatCrowns(balance)}</span>
                <span>Crowns</span>
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
