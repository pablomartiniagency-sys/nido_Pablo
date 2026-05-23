"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getStaffUsers, removeStaffUser as removeLocalStaff, updateStaffPassword as updateLocalStaffPassword } from "@/lib/auth/staff";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { IconPlus, IconTrash, IconRefresh, IconCheck, IconX, IconSettings } from "@/components/ui/Icons";
import { useStore } from "@/lib/data/useStore";
import { COMUNIDADES_AUTONOMAS } from "@/types/crm";

export function ConfiguracionView() {
  const { user, isDemo, demoMinutesLeft, logout, addStaffUser } = useAuth();
  const { configuracion, updateConfiguracion } = useStore();
  const { toast } = useToast();
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", name: "" });
  const [staffList, setStaffList] = useState<{ id: string; email: string; name: string }[]>([]);
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [resetPassValue, setResetPassValue] = useState("");
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load staff list from localStorage
  useEffect(() => {
    setStaffList(getStaffUsers().map(u => ({ id: u.id, email: u.email, name: u.name })));
  }, []);

  const handleAddStaff = async () => {
    if (!staffForm.email || !staffForm.password || !staffForm.name) {
      toast("Completa todos los campos", "error"); return;
    }
    const result = await addStaffUser(staffForm.email, staffForm.password, staffForm.name);
    if (result.success) {
      toast(`Usuario ${staffForm.email} creado`);
      setStaffList(prev => [...prev, { id: Date.now().toString(), email: staffForm.email, name: staffForm.name }]);
      setStaffForm({ email: "", password: "", name: "" });
      setShowAddStaff(false);
    } else {
      toast(result.error || "Error al crear usuario", "error");
    }
  };

  const handleDeleteStaff = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar usuario ${email}? Esta acción no se puede deshacer.`)) return;
    removeLocalStaff(userId);
    setStaffList(prev => prev.filter(s => s.id !== userId));
    toast(`Usuario ${email} eliminado`);
  };

  const handleResetStaffPassword = async (userId: string) => {
    if (!resetPassValue || resetPassValue.length < 4) { toast("La contraseña debe tener al menos 4 caracteres", "error"); return; }
    updateLocalStaffPassword(userId, resetPassValue);
    toast("Contraseña actualizada");
    setResetPassId(null);
    setResetPassValue("");
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/email-test");
      const data = await res.json();
      setEmailStatus(data);
      if (data.success) {
        toast(data.message);
      } else {
        toast(data.message, "error");
      }
    } catch {
      setEmailStatus({ ok: false, message: "Error de conexión al probar email" });
      toast("Error de conexión", "error");
    }
    setEmailTesting(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPass || passwordForm.newPass.length < 6) {
      toast("La contraseña debe tener al menos 6 caracteres", "error"); return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast("Las contraseñas no coinciden", "error"); return;
    }
    setChangingPassword(true);
    try {
      const sb = createClient();
      if (!sb) { toast("Supabase no configurado", "error"); return; }
      const { error } = await sb.auth.updateUser({ password: passwordForm.newPass });
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Contraseña actualizada correctamente");
        setShowPasswordForm(false);
        setPasswordForm({ current: "", newPass: "", confirm: "" });
      }
    } catch (err: any) {
      toast(err.message || "Error al cambiar contraseña", "error");
    }
    setChangingPassword(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Configuración" description="Gestiona tu cuenta, email y usuarios" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mi cuenta */}
        <Card>
          <CardHeader><CardTitle>Mi cuenta</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-white/50 text-sm">Email</span>
              <span className="text-white font-medium text-sm">{user?.email || "demo@nido.app"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-white/50 text-sm">Rol</span>
              <Badge variant={user?.role === "owner" ? "success" : user?.role === "staff" ? "info" : "warning"}>
                {user?.role === "owner" ? "Propietario" : user?.role === "staff" ? "Personal" : "Demo"}
              </Badge>
            </div>
            {user?.role === "owner" && !isDemo && (
              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                  Cambiar contraseña
                </Button>
              </div>
            )}
            {showPasswordForm && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <input className="input" type="password" placeholder="Nueva contraseña" value={passwordForm.newPass}
                  onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} />
                <input className="input" type="password" placeholder="Confirmar contraseña" value={passwordForm.confirm}
                  onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? "Guardando..." : "Guardar contraseña"}
                  </Button>
                </div>
              </div>
            )}
            {isDemo && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-sm font-medium text-amber-300 mb-1">⏳ Sesión demo</div>
                <div className="text-xs text-white/60">Tu sesión expira en <strong className="text-amber-300">{demoMinutesLeft} minutos</strong>.</div>
                <div className="text-xs text-white/40 mt-2">Los datos se guardan en localStorage.</div>
              </div>
            )}
            <div className="pt-4">
              <Button variant="danger" size="sm" onClick={logout}>Cerrar sesión</Button>
            </div>
          </div>
        </Card>

        {/* Estado del email */}
        <Card>
          <CardHeader><CardTitle>Email (SMTP)</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Destino</span>
                <span className="text-white font-mono text-xs">pablomartiniagency@gmail.com</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Host</span>
                <span className="text-white/70 font-mono text-xs">{process.env.NEXT_PUBLIC_SMTP_HOST || "smtp.gmail.com"}</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestEmail} disabled={emailTesting}>
              <IconRefresh width={14} height={14} className={emailTesting ? "animate-spin" : ""} />
              {emailTesting ? "Probando..." : "Probar conexión SMTP"}
            </Button>
            {emailStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                emailStatus.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"
              }`}>
                {emailStatus.ok ? <IconCheck width={14} height={14} className="mt-0.5 shrink-0" /> : <IconX width={14} height={14} className="mt-0.5 shrink-0" />}
                <span>{emailStatus.message}</span>
              </div>
            )}
            <p className="text-[10px] text-white/30 leading-relaxed">
              Los emails de contacto y recordatorios se envían vía Gmail SMTP. Si falla, verifica que SMTP_PASS en .env.local sea un App Password de 16 caracteres generado en&nbsp;
              <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-coral-400/60 hover:text-coral-400">Google App Passwords</a>.
            </p>
          </div>
        </Card>
      </div>

      {/* Datos del centro */}
      <Card>
        <CardHeader><CardTitle>Datos del centro</CardTitle></CardHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label mb-1">Nombre del centro</label>
            <input className="input" value={configuracion.nombre} onChange={e => updateConfiguracion({ nombre: e.target.value })} placeholder="Ej. Escuela Infantil Sol" />
          </div>
          <div>
            <label className="label mb-1">NIF / CIF</label>
            <input className="input" value={configuracion.nif} onChange={e => updateConfiguracion({ nif: e.target.value })} placeholder="B12345678" />
          </div>
          <div>
            <label className="label mb-1">Teléfono</label>
            <input className="input" value={configuracion.telefono} onChange={e => updateConfiguracion({ telefono: e.target.value })} placeholder="612345678" />
          </div>
          <div>
            <label className="label mb-1">Comunidad Autónoma</label>
            <select className="select" value={configuracion.comunidadAutonoma} onChange={e => updateConfiguracion({ comunidadAutonoma: e.target.value })}>
              <option value="">Seleccionar...</option>
              {COMUNIDADES_AUTONOMAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {configuracion.comunidadAutonoma === "Andalucía" && (
              <p className="text-xs text-emerald-400 mt-1">✔ Módulo Séneca activado. Aparecerá en el menú lateral.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label mb-1">Dirección</label>
            <input className="input" value={configuracion.direccion} onChange={e => updateConfiguracion({ direccion: e.target.value })} placeholder="Av. Constitución 123, 41001 Sevilla" />
          </div>
        </div>
      </Card>

      {/* Usuarios secundarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios secundarios</CardTitle>
          {user?.role === "owner" && <Button size="sm" onClick={() => setShowAddStaff(true)}><IconPlus width={14} height={14} /> Añadir</Button>}
        </CardHeader>
        {isDemo ? (
          <p className="text-sm text-white/40">Inicia sesión como propietario para gestionar usuarios secundarios.</p>
        ) : user?.role === "staff" ? (
          <p className="text-sm text-white/40">Solo el propietario puede gestionar usuarios secundarios.</p>
        ) : (
          <>
            {staffList.length === 0 && <p className="text-sm text-white/40">No hay usuarios secundarios. Añade educadores o personal.</p>}
            <div className="space-y-2">
              {staffList.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{s.name}</div>
                      <div className="text-xs text-white/40">{s.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">Personal</Badge>
                      <button onClick={() => setResetPassId(resetPassId === s.id ? null : s.id)} className="text-white/30 hover:text-white text-xs transition" title="Resetear contraseña">
                        <IconSettings width={14} height={14} />
                      </button>
                      <button onClick={() => handleDeleteStaff(s.id, s.email)} className="text-white/30 hover:text-red-400 transition" title="Eliminar">
                        <IconTrash width={14} height={14} />
                      </button>
                    </div>
                  </div>
                  {resetPassId === s.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                      <input className="input flex-1" type="password" placeholder="Nueva contraseña" value={resetPassValue} onChange={e => setResetPassValue(e.target.value)} />
                      <Button variant="secondary" size="sm" onClick={() => handleResetStaffPassword(s.id)}>Guardar</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {showAddStaff && (
        <Card>
          <CardHeader><CardTitle>Nuevo usuario secundario</CardTitle></CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" placeholder="Nombre" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))} />
            <input className="input" placeholder="Email" type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} />
            <input className="input" placeholder="Contraseña" type="password" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowAddStaff(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddStaff}>Crear usuario</Button>
          </div>
        </Card>
      )}

      {/* Datos y privacidad */}
      <Card>
        <CardHeader><CardTitle>Datos y privacidad</CardTitle></CardHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Exportar mis datos</span>
            <Button variant="ghost" size="sm" onClick={() => { window.location.href = "/exportar"; }}>Ir a exportar</Button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Eliminar mi cuenta</span>
            <Button variant="danger" size="sm" onClick={() => toast("Contacta con soporte para eliminar tu cuenta", "info")}>Solicitar baja</Button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Política de privacidad</span>
            <a href="/privacidad" className="text-coral-400 hover:text-coral-300 text-sm">Ver</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
