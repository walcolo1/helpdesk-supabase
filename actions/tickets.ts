"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus, Prisma } from "@prisma/client";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { saveAttachmentRecord } from "./attachments";

// ── Lectura ────────────────────────────────────────────────────────────────────

export async function getTickets() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const role = session.user.role;
  const userId = session.user.id;

  const where: any = {};
  if (role === "user") {
    where.createdById = userId;
  } else if (role === "agent") {
    where.assignedToId = userId;
  }

  return await prisma.ticket.findMany({
    where,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export type TicketSummary = Awaited<ReturnType<typeof getTickets>>[0];

export async function getTicketQueue(filters?: { status?: string; categoryId?: string; assignedToId?: string }) {
  const where: any = {
    status: { in: [TicketStatus.open, TicketStatus.in_progress, TicketStatus.waiting_user, TicketStatus.on_hold] }
  };



  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (role === "agent" && userId) {
    // Agents only see their own tickets, regardless of filters
    where.assignedToId = userId;
  } else {
    // Admins can see filtered tickets
    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId === "null" ? null : filters.assignedToId;
    }
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.categoryId) where.categoryId = filters.categoryId;

  return await prisma.ticket.findMany({
    where,
    include: {
      assignedTo: { select: { name: true } },
      service: { select: { name: true } },
    },
    orderBy: [
      { priority: "desc" }, 
      { slaDeadline: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export type TicketQueueItem = Awaited<ReturnType<typeof getTicketQueue>>[0];

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    service: { include: { category: true } },
    createdBy:  { select: { id: true, name: true, email: true, department: true } },
    assignedTo: { select: { id: true, name: true, email: true, department: true } },
    history: {
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    },
    comments: {
      include: {
        user: { select: { id: true, name: true, role: true, image: true } },
      },
    },
    resolvedBy: { select: { id: true, name: true } },
    closedBy:   { select: { id: true, name: true } },
    attachments: {
      include: {
        uploadedBy: { select: { id: true, name: true } }
      }
    },
  },
}>;

export type TicketHistoryEvent = Prisma.TicketHistoryGetPayload<{
  include: {
    user: { select: { id: true, name: true, role: true } },
  },
}>;

export type TicketDetail = TicketWithRelations | null;

export async function getTicketById(id: string): Promise<TicketDetail> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      service: { include: { category: true } },
      createdBy:  { select: { id: true, name: true, email: true, department: true } },
      assignedTo: { select: { id: true, name: true, email: true, department: true } },
      history: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, role: true, image: true } },
        },
      },
      resolvedBy: { select: { id: true, name: true } },
      closedBy:   { select: { id: true, name: true } },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true } }
        }
      },
    },
  }) as TicketDetail;

  if (!ticket) return null;

  const role = session.user.role;
  const userId = session.user.id;

  const isAdmin = role === "admin";
  const isOwner = ticket.createdById === userId;
  const isAssignedAgent = role === "agent" && ticket.assignedToId === userId;

  if (!isAdmin && !isOwner && !isAssignedAgent) {
    return null;
  }

  return ticket;
}






// ── Helpers internos ──────────────────────────────────────────────────────────

/** Inserta un registro de historial. No lanza si falla — auditoría no crítica. */
async function logHistory(
  ticketId: string,
  userId: string,
  field: string,
  oldValue: string | null | undefined,
  newValue: string | null | undefined
) {
  try {
    await prisma.ticketHistory.create({
      data: { ticketId, userId, field, oldValue: oldValue ?? null, newValue: newValue ?? null },
    });
  } catch {
    // La auditoría es best-effort; no bloquea el flujo principal
  }
}

// ── Creación ──────────────────────────────────────────────────────────────────

