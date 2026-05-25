import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Ticket as TicketIcon, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type RecentTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  createdBy: { name: string; email: string };
  assignedTo: { name: string } | null;
};

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "En Progreso", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  waiting_user: { label: "Esperando Usuario", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  resolved: { label: "Resuelto", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  auto_closed: { label: "Auto Cerrado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  on_hold: { label: "En Pausa", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "text-gray-500" },
  medium: { label: "Media", color: "text-blue-500" },
  high: { label: "Alta", color: "text-orange-500 font-medium" },
  critical: { label: "Crítica", color: "text-red-600 font-bold" },
};

export function RecentTickets({ tickets }: { tickets: RecentTicket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center shadow-sm">
        <TicketIcon size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay tickets recientes</h3>
        <p className="text-gray-500 mt-1 max-w-sm">
          Aún no se ha registrado actividad reciente en el sistema.
        </p>
        <Link 
          href="/dashboard/tickets/new" 
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Crear mi primer ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TicketIcon size={18} className="text-indigo-600" />
          Última Actividad
        </h2>
        <Link 
          href="/dashboard/tickets" 
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {tickets.map((ticket) => {
          const status = statusMap[ticket.status] || { label: ticket.status, color: "bg-gray-100 text-gray-800" };
          const priority = priorityMap[ticket.priority] || { label: ticket.priority, color: "text-gray-500" };

          return (
            <Link 
              key={ticket.id} 
              href={`/dashboard/tickets/${ticket.id}`}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors block"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-gray-500">#{ticket.ticketNumber}</span>
                  <Badge variant="secondary" className={`text-[10px] uppercase font-bold border-0 ${status.color}`}>
                    {status.label}
                  </Badge>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white truncate" title={ticket.subject}>
                  {ticket.subject}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    <span className="truncate max-w-[120px]">{ticket.createdBy.name}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Prioridad:</span>
                  <span className={priority.color}>{priority.label}</span>
                </div>
                {ticket.assignedTo && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400">Asignado a:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
