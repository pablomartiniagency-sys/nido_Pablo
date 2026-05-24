import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface KPIProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KPI({ label, value, subtitle, icon, trend, className }: KPIProps) {
  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-start justify-between mb-2">
        <div className="label">{label}</div>
        {icon && <div className="text-coral-400/60">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-ink-900 tracking-tight">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend === "up" && <span className="text-emerald-400 text-xs">↑</span>}
          {trend === "down" && <span className="text-red-400 text-xs">↓</span>}
          <span className="text-xs text-ink-400">{subtitle}</span>
        </div>
      )}
    </div>
  );
}