export async function createTicket(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  try {
    const subject    = formData.get("subject")    as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const serviceId  = formData.get("serviceId")  as string;
    const priority   = formData.get("priority")   as "low" | "medium" | "high" | "critical";

    if (!subject || !description || !categoryId || !serviceId) {
      return { error: "Faltan campos obligatorios" };
    }

    let ticketNumber = "";
    let ticket;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const seqResult = await prisma.$queryRaw<{ nextval: bigint }[]>`
          SELECT nextval('ticket_number_seq')::bigint
        `;
        const nextNumber = Number(seqResult[0].nextval);
        ticketNumber = `TCK-${nextNumber}`;

        // Calcular SLA
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        const slaDeadline = service ? new Date(Date.now() + service.slaHours * 60 * 60 * 1000) : null;

        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            subject,
            description,
            categoryId,
            serviceId,
            priority: priority || "medium",
            createdById: session.user.id,
            status: TicketStatus.open,
            slaDeadline,
          },
        });
        break;
      } catch (error: any) {
        if (error.code === "P2002") {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          console.warn(`Unique constraint violation on ticketNumber: ${ticketNumber}. Retrying... Attempt ${attempts}/${maxAttempts}`);
          continue;
        }
        throw error;
      }
    }

    if (!ticket) {
      throw new Error("No se pudo crear el ticket. Conflicto de numeración.");
    }

    // Registro de actividad: creación
    await logHistory(ticket.id, session.user.id, "created", null, ticketNumber);

    // Procesar adjuntos
    let attachmentFailed = false;
    const attachments = formData.getAll("attachments") as File[];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.name && file.size > 0) {
          try {
            const res = await saveAttachmentRecord(ticket.id, session.user.id, file);
            if (!res.success) {
              attachmentFailed = true;
              console.error("[tickets:create:attachments] Error al guardar adjunto:", res.error);
            }
          } catch (err) {
            attachmentFailed = true;
            console.error("[tickets:create:attachments] Excepción al guardar adjunto:", err);
          }
        }
      }
    }

    revalidatePath("/dashboard/tickets");
    if (attachmentFailed) {
      redirect(`/dashboard/tickets/${ticket.id}?error=attachments_failed`);
    } else {
      redirect(`/dashboard/tickets/${ticket.id}`);
    }
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) throw error;
    console.error("Error al crear ticket:", error);
    return { error: error.message || "Error interno al crear el ticket" };
  }
}

// ── Resolución y Cierre ────────────────────────────────────────────────────────

export async function resolveTicket(ticketId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const role = session.user.role;
  if (role !== "admin" && role !== "agent") throw new Error("Sin autorización");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { status: true } });
  if (!ticket) throw new Error("Ticket no encontrado");

  const notes = formData.get("notes") as string;
  const isTracking = formData.get("isTracking") === "true";
  const now = new Date();

  const newStatus = isTracking ? TicketStatus.tracking : TicketStatus.resolved;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: newStatus,

      resolvedAt: now,
      resolvedById: session.user.id,
      resolutionNotes: notes,
    },
  });

  await logHistory(ticketId, session.user.id, "status", ticket.status, newStatus);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function closeTicket(ticketId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const role = session.user.role;
  if (role !== "admin" && role !== "agent") throw new Error("Sin autorización");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { status: true } });
  if (!ticket) throw new Error("Ticket no encontrado");

  const notes = formData.get("notes") as string;
  const now = new Date();

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.closed,

      closedAt: now,
      closedById: session.user.id,
      resolutionNotes: notes,
    },
  });

  await logHistory(ticketId, session.user.id, "status", ticket.status, TicketStatus.closed);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function userConfirmCloseTicket(ticketId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { status: true, createdById: true } });
  if (!ticket) throw new Error("Ticket no encontrado");

  // El usuario que lo creó o un administrador pueden cerrarlo
  if (ticket.createdById !== session.user.id && session.user.role !== "admin") {
    throw new Error("No autorizado para confirmar el cierre de este ticket");
  }

  if (ticket.status !== "resolved" && ticket.status !== "tracking") {
    throw new Error("El ticket no está en un estado válido para cierre");
  }

  const now = new Date();

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.closed,
      closedAt: now,
      closedById: session.user.id,
    },
  });

  await logHistory(ticketId, session.user.id, "status", ticket.status, TicketStatus.closed);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

// ── Edición ───────────────────────────────────────────────────────────────────

