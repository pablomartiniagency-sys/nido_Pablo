"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useStore } from "@/lib/data/useStore";
import { Logo } from "@/components/ui/Logo";
import {
  IconDashboard, IconAccounting, IconInvoice, IconFamilies,
  IconChat, IconForecast, IconBolt, IconBowl, IconUsers, IconPayroll, IconSettings, IconLogout,
  IconGraduation, IconTrendingUp, IconBell, IconDownload, IconUpload, IconHelp, IconX, IconEuro,
} from "@/components/ui/Icons";

const BOTTOM_ITEMS = [
  { href: "/dashboard",    label: "Inicio",       icon: <IconDashboard width={20} height={20} /> },
  { href: "/facturacion",  label: "Facturas",     icon: <IconInvoice width={20} height={20} /> },
  { href: "/familias",     label: "Familias",     icon: <IconFamilies width={20} height={20} /> },
  { href: "/alumnos",      label: "Alumnos",      icon: <IconGraduation width={20} height={20} /> },
  { href: "#mas",          label: "Más",          icon: <IconSettings width={20} height={20} /> },
];

const DRAWER_ITEMS = [
  { section: "GENERAL", items: [
    { href: "/dashboard",      label: "Dashboard",    icon: <IconDashboard width={18} height={18} /> },
  ]},
  { section: "CONTABILIDAD", items: [
    { href: "/contabilidad",   label: "Contabilidad", icon: <IconAccounting width={18} height={18} /> },
    { href: "/facturacion",    label: "Facturación",  icon: <IconInvoice width={18} height={18} /> },
    { href: "/familias",       label: "Familias",     icon: <IconFamilies width={18} height={18} /> },
    { href: "/alumnos",        label: "Alumnos",      icon: <IconGraduation width={18} height={18} /> },
    { href: "/oportunidades",  label: "Oportunidades",icon: <IconTrendingUp width={18} height={18} /> },
    { href: "/recordatorios",  label: "Recordatorios",icon: <IconBell width={18} height={18} /> },
  ]},
  { section: "GESTIÓN IA", items: [
    { href: "/asistente",      label: "Asistente IA", icon: <IconChat width={18} height={18} /> },
    { href: "/previsiones",    label: "Previsiones",  icon: <IconForecast width={18} height={18} /> },
    { href: "/suministros",    label: "Suministros",  icon: <IconBolt width={18} height={18} /> },
    { href: "/comedor",        label: "Comedor",      icon: <IconBowl width={18} height={18} /> },
    { href: "/empleados",      label: "Empleados",    icon: <IconUsers width={18} height={18} /> },
    { href: "/nominas",        label: "Nóminas",      icon: <IconPayroll width={18} height={18} /> },
  ]},
  { section: "SISTEMA", items: [
    { href: "/exportar",       label: "Exportar datos", icon: <IconDownload width={18} height={18} /> },
    { href: "/importar",       label: "Importar datos", icon: <IconUpload width={18} height={18} /> },
    { href: "/planes",         label: "Planes",         icon: <IconEuro width={18} height={18} /> },
    { href: "/configuracion",  label: "Configuración",  icon: <IconSettings width={18} height={18} /> },
    { href: "/ayuda",          label: "Ayuda",          icon: <IconHelp width={18} height={18} /> },
  ]},
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { configuracion } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 md:hidden safe-area-bottom shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around h-14 px-1">
          {BOTTOM_ITEMS.map(it => {
            const active = it.href === "#mas" ? drawerOpen : pathname === it.href;
            return (
              <button
                key={it.href}
                onClick={() => {
                  if (it.href === "#mas") { setDrawerOpen(true); return; }
                  router.push(it.href);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 flex-1 ${
                  active ? "text-lapis-600" : "text-ink-400 hover:text-ink-600 active:scale-95"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">{it.icon}</span>
                <span className="text-[9px] font-medium leading-tight truncate max-w-full">{it.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer (bottom sheet) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ pointerEvents: drawerOpen ? "auto" : "none" }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-5 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-ink-400 transition"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-4">
          {DRAWER_ITEMS.map(group => (
            <div key={group.section}>
              <div className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider px-2 mb-1.5">
                {group.section}
              </div>
              {group.items.map(it => {
                const active = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? "bg-lapis-50 text-lapis-600"
                        : "text-ink-500 hover:text-ink-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center">{it.icon}</span>
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Logout */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition w-full"
            >
              <IconLogout width={18} height={18} />
              Cerrar sesión
            </button>
          </div>

          {/* Spacer for bottom safety */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}
