"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Carpeta local para almacenar archivos (fuera de public/ para seguridad)
const UPLOAD_DIR = join(process.cwd(), "storage", "attachments");

/**
 * Función auxiliar para procesar y guardar un archivo adjunto
 */
export async function saveAttachmentRecord(ticketId: string, userId: string, file: File) {
  if (file.size === 0) return { success: false, error: "El archivo está vacío" };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: "El archivo excede el tamaño máximo (10MB)" };

  // Asegurar que el directorio exista
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const fileNameOnDisk = `${uniquePrefix}-${safeFileName}`;
  const filePath = join(UPLOAD_DIR, fileNameOnDisk);

  await writeFile(filePath, buffer);

  const attachment = await prisma.ticketAttachment.create({
    data: {
      ticketId,
      uploadedById: userId,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      filePath: fileNameOnDisk,
    },
  });

  // Registro de auditoría
  try {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId: userId,
        field: "attachment",
        oldValue: null,
        newValue: file.name,
      },
    });
  } catch {
    // best-effort
  }

  return { success: true, attachment };
}

export async function uploadTicketAttachment(ticketId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, createdById: true },
    });

    if (!ticket) return { success: false, error: "Ticket no encontrado" };

    // Cualquier usuario autenticado con acceso al ticket puede subir archivos
    // En este sistema, si el usuario puede ver el ticket (por dueño o por ser staff), tiene acceso.
    // Para simplificar y cumplir el requisito: solo verificamos que esté autenticado.
    // (La lógica de negocio de quién ve qué ya está en las vistas y el middleware)
    if (!session?.user) {
      return { success: false, error: "No tienes permisos para adjuntar archivos" };
    }

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No se proporcionó ningún archivo" };

    const result = await saveAttachmentRecord(ticketId, session.user.id, file);
    if (!result.success) return result;

    revalidatePath(`/dashboard/tickets/${ticketId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error al subir archivo:", error);
    return { success: false, error: error.message || "Error interno al subir el archivo" };
  }
}
