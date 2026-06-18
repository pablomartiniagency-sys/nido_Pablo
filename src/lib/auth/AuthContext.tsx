"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createIdentityClient } from "@/lib/supabase-identity";

export type AuthUser = {
  id: string;
  email: string;
  role: "owner" | "staff";
  name?: string;
  isMaster: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: async () => ({ success: false }), logout: async () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkIsMasterAdmin = useCallback(async (userId: string): Promise<boolean> => {
    const identity = createIdentityClient();
    if (!identity) return false;
    try {
      const { data } = await identity.from("identity_master_admins").select("id").eq("user_id", userId).maybeSingle();
      return !!data;
    } catch { return false; }
  }, []);

  // Handle cross-domain session from URL hash (redirect from nido-identity)
  const handleHashSession = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.location.hash) return false;
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) return false;

    const identity = createIdentityClient();
    if (!identity) return false;
    try {
      const { data, error } = await identity.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      } as any);
      if (!error && data.user) {
        const isMaster = await checkIsMasterAdmin(data.user.id);
        setUser({ id: data.user.id, email: data.user.email || "", role: "owner", name: data.user.user_metadata?.name, isMaster });
        window.location.hash = "";
        return true;
      }
    } catch {}
    return false;
  }, [checkIsMasterAdmin]);

  // Check existing session on mount
  useEffect(() => {
    if (typeof window === "undefined") { setLoading(false); return; }
    const checkSession = async () => {
      // 0. Check URL hash for cross-domain session from nido-identity
      if (await handleHashSession()) { setLoading(false); return; }

      // 1. Check identity auth
      const identity = createIdentityClient();
      if (identity) {
        const { data: { session } } = await identity.auth.getSession();
        if (session?.user) {
          const isMaster = await checkIsMasterAdmin(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: "owner",
            name: session.user.user_metadata?.name,
            isMaster,
          });
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    };

    checkSession();
  }, [handleHashSession, checkIsMasterAdmin]);

  const login = useCallback(async (email: string, password: string) => {
    const identity = createIdentityClient();
    if (!identity) return { success: false, error: "Error de configuración de autenticación" };

    const { data, error } = await identity.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : "Error de autenticación: " + error.message };
    }

    if (data.user) {
      const isMaster = await checkIsMasterAdmin(data.user.id);
      setUser({ id: data.user.id, email: data.user.email || "", role: "owner", name: data.user.user_metadata?.name, isMaster });
      return { success: true };
    }

    return { success: false, error: "Email o contraseña incorrectos" };
  }, [checkIsMasterAdmin]);

  const logout = useCallback(async () => {
    const identity = createIdentityClient();
    if (identity) await identity.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
