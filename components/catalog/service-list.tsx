"use client";

import { useTransition } from "react";
import { updateService, deleteService } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Plus, Clock, Shield } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  slaHours: number;
  defaultPriority: string;
  isActive: boolean;
}

export function ServiceList({ services, categoryId, categoryName, onAdd, onEdit }: { 
  services: Service[], 
  categoryId: string | null,
  categoryName?: string,
  onAdd: () => void,
  onEdit: (service: Service) => void
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el servicio "${name}"? No debe tener tickets asociados.`)) {
      startTransition(async () => {
        try {
          await deleteService(id);
        } catch (error: any) {
          alert(error.message);
        }
      });
    }
  };

  const priorityColors: any = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  if (!categoryId) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-center p-12 text-gray-400 h-full">
        Selecciona una categoría para ver sus servicios
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            Servicios: {categoryName}
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Configuración de niveles de servicio</p>
        </div>
        <Button size="sm" onClick={onAdd} className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} className="mr-1" /> Nuevo Servicio
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div key={svc.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all bg-white dark:bg-slate-950 group relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 dark:text-white truncate pr-16">{svc.name}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600" onClick={() => onEdit(svc)}>
                    <Settings size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => handleDelete(svc.id, svc.name)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">
                {svc.description || "Sin descripción disponible."}
              </p>

              <div className="flex items-center gap-4 border-t dark:border-slate-800 pt-3 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={12} className="text-indigo-500" />
                  <span>{svc.slaHours}h SLA</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Shield size={12} className="text-indigo-500" />
                  <Badge variant="secondary" className={`text-[10px] uppercase font-bold py-0 h-4 ${priorityColors[svc.defaultPriority]}`}>
                    {svc.defaultPriority}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        {services.length === 0 && (
          <div className="p-12 text-center text-gray-400 text-sm">
            No hay servicios configurados en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}
