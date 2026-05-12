import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Caso de éxito — Escuela Rosa · Nido",
  description: "Cómo Rosa ahorró 15.200€/año gracias a Nido.",
};

export default function CasoRosaPage() {
  return (
    <div className="min-h-screen bg-grid bg-glow">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="inline-block mb-8"><Logo href="/" /></Link>
        <Card className="p-8 md:p-12">
          <div className="eyebrow mb-3">Caso de éxito</div>
          <h1 className="text-3xl font-bold text-white mb-4">Rosa, directora de &quot;Pequeños Exploradores&quot;</h1>
          <p className="text-body mb-8">Ahorro: <strong className="text-coral-400">15.200 €/año</strong> en costes de gestión.</p>

          <div className="prose prose-invert space-y-4 text-sm text-white/70">
            <p>Rosa dirige una escuela infantil con 32 alumnos y 5 empleados. Antes de Nido, dedicaba 20h/semana a facturación, contabilidad y gestión de personal.</p>
            <p>Con Nido automatizó: facturación recurrente con SEPA, libro de gastos con OCR, nóminas y previsión de tesorería.</p>
            <p>Resultado: redujo la carga administrativa un 85% y ahora puede dedicarse a lo que importa: los niños.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06] flex justify-center">
            <Link href="/" className="text-sm text-coral-400 hover:text-coral-300">← Volver a Nido</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
