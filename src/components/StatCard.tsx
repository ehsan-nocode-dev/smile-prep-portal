import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tint: "blue" | "green" | "yellow" | "gray" | "purple";
  className?: string;
  valueClassName?: string;
}

const tintClasses = {
  blue: "tint-blue",
  green: "tint-green",
  yellow: "tint-yellow",
  gray: "tint-gray",
  purple: "tint-purple",
};

export function StatCard({ label, value, icon, tint, className, valueClassName }: Props) {
  return (
    <div className={cn("rounded-xl p-5 card-shadow bg-card flex items-center gap-4", className)}>
      <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", tintClasses[tint])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        <div className={cn("text-2xl font-bold tracking-tight mt-0.5", valueClassName)}>{value}</div>
      </div>
    </div>
  );
}
