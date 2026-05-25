"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Iniciando sesión..." : "Iniciar Sesión"}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-4">
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
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input id="password" type="password" name="password" required />
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
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
