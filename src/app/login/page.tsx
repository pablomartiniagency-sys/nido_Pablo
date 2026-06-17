"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-400 text-sm animate-pulse p-6">
        Cargando...
      </div>
    );
  }

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      router.replace("/dashboard");
    } else {
      setError(result.error || "Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,98%)] p-4 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 1440 1024" fill="none" preserveAspectRatio="xMidYMid slice">
          {/* Nidos */}
          <g transform="translate(180, 780)" opacity="0.25">
            <path d="M-20,0 C-16,19 -7,24 0,24 C7,24 16,19 20,0" fill="none" stroke="#A5C8E8" strokeWidth="1" />
            <path d="M-13,3 C-8,16 -3,20 0,20 C3,20 8,16 13,3" fill="none" stroke="#A5C8E8" strokeWidth="0.7" />
          </g>
          <g transform="translate(1100, 500)" opacity="0.22">
            <path d="M-18,0 C-14,17 -6,21 0,21 C6,21 14,17 18,0" fill="none" stroke="#90B4D6" strokeWidth="0.9" />
            <path d="M-11,3 C-7,13 -3,17 0,17 C3,17 7,13 11,3" fill="none" stroke="#90B4D6" strokeWidth="0.6" />
          </g>

          {/* Flores */}
          <g transform="translate(380, 200)" opacity="0.3">
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(0)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(72)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(144)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(216)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(288)" />
          </g>
          <g transform="translate(730, 830)" opacity="0.22">
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#71A8D9" transform="rotate(0)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#71A8D9" transform="rotate(72)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#71A8D9" transform="rotate(144)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#71A8D9" transform="rotate(216)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#71A8D9" transform="rotate(288)" />
          </g>
          <g transform="translate(80, 400)" opacity="0.25">
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(0)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(72)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(144)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(216)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(288)" />
          </g>
          <g transform="translate(1280, 680)" opacity="0.22">
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(0)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(72)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(144)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(216)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#C4E0F0" transform="rotate(288)" />
          </g>

          {/* Soles */}
          <g transform="translate(1200, 150)" opacity="0.28">
            <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#A5C8E8" />
            <line x1="0" y1="-8" x2="0" y2="-12" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="8" y1="0" x2="12" y2="0" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="0" y1="8" x2="0" y2="12" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="-8" y1="0" x2="-12" y2="0" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="5.5" y1="-5.5" x2="8" y2="-8" stroke="#A5C8E8" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="5.5" y1="5.5" x2="8" y2="8" stroke="#A5C8E8" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5.5" y1="5.5" x2="-8" y2="8" stroke="#A5C8E8" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5.5" y1="-5.5" x2="-8" y2="-8" stroke="#A5C8E8" strokeWidth="0.6" strokeLinecap="round" />
          </g>
          <g transform="translate(500, 700)" opacity="0.22">
            <rect x="-2" y="-2" width="4" height="4" rx="1" fill="#4A8AC9" />
            <line x1="0" y1="-7" x2="0" y2="-10" stroke="#4A8AC9" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="7" y1="0" x2="10" y2="0" stroke="#4A8AC9" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="0" y1="7" x2="0" y2="10" stroke="#4A8AC9" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="-7" y1="0" x2="-10" y2="0" stroke="#4A8AC9" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="5" y1="-5" x2="7" y2="-7" stroke="#4A8AC9" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="5" y1="5" x2="7" y2="7" stroke="#4A8AC9" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5" y1="5" x2="-7" y2="7" stroke="#4A8AC9" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5" y1="-5" x2="-7" y2="-7" stroke="#4A8AC9" strokeWidth="0.6" strokeLinecap="round" />
          </g>

          {/* Ondas */}
          <path d="M0 930 Q200 895 400 930 T800 930 T1200 930 T1440 930" stroke="#A5C8E8" strokeWidth="0.6" opacity="0.15" fill="none" />
          <path d="M0 960 Q250 925 500 960 T1000 960 T1440 960" stroke="#90B4D6" strokeWidth="0.5" opacity="0.12" fill="none" />
        </svg>
      </div>
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo href="/" />
          </div>
          <div className="text-xs text-ink-400 mt-1">Inicia sesión en tu centro</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-xs font-medium text-ink-600 mb-1 block">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="text-xs font-medium text-ink-600 mb-1 block">Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
            />
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <a
            href="https://nido-identity.netlify.app/login"
            className="text-[11px] text-lapis-500 hover:underline"
          >
            Acceso administradores
          </a>
        </div>
      </div>
    </div>
  );
}
