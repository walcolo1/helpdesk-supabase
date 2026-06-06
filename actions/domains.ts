"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAllowedDomains() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }

  return await prisma.allowedEmailDomain.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createAllowedDomain(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const rawDomain = formData.get("domain") as string;
  const description = formData.get("description") as string;

  if (!rawDomain) {
    return { error: "El dominio es requerido." };
  }

  // Normalizar: quitar espacios, convertir a minúsculas
  let domain = rawDomain.replace(/\s+/g, "").toLowerCase();

  // Quitar @ si el administrador lo escribe al inicio
  if (domain.startsWith("@")) {
    domain = domain.substring(1);
  }

  // Validaciones de formato básico de dominio
  if (!domain || domain.includes("@") || !domain.includes(".")) {
    return { error: "El formato del dominio es inválido." };
  }

  try {
    const existing = await prisma.allowedEmailDomain.findUnique({
      where: { domain },
    });

    if (existing) {
      return { error: "Este dominio ya está registrado." };
    }

    await prisma.allowedEmailDomain.create({
      data: {
        domain,
        description: description ? description.trim() : null,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/users/domains");
    return { success: "Dominio agregado correctamente." };
  } catch (error: any) {
    console.error("[domains:create]", error);
    return { error: "Error interno al agregar el dominio." };
  }
}

export async function toggleAllowedDomain(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }

  try {
    const domain = await prisma.allowedEmailDomain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new Error("Dominio no encontrado");
    }

    await prisma.allowedEmailDomain.update({
      where: { id },
      data: { isActive: !domain.isActive },
    });

    revalidatePath("/dashboard/users/domains");
  } catch (error) {
    console.error("[domains:toggle]", error);
    throw new Error("Error al alternar el estado del dominio.");
  }
}

export async function deleteAllowedDomain(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }

  try {
    await prisma.allowedEmailDomain.delete({
      where: { id },
    });

    revalidatePath("/dashboard/users/domains");
  } catch (error) {
    console.error("[domains:delete]", error);
    throw new Error("Error al eliminar el dominio.");
  }
}
