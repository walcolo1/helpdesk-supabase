import { getTicketById } from "@/actions/tickets";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Tag, Layers, Clock, CalendarDays, AlertCircle, Pencil } from "lucide-react";
import { TicketHistoryTimeline } from "@/components/tickets/ticket-history-timeline";
import { TicketCommentForm } from "@/components/tickets/ticket-comment-form";
import { TicketCommentsList } from "@/components/tickets/ticket-comments-list";
import { TicketResolutionForm } from "@/components/tickets/ticket-resolution-form";
import { TicketUserConfirmClose } from "@/components/tickets/ticket-user-confirm-close";
import { TicketSLABadge } from "@/components/tickets/ticket-sla-badge";
import { TicketAttachments } from "@/components/tickets/ticket-attachments";
import { TicketAssigner } from "@/components/tickets/ticket-assigner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── Config de etiquetas visuales (mismo criterio que TicketTable) ─────────────
const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  open:         { label: "Abierto",                    dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  in_progress:  { label: "En Progreso",                dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  waiting_user: { label: "Espera de Usuario",          dot: "bg-purple-500",  badge: "bg-purple-50 text-purple-700 ring-purple-200" },
  resolved:     { label: "Resuelto — Pend. Cierre",    dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  tracking:     { label: "Seguimiento — Pend. Cierre", dot: "bg-teal-500",    badge: "bg-teal-50 text-teal-700 ring-teal-200" },
  closed:       { label: "Cerrado",                    dot: "bg-gray-400",    badge: "bg-gray-50 text-gray-600 ring-gray-200" },
  auto_closed:  { label: "Auto Cerrado",               dot: "bg-gray-400",    badge: "bg-gray-50 text-gray-600 ring-gray-200" },
  on_hold:      { label: "En Espera",                  dot: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};


const priorityConfig: Record<string, { label: string; badge: string }> = {
  low:      { label: "Baja",     badge: "bg-slate-50 text-slate-600 ring-slate-200" },
  medium:   { label: "Media",    badge: "bg-blue-50 text-blue-600 ring-blue-200" },
  high:     { label: "Alta",     badge: "bg-orange-50 text-orange-700 ring-orange-200" },
  critical: { label: "Crítica",  badge: "bg-red-50 text-red-700 ring-red-200" },
};

function formatDate(date: Date | null | undefined, withTime = true) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(date));
}

// ── Sub-componente: Card de metadato ──────────────────────────────────────────
function MetaCard({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
      <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const [session, ticket, agents] = await Promise.all([
    auth(),
    getTicketById(params.id),
    prisma.user.findMany({
      where: { role: { in: ["admin", "agent"] } },
      select: { id: true, name: true }
    }),
  ]);

  if (!ticket) notFound();

  const role = session?.user?.role ?? "";
  const isPrivileged = role === "admin" || role === "agent";
  const isOwner = ticket.createdById === session?.user?.id;
  const canEdit = isPrivileged || isOwner;

  const status   = statusConfig[ticket.status]   ?? { label: ticket.status,   dot: "bg-gray-400",    badge: "bg-gray-50 text-gray-600 ring-gray-200" };
  const priority = priorityConfig[ticket.priority] ?? { label: ticket.priority, badge: "bg-gray-50 text-gray-600 ring-gray-200" };

  const visibleComments = isPrivileged
    ? ticket.comments
    : ticket.comments.filter(c => !c.isInternal);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">

      {/* ─ Cabecera ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Mis Tickets
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</span>
      </div>

      {searchParams?.error === "attachments_failed" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p>El ticket fue creado, pero uno o más adjuntos no pudieron cargarse.</p>
        </div>
      )}

      {/* ─ Título y badges ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{ticket.subject}</h1>
          <p className="text-sm text-gray-400 mt-1">ID: {ticket.ticketNumber}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {/* Priority badge */}
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${priority.badge}`}>
            {priority.label}
          </span>
          {/* SLA Badge */}
          <TicketSLABadge 
            slaDeadline={ticket.slaDeadline} 
            resolvedAt={ticket.resolvedAt} 
            status={ticket.status} 
          />
          {/* Edit button */}
          {canEdit && (
            <Link
              href={`/dashboard/tickets/${ticket.id}/edit`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <Pencil size={13} />
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─ Columna principal (descripción) ─────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Descripción */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Descripción</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Notas de Resolución (si existen) */}
          {(ticket.resolvedAt || ticket.closedAt) && ticket.resolutionNotes && (
            <Card className="border-emerald-100 bg-emerald-50/20 dark:bg-emerald-900/10 dark:border-emerald-900/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Solución y Resolución</h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-500 mt-1 whitespace-pre-wrap">
                      {ticket.resolutionNotes}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-emerald-600/70 dark:text-emerald-500/50">
                      <span>Resuelto por: {ticket.resolvedBy?.name || ticket.closedBy?.name}</span>
                      <span>Fecha: {formatDate(ticket.resolvedAt || ticket.closedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario de Resolución (solo agentes/admin) */}
          {isPrivileged && ticket.status !== "closed" && ticket.status !== "auto_closed" && (
            <TicketResolutionForm ticketId={ticket.id} currentStatus={ticket.status} />
          )}

          {/* Confirmación de cierre para el usuario final (resolved o tracking) */}
          {!isPrivileged && isOwner &&
            (ticket.status === "resolved" || ticket.status === "tracking") && (
            <TicketUserConfirmClose
              ticketId={ticket.id}
              currentStatus={ticket.status}
              resolvedBy={ticket.resolvedBy?.name || ticket.closedBy?.name || undefined}
              resolvedAt={ticket.resolvedAt || undefined}
            />
          )}

          {/* Comentarios */}
          <div className="flex flex-col gap-6">
            <TicketCommentsList comments={visibleComments} currentUserId={session?.user?.id} />
            <TicketCommentForm ticketId={ticket.id} isPrivileged={isPrivileged} />
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Historial de Actividad</h2>
            <TicketHistoryTimeline history={ticket.history} />
          </div>

        </div>

        {/* ─ Columna lateral (metadata) ──────────────────────────── */}
        <div className="flex flex-col gap-6">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-700">Información del Ticket</h2>

            <MetaCard icon={<Layers size={16} />} label="Categoría">
              {ticket.service.category.name}
            </MetaCard>

            <MetaCard icon={<Tag size={16} />} label="Servicio">
              {ticket.service.name}
            </MetaCard>

            <MetaCard icon={<User size={16} />} label="Creado por">
              <span>{ticket.createdBy.name}</span>
              {ticket.createdBy.department && (
                <p className="text-xs text-gray-400 font-normal mt-0.5">{ticket.createdBy.department}</p>
              )}
            </MetaCard>

            <MetaCard icon={<User size={16} />} label="Asignado a">
              {isPrivileged ? (
                <TicketAssigner ticketId={ticket.id} currentAssignedToId={ticket.assignedToId} agents={agents} />
              ) : (
                ticket.assignedTo ? (
                  <>
                    <span>{ticket.assignedTo.name}</span>
                    {ticket.assignedTo.department && (
                      <p className="text-xs text-gray-400 font-normal mt-0.5">{ticket.assignedTo.department}</p>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 font-normal">Sin asignar</span>
                )
              )}
            </MetaCard>

            <MetaCard icon={<CalendarDays size={16} />} label="Creado">
              {formatDate(ticket.createdAt)}
            </MetaCard>

            <MetaCard icon={<Clock size={16} />} label="Última actualización">
              {formatDate(ticket.updatedAt)}
            </MetaCard>

            {ticket.slaDeadline && (
              <MetaCard icon={<AlertCircle size={16} />} label="Vencimiento SLA">
                {formatDate(ticket.slaDeadline)}
              </MetaCard>
            )}

            {ticket.resolvedAt && (
              <MetaCard icon={<Clock size={16} />} label="Resuelto en">
                {formatDate(ticket.resolvedAt)}
              </MetaCard>
            )}
          </div>

          {/* Adjuntos */}
          <TicketAttachments 
            ticketId={ticket.id}
            attachments={ticket.attachments}
            canUpload={!!session?.user}
          />

        </div>
      </div>
    </div>
  );
}
