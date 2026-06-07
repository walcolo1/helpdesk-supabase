import { TicketHistoryEvent } from "@/actions/tickets";

type HistoryEvent = TicketHistoryEvent;


// ── Etiquetas legibles para campos y valores ──────────────────────────────────

const fieldLabels: Record<string, string> = {
  created: "Ticket creado",
  status: "Estado",
  priority: "Prioridad",
  assignedToId: "Asignación",
  subject: "Asunto",
  description: "Descripción",
  attachment: "Archivo Adjunto",
  auto_assignment: "Autoasignación",
};

const statusLabels: Record<string, string> = {
  open: "Abierto",
  in_progress: "En Progreso",
  waiting_user: "Espera de Usuario",
  resolved: "Resuelto — Pendiente Cierre",
  tracking: "Seguimiento Largo Plazo",
  closed: "Cerrado",
  auto_closed: "Auto Cerrado",
  on_hold: "En Espera",
};


const priorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  agent: "Agente",
  user: "Usuario",
};

function translateValue(field: string, value: string | null): string {
  if (!value) return "Sin asignar";
  if (field === "status") return statusLabels[value] ?? value;
  if (field === "priority") return priorityLabels[value] ?? value;
  return value;
}

// ── Icono del timeline por tipo de cambio ─────────────────────────────────────

function DotIcon({ field }: { field: string }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white text-xs font-bold";

  if (field === "created") return <span className={`${base} bg-emerald-100 text-emerald-700`}>✦</span>;
  if (field === "status") return <span className={`${base} bg-blue-100 text-blue-700`}>≡</span>;
  if (field === "priority") return <span className={`${base} bg-orange-100 text-orange-700`}>!</span>;
  if (field === "assignedToId" || field === "auto_assignment") return <span className={`${base} bg-purple-100 text-purple-700`}>→</span>;
  if (field === "subject" || field === "description") return <span className={`${base} bg-gray-100 text-gray-700`}>T</span>;
  if (field === "attachment") return <span className={`${base} bg-blue-50 text-blue-600`}>@</span>;
  return <span className={`${base} bg-gray-100 text-gray-500`}>·</span>;
}

// ── Descripción de cada evento ────────────────────────────────────────────────

function HistoryEventText({ event }: { event: HistoryEvent }) {
  const { field, oldValue, newValue, user } = event;
  const actor = user.name;

  if (field === "auto_assignment") {
    return (
      <span>
        El ticket fue asignado automáticamente al agente{" "}
        <strong className="font-medium text-gray-900">{newValue}</strong> por interacción operativa.
      </span>
    );
  }

  if (field === "created") {
    return (
      <span>
        <strong className="font-medium text-gray-900">{actor}</strong>{" "}
        creó el ticket
      </span>
    );
  }

  if (field === "assignedToId") {
    const from = oldValue ? <span className="font-medium text-gray-700">{oldValue}</span> : <em className="text-gray-400">Sin asignar</em>;
    const to = newValue ? <span className="font-medium text-gray-700">{newValue}</span> : <em className="text-gray-400">Sin asignar</em>;
    return (
      <span>
        <strong className="font-medium text-gray-900">{actor}</strong>{" "}
        cambió la asignación de {from} → {to}
      </span>
    );
  }

  if (field === "description" || field === "subject") {
    return (
      <span>
        <strong className="font-medium text-gray-900">{actor}</strong>{" "}
        actualizó la <strong className="font-medium">{fieldLabels[field] ?? field}</strong>
      </span>
    );
  }

  if (field === "attachment") {
    return (
      <span>
        <strong className="font-medium text-gray-900">{actor}</strong>{" "}
        adjuntó el archivo <strong className="font-medium text-blue-600">{newValue}</strong>
      </span>
    );
  }

  return (
    <span>
      <strong className="font-medium text-gray-900">{actor}</strong>{" "}
      cambió <strong className="font-medium">{fieldLabels[field] ?? field}</strong>{" "}
      de <span className="line-through text-gray-400">{translateValue(field, oldValue ?? null)}</span>{" "}
      → <span className="font-medium text-gray-800">{translateValue(field, newValue ?? null)}</span>
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function TicketHistoryTimeline({ history }: { history: HistoryEvent[] }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Aún no hay actividad registrada.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {history.map((item, idx) => {
        const isLast = idx === history.length - 1;
        return (
          <li key={item.id} className="flex gap-4">
            {/* Línea vertical + icono */}
            <div className="flex flex-col items-center">
              <DotIcon field={item.field} />
              {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            {/* Contenido */}
            <div className={`pb-6 pt-1 min-w-0 ${isLast ? "" : ""}`}>
              <p className="text-sm text-gray-600 leading-snug">
                <HistoryEventText event={item} />
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Intl.DateTimeFormat("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(item.createdAt))}
                {" · "}
                <span className="capitalize">{roleLabels[item.user.role] ?? item.user.role}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
