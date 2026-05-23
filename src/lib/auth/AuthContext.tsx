"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient, isSupabaseReady } from "@/lib/supabase/client";
import { createDemoSession, getDemoSession, clearDemoSession, getDemoMinutesLeft, type DemoSession } from "./demo";
import { createMasterSession, getMasterSession, clearMasterSession, isValidMasterPassword, getMasterCredentials } from "./master";
import { getStaffUsers, addStaffUser as addLocalStaff, verifyStaffLogin, removeStaffUser as removeLocalStaff, updateStaffPassword as updateLocalStaffPassword } from "./staff";
import type { User, Session } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string;
  role: "owner" | "staff" | "demo";
  name?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  demoMinutesLeft: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  addStaffUser: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  staffUsers: AuthUser[];
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isDemo: false, demoMinutesLeft: 0,
  login: async () => ({ success: false }), signup: async () => ({ success: false }),
  loginAsDemo: () => {}, logout: async () => {}, addStaffUser: async () => ({ success: false }),
  staffUsers: [],
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<AuthUser[]>([]);
  const [demoMinutesLeft, setDemoMinutesLeft] = useState(0);

  // Check existing session on mount
  useEffect(() => {
    if (typeof window === "undefined") { setLoading(false); return; }
    const checkSession = async () => {
      const sb = createClient();
      if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: (session.user.user_metadata?.role as "owner" | "staff") || "owner",
            name: session.user.user_metadata?.name,
          });
          setLoading(false);
          return;
        }
      }

      // Fallback: master session
      const master = getMasterSession();
      if (master) {
        setUser({ id: "master-1", email: master.email, role: "owner", name: "Pablo Martini" });
        setLoading(false);
        return;
      }

      // Fallback: demo session
      const demo = getDemoSession();
      if (demo) {
        setUser({ id: demo.id, email: demo.email, role: "demo" });
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Demo countdown timer
  useEffect(() => {
    if (!user || user.role !== "demo") return;
    const interval = setInterval(() => {
      const mins = getDemoMinutesLeft();
      setDemoMinutesLeft(mins);
      if (mins <= 0) {
        clearDemoSession();
        setUser(null);
        clearInterval(interval);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    // 1. Check master credentials
    const masterCreds = getMasterCredentials();
    if (email === masterCreds.email && isValidMasterPassword(password)) {
      createMasterSession();
      setUser({ id: "master-1", email: masterCreds.email, role: "owner", name: "Pablo Martini" });
      return { success: true };
    }

    // 2. Check local staff
    const staffUser = verifyStaffLogin(email, password);
    if (staffUser) {
      setUser({ id: staffUser.id, email: staffUser.email, role: "staff", name: staffUser.name });
      return { success: true };
    }

    // 3. Try Supabase (if available)
    const sb = createClient();
    if (sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            role: (data.user.user_metadata?.role as "owner" | "staff") || "owner",
            name: data.user.user_metadata?.name,
          });
          return { success: true };
        }
      } catch {}
    }

    return { success: false, error: "Credenciales incorrectas. Prueba con la cuenta master: pablomartiniagency@gmail.com" };
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const sb = createClient();
    if (!sb) return { success: false, error: "Supabase no configurado" };
    try {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { name: name || "", role: "owner" } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || "", role: "owner", name });
        return { success: true };
      }
      return { success: false, error: "Error al crear usuario" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const loginAsDemo = useCallback(() => {
    const demo = createDemoSession();
    setUser({ id: demo.id, email: demo.email, role: "demo" });
    setDemoMinutesLeft(60);
  }, []);

  const logout = useCallback(async () => {
    const sb = createClient();
    if (sb) await sb.auth.signOut();
    clearDemoSession();
    clearMasterSession();
    setUser(null);
    setDemoMinutesLeft(0);
  }, []);

  const addStaffUser = useCallback(async (email: string, password: string, name: string) => {
    if (user?.role !== "owner") return { success: false, error: "Solo el propietario puede crear usuarios secundarios" };
    if (password.length < 6) return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };

    // Try Supabase admin API (auto-confirms email)
    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, ownerEmail: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setStaffUsers(prev => [...prev, { id: data.user.id, email, role: "staff", name }]);
        return { success: true };
      }
      console.warn("[Auth] Supabase create failed:", data.error);
    } catch (err: any) {
      console.warn("[Auth] Supabase create error:", err?.message);
    }

    // Fallback: localStorage
    const newUser = addLocalStaff(email, password, name);
    setStaffUsers(prev => [...prev, { id: newUser.id, email, role: "staff", name }]);
    return { success: true, warning: "Creado localmente (sin conexión a Supabase)" };
  }, [user?.email, user?.role]);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: user?.role === "demo", demoMinutesLeft, login, signup, loginAsDemo, logout, addStaffUser, staffUsers }}>
      {children}
    </AuthContext.Provider>
  );
}
