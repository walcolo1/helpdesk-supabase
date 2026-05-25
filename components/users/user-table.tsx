"use client";

import { useTransition } from "react";
import { toggleUserStatus, updateUserRole, resetUserPassword, extendUserAccess } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Shield, Building2, Ticket, CheckCircle2, XCircle, Zap, Calendar, Key, AlertTriangle, CalendarPlus, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

interface UserWithCounts {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  _count: {
    ticketsAssigned: number;
    ticketsCreated: number;
  };
}

export function UserTable({ users, currentUserId, isAdmin }: { users: UserWithCounts[], currentUserId: string, isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [resetModalUser, setResetModalUser] = useState<{id: string, name: string} | null>(null);
  const [extendModalUser, setExtendModalUser] = useState<{id: string, name: string, expiresAt: Date | null} | null>(null);

  const [resetState, resetAction] = useFormState(resetUserPassword, {});
  const [extendState, extendAction] = useFormState(extendUserAccess, {});

  // Cierra los modales al tener éxito
  if (resetState?.success && resetModalUser) {
    setResetModalUser(null);
    resetState.success = undefined; // reset
  }
  if (extendState?.success && extendModalUser) {
    setExtendModalUser(null);
    extendState.success = undefined; // reset
  }

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      alert("No puedes desactivar tu propia cuenta");
      return;
    }
    startTransition(async () => {
      try {
        await toggleUserStatus(userId, currentStatus);
      } catch (error: any) {
        alert(error.message);
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      alert("No puedes cambiar tu propio rol");
      return;
    }
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole as any);
      } catch (error: any) {
        alert(error.message);
      }
    });
  };


  const getExpirationStatus = (user: UserWithCounts) => {
    if (!user.isActive) return { label: "Inactivo", variant: "secondary", className: "" };
    if (!user.expiresAt) return { label: "Activo", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" };
    
    const now = new Date();
    const expiresAt = new Date(user.expiresAt);
    const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: "Vencido", variant: "destructive", className: "bg-red-100 text-red-700 hover:bg-red-100" };
    } else if (diffDays <= 7) {
      return { label: "Próximo a Vencer", variant: "default", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" };
    }
    
    return { label: "Activo", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" };
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Usuario</th>
              <th className="px-6 py-4 font-semibold">Rol & Depto</th>
              <th className="px-6 py-4 font-semibold">Actividad</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <User size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{user.name}</span>
                      <span className="text-gray-500 text-[11px]">{user.email}</span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                        <Calendar size={10} />
                        <span>Desde {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    {isAdmin && user.id !== currentUserId ? (
                      <select
                        disabled={isPending}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs h-7 px-2 rounded border border-gray-200 dark:border-slate-800 bg-transparent focus:ring-1 focus:ring-indigo-500/20 outline-none w-fit font-medium"
                      >
                        <option value="admin">Administrador</option>
                        <option value="agent">Agente</option>
                        <option value="user">Usuario Final</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Shield size={12} className="text-indigo-500" />
                        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{user.role}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 size={12} />
                        <span>{user.department}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1" title="Tickets Asignados">
                        <Zap size={12} className="text-amber-500" />
                        <span>{user._count.ticketsAssigned}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Tickets Creados">
                        <Ticket size={12} className="text-indigo-500" />
                        <span>{user._count.ticketsCreated}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <Badge 
                      variant={getExpirationStatus(user).variant as any}
                      className={getExpirationStatus(user).className}
                    >
                      {getExpirationStatus(user).label}
                    </Badge>
                    {user.expiresAt && (
                      <span className="text-[10px] text-gray-500">
                        Vence: {new Date(user.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isAdmin && user.id !== currentUserId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => setExtendModalUser({ id: user.id, name: user.name, expiresAt: user.expiresAt })}
                          className="text-indigo-600 hover:text-indigo-700 h-8 px-2"
                          title="Ampliar Acceso"
                        >
                          <CalendarPlus size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => setResetModalUser({ id: user.id, name: user.name })}
                          className="text-gray-600 hover:text-indigo-600 h-8 px-2"
                          title="Restablecer Contraseña"
                        >
                          <Key size={14} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={user.isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2"}
                        >
                          {user.isActive ? (
                            <><XCircle size={14} className="mr-1" /> Desactivar</>
                          ) : (
                            <><CheckCircle2 size={14} className="mr-1" /> Activar</>
                          )}
                        </Button>
                      </>
                    )}
                    {user.id === currentUserId && (
                      <span className="text-[10px] font-bold text-indigo-500 uppercase italic">Tú</span>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Restablecer Contraseña */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key size={20} className="text-indigo-600" />
                Restablecer Contraseña
              </h3>
              <button onClick={() => setResetModalUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form action={resetAction} className="p-6 space-y-4">
              <input type="hidden" name="userId" value={resetModalUser.id} />
              
              <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-lg text-sm mb-4">
                Estás a punto de restablecer la contraseña para <strong>{resetModalUser.name}</strong>.
              </div>

              {resetState?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {resetState.error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nueva Contraseña Temporal</label>
                <input required type="password" name="newPassword" minLength={6} className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Confirmar Contraseña Temporal</label>
                <input required type="password" name="confirmPassword" minLength={6} className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="mustChangePassword" name="mustChangePassword" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                <label htmlFor="mustChangePassword" className="text-sm text-gray-600">
                  Requerir cambio de contraseña al primer ingreso
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setResetModalUser(null)}>Cancelar</Button>
                <ResetSubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Vencimiento */}
      {extendModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CalendarPlus size={20} className="text-indigo-600" />
                Editar Vencimiento
              </h3>
              <button onClick={() => setExtendModalUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form action={extendAction} className="p-6 space-y-4">
              <input type="hidden" name="userId" value={extendModalUser.id} />
              
              <div className="text-sm text-gray-600 mb-4">
                Configurando acceso para <strong>{extendModalUser.name}</strong>.
              </div>

              {extendState?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {extendState.error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  name="expiresAt" 
                  defaultValue={extendModalUser.expiresAt ? new Date(extendModalUser.expiresAt).toISOString().split('T')[0] : ''}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="noExpiration" 
                  name="noExpiration" 
                  defaultChecked={!extendModalUser.expiresAt}
                  onChange={(e) => {
                    const dateInput = e.target.form?.elements.namedItem('expiresAt') as HTMLInputElement;
                    if (dateInput) dateInput.disabled = e.target.checked;
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" 
                />
                <label htmlFor="noExpiration" className="text-sm text-gray-600">
                  Sin vencimiento (acceso ilimitado)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setExtendModalUser(null)}>Cancelar</Button>
                <ExtendSubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
      {pending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</> : "Guardar Contraseña"}
    </Button>
  );
}

function ExtendSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
      {pending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</> : "Guardar Cambios"}
    </Button>
  );
}
