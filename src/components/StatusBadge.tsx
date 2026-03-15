import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  Pending: "bg-warning-light text-warning",
  Approved: "bg-info-light text-info",
  Completed: "bg-success-light text-success",
  Planning: "bg-secondary-light text-secondary",
  "In Progress": "bg-warning-light text-warning",
  Active: "bg-success-light text-success",
  Inactive: "bg-background text-text-muted",
  donation: "bg-success-light text-success",
  problem: "bg-danger-light text-danger",
  citizen: "bg-info-light text-info",
  project: "bg-secondary-light text-secondary",
  Urgent: "bg-danger-light text-danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const color = variants[status] ?? "bg-background text-text-secondary";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold",
        color,
        className
      )}
    >
      {status}
    </span>
  );
}
