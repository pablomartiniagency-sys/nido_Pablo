"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: number; message: string; type: "success" | "error" | "info";
}

interface ToastCtx {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fadeIn backdrop-blur-xl border",
              t.type === "success" && "bg-emerald-500/20 border-emerald-500/30 text-emerald-200",
              t.type === "error" && "bg-red-500/20 border-red-500/30 text-red-200",
              t.type === "info" && "bg-blue-500/20 border-blue-500/30 text-blue-200",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
