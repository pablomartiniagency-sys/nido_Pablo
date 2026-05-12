import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-grid bg-glow">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="inline-block mb-8"><Logo href="/" /></Link>
        <Card className="p-8 md:p-12">
          <h1 className="text-2xl font-bold text-white mb-6">Protección de Datos (GDPR)</h1>
          <div className="space-y-6 text-sm text-white/70">
            <section>
              <h2 className="text-base font-semibold text-white mb-2">1. Responsable del tratamiento</h2>
              <p>Delega (en adelante, &quot;el responsable&quot;) actúa como responsable del tratamiento de los datos personales recogidos a través de Nido.</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">2. Datos que tratamos</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Datos identificativos de familias (nombre, email, teléfono, IBAN)</li>
                <li>Datos de menores (nombre, fecha de nacimiento, alergias)</li>
                <li>Datos laborales de empleados (DNI, salario, contrato, IBAN)</li>
                <li>Datos contables y fiscales (facturas, gastos, nóminas)</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">3. Base legal</h2>
              <p>Ejecución del contrato de prestación de servicios educativos y cumplimiento de obligaciones legales (fiscales, laborales, contables).</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">4. Medidas de seguridad</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cifrado en tránsito (TLS 1.3) y en reposo (AES-256)</li>
                <li>Autenticación mediante Supabase Auth con RLS (Row Level Security)</li>
                <li>Aislamiento multi-tenant: cada centro solo accede a sus datos</li>
                <li>Los datos de pago (IBAN) se almacenan cifrados</li>
                <li>Auditoría de acceso mediante logs de Supabase</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">5. Conservación de datos</h2>
              <p>Los datos se conservan durante la vigencia del contrato y hasta 5 años después por obligaciones fiscales y contables ( art. 30 CCom).</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">6. Derechos del interesado</h2>
              <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición escribiendo a: pablomartiniagency@gmail.com</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">7. Consentimiento de familias</h2>
              <p>Nido incluirá un módulo de gestión de consentimientos donde las familias podrán:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Aceptar la política de privacidad digitalmente</li>
                <li>Autorizar el uso de imágenes (LOPD)</li>
                <li>Gestionar alergias e información médica</li>
                <li>Solicitar la baja y eliminación de sus datos</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white mb-2">8. Delegado de Protección de Datos</h2>
              <p>Contacto DPO: pablomartiniagency@gmail.com</p>
            </section>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <Link href="/" className="text-sm text-coral-400 hover:text-coral-300">← Volver a Nido</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
