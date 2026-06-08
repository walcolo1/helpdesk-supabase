"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";
import { validatePasswordStrength, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password-validation";

export async function getUsers(query?: string, role?: string) {
  const session = await auth();
  const isAgent = session?.user?.role === "agent";
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin && !isAgent) {
    throw new Error("No autorizado");
  }

  const where: any = {};
  
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { email: { contains: query } },
    ];
  }

  if (role && role !== "all") {
    where.role = role;
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      _count: {
        select: {
          ticketsAssigned: true,
          ticketsCreated: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }

  if (userId === session.user.id) {
    throw new Error("No puedes desactivar tu propia cuenta");
  }

  if (currentStatus) {
    // Intentando desactivar
    const userToDisable = await prisma.user.findUnique({ where: { id: userId } });
    if (userToDisable?.role === "admin") {
      const activeAdminsCount = await prisma.user.count({
        where: { role: "admin", isActive: true },
      });
      if (activeAdminsCount <= 1) {
        throw new Error("No puedes desactivar al único administrador activo en el sistema");
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/dashboard/users");
}

export async function updateUserRole(userId: string, newRole: "admin" | "agent" | "user") {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }

  if (newRole !== "admin") {
    // Si se está quitando el rol admin
    const userToDemote = await prisma.user.findUnique({ where: { id: userId } });
    if (userToDemote?.role === "admin") {
      const activeAdminsCount = await prisma.user.count({
        where: { role: "admin", isActive: true },
      });
      if (activeAdminsCount <= 1) {
        throw new Error("No puedes quitar el rol al único administrador activo en el sistema");
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/dashboard/users");
}

export async function resetUserPassword(
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const mustChange = formData.get("mustChangePassword") === "on";

  if (!userId || !newPassword || !confirmPassword) {
    return { error: "Todos los campos son requeridos." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  if (!validatePasswordStrength(newPassword)) {
    return { error: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  if (userId === session.user.id) {
    return { error: "Usa la configuración de perfil para cambiar tu propia contraseña" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        mustChangePassword: mustChange
      },
    });

    revalidatePath("/dashboard/users");
    return { success: "Contraseña actualizada correctamente." };
  } catch (error: any) {
    return { error: "Error al restablecer la contraseña." };
  }
}

export async function extendUserAccess(
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const userId = formData.get("userId") as string;
  const expiresAtString = formData.get("expiresAt") as string;
  const noExpiration = formData.get("noExpiration") === "on";

  if (!userId) {
    return { error: "Usuario no especificado." };
  }

  let newExpiration: Date | null = null;
  if (!noExpiration && expiresAtString) {
    const parts = expiresAtString.split("-");
    if (parts.length === 3) {
      newExpiration = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
    } else {
      newExpiration = new Date(expiresAtString);
    }
    if (isNaN(newExpiration.getTime())) {
      return { error: "Fecha de vencimiento inválida." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { expiresAt: newExpiration },
    });

    revalidatePath("/dashboard/users");
    return { success: "Fecha de vencimiento actualizada correctamente." };
  } catch (error) {
    return { error: "Error al actualizar la fecha de vencimiento." };
  }
}

export async function createUser(
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();
  const role = formData.get("role") as any;
  const department = formData.get("department") as string;
  const password = (formData.get("password") as string).trim();
  const expiresAtString = formData.get("expiresAt") as string;
  const mustChange = formData.get("mustChangePassword") === "on";

  if (!name || !email || !role || !password) {
    return { error: "Nombre, email, rol y contraseña temporal son requeridos." };
  }

  if (!validatePasswordStrength(password)) {
    return { error: PASSWORD_REQUIREMENTS_MESSAGE };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "El email ya está registrado." };
    }

    let newExpiration: Date | null = null;
    if (expiresAtString) {
      const parts = expiresAtString.split("-");
      if (parts.length === 3) {
        newExpiration = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
      } else {
        newExpiration = new Date(expiresAtString);
      }
      if (isNaN(newExpiration.getTime())) {
        return { error: "Fecha de vencimiento inválida." };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        role,
        department: department || null,
        password: hashedPassword,
        expiresAt: newExpiration,
        mustChangePassword: mustChange,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: "Usuario creado exitosamente." };
  } catch (error: any) {
    return { error: error.message || "Error al crear el usuario." };
  }
}
