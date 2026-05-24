"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingModal } from "@/components/modules/OnboardingModal";
import { HelpPanel } from "@/components/modules/HelpPanel";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isDemo, demoMinutesLeft } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-grid bg-glow">
      {isDemo && demoMinutesLeft <= 10 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-center text-sm text-amber-700">
          ⏳ Tu sesión demo expira en {demoMinutesLeft} minutos. Los datos se perderán al cerrar sesión.
        </div>
      )}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {loading ? (
            <DashboardLoadingSkeleton />
          ) : !user ? null : (
            <ErrorBoundary>{children}</ErrorBoundary>
          )}
        </main>
      </div>
      <OnboardingModal />
      <HelpPanel />
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="h-4 w-72 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
