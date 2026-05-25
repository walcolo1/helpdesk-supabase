import { TicketSummary } from "@/actions/tickets";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "En Progreso", color: "bg-amber-100 text-amber-800" },
  waiting_user: { label: "Espera de Usuario", color: "bg-purple-100 text-purple-800" },
  resolved: { label: "Resuelto — Pend. Cierre", color: "bg-emerald-100 text-emerald-800" },
  tracking: { label: "Seguimiento", color: "bg-teal-100 text-teal-800" },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-800" },
  auto_closed: { label: "Auto Cerrado", color: "bg-gray-100 text-gray-800" },
  on_hold: { label: "En Espera", color: "bg-indigo-100 text-indigo-800" },
};


const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-slate-100 text-slate-800" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-800" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-800" },
};

export function TicketTable({ tickets }: { tickets: TicketSummary[] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">No hay tickets registrados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                ID / Número
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Asunto
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Prioridad
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || { label: ticket.status, color: "bg-gray-100 text-gray-800" };
              const priority = priorityConfig[ticket.priority] || { label: ticket.priority, color: "bg-gray-100 text-gray-800" };
              
              return (
                <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/tickets/${ticket.id}`} className="block hover:underline">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
  );
}
