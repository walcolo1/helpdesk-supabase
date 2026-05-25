"use client";

import { useState } from "react";
import { toggleResourceStatus, deleteResource } from "@/actions/resources";
import { FileText, Trash2, Power, PowerOff, Loader2 } from "lucide-react";

export function ResourceTable({ resources }: { resources: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, currentStatus: boolean) {
    if (confirm(`¿Estás seguro de que deseas ${currentStatus ? 'desactivar' : 'activar'} este recurso?`)) {
      setLoadingId(id);
      try {
        await toggleResourceStatus(id, currentStatus);
      } catch (e) {
        alert("Error al cambiar el estado.");
      } finally {
        setLoadingId(null);
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente este recurso? Esta acción no se puede deshacer.")) {
      setLoadingId(id);
      try {
        await deleteResource(id);
      } catch (e) {
        alert("Error al eliminar el recurso.");
      } finally {
        setLoadingId(null);
      }
    }
  }

  if (resources.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
        No hay recursos registrados.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Recurso</th>
              <th className="px-4 py-3">Archivo</th>
              <th className="px-4 py-3">Subido Por</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {resources.map((res) => (
              <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{res.title}</p>
                      <p className="text-xs text-gray-500">{new Date(res.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                    {res.fileName}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {res.createdBy.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    res.isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {res.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggle(res.id, res.isActive)}
                      disabled={loadingId === res.id}
                      className={`p-1.5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ${res.isActive ? 'hover:text-red-600' : 'hover:text-emerald-600'}`}
                      title={res.isActive ? "Desactivar" : "Activar"}
                    >
                      {loadingId === res.id ? <Loader2 size={16} className="animate-spin" /> : (
                        res.isActive ? <PowerOff size={16} /> : <Power size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      disabled={loadingId === res.id}
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      {loadingId === res.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
