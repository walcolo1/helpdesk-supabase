"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";
import { validatePasswordStrength, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password-validation";

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
    const data = Object.fromEntries(formData);
    const name = data.name as string;
    const email = (data.email as string || "").trim().toLowerCase();
    const password = data.password as string;
    const confirmPassword = data.confirmPassword as string;

    if (!name || !email || !password || !confirmPassword) {
      return 'Todos los campos son requeridos.';
    }

    if (!email.includes("@")) {
      return 'Formato de correo electrónico inválido.';
    }

    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }

    if (!validatePasswordStrength(password)) {
      return PASSWORD_REQUIREMENTS_MESSAGE;
    }

    // Extraer dominio después de @
    const domain = email.substring(email.lastIndexOf("@") + 1);
    if (!domain) {
      return 'El correo debe tener un dominio válido.';
    }

    // Buscar en AllowedEmailDomain
    const allowedDomain = await prisma.allowedEmailDomain.findFirst({
      where: {
        domain: domain,
        isActive: true,
      },
    });

    if (!allowedDomain) {
      return 'El correo ingresado no pertenece a un dominio institucional autorizado. Use un correo institucional permitido o contacte al administrador.';
    }

    // Validar correo duplicado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return 'El correo ya está registrado.';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isActive: true,
        mustChangePassword: false,
        role: "user",
      },
    });

    return "SUCCESS";
  } catch (error: any) {
    console.error("[auth:register]", error);
    return 'Error al registrar el usuario.';
  }
}

export async function logout() {
  await signOut();
}
