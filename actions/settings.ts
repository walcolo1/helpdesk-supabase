"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSystemSetting(key: string) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`[settings:getSystemSetting] Error fetching key ${key}:`, error);
    return null;
  }
}

export async function updateSystemSetting(key: string, value: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { error: "El valor es requerido." };
  }

  if (key === "password_recovery_email") {
    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      return { error: "Formato de correo electrónico inválido." };
    }
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: trimmedValue },
      create: {
        key,
        value: trimmedValue,
        description: key === "password_recovery_email" ? "Correo de soporte para recuperación de contraseña" : null,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/forgot-password");
    return { success: "Configuración guardada correctamente." };
  } catch (error) {
    console.error("[settings:updateSystemSetting] Error:", error);
    return { error: "Error al guardar la configuración." };
  }
}
