import { Outlet } from "react-router-dom";
import { PortalSidebar, NavItem } from "@/components/PortalSidebar";
import { LayoutDashboard, ClipboardList, Trophy, UserCircle2 } from "lucide-react";

const items: NavItem[] = [
  { to: "/staff", end: true, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/staff/tasks", label: "Task Log", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/staff/leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { to: "/staff/profile", label: "Profile", icon: <UserCircle2 className="h-4 w-4" /> },
];

export default function StaffLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PortalSidebar items={items} />
      <main className="flex-1 min-w-0 p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
