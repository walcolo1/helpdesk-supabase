import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, getAttachmentsBucket } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Validar header Authorization
    const authHeader = req.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Calcular fecha límite (1 año atrás)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    // 3. Buscar tickets que cumplen la condición de antigüedad
    const ticketsToDelete = await prisma.ticket.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
      select: {
        id: true,
        attachments: {
          select: {
            filePath: true,
          },
        },
      },
    });

    const deletedCount = ticketsToDelete.length;

    if (deletedCount > 0) {
      const ticketIds = ticketsToDelete.map((t) => t.id);
      const filePaths = ticketsToDelete.flatMap((t) =>
        t.attachments.map((att) => att.filePath).filter(Boolean)
      );

      // 4. Intentar borrar archivos del almacenamiento Supabase Storage
      if (filePaths.length > 0) {
        try {
          const supabase = getSupabaseAdmin();
          const bucket = getAttachmentsBucket();
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (storageError) {
            console.error(
              "[cleanup-cron] Error al borrar archivos de Supabase Storage:",
              storageError.message
            );
          }
        } catch (storageException: any) {
          console.error(
            "[cleanup-cron] Excepción al eliminar archivos de almacenamiento:",
            storageException?.message || storageException
          );
        }
      }

      // 5. Eliminar registros en base de datos en orden seguro por transacciones
      await prisma.$transaction([
        prisma.ticketAttachment.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticketComment.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticketHistory.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticket.deleteMany({
          where: { id: { in: ticketIds } },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      deletedTickets: deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error: any) {
    console.error("[cleanup-cron] Error general durante limpieza:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
