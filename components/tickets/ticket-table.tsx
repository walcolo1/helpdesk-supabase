import { TicketSummary } from "@/actions/tickets";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  in_progress: { label: "En Progreso", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  waiting_user: { label: "Espera de Usuario", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  resolved: { label: "Resuelto — Pend. Cierre", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  tracking: { label: "Seguimiento", color: "bg-teal-50 text-teal-700 border border-teal-200" },
  closed: { label: "Cerrado", color: "bg-gray-50 text-gray-600 border border-gray-200" },
  auto_closed: { label: "Auto Cerrado", color: "bg-gray-50 text-gray-600 border border-gray-200" },
  on_hold: { label: "En Espera", color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-slate-50 text-slate-700 border border-slate-200" },
  medium: { label: "Media", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  high: { label: "Alta", color: "bg-orange-50 text-orange-700 border border-orange-200" },
  critical: { label: "Crítica", color: "bg-red-50 text-[#ba1a1a] border border-red-200 font-semibold" },
};

export function TicketTable({ tickets }: { tickets: TicketSummary[] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm text-center">
        <p className="text-sm font-semibold text-gray-500">No hay tickets registrados</p>
        <p className="text-xs text-gray-400 mt-1">Los nuevos incidentes aparecerán en esta lista.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {tickets.map((ticket) => {
          const status = statusConfig[ticket.status] || { label: ticket.status, color: "bg-gray-50 text-gray-600 border border-gray-200" };
          const priority = priorityConfig[ticket.priority] || { label: ticket.priority, color: "bg-gray-50 text-gray-600 border border-gray-200" };
          
          return (
            <div 
              key={ticket.id} 
              className="bg-white p-5 rounded-xl border border-[#c6c6cd] shadow-sm hover:shadow-md transition-all duration-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#131b2e]">
                  <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:text-[#0051d5] transition-colors">
                    {ticket.ticketNumber}
                  </Link>
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${priority.color}`}>
                  {priority.label}
                </span>
              </div>
              
              <div>
                <Link 
                  href={`/dashboard/tickets/${ticket.id}`} 
                  className="font-semibold text-sm text-gray-700 hover:text-[#0051d5] transition-colors block leading-snug"
                >
                  {ticket.subject}
                </Link>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Intl.DateTimeFormat('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date(ticket.createdAt))}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${status.color}`}>
                  {status.label}
                </span>
                <Link 
                  href={`/dashboard/tickets/${ticket.id}`} 
                  className="text-[11px] font-bold text-[#0051d5] hover:text-[#003fb3] uppercase tracking-wider transition-colors"
                >
                  Ver Detalles →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white rounded-xl border border-[#c6c6cd] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-600">
            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-[#c6c6cd] font-bold">
              <tr>
                <th scope="col" className="px-6 py-4">
                  ID / Número
                </th>
                <th scope="col" className="px-6 py-4">
                  Asunto
                </th>
                <th scope="col" className="px-6 py-4">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4">
                  Prioridad
                </th>
                <th scope="col" className="px-6 py-4">
                  Fecha de Reporte
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || { label: ticket.status, color: "bg-gray-50 text-gray-600 border border-gray-200" };
                const priority = priorityConfig[ticket.priority] || { label: ticket.priority, color: "bg-gray-50 text-gray-600 border border-gray-200" };
                
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-[#131b2e] whitespace-nowrap">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:text-[#0051d5] transition-colors">
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 max-w-xs md:max-w-md truncate">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="font-semibold text-gray-700 group-hover:text-[#0051d5] transition-colors block">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-normal">
                      {new Intl.DateTimeFormat('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(ticket.createdAt))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
