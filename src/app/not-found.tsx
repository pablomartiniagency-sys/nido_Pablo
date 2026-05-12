import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-grid bg-glow flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6"><Logo href="/" /></div>
        <h1 className="text-6xl font-extrabold text-white mb-2">404</h1>
        <p className="text-sm text-white/50 mb-6">Esta página no existe o ha sido movida.</p>
        <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded-xl bg-white text-ink-900 hover:bg-white/90 shadow-glow-coral">
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
