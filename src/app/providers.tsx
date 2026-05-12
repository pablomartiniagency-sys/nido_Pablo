"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { StoreProvider } from "@/lib/data/StoreContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}
