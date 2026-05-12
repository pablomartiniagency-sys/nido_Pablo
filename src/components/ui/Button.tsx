"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
        variant === "primary" && "bg-white text-ink-900 hover:bg-white/90 shadow-glow-coral",
        variant === "secondary" && "bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.10]",
        variant === "ghost" && "text-white/60 hover:text-white hover:bg-white/[0.04]",
        variant === "danger" && "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