export async function updateTicket(ticketId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket no encontrado");

  const role         = session.user.role;
  const isOwner      = ticket.createdById === session.user.id;
  const isPrivileged = role === "admin" || role === "agent";

  if (!isPrivileged && !isOwner) throw new Error("Sin autorización para editar este ticket");

  const newStatus      = formData.get("status")       as string | null;
  const newPriority    = formData.get("priority")     as string | null;
  const newAssignedToId = formData.get("assignedToId") as string | null;
  const newSubject     = formData.get("subject")      as string | null;
  const newDescription = formData.get("description")  as string | null;

  const data: Record<string, unknown> = {};

  // Actividad a registrar
  const activities: Array<{ field: string; old: string | null; new: string | null }> = [];

  if (newPriority && newPriority !== ticket.priority) {
    data.priority = newPriority;
    activities.push({ field: "priority", old: ticket.priority, new: newPriority });
  }

  // Permitir al dueño o a privilegiados cambiar título y descripción
  if (newSubject && newSubject !== ticket.subject) {
    data.subject = newSubject;
    activities.push({ field: "subject", old: ticket.subject, new: newSubject });
  }

  if (newDescription && newDescription !== ticket.description) {
    data.description = newDescription;
    activities.push({ field: "description", old: ticket.description, new: newDescription });
  }

  if (isPrivileged) {
    if (newStatus && newStatus !== ticket.status) {
      data.status = newStatus;
      activities.push({ field: "status", old: ticket.status, new: newStatus });
    }

    const resolvedAssignee = newAssignedToId === "" ? null : (newAssignedToId ?? undefined);
    if (resolvedAssignee !== undefined && resolvedAssignee !== ticket.assignedToId) {
      data.assignedToId = resolvedAssignee;
      activities.push({ field: "assignedToId", old: ticket.assignedToId, new: resolvedAssignee });
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.ticket.update({ where: { id: ticketId }, data });

    for (const a of activities) {
      await logHistory(ticketId, session.user.id, a.field, a.old, a.new);
    }
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  redirect(`/dashboard/tickets/${ticketId}`);
}

export async function quickAssignTicket(ticketId: string, newAssignedToId: string | null) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const role = session.user.role;
  if (role !== "admin" && role !== "agent") {
    throw new Error("Sin autorización para reasignar este ticket");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket no encontrado");

  if (newAssignedToId !== ticket.assignedToId) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedToId: newAssignedToId },
    });

    await logHistory(ticketId, session.user.id, "assignedToId", ticket.assignedToId, newAssignedToId);
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets/queue");
}

// ── Comentarios ────────────────────────────────────────────────────────────────

export async function createComment(ticketId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { createdById: true, assignedToId: true }
  });

  if (!ticket) throw new Error("Ticket no encontrado");

  const role = session.user.role;
  const userId = session.user.id;

  const isAdmin = role === "admin";
  const isOwner = ticket.createdById === userId;
  const isAssignedAgent = role === "agent" && ticket.assignedToId === userId;

  if (!isAdmin && !isOwner && !isAssignedAgent) {
    throw new Error("No autorizado");
  }

  const content = formData.get("content") as string;
  const isInternal = formData.get("isInternal") === "true";

  if (!content || content.trim() === "") {
    throw new Error("El comentario no puede estar vacío");
  }

  await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: session.user.id,
      content,
      isInternal,
    },
  });

  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

// ── Búsqueda ──────────────────────────────────────────────────────────────────

export async function searchTicket(query: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  if (!query || query.trim() === "") return { error: "Búsqueda vacía" };

  const cleanQuery = query.trim();

  // Buscar por número de ticket exacto o parcial (como TCK-...) o ID
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { ticketNumber: { contains: cleanQuery } },
        { id: cleanQuery },
      ],
    },
    select: {
      id: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!ticket) return { error: "Ticket no encontrado" };

  const role = session.user.role;
  const userId = session.user.id;

  const isAdmin = role === "admin";
  const isOwner = ticket.createdById === userId;
  const isAssignedAgent = role === "agent" && ticket.assignedToId === userId;

  if (!isAdmin && !isOwner && !isAssignedAgent) {
    return { error: "Acceso denegado: no tienes permisos para ver este ticket" };
  }

  return { success: true, redirectUrl: `/dashboard/tickets/${ticket.id}` };
}
