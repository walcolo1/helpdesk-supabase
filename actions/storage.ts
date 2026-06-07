"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, getAttachmentsBucket } from "@/lib/supabase-admin";

/**
 * Obtiene el tamaño de un bucket de almacenamiento de Supabase de forma recursiva.
 */
async function getBucketSize(bucketName: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  let totalSize = 0;

  const listFolder = async (path: string = "") => {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 100,
      offset: 0,
    });

    if (error) {
      console.error(`[storage] Error listando archivos en bucket ${bucketName} ruta "${path}":`, error.message);
      return;
    }

    if (!data) return;

    for (const item of data) {
      // En Supabase, las carpetas no tienen id o no tienen metadata
      if (!item.id && !item.metadata) {
        const folderPath = path ? `${path}/${item.name}` : item.name;
        await listFolder(folderPath);
      } else if (item.metadata) {
        totalSize += item.metadata.size || 0;
      }
    }
  };

  try {
    await listFolder();
    return totalSize;
  } catch (err: any) {
    console.error(`[storage] Excepción calculando tamaño de bucket ${bucketName}:`, err.message || err);
    return 0;
  }
}

/**
 * Obtiene el resumen de almacenamiento: DB, buckets, cuota y cálculos derivados.
 */
export async function getStorageOverview() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }

  // 1. Tamaño de la Base de Datos (PostgreSQL)
  let dbSize: number | null = null;
  try {
    const result = await prisma.$queryRaw<{ size: bigint }[]>`
      SELECT pg_database_size(current_database())::bigint AS size
    `;
    if (result && result[0]) {
      dbSize = Number(result[0].size);
    }
  } catch (err) {
    console.error("[storage] pg_database_size no disponible o sin permisos en DB:", err);
  }

  // 2. Tamaño de Buckets en Supabase Storage
  const [resourcesSize, attachmentsSize] = await Promise.all([
    getBucketSize("resources"),
    getBucketSize(getAttachmentsBucket()),
  ]);

  // 3. Cuota Configurada
  const quotaSetting = await prisma.systemSetting.findUnique({
    where: { key: "storage_quota_mb" },
  });
  const quotaMb = quotaSetting ? Number(quotaSetting.value) : 500; // Valor por defecto 500 MB

  // Sumar todo
  const dbBytes = dbSize || 0;
  const totalUsedBytes = dbBytes + resourcesSize + attachmentsSize;

  return {
    dbSize: dbSize, // bytes o null
    resourcesSize, // bytes
    attachmentsSize, // bytes
    totalUsedBytes, // bytes
    quotaMb, // megabytes
    success: true,
  };
}

/**
 * Actualiza la cuota de almacenamiento en la tabla SystemSetting.
 */
export async function updateStorageQuota(quotaMb: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }

  if (quotaMb <= 0 || isNaN(quotaMb)) {
    throw new Error("La cuota debe ser un número positivo");
  }

  await prisma.systemSetting.upsert({
    where: { key: "storage_quota_mb" },
    update: { value: String(quotaMb) },
    create: {
      key: "storage_quota_mb",
      value: String(quotaMb),
      description: "Capacidad de almacenamiento de cuota en MB para la aplicación",
    },
  });

  revalidatePath("/dashboard/storage");
  return { success: true };
}

/**
 * Obtiene tickets candidatos para eliminación en base a filtros aplicados.
 */
export async function getOldTicketsForCleanup(filters?: {
  olderThanOneYear?: boolean;
  isClosed?: boolean;
  isResolved?: boolean;
  hasAttachments?: boolean;
  searchQuery?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }

  const where: any = {};

  if (filters?.olderThanOneYear) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    where.createdAt = { lt: cutoffDate };
  }

  if (filters?.isClosed) {
    where.status = { in: ["closed", "auto_closed"] };
  } else if (filters?.isResolved) {
    where.status = "resolved";
  }

  if (filters?.hasAttachments) {
    where.attachments = { some: {} };
  }

  if (filters?.searchQuery) {
    let cleanSearch = filters.searchQuery.trim();
    // Normalizar TCK-60001
    const matchTck = cleanSearch.match(/^tck-?(\d*)/i);
    if (matchTck) {
      const digits = matchTck[1] || "";
      cleanSearch = digits ? `TCK-${digits}` : "TCK-";
    }
    where.ticketNumber = { contains: cleanSearch, mode: "insensitive" };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy: { select: { name: true } },
      attachments: { select: { fileSize: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tickets.map((t) => {
    const attachmentCount = t.attachments.length;
    const attachmentSize = t.attachments.reduce((sum, att) => sum + att.fileSize, 0);

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      status: t.status,
      creatorName: t.createdBy.name,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      attachmentCount,
      attachmentSize,
    };
  });
}

/**
 * Elimina manualmente de forma selectiva un conjunto de tickets.
 * Borra primero sus adjuntos del bucket Supabase Storage, y luego remueve
 * en cascada y en orden transaccional todos los registros asociados en la base de datos.
 */
export async function deleteSelectedTickets(ticketIds: string[]) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }

  if (!ticketIds || ticketIds.length === 0) {
    return { success: false, error: "No se proporcionaron identificadores de tickets" };
  }

  // 1. Obtener detalles de tickets y sus adjuntos
  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ticketIds } },
    select: {
      id: true,
      ticketNumber: true,
      attachments: {
        select: {
          filePath: true,
        },
      },
    },
  });

  const filePaths = tickets.flatMap((t) =>
    t.attachments.map((att) => att.filePath).filter(Boolean)
  );

  let storageDeletedCount = 0;
  const storageErrors: string[] = [];

  // 2. Borrar del bucket attachments en Supabase Storage
  if (filePaths.length > 0) {
    try {
      const supabase = getSupabaseAdmin();
      const bucket = getAttachmentsBucket();
      const { error, data } = await supabase.storage.from(bucket).remove(filePaths);

      if (error) {
        console.error("[storage:deleteSelectedTickets] Error en Supabase Storage:", error.message);
        storageErrors.push(error.message);
      } else {
        storageDeletedCount = data?.length || filePaths.length;
      }
    } catch (err: any) {
      console.error("[storage:deleteSelectedTickets] Excepción de almacenamiento:", err.message || err);
      storageErrors.push(err.message || String(err));
    }
  }

  // 3. Auditoría en registros de servidor
  const adminName = session.user.name || "Administrador";
  for (const t of tickets) {
    console.log(
      `[AUDITORÍA] El administrador ${adminName} eliminó manualmente el ticket [${t.ticketNumber}] desde gestión de almacenamiento.`
    );
  }

  // 4. Eliminar registros en base de datos en orden seguro por transacciones
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

  revalidatePath("/dashboard/storage");
  revalidatePath("/dashboard/tickets");

  return {
    success: true,
    ticketsDeleted: tickets.length,
    attachmentsDeleted: filePaths.length,
    storageDeleted: storageDeletedCount,
    errors: storageErrors.length > 0 ? storageErrors : null,
  };
}
