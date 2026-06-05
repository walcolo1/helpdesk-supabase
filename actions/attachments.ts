"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, getAttachmentsBucket } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// Extensiones permitidas
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "pdf",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "zip", "mp4", "mp3",
];

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Sube un archivo a Supabase Storage y crea el registro en Prisma.
 * storagePath guardado en filePath del modelo TicketAttachment.
 */
export async function saveAttachmentRecord(ticketId: string, userId: string, file: File) {
  if (file.size === 0) return { success: false, error: "El archivo está vacío" };
  if (file.size > 10 * 1024 * 1024)
    return { success: false, error: "El archivo excede el tamaño máximo (10MB)" };

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext))
    return { success: false, error: `Tipo de archivo no permitido (.${ext})` };

  const supabase = getSupabaseAdmin();
  const bucket = getAttachmentsBucket();

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `tickets/${ticketId}/${Date.now()}-${safeFileName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Subir a Supabase Storage (bucket privado)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("[attachments:upload] Error al subir a Supabase Storage:", uploadError);
    return {
      success: false,
      error: "No se pudo subir el archivo. Revise configuración de almacenamiento.",
    };
  }

  // Guardar registro en Prisma; si falla, borrar el archivo subido (evitar huérfanos)
  let attachment;
  try {
    attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId,
        uploadedById: userId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        filePath: storagePath, // storagePath en lugar de ruta local
      },
    });
  } catch (prismaError) {
    console.error("[attachments:upload] Error al guardar en base de datos:", prismaError);
    // Limpiar archivo subido para no dejarlo huérfano
    await supabase.storage.from(bucket).remove([storagePath]);
    return { success: false, error: "No se pudo registrar el archivo en la base de datos." };
  }

  // Registro de auditoría (best-effort)
  try {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
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

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No se proporcionó ningún archivo" };

    const result = await saveAttachmentRecord(ticketId, session.user.id, file);
    if (!result.success) return result;

    revalidatePath(`/dashboard/tickets/${ticketId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[attachments:upload] Error inesperado:", error);
    return {
      success: false,
      error: "No se pudo subir el archivo. Revise configuración de almacenamiento.",
    };
  }
}
