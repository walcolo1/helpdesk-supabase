import { getTicketQueue } from "@/actions/tickets";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TicketQueueTable } from "@/components/tickets/ticket-queue-table";
import { QueueFilters } from "@/components/tickets/queue-filters";
import { TicketSearch } from "@/components/tickets/ticket-search";
import { ListFilter, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketQueuePage({
  searchParams
}: {
  searchParams: { status?: string; categoryId?: string; assignedToId?: string };
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "agent")) {
    redirect("/dashboard");
  }

  const [tickets, categories, agents] = await Promise.all([
    getTicketQueue(searchParams),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ 
      where: { role: { in: ["admin", "agent"] } },
      select: { id: true, name: true }
    })
  ]);

  // Estadísticas rápidas de la cola
  const criticalCount = tickets.filter(t => t.priority === "critical").length;
  const breachedCount = tickets.filter(t => t.slaDeadline && new Date() > new Date(t.slaDeadline)).length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Cabecera Operativa */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
            <Zap size={14} className="fill-current" />
            Operaciones en Vivo
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Cola Operativa
          </h1>
          <p className="text-gray-500 text-sm">
            Atención priorizada de tickets activos según SLA y urgencia.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Críticos</p>
            <p className="text-xl font-black text-red-600">{criticalCount}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Vencidos</p>
            <p className="text-xl font-black text-orange-600">{breachedCount}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">En Cola</p>
            <p className="text-xl font-black text-indigo-600">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col gap-4">
        <TicketSearch />
        <QueueFilters categories={categories} agents={agents} />
      </div>

      {/* Tabla de la Cola */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ListFilter size={16} />
            Tickets Pendientes
          </h2>
          <span className="text-xs text-gray-400">Actualizado hace un momento</span>
        </div>
        
        <TicketQueueTable tickets={tickets} />
      </div>
    </div>
  );
}
