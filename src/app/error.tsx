"use client";

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-grid bg-glow flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6"><Logo href="/" /></div>
        <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
        <p className="text-sm text-white/50 mb-6">Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.</p>
        <Button onClick={reset}>Intentar de nuevo</Button>
      </div>
    </div>
  );
}
