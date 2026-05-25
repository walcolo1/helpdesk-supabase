"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Filter, X } from "lucide-react";

export function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [start, setStart] = useState(searchParams.get("from") || "");
  const [end, setEnd] = useState(searchParams.get("to") || "");

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (start) params.set("from", start);
    else params.delete("from");
    
    if (end) params.set("to", end);
    else params.delete("to");

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setStart("");
    setEnd("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-900 shadow-sm">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rango de fechas:</span>
      </div>
      
      <div className="flex items-center gap-2 flex-1 min-w-[300px]">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border-none text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 w-full"
        />
        <span className="text-gray-300">a</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border-none text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9">
          Aplicar
        </Button>
        {(start || end) && (
          <Button variant="ghost" onClick={handleClear} className="h-9 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
