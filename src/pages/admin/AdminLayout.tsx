import { Outlet } from "react-router-dom";
import { PortalSidebar, NavItem } from "@/components/PortalSidebar";
import { PortalTopBar } from "@/components/crowns/PortalTopBar";
import { LayoutDashboard, ListChecks, FileCheck2, Users, Trophy, UserCircle2, Store, Coins } from "lucide-react";

const items: NavItem[] = [
  { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4" /> },
  { to: "/admin/submissions", label: "Submissions", icon: <FileCheck2 className="h-4 w-4" /> },
  { to: "/admin/team", label: "My Team", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/store", label: "Store", icon: <Store className="h-4 w-4" /> },
  { to: "/admin/crowns", label: "Crown Ledger", icon: <Coins className="h-4 w-4" /> },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { to: "/admin/profile", label: "Profile", icon: <UserCircle2 className="h-4 w-4" /> },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PortalSidebar items={items} />
      <main className="flex-1 min-w-0 p-8 overflow-x-auto">
        <PortalTopBar portal="admin" />
        <Outlet />
      </main>
    </div>
  );
}
