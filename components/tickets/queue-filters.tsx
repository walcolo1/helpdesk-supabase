"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User, Tag, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueueFiltersProps {
  categories: { id: string; name: true }[];
  agents: { id: string; name: string }[];
}

export function QueueFilters({ categories, agents }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 mr-2">
        <Filter size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Filtrar:</span>
      </div>

      {/* Estado */}
      <select 
        value={searchParams.get("status") || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="text-xs font-medium bg-gray-50 dark:bg-slate-900 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Cualquier Estado</option>
        <option value="open">Abierto</option>
        <option value="in_progress">En Progreso</option>
        <option value="waiting_user">Espera de Usuario</option>
      </select>

      {/* Categoría */}
      <select 
        value={searchParams.get("categoryId") || ""}
        onChange={(e) => updateFilter("categoryId", e.target.value)}
        className="text-xs font-medium bg-gray-50 dark:bg-slate-900 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Todas las Categorías</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Agente */}
      <select 
        value={searchParams.get("assignedToId") || ""}
        onChange={(e) => updateFilter("assignedToId", e.target.value)}
        className="text-xs font-medium bg-gray-50 dark:bg-slate-900 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Cualquier Agente</option>
        <option value="null">Sin Asignar</option>
        {agents.map((a: any) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {(searchParams.toString() !== "") && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 h-8 px-2 hover:text-red-600">
          <X size={14} className="mr-1" /> Limpiar
        </Button>
      )}
    </div>
  );
}
