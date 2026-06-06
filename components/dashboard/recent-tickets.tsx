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
  open: { label: "Abierto", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  in_progress: { label: "En Progreso", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  waiting_user: { label: "Espera de Usuario", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  resolved: { label: "Resuelto", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  closed: { label: "Cerrado", color: "bg-gray-50 text-gray-600 border border-gray-200" },
  auto_closed: { label: "Auto Cerrado", color: "bg-gray-50 text-gray-600 border border-gray-200" },
  on_hold: { label: "En Pausa", color: "bg-orange-50 text-orange-700 border border-orange-200" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-slate-50 text-slate-700 border border-slate-200" },
  medium: { label: "Media", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  high: { label: "Alta", color: "bg-orange-50 text-orange-700 border border-orange-200" },
  critical: { label: "Crítica", color: "bg-red-50 text-[#ba1a1a] border border-red-200 font-semibold" },
};

export function RecentTickets({ tickets }: { tickets: RecentTicket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white border border-[#c6c6cd] rounded-xl p-8 text-center flex flex-col items-center shadow-sm">
        <TicketIcon size={40} className="text-gray-300 mb-4" />
        <h3 className="text-base font-semibold text-[#131b2e]">No hay tickets recientes</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          Aún no se ha registrado actividad reciente en el sistema.
        </p>
        <Link 
          href="/dashboard/tickets/new" 
          className="mt-4 px-4 py-2 bg-[#0051d5] hover:bg-[#003fb3] text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Crear mi primer ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-2 uppercase tracking-wider">
          <TicketIcon size={16} className="text-[#0051d5]" />
          Última Actividad
        </h2>
        <Link 
          href="/dashboard/tickets" 
          className="text-xs text-[#0051d5] hover:text-[#003fb3] font-semibold flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {tickets.map((ticket) => {
          const status = statusMap[ticket.status] || { label: ticket.status, color: "bg-gray-50 text-gray-600 border border-gray-200" };
          const priority = priorityMap[ticket.priority] || { label: ticket.priority, color: "bg-gray-50 text-gray-600 border border-gray-200" };

          return (
            <Link 
              key={ticket.id} 
              href={`/dashboard/tickets/${ticket.id}`}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors block group"
            >
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-gray-400">#{ticket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${status.color}`}>
                    {status.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-[#131b2e] truncate group-hover:text-[#0051d5] transition-colors" title={ticket.subject}>
                  {ticket.subject}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-gray-300" />
                    <span className="truncate max-w-[120px] font-medium">{ticket.createdBy.name}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end text-xs">
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-gray-200 px-2.5 py-1 rounded-lg">
                    <span className="text-gray-400 font-medium">Asignado:</span>
                    <span className="font-bold text-[#131b2e]">{ticket.assignedTo.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 border-dashed px-2.5 py-1 rounded-lg">
                    <span className="text-gray-400 font-medium italic">Sin asignar</span>
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
