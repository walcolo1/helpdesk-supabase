"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error: any) {
    if (error?.message?.includes('Account expired') || error?.cause?.err?.message?.includes('Account expired')) {
      return 'Tu cuenta ha expirado. Por favor, contacta a un administrador.';
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciales inválidas.';
        default:
          return 'Algo salió mal.';
      }
    }
    throw error;
  }
}

export async function register(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "agent") {
      return "No autorizado para crear usuarios.";
    }

    const data = Object.fromEntries(formData);
    const { name, email, expiresAt } = data;

    if (!name || !email) {
      return 'El nombre y el correo son requeridos.';
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email as string },
    });

    if (existingUser) {
      return 'El correo ya está registrado.';
    }

    // Generar contraseña temporal segura (12 caracteres)
    const temporaryPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const expirationDate = expiresAt ? new Date(expiresAt as string) : null;

    const userRole = (data.role as string) || 'user';

    await prisma.user.create({
      data: {
        name: name as string,
        email: email as string,
        password: hashedPassword,
        expiresAt: expirationDate,
        mustChangePassword: true,
        role: userRole as any,
      },
    });

    // Enviar correo de bienvenida (best-effort: no bloquea si falla)
    try {
      await sendWelcomeEmail({
        name: name as string,
        email: email as string,
        role: userRole,
        temporaryPassword, // Contraseña en claro solo para el correo, no se loguea
      });
    } catch (emailError) {
      // El usuario fue creado, pero el correo falló — no bloqueamos el flujo
      console.warn('[register] Fallo al enviar correo de bienvenida:', (emailError as Error).message);
    }

    return "SUCCESS";
    
  } catch (error) {
    return 'Error al registrar el usuario.';
  }
}

export async function logout() {
  await signOut();
}
