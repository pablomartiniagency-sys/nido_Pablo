import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const VARIANTS: Record<string, string> = {
  default: "bg-white/10 text-white/70 border-white/10",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  danger: "bg-red-500/15 text-red-300 border-red-500/25",
  info: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("chip", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
