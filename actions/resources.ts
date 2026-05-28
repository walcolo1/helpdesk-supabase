"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, getStorageBucket } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/csv",
];

const SIGNED_URL_EXPIRES_IN = 60 * 10; // 10 minutos

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function createResource(
  prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return { error: "No autorizado." };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!title || !file || file.size === 0) {
      return { error: "El título y el archivo son obligatorios." };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: "El archivo supera el límite de 10 MB." };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "El tipo de archivo no está permitido." };
    }

    // Generar ruta segura en Storage
    const safeFileName = sanitizeFilename(file.name);
    const storagePath = `${Date.now()}-${safeFileName}`;

    // Subir a Supabase Storage
    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      return { error: "Error al subir el archivo al storage." };
    }

    // Guardar referencia en base de datos (fileUrl guarda el storagePath)
    try {
      await prisma.resource.create({
        data: {
          title,
          description,
          fileName: file.name,
          fileUrl: storagePath, // storagePath, no URL pública
          fileType: file.type,
          fileSize: file.size,
          isActive: true,
          createdById: session.user.id,
        },
      });
    } catch (dbError) {
      console.error("Prisma failed to save resource reference. Cleaning up uploaded storage file...", dbError);
      try {
        await supabase.storage.from(bucket).remove([storagePath]);
      } catch (cleanupError) {
        console.error("Failed to cleanup storage file after database error:", cleanupError);
      }
      throw dbError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/resources");
    revalidatePath("/dashboard/resources/manage");

    return { success: "Recurso creado exitosamente." };
  } catch (error) {
    console.error("Error creating resource:", error);
    return { error: "Ocurrió un error al subir el archivo." };
  }
}

export async function toggleResourceStatus(resourceId: string, currentStatus: boolean) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado.");
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/resources/manage");
}

export async function deleteResource(resourceId: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado.");
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw new Error("Recurso no encontrado.");
  }

  // Eliminar de Supabase Storage primero
  try {
    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucket();
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([resource.fileUrl]); // fileUrl contiene el storagePath

    if (storageError) {
      console.warn("No se pudo eliminar el archivo del storage:", storageError.message);
      // Continuamos para al menos eliminar el registro de BD
    }
  } catch (e) {
    console.warn("Error al conectar con Supabase Storage:", (e as Error).message);
  }

  // Eliminar registro de base de datos
  await prisma.resource.delete({
    where: { id: resourceId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/resources/manage");
}

/**
 * Retorna recursos activos con signed URLs para descarga privada.
 * Cada signed URL expira en SIGNED_URL_EXPIRES_IN segundos.
 */
export async function getActiveResources(limit?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const resources = await prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        createdAt: true,
      },
    });

    // Generar signed URLs para cada recurso
    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucket();

    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource) => {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(resource.fileUrl, SIGNED_URL_EXPIRES_IN);

          if (error) {
            console.error("[resources:signedUrl] createSignedUrl failed for", resource.fileName, "-", error.message);
          }

          return {
            ...resource,
            downloadUrl: error ? null : data?.signedUrl ?? null,
          };
        } catch (err) {
          console.error("[resources:signedUrl] Unexpected error for", resource.fileName, "-", (err as Error).message);
          return { ...resource, downloadUrl: null };
        }
      })
    );

    return resourcesWithUrls;
  } catch (error) {
    console.error("[resources:getActiveResources] Critical error loading resources:", error);
    throw error;
  }
}

/**
 * Retorna todos los recursos (activos e inactivos) con signed URLs.
 * Solo accesible por admins.
 */
export async function getAllResources() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });

  // Generar signed URLs para cada recurso
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();

  const resourcesWithUrls = await Promise.all(
    resources.map(async (resource) => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(resource.fileUrl, SIGNED_URL_EXPIRES_IN);

        if (error) {
          console.error("[resources:signedUrl] createSignedUrl failed for", resource.fileName, "-", error.message);
        }

        return {
          ...resource,
          downloadUrl: error ? null : data?.signedUrl ?? null,
        };
      } catch (err) {
        console.error("[resources:signedUrl] Unexpected error for", resource.fileName, "-", (err as Error).message);
        return { ...resource, downloadUrl: null };
      }
    })
  );

  return resourcesWithUrls;
}
