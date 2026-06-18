"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { useStore } from "@/lib/data/useStore";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  IconDashboard, IconAccounting, IconInvoice, IconFamilies,
  IconChat, IconForecast, IconBolt, IconBowl, IconUsers, IconPayroll, IconSettings, IconLogout,
  IconGraduation, IconTrendingUp, IconBell, IconDownload, IconUpload, IconClipboard, IconHelp, IconEuro,
} from "@/components/ui/Icons";

const ITEMS = [
  { section:"general",  href:"/dashboard",      label:"Dashboard",    icon:<IconDashboard /> },
  { section:"contable", href:"/contabilidad",   label:"Contabilidad", icon:<IconAccounting /> },
  { section:"contable", href:"/facturacion",    label:"Facturación",  icon:<IconInvoice /> },
  { section:"contable", href:"/familias",       label:"Familias",     icon:<IconFamilies /> },
  { section:"ia",       href:"/asistente",      label:"Asistente IA", icon:<IconChat /> },
  { section:"ia",       href:"/salud-financiera",label:"Salud Financiera",icon:<IconForecast /> },
  { section:"ia",       href:"/suministros",    label:"Suministros",  icon:<IconBolt /> },
  { section:"ia",       href:"/comedor",        label:"Comedor",      icon:<IconBowl /> },
  { section:"ia",       href:"/empleados",      label:"Empleados",    icon:<IconUsers /> },
  { section:"ia",       href:"/nominas",        label:"Nóminas",      icon:<IconPayroll /> },
  { section:"contable", href:"/alumnos",        label:"Alumnos",      icon:<IconGraduation /> },
  { section:"contable", href:"/oportunidades",  label:"Oportunidades",icon:<IconTrendingUp /> },
  { section:"contable", href:"/recordatorios",  label:"Recordatorios", icon:<IconBell /> },
  { section:"contable", href:"/seneca",         label:"Séneca",       icon:<IconClipboard />,  andaluciaOnly: true },
  { section:"sistema",  href:"/exportar",       label:"Exportar datos",icon:<IconDownload width={18} height={18} /> },
  { section:"sistema",  href:"/importar",       label:"Importar datos",icon:<IconUpload width={18} height={18} /> },
  { section:"sistema",  href:"/planes",         label:"Planes",        icon:<IconEuro /> },
  { section:"sistema",  href:"/configuracion",  label:"Configuración",icon:<IconSettings /> },
  { section:"sistema",  href:"/ayuda",          label:"Ayuda",         icon:<IconHelp /> },
  { section:"sistema",  href:"#admin",          label:"Panel de administración", icon:<IconSettings />, adminOnly: true },
];

const SECCIONES = [
  ["general",  "GENERAL"],
  ["contable", "CONTABILIDAD"],
  ["ia",       "GESTIÓN IA"],
  ["sistema",  "SISTEMA"],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { configuracion } = useStore();
  const { user, logout } = useAuth();
  const esAndalucia = configuracion.comunidadAutonoma === "Andalucía";
  const items = ITEMS.filter(i => (!i.andaluciaOnly || esAndalucia) && (!i.adminOnly || user?.isMaster));

  const goToAdminPanel = async () => {
    const { createIdentityClient } = await import("@/lib/supabase-identity");
    const identity = createIdentityClient();
    if (!identity) return;
    const { data: { session } } = await identity.auth.getSession();
    if (session) {
      const hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: String(session.expires_in || 3600),
        token_type: "bearer",
      }).toString();
      window.location.href = "https://nido-identity.netlify.app#" + hash;
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-lapis-100 bg-lapis-50/80 backdrop-blur-xl py-6 px-4 hidden lg:flex flex-col sticky top-0 h-screen self-start">
      <div className="px-2 mb-8"><Logo /></div>
      <nav className="flex-1 space-y-6">
        {SECCIONES.map(([key, label]) => (
          <div key={key}>
            <div className="label px-3 mb-2">{label}</div>
            {items.filter(i => i.section === key).map(it => {
              const active = pathname === it.href;
              if (it.adminOnly) {
                return (
                  <button key={it.href} onClick={goToAdminPanel}
                    className="relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition mb-0.5 text-ink-500 hover:text-ink-900 hover:bg-gray-50 border border-transparent">
                    <span className="shrink-0">{it.icon}</span>
                    <span>{it.label}</span>
                  </button>
                );
              }
              return (
                <Link key={it.href} href={it.href}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    active
                      ? "bg-white text-lapis-600 border border-lapis-200 shadow-md shadow-lapis-200/50"
                      : "text-ink-500 hover:text-ink-900 hover:bg-lapis-100/50 border border-transparent"
                  }`}>
                  {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-lapis-400 to-lapis-600 rounded-r shadow-sm" />}
                  <span className="shrink-0">{it.icon}</span>
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <button onClick={async () => { await logout(); router.push("/login"); }} className="mt-6 w-full px-3 py-2 text-xs text-ink-400 hover:text-ink-900 flex items-center gap-2">
        <IconLogout width={14} height={14}/> Cerrar sesión
      </button>
    </aside>
  );
}
