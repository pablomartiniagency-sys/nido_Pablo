"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { IconHelp, IconPlay } from "@/components/ui/Icons";

const FAQS = [
  { q: "¿Cómo añadir una familia?", r: "Ve a Familias → Nueva familia. Rellena nombre, email, alumnos y los servicios que contratan. Los servicios se usarán para generar facturas automáticas." },
  { q: "¿Cómo crear una factura?", r: "En Facturación → Nueva factura. Selecciona la familia, periodo, servicios e importes. Puedes marcar como pagada, enviada o borrador." },
  { q: "¿Cómo escanear una factura con OCR?", r: "En Contabilidad → Subir factura. Selecciona una imagen (JPG, PNG, WebP). El sistema extraerá proveedor, importe, IVA y categoría automáticamente." },
  { q: "¿Cómo gestionar cargos por alumno?", r: "En Familias, cada familia tiene un botón «Añadir cargo». Puedes añadir cargos como material, extraescolares, comedor, etc. por cada alumno. La familia suma todos los cargos de sus hijos." },
  { q: "¿Cómo enviar recordatorios de pago?", r: "En Recordatorios, selecciona las facturas pendientes y elige enviar recordatorio por email. El sistema envía un correo cordial o de impago según el caso." },
  { q: "¿Cómo generar la remesa SEPA?", r: "En Facturación → Generar remesa SEPA. Crea un archivo XML bancario con todas las facturas pendientes de cobro agrupadas por familia." },
  { q: "¿Cómo funciona el módulo Séneca?", r: "Si tu centro está en Andalucía, activa la comunidad autónoma en Configuración. Aparecerá el módulo Séneca en el menú lateral para gestionar alumnos, grupos y asistencia." },
  { q: "¿Cómo añadir empleados y nóminas?", r: "En Empleados → Nuevo empleado. Rellena datos personales, salario y contrato. Luego en Nóminas → Generar nóminas del mes para crear las nóminas automáticamente." },
  { q: "¿Cómo importar datos desde otro sistema?", r: "En Importar datos, descarga la plantilla CSV para la entidad que quieras migrar (familias, alumnos, facturas...), rellénala y súbela. El sistema validará los datos antes de importar." },
  { q: "¿Cómo contactar con soporte?", r: "Puedes escribirnos a través del asistente IA o enviar un email a soporte@nido.app. Te responderemos en menos de 24 horas." },
];

const GUIAS = [
  { titulo: "Primeros pasos en Nido", descripcion: "Configura tu centro, añade familias, alumnos y empieza a facturar.", duracion: "5 min" },
  { titulo: "Facturación y cobros", descripcion: "Crea facturas, gestiona impagos, genera remesas SEPA y envía recordatorios.", duracion: "8 min" },
  { titulo: "Contabilidad y OCR", descripcion: "Escanea facturas con OCR, clasifica gastos y lleva la contabilidad al día.", duracion: "6 min" },
  { titulo: "Gestión de personal", descripcion: "Añade empleados, genera nóminas y gestiona incidencias laborales.", duracion: "7 min" },
  { titulo: "CRM y oportunidades", descripcion: "Gestiona leads, programa visitas y convierte oportunidades en matriculaciones.", duracion: "4 min" },
];

export function AyudaView() {
  const [faqOpen, setFaqOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Ayuda" description="Guías, tutoriales y preguntas frecuentes para sacar el máximo partido a Nido" />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-500 mx-auto mb-3">
            <IconHelp width={20} height={20} />
          </div>
          <div className="text-lg font-bold text-ink-900">{FAQS.length} preguntas</div>
          <div className="text-xs text-ink-500 mt-1">FAQ con respuestas detalladas</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 mx-auto mb-3">
            <IconPlay width={20} height={20} />
          </div>
          <div className="text-lg font-bold text-ink-900">{GUIAS.length} guías</div>
          <div className="text-xs text-ink-500 mt-1">Tutoriales paso a paso</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 mx-auto mb-3">
            <span className="text-xl">📹</span>
          </div>
          <div className="text-lg font-bold text-ink-900">Video tutorial</div>
          <div className="text-xs text-ink-500 mt-1">Próximamente</div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Guías rápidas</CardTitle></CardHeader>
        <div className="divide-y divide-gray-100">
          {GUIAS.map((g, i) => (
            <div key={i} className="flex items-center gap-4 py-4 px-2">
              <div className="w-8 h-8 rounded-lg bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-500 text-xs font-bold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink-900">{g.titulo}</div>
                <div className="text-xs text-ink-500 mt-0.5">{g.descripcion}</div>
              </div>
              <span className="text-[10px] text-ink-400 font-mono shrink-0">{g.duracion}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preguntas frecuentes</CardTitle></CardHeader>
        <div className="divide-y divide-gray-100">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setFaqOpen(faqOpen === faq.q ? null : faq.q)}
                className="w-full flex items-center justify-between py-4 px-2 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-ink-900">{faq.q}</span>
                <span className={`text-ink-400 transition-transform ${faqOpen === faq.q ? "rotate-180" : ""}`}>▼</span>
              </button>
              {faqOpen === faq.q && (
                <div className="px-2 pb-4">
                  <p className="text-sm text-ink-600 leading-relaxed">{faq.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="text-center py-8">
        <p className="text-sm text-ink-500">
          ¿Necesitas más ayuda?{" "}
          <a href="/asistente" className="text-coral-500 hover:text-coral-600 font-medium">Pregunta al asistente IA</a>
          {" "}o escribe a{" "}
          <a href="mailto:soporte@nido.app" className="text-coral-500 hover:text-coral-600 font-medium">soporte@nido.app</a>
        </p>
      </Card>
    </div>
  );
}
