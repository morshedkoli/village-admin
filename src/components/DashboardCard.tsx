import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  iconColor?: string;
  iconBg?: string;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  className,
  iconColor = "text-primary",
  iconBg = "bg-primary-light",
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-lg",
              trendUp
                ? "bg-success-light text-success"
                : "bg-danger-light text-danger"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-text-secondary font-medium mb-0.5">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
