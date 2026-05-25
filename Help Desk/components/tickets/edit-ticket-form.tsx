"use client";

import { updateTicket } from "@/actions/tickets";
import { TicketDetail } from "@/actions/tickets";
import Link from "next/link";
import { useTransition } from "react";

const statusOptions = [
  { value: "open",         label: "Abierto" },
  { value: "in_progress",  label: "En Progreso" },
  { value: "waiting_user", label: "Espera de Usuario" },
  { value: "resolved",     label: "Resuelto" },
  { value: "closed",       label: "Cerrado" },
  { value: "auto_closed",  label: "Auto Cerrado" },
  { value: "on_hold",      label: "Seguimiento Largo Plazo" },
];


const priorityOptions = [
  { value: "low",      label: "Baja" },
  { value: "medium",   label: "Media" },
  { value: "high",     label: "Alta" },
  { value: "critical", label: "Crítica" },
];

interface EditTicketFormProps {
  ticket: NonNullable<TicketDetail>;
  agents: { id: string; name: string; email: string }[];
  isPrivileged: boolean;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 " +
  "disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export function EditTicketForm({ ticket, agents, isPrivileged }: EditTicketFormProps) {
  const [isPending, startTransition] = useTransition();

  const action = async (formData: FormData) => {
    startTransition(async () => {
      await updateTicket(ticket.id, formData);
    });
  };

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 space-y-6">

        {/* Información de solo lectura / Título */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Ticket ID</p>
          <p className="text-sm font-semibold text-gray-900">{ticket.ticketNumber}</p>
        </div>

        {/* Asunto */}
        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium text-gray-700">
            Asunto
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            defaultValue={ticket.subject}
            className={selectClass}
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            defaultValue={ticket.description}
            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 resize-y"
          />
        </div>

        {/* Prioridad — accesible para todos */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium text-gray-700">
            Prioridad
          </label>
          <select id="priority" name="priority" defaultValue={ticket.priority} className={selectClass}>
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Estado — solo admin / agent */}
        {isPrivileged && (
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Estado
            </label>
            <select id="status" name="status" defaultValue={ticket.status} className={selectClass}>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Asignación — solo admin / agent */}
        {isPrivileged && (
          <div className="space-y-2">
            <label htmlFor="assignedToId" className="text-sm font-medium text-gray-700">
              Asignado a
            </label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue={ticket.assignedToId ?? ""}
              className={selectClass}
            >
              <option value="">Sin asignar</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {!isPrivileged && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-md p-3 border border-gray-100">
            Como usuario, solo puedes modificar la prioridad de tus propios tickets. El estado y la asignación son gestionados por el equipo de soporte.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/dashboard/tickets/${ticket.id}`}
          className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
