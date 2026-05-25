"use client";

import { useTransition } from "react";
import { quickAssignTicket } from "@/actions/tickets";
import { Loader2 } from "lucide-react";

interface TicketAssignerProps {
  ticketId: string;
  currentAssignedToId: string | null;
  agents: { id: string; name: string }[];
}

export function TicketAssigner({ ticketId, currentAssignedToId, agents }: TicketAssignerProps) {
  const [isPending, startTransition] = useTransition();

  const handleAssign = (newId: string) => {
    const value = newId === "unassigned" ? null : newId;
    startTransition(async () => {
      try {
        await quickAssignTicket(ticketId, value);
      } catch (error: any) {
        alert(error.message || "Error al reasignar el ticket");
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        disabled={isPending}
        value={currentAssignedToId ?? "unassigned"}
        onChange={(e) => handleAssign(e.target.value)}
        className="h-7 text-xs font-medium bg-transparent border border-gray-200 dark:border-slate-800 rounded px-2 pr-6 focus:ring-1 focus:ring-indigo-500/20 outline-none w-auto max-w-[150px] truncate disabled:opacity-50 appearance-none"
      >
        <option value="unassigned">Sin asignar</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      
      {/* Icono de dropdown o spinner */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
}
