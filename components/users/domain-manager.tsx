"use client";

import { useState, useTransition } from "react";
import { createAllowedDomain, toggleDomainStatus, deleteAllowedDomain } from "@/actions/domains";
import { Globe, Plus, Trash2, ArrowLeft, Loader2, Check, X, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Domain {
  id: string;
  domain: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DomainManagerProps {
  initialDomains: Domain[];
}

export function DomainManager({ initialDomains }: DomainManagerProps) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!domainInput) {
      setErrorMsg("El dominio es obligatorio.");
      return;
    }

    const formData = new FormData();
    formData.append("domain", domainInput);
    formData.append("description", descriptionInput);

    startTransition(async () => {
      const result = await createAllowedDomain(null, formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg(result.success || "Dominio agregado con éxito.");
        
        // Normalizar dominio para agregarlo localmente al estado
        let normDomain = domainInput.trim().toLowerCase();
        if (normDomain.startsWith("@")) {
          normDomain = normDomain.substring(1);
        }
        
        const newDomainObj: Domain = {
          id: Math.random().toString(), // Temporal, se refrescará con refresh o listado
          domain: normDomain,
          description: descriptionInput ? descriptionInput.trim() : null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setDomains((prev) => [newDomainObj, ...prev]);
        setDomainInput("");
        setDescriptionInput("");
        
        // Esperar un momento y recargar la página para obtener el ID real de la base de datos
        window.location.reload();
      }
    });
  };

  const handleToggleStatus = (domainId: string, currentStatus: boolean) => {
    setActionPendingId(domainId);
    startTransition(async () => {
      try {
        await toggleDomainStatus(domainId, currentStatus);
        setDomains((prev) =>
          prev.map((d) => (d.id === domainId ? { ...d, isActive: !currentStatus } : d))
        );
      } catch (err: any) {
        alert(err.message || "Error al cambiar estado.");
      } finally {
        setActionPendingId(null);
      }
    });
  };

  const handleDeleteDomain = (domainId: string, domainName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el dominio "${domainName}"?`)) {
      return;
    }

    setActionPendingId(domainId);
    startTransition(async () => {
      try {
        await deleteAllowedDomain(domainId);
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      } catch (err: any) {
        alert(err.message || "Error al eliminar dominio.");
      } finally {
        setActionPendingId(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Cabecera de Navegación */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          Usuarios
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-mono font-bold text-gray-400">Dominios Permitidos</span>
      </div>

      {/* Título de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] flex items-center gap-2">
            <Globe className="text-[#0051d5]" size={24} />
            Dominios de Correo Autorizados
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestiona la lista blanca de dominios para el registro público de usuarios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Formulario de Registro de Dominio */}
        <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider mb-1">
              Agregar Nuevo Dominio
            </h2>
            <p className="text-[10px] text-gray-400">
              Registra un nuevo dominio institucional para permitir el auto-registro.
            </p>
          </div>

          <form onSubmit={handleAddDomain} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2">
                <X size={14} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Dominio
              </label>
              <input
                type="text"
                required
                placeholder="ej: ejercito.mil.co"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:border-transparent transition-all"
              />
              <span className="text-[9px] text-gray-400 italic">
                No ingreses la @ inicial, el sistema la removerá automáticamente.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Descripción (Opcional)
              </label>
              <textarea
                placeholder="ej: Dominio oficial del Ejército Nacional"
                rows={3}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:border-transparent transition-all resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#0051d5] hover:bg-[#003fb3] text-white text-[10px] font-bold uppercase tracking-wider h-9 rounded-lg gap-2 shadow-sm transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus size={12} />
                  Agregar Dominio
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Columna Derecha: Listado de Dominios Existentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#c6c6cd] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                Lista de Dominios Registrados ({domains.length})
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Solo los dominios en estado Activo permitirán el registro público de cuentas.
              </p>
            </div>
          </div>

          {domains.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">No hay dominios registrados.</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Registra un dominio en la barra lateral izquierda para comenzar.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Dominio</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {domains.map((item) => {
                    const isChanging = actionPendingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                          {item.domain}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 max-w-[200px] truncate">
                          {item.description || <span className="text-gray-300 italic">Sin descripción</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.isActive)}
                            disabled={isChanging || isPending}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase transition-all ring-1 ring-inset ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 ring-red-200 hover:bg-red-100"
                            }`}
                          >
                            <span className={`h-1 w-1 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                            {item.isActive ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDeleteDomain(item.id, item.domain)}
                              disabled={isChanging || isPending}
                              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                              title="Eliminar Dominio"
                            >
                              {isChanging ? (
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
