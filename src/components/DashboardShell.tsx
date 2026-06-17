"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingModal } from "@/components/modules/OnboardingModal";
import { HelpPanel } from "@/components/modules/HelpPanel";
import { useStore } from "@/lib/data/useStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function BackgroundPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1440 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Nidos */}
        <g transform="translate(180, 780)" opacity="0.12">
          <path d="M-20,0 C-16,19 -7,24 0,24 C7,24 16,19 20,0" fill="none" stroke="#A5C8E8" strokeWidth="0.9" />
          <path d="M-13,3 C-8,16 -3,20 0,20 C3,20 8,16 13,3" fill="none" stroke="#A5C8E8" strokeWidth="0.6" />
        </g>
        <g transform="translate(1100, 500)" opacity="0.1">
          <path d="M-18,0 C-14,17 -6,21 0,21 C6,21 14,17 18,0" fill="none" stroke="#90B4D6" strokeWidth="0.8" />
        </g>
        <g transform="translate(680, 860)" opacity="0.1">
          <path d="M-16,0 C-13,15 -5,19 0,19 C5,19 13,15 16,0" fill="none" stroke="#71A8D9" strokeWidth="0.8" />
        </g>
        <g transform="translate(1340, 760)" opacity="0.1">
          <path d="M-22,0 C-18,21 -8,27 0,27 C8,27 18,21 22,0" fill="none" stroke="#A5D4E8" strokeWidth="0.9" />
        </g>
        {/* Flores (pétalos con forma de hoja, no círculos) */}
        <g transform="translate(380, 220)" opacity="0.18">
          <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(0)" />
          <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(72)" />
          <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(144)" />
          <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(216)" />
          <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(288)" />
        </g>
        <g transform="translate(940, 160)" opacity="0.15">
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(0)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(72)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(144)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(216)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(288)" />
        </g>
        <g transform="translate(1280, 420)" opacity="0.12">
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(0)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(72)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(144)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(216)" />
          <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(288)" />
        </g>
        {/* Soles */}
        <g transform="translate(1200, 150)" opacity="0.15">
          <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#A5C8E8" />
          <line x1="0" y1="-8" x2="0" y2="-11" stroke="#A5C8E8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="8" y1="0" x2="11" y2="0" stroke="#A5C8E8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="0" y1="8" x2="0" y2="11" stroke="#A5C8E8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="-8" y1="0" x2="-11" y2="0" stroke="#A5C8E8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="5.5" y1="-5.5" x2="7.5" y2="-7.5" stroke="#A5C8E8" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="5.5" y1="5.5" x2="7.5" y2="7.5" stroke="#A5C8E8" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="-5.5" y1="5.5" x2="-7.5" y2="7.5" stroke="#A5C8E8" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="-5.5" y1="-5.5" x2="-7.5" y2="-7.5" stroke="#A5C8E8" strokeWidth="0.5" strokeLinecap="round" />
        </g>
        <g transform="translate(500, 700)" opacity="0.12">
          <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill="#4A8AC9" />
          <line x1="0" y1="-7" x2="0" y2="-10" stroke="#4A8AC9" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="7" y1="0" x2="10" y2="0" stroke="#4A8AC9" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="0" y1="7" x2="0" y2="10" stroke="#4A8AC9" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="-7" y1="0" x2="-10" y2="0" stroke="#4A8AC9" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="5" y1="-5" x2="7" y2="-7" stroke="#4A8AC9" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="5" y1="5" x2="7" y2="7" stroke="#4A8AC9" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="-5" y1="5" x2="-7" y2="7" stroke="#4A8AC9" strokeWidth="0.5" strokeLinecap="round" />
          <line x1="-5" y1="-5" x2="-7" y2="-7" stroke="#4A8AC9" strokeWidth="0.5" strokeLinecap="round" />
        </g>
        <g transform="translate(280, 600)" opacity="0.12">
          <rect x="-2" y="-2" width="4" height="4" rx="1" fill="#CEE1F2" />
          <line x1="0" y1="-6" x2="0" y2="-9" stroke="#CEE1F2" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="6" y1="0" x2="9" y2="0" stroke="#CEE1F2" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="0" y1="6" x2="0" y2="9" stroke="#CEE1F2" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="-6" y1="0" x2="-9" y2="0" stroke="#CEE1F2" strokeWidth="0.7" strokeLinecap="round" />
        </g>
        {/* Ondas */}
        <path d="M0 940 Q200 905 400 940 T800 940 T1200 940 T1440 940" stroke="#A5C8E8" strokeWidth="0.5" opacity="0.1" fill="none" />
        <path d="M0 960 Q250 930 500 960 T1000 960 T1440 960" stroke="#90B4D6" strokeWidth="0.4" opacity="0.08" fill="none" />
      </svg>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { syncing } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundPattern />
      <div className="flex relative z-0 items-start">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full relative pb-20 md:pb-10">
          {syncing && (
            <div className="fixed bottom-20 md:bottom-4 right-4 z-[80] flex items-center gap-2 bg-lapis-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              Guardando...
            </div>
          )}
          {loading ? (
            <DashboardLoadingSkeleton />
          ) : !user ? null : (
            <ErrorBoundary>{children}</ErrorBoundary>
          )}
        </main>
      </div>
      <OnboardingModal />
      <HelpPanel />
      <MobileNav />
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
