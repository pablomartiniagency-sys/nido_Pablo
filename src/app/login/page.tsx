"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, signup, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast("Email y contraseña requeridos", "error"); return; }
    if (mode === "signup" && !name) { toast("Nombre requerido", "error"); return; }
    setLoading(true);

    const result = mode === "login"
      ? await login(email, password)
      : await signup(email, password, name);

    if (result.success) {
      toast(mode === "login" ? "Sesión iniciada" : "Cuenta creada");
      router.push("/dashboard");
    } else {
      toast(result.error || "Error", "error");
    }
    setLoading(false);
  };

  const handleDemo = () => {
    loginAsDemo();
    toast("Sesión demo de 1 hora iniciada");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-grid bg-glow flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo href="/" /></div>
          <h1 className="text-xl font-bold text-ink-900">Acceder a Nido</h1>
          <p className="text-sm text-ink-500 mt-1">Portal de gestión escolar</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
            <button onClick={() => setMode("login")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === "login" ? "bg-coral-50 text-coral-500 border border-coral-200" : "text-ink-500 hover:text-ink-900"}`}>
              Iniciar sesión
            </button>
            <button onClick={() => setMode("signup")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === "signup" ? "bg-coral-50 text-coral-500 border border-coral-200" : "text-ink-500 hover:text-ink-900"}`}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <input className="input" placeholder="Nombre del centro" value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#131316] px-2 text-ink-400">o</span></div>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleDemo}>
            Probar demo gratuita (1 hora)
          </Button>

          <div className="text-[10px] text-ink-900/25 text-center space-y-1">
            <p>Demo: acceso instantáneo con datos de ejemplo</p>
            <p>Tu sesión demo expirará automáticamente en 60 minutos</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-ink-400 hover:text-ink-500">← Volver a Nido</a>
        </div>
      </div>
    </div>
  );
}
