"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";
import { auth } from "@/auth";

export async function getDashboardMetrics(startDate?: Date, endDate?: Date) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "agent")) {
    throw new Error("No autorizado");
  }

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Basic counts
  const totalTickets = await prisma.ticket.count({ where });
  const openTickets = await prisma.ticket.count({
    where: { ...where, status: { in: [TicketStatus.open, TicketStatus.in_progress, TicketStatus.waiting_user, TicketStatus.on_hold] } }
  });


  const resolvedTickets = await prisma.ticket.count({
    where: { ...where, status: TicketStatus.resolved }

  });
  const closedTickets = await prisma.ticket.count({
    where: { ...where, status: { in: [TicketStatus.closed, TicketStatus.auto_closed] } }
  });


  // SLA Metrics
  const ticketsWithSLA = await prisma.ticket.findMany({
    where: { 
      ...where, 
      slaDeadline: { not: null },
      OR: [
        { status: { in: [TicketStatus.resolved, TicketStatus.closed, TicketStatus.auto_closed] } },
        { slaDeadline: { lt: new Date() } }

      ]
    },
    select: {
      slaDeadline: true,
      resolvedAt: true,
      closedAt: true,
      status: true
    }
  });

  const totalSLAEvaluated = ticketsWithSLA.length;
  const slaBreached = ticketsWithSLA.filter(t => {
    const completionDate = t.resolvedAt || t.closedAt || new Date();
    return t.slaDeadline && completionDate > t.slaDeadline;
  }).length;
  
  const slaComplianceRate = totalSLAEvaluated > 0 
    ? ((totalSLAEvaluated - slaBreached) / totalSLAEvaluated) * 100 
    : 100;

  // Resolution Time (Avg in hours)
  const resolvedTicketsData = await prisma.ticket.findMany({
    where: { ...where, resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true }
  });

  let avgResolutionTime = 0;
  if (resolvedTicketsData.length > 0) {
    const totalTime = resolvedTicketsData.reduce((acc, t) => {
      return acc + (t.resolvedAt!.getTime() - t.createdAt.getTime());
    }, 0);
    avgResolutionTime = totalTime / resolvedTicketsData.length / (1000 * 60 * 60); // In hours
  }

  // Grouped metrics
  const statusDistribution = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: { id: true }
  });

  const priorityDistribution = await prisma.ticket.groupBy({
    by: ["priority"],
    where,
    _count: { id: true }
  });

  const categoryDistribution = await prisma.ticket.findMany({
    where,
    select: {
      service: {
        select: {
          category: {
            select: { name: true }
          }
        }
      }
    }
  });

  const categoryCounts: Record<string, number> = {};
  categoryDistribution.forEach(t => {
    const name = t.service.category.name;
    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
  });

  // Agent distribution
  const agentDistribution = await prisma.ticket.groupBy({
    by: ["assignedToId"],
    where: { ...where, assignedToId: { not: null } },
    _count: { id: true }
  });

  // Fetch agent names
  const agentIds = agentDistribution.map(a => a.assignedToId as string);
  const agents = await prisma.user.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true }
  });

  const agentMap = new Map(agents.map(a => [a.id, a.name]));

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    closedTickets,
    slaBreached,
    slaComplianceRate,
    avgResolutionTime,
    statusDistribution: statusDistribution.map(s => ({ name: s.status, value: s._count.id })),
    priorityDistribution: priorityDistribution.map(p => ({ name: p.priority, value: p._count.id })),
    categoryDistribution: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
    agentDistribution: agentDistribution.map(a => ({ 
      name: agentMap.get(a.assignedToId as string) || "Desconocido", 
      value: a._count.id 
    })),
  };
}
