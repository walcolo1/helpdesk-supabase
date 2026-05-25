import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [
    total,
    open,
    inProgress,
    waitingUser,
    resolved,
    closed,
    byPriority,
    byStatus,
    byCategory,
  ] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: "open" } }),
    prisma.ticket.count({ where: { ...where, status: "in_progress" } }),
    prisma.ticket.count({ where: { ...where, status: "waiting_user" } }),
    prisma.ticket.count({ where: { ...where, status: "resolved" } }),
    prisma.ticket.count({ where: { ...where, status: { in: ["closed", "auto_closed"] } } }),
    prisma.ticket.groupBy({ by: ["priority"], where, _count: { id: true } }),
    prisma.ticket.groupBy({ by: ["status"], where, _count: { id: true } }),
    prisma.ticket.findMany({ where, select: { service: { select: { category: { select: { name: true } } } } } }),
  ]);

  // SLA analysis
  const slaTickets = await prisma.ticket.findMany({
    where: { ...where, slaDeadline: { not: null } },
    select: { slaDeadline: true, resolvedAt: true, closedAt: true, status: true, createdAt: true },
  });
  const evaluated = slaTickets.filter(t => t.resolvedAt || t.closedAt || (t.slaDeadline && new Date() > t.slaDeadline!));
  const breached = evaluated.filter(t => {
    const done = t.resolvedAt || t.closedAt || new Date();
    return t.slaDeadline && done > t.slaDeadline;
  });
  const slaRate = evaluated.length > 0
    ? (((evaluated.length - breached.length) / evaluated.length) * 100).toFixed(1)
    : "N/A";

  // Avg resolution
  const resolvedList = await prisma.ticket.findMany({
    where: { ...where, resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  });
  const avgHours = resolvedList.length > 0
    ? (resolvedList.reduce((acc, t) => acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedList.length / 3600000).toFixed(2)
    : "N/A";

  // Category counts
  const catCounts: Record<string, number> = {};
  byCategory.forEach(t => {
    const name = t.service.category.name;
    catCounts[name] = (catCounts[name] || 0) + 1;
  });

  // Build rows
  const rows: string[][] = [
    ["RESUMEN GENERAL"],
    ["Métrica", "Valor"],
    ["Total Tickets", String(total)],
    ["Abiertos", String(open)],
    ["En Progreso", String(inProgress)],
    ["Esperando Usuario", String(waitingUser)],
    ["Resueltos", String(resolved)],
    ["Cerrados", String(closed)],
    [""],
    ["SLA"],
    ["Tickets evaluados con SLA", String(evaluated.length)],
    ["Tickets vencidos", String(breached.length)],
    ["Tasa de cumplimiento SLA", `${slaRate}%`],
    ["Tiempo promedio de resolución (h)", avgHours],
    [""],
    ["POR PRIORIDAD"],
    ["Prioridad", "Cantidad"],
    ...byPriority.map(p => [p.priority, String(p._count.id)]),
    [""],
    ["POR ESTADO"],
    ["Estado", "Cantidad"],
    ...byStatus.map(s => [s.status, String(s._count.id)]),
    [""],
    ["POR CATEGORÍA"],
    ["Categoría", "Cantidad"],
    ...Object.entries(catCounts).map(([name, count]) => [name, String(count)]),
  ];

  const csv = rows.map(r => r.map(escapeCsvCell).join(",")).join("\n");
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metricas_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
