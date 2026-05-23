import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-border p-6",
        className
      )}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-[13px] text-text-secondary mt-0.5">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
