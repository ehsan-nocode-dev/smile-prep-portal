import { Bell, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useCrowns } from "@/contexts/CrownsContext";
import { formatCrowns, formatTxDate } from "@/lib/crowns";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PortalTopBar({ portal }: { portal: "admin" | "staff" }) {
  const { currentUserId } = useStore();
  const { getBalance, notifications, unreadNotifications, markNotificationsRead } = useCrowns();
  const balance = getBalance(currentUserId);

  return (
    <header className="flex items-center justify-end gap-3 mb-6">
      {portal === "admin" && (
        <Popover onOpenChange={(o) => o && markNotificationsRead()}>
          <PopoverTrigger asChild>
            <button
              className="relative h-10 w-10 rounded-full bg-card card-shadow flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b font-semibold text-sm">Notifications</div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">You're all caught up.</div>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.type === "redemption_pending" ? "/admin/fulfil" : "/admin/store"}
                  className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm font-medium">{n.productTitle}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{formatTxDate(n.createdAt)}</div>
                </Link>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={portal === "admin" ? "/admin/crowns" : "/staff/store"}
            className="inline-flex items-center gap-2 rounded-full bg-card card-shadow px-4 h-10 font-bold hover:bg-muted transition-colors"
          >
            <Crown className="h-4 w-4 text-crown" />
            <span className="tabular-nums">{formatCrowns(balance)}</span>
            <span className="text-xs font-medium text-muted-foreground">Crowns</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Your Crown balance</TooltipContent>
      </Tooltip>
    </header>
  );
}
