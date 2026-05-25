import { TicketQueueItem } from "@/actions/tickets";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ArrowRight, User } from "lucide-react";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSeconds = Math.round(diffInMs / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (Math.abs(diffInMinutes) < 1) return "ahora mismo";
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');
  return rtf.format(diffInDays, 'day');
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "En Progreso", color: "bg-amber-100 text-amber-800" },
  waiting_user: { label: "Espera de Usuario", color: "bg-purple-100 text-purple-800" },
  resolved: { label: "Resuelto — Pend. Cierre", color: "bg-emerald-100 text-emerald-800" },
  tracking: { label: "Seguimiento", color: "bg-teal-100 text-teal-800" },
  on_hold: { label: "En Espera", color: "bg-indigo-100 text-indigo-800" },
};


const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-slate-100 text-slate-800 border-slate-200" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-800 border-blue-200" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-200" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-200 animate-pulse" },
};

export function TicketQueueTable({ tickets }: { tickets: TicketQueueItem[] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Clock className="text-gray-300" size={32} />
        </div>
        <p className="text-gray-500 font-medium">La cola está vacía. ¡Buen trabajo!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Prioridad & SLA</th>
              <th className="px-6 py-4 font-semibold">Ticket</th>
              <th className="px-6 py-4 font-semibold">Servicio / Categoría</th>
              <th className="px-6 py-4 font-semibold">Asignado</th>
              <th className="px-6 py-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || { label: ticket.status, color: "bg-gray-100" };
              const priority = priorityConfig[ticket.priority];
              const isBreached = ticket.slaDeadline && new Date() > new Date(ticket.slaDeadline);
              
              return (
                <tr key={ticket.id} className={`group hover:bg-gray-50/80 dark:hover:bg-slate-900/50 transition-colors ${isBreached ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className={`${priority.color} border w-fit font-bold`}>
                        {priority.label}
                      </Badge>
                      {ticket.slaDeadline ? (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isBreached ? 'text-red-600' : 'text-gray-500'}`}>
                          {isBreached ? <AlertTriangle size={12} /> : <Clock size={12} />}
                          {isBreached ? 'VENCIDO' : 'Vence'} {formatRelativeTime(new Date(ticket.slaDeadline))}
                          {isBreached && ticket.priority === 'critical' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white rounded-[4px] text-[8px] font-black uppercase tracking-tighter animate-bounce">
                              ¡Urgente!
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin SLA</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{ticket.ticketNumber}</span>
                      <span className="text-gray-600 dark:text-gray-400 line-clamp-1 text-xs mt-0.5">{ticket.subject}</span>
                      <div className="mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.service.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <User size={14} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.assignedTo?.name || <span className="italic text-gray-400">Sin asignar</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg group-hover:translate-x-1 duration-200"
                    >
                      Atender <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
