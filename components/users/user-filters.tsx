"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";

export function UserFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleRoleFilter = (role: string) => {
    const params = new URLSearchParams(searchParams);
    if (role && role !== "all") {
      params.set("role", role);
    } else {
      params.delete("role");
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-10 h-10 bg-white dark:bg-slate-950"
          defaultValue={searchParams.get("query")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Filter className="text-gray-400 w-4 h-4 shrink-0" />
        <select
          defaultValue={searchParams.get("role")?.toString() || "all"}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="h-10 px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-auto"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="agent">Agentes</option>
          <option value="user">Usuarios Finales</option>
        </select>
      </div>
    </div>
  );
}
