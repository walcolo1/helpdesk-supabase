"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const role = session.user.role;
  const userId = session.user.id;
  const isAgentOrAdmin = role === "admin" || role === "agent";

  const baseWhere = isAgentOrAdmin ? {} : { createdById: userId };

  // Run all counts in parallel
  const [
    total,
    open,
    inProgress,
    critical,
    resolvedOrClosed
  ] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: "open" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "in_progress" } }),
    prisma.ticket.count({ where: { ...baseWhere, priority: "critical" } }),
    prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { in: ["resolved", "closed", "auto_closed"] }
      }
    }),
  ]);

  return {
    total,
    open,
    inProgress,
    critical,
    resolvedOrClosed
  };
}

export async function getRecentTickets() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const role = session.user.role;
  const userId = session.user.id;
  const isAgentOrAdmin = role === "admin" || role === "agent";

  const baseWhere = isAgentOrAdmin ? {} : { createdById: userId };

  const tickets = await prisma.ticket.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        }
      },
      assignedTo: {
        select: {
          name: true
        }
      }
    }
  });

  return tickets;
}
