"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Categorías
export async function getCategories() {
  return await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true }
      }
    },
    orderBy: { sortOrder: "asc" }
  });
}

export async function createCategory(data: { name: string, description?: string, color?: string, icon?: string }) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  const category = await prisma.category.create({
    data
  });

  revalidatePath("/dashboard/catalog");
  return category;
}

export async function updateCategory(id: string, data: { name?: string, description?: string, color?: string, icon?: string, isActive?: boolean }) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  const category = await prisma.category.update({
    where: { id },
    data
  });

  revalidatePath("/dashboard/catalog");
  return category;
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  // Verificar si tiene servicios
  const servicesCount = await prisma.service.count({ where: { categoryId: id } });
  if (servicesCount > 0) throw new Error("No se puede eliminar una categoría con servicios asociados.");

  await prisma.category.delete({ where: { id } });

  revalidatePath("/dashboard/catalog");
}

// Servicios
export async function getServices(categoryId?: string) {
  return await prisma.service.findMany({
    where: categoryId ? { categoryId } : {},
    include: {
      category: true
    },
    orderBy: { sortOrder: "asc" }
  });
}

export async function createService(data: { categoryId: string, name: string, description?: string, slaHours?: number, defaultPriority?: any }) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  const service = await prisma.service.create({
    data
  });

  revalidatePath("/dashboard/catalog");
  return service;
}

export async function updateService(id: string, data: { categoryId?: string, name?: string, description?: string, slaHours?: number, defaultPriority?: any, isActive?: boolean }) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  const service = await prisma.service.update({
    where: { id },
    data
  });

  revalidatePath("/dashboard/catalog");
  return service;
}

export async function deleteService(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");

  // Verificar si tiene tickets
  const ticketsCount = await prisma.ticket.count({ where: { serviceId: id } });
  if (ticketsCount > 0) throw new Error("No se puede eliminar un servicio que tiene tickets asociados.");

  await prisma.service.delete({ where: { id } });

  revalidatePath("/dashboard/catalog");
}
