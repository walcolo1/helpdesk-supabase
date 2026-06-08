"use server";

import { auth, update } from "@/auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validatePasswordStrength, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password-validation";

export async function changeUserPassword(
  prevState: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "No hay una sesión activa." };
  }

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Todos los campos son obligatorios." };
  }

  if (!validatePasswordStrength(newPassword)) {
    return { error: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La confirmación no coincide con la nueva contraseña." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.password) {
    return { error: "Usuario no encontrado o no verificado." };
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    return { error: "La contraseña actual es incorrecta." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  try {
    await update({ mustChangePassword: false });
  } catch (err) {
    // ignore
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  if (session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  return {
    success: "Contraseña actualizada correctamente.",
  };
}
