"use client";

import { useFormState, useFormStatus } from "react-dom";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Creando usuario..." : "Crear Usuario"}
    </Button>
  );
}

export default function RegisterForm() {
  const [errorMessage, dispatch] = useFormState(register, undefined);
  const router = useRouter();

  useEffect(() => {
    if (errorMessage === "SUCCESS") {
      router.push("/dashboard/users");
      router.refresh();
    }
  }, [errorMessage, router]);

  if (errorMessage === "SUCCESS") {
    return null; // Or a loading spinner while redirecting
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Registro</CardTitle>
          <CardDescription>
            La contraseña temporal se generará automáticamente y se enviará por correo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@ejemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue="user"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="user">Usuario Final</option>
                <option value="agent">Agente de Soporte</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Fecha de Vencimiento (Opcional)</Label>
              <Input id="expiresAt" type="date" name="expiresAt" />
            </div>
            
            {errorMessage && (
              <p className="text-sm text-red-500 font-medium">
                {errorMessage}
              </p>
            )}

            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-muted-foreground">
            <Link href="/dashboard/users" className="underline">
              Volver a Usuarios
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
