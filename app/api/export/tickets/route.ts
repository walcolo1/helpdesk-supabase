import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function escapeCsvCell(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "agent")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      service:    { include: { category: { select: { name: true } } } },
      createdBy:  { select: { name: true, email: true, department: true } },
      assignedTo: { select: { name: true, email: true } },
      resolvedBy: { select: { name: true } },
      closedBy:   { select: { name: true } },
    },

  });

  const headers = [
    "Número", "Asunto", "Estado", "Prioridad",
    "Categoría", "Servicio", "SLA (horas)", "Vencimiento SLA",
    "Creado por", "Email Creador", "Departamento",
    "Asignado a", "Email Agente",
    "Creado en", "Actualizado en",
    "Resuelto en", "Resuelto por",
    "Cerrado en", "Cerrado por",
    "Tiempo Resolución (horas)", "Cumplió SLA",
    "Notas de Resolución",
  ];

  const rows = tickets.map(t => {
    const resolutionTime = t.resolvedAt
      ? ((t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)).toFixed(2)
      : "";
    const metSLA = t.slaDeadline && t.resolvedAt
      ? t.resolvedAt <= t.slaDeadline ? "Sí" : "No"
      : "";

    return [
      t.ticketNumber,
      t.subject,
      t.status,
      t.priority,
      (t.service as any)?.category?.name ?? "",
      t.service?.name ?? "",
      t.service?.slaHours != null ? String(t.service.slaHours) : "",
      formatDate(t.slaDeadline),
      t.createdBy.name,
      t.createdBy.email,
      t.createdBy.department ?? "",
      t.assignedTo?.name ?? "",
      t.assignedTo?.email ?? "",
      formatDate(t.createdAt),
      formatDate(t.updatedAt),
      formatDate(t.resolvedAt),
      t.resolvedBy?.name ?? "",
      formatDate(t.closedAt),
      t.closedBy?.name ?? "",
      resolutionTime,
      metSLA,
      t.resolutionNotes ?? "",
    ].map(escapeCsvCell).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
