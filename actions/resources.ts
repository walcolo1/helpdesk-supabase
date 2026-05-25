"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/csv"
];

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

    const uploadDir = path.join(process.cwd(), "public", "uploads", "resources");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename to avoid overwrites
    const ext = path.extname(file.name);
    const base = path.basename(sanitizeFilename(file.name), ext);
    const uniqueFileName = `${base}_${crypto.randomBytes(4).toString("hex")}${ext}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/resources/${uniqueFileName}`;

    await prisma.resource.create({
      data: {
        title,
        description,
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        isActive: true,
        createdById: session.user.id,
      },
    });

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

  // Attempt to delete physical file
  try {
    const uploadDir = path.join(process.cwd(), "public");
    const filePath = path.join(uploadDir, resource.fileUrl);
    // basic security check to avoid directory traversal
    if (filePath.startsWith(uploadDir)) {
      await fs.unlink(filePath);
    }
  } catch (e) {
    console.warn(`No se pudo eliminar el archivo físico: ${resource.fileUrl}`);
  }

  await prisma.resource.delete({
    where: { id: resourceId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/resources/manage");
}

export async function getActiveResources(limit?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    return await prisma.resource.findMany({
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
      }
    });
  } catch (error) {
    console.error("Error in getActiveResources:", error);
    return [];
  }
}

export async function getAllResources() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  return prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  });
}
