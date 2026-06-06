"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const role = session.user.role;
    const userId = session.user.id;
    const isAgentOrAdmin = role === "admin" || role === "agent";

    const baseWhere = isAgentOrAdmin ? {} : { createdById: userId };

    // Optimized count retrieval: 2 queries instead of 5
    const [statusGroups, critical] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
        where: baseWhere,
      }),
      prisma.ticket.count({
        where: {
          ...baseWhere,
          priority: "critical",
        },
      }),
    ]);

    // Parse counts from status groups
    let total = 0;
    let open = 0;
    let inProgress = 0;
    let resolvedOrClosed = 0;

    for (const group of statusGroups) {
      const count = group._count.id;
      total += count;
      
      if (group.status === "open") {
        open = count;
      } else if (group.status === "in_progress") {
        inProgress = count;
      } else if (["resolved", "closed", "auto_closed"].includes(group.status)) {
        resolvedOrClosed += count;
      }
    }

    return {
      total,
      open,
      inProgress,
      critical,
      resolvedOrClosed,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      critical: 0,
      resolvedOrClosed: 0,
    };
  }
}

export async function getRecentTickets() {
  try {
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
  } catch (error) {
    console.error("Error in getRecentTickets:", error);
    return [];
  }
}
