import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
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
        "bg-white rounded-xl border border-border p-5 transition-colors hover:border-text-muted/40",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center",
            iconBg
          )}
        >
          <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold",
              trendUp ? "text-success" : "text-danger"
            )}
          >
            {trendUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        )}
      </div>
      <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-[22px] font-semibold text-text-primary tracking-tight leading-tight">
        {value}
      </p>
    </div>
  );
}
