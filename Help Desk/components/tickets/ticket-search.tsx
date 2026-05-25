"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchTicket } from "@/actions/tickets";
import { Search, Loader2 } from "lucide-react";

export function TicketSearch() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      try {
        const result = await searchTicket(query);
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

  return (
    <form onSubmit={handleSearch} className="relative flex items-center max-w-sm w-full">
      <div className="absolute left-3 text-gray-400">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar TCK-..."
        disabled={isPending}
        className="w-full h-10 pl-10 pr-10 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
      />
      {isPending && (
        <div className="absolute right-3 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}
    </form>
  );
}
