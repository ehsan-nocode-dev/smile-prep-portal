import { cn } from "@/lib/utils";
import { SubmissionStatus, Status } from "@/lib/mock-data";

interface Props {
  status: SubmissionStatus | Status;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const styles: Record<string, string> = {
    Approved: "border-success text-success bg-success/5",
    Active: "border-success text-success bg-success/5",
    Rejected: "border-destructive text-destructive bg-destructive/5",
    Inactive: "border-muted-foreground/40 text-muted-foreground bg-muted",
    Pending: "border-warning text-warning-foreground bg-warning/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
