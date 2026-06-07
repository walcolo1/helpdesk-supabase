"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchTicket } from "@/actions/tickets";
import { Search, Loader2 } from "lucide-react";

function sanitizeSearchQuery(input: string): string {
  const trimmed = input.trim();
  // Verifica si empieza con tck o tck-
  const isTckFormat = /^tck-?\d+/i.test(trimmed);
  if (isTckFormat) {
    const digits = trimmed.replace(/\D/g, "");
    return `TCK-${digits}`;
  }
  // De lo contrario, remueve todo lo que no sea dígito
  return trimmed.replace(/\D/g, "");
}

export function TicketSearch({
  placeholder = "Buscar número de ticket…",
  className = "max-w-sm w-full",
  variant = "default"
}: {
  placeholder?: string;
  className?: string;
  variant?: "default" | "topbar";
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleaned = sanitizeSearchQuery(query);
    if (!cleaned) {
      alert("Por favor, ingrese un número de ticket válido (ej. 60001 o TCK-60001)");
      return;
    }

    setQuery(cleaned);

    startTransition(async () => {
      try {
        const result = await searchTicket(cleaned);
        if (result.error) {
          alert(result.error);
        } else if (result.success && result.redirectUrl) {
          router.push(result.redirectUrl);
          setQuery("");
        }
      } catch (error: any) {
        alert(error.message || "Ocurrió un error al buscar");
      }
    });
  };

  const handleBlur = () => {
    if (query.trim()) {
      setQuery(sanitizeSearchQuery(query));
    }
  };

  const isTopbar = variant === "topbar";

  return (
    <form onSubmit={handleSearch} className={`${isTopbar ? "relative flex items-center w-full" : "relative flex items-center " + className}`}>
      <div className={isTopbar ? "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400" : "absolute left-3 text-gray-400"}>
        <Search size={isTopbar ? 14 : 16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={isPending}
        className={
          isTopbar
            ? "w-full pl-9 pr-8 py-1.5 text-xs bg-[#f8fafc] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0051d5] focus:border-[#0051d5] text-gray-700 placeholder-gray-400 disabled:opacity-50"
            : "w-full h-10 pl-10 pr-10 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
        }
      />
      {isPending && (
        <div className={isTopbar ? "absolute right-2 text-gray-400" : "absolute right-3 text-gray-400"}>
          <Loader2 size={isTopbar ? 12 : 16} className="animate-spin" />
        </div>
      )}
    </form>
  );
}
