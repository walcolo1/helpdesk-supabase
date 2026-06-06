"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Lock, Ticket, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      className="w-full bg-[#0051d5] hover:bg-[#003fb3] text-white font-medium py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2" 
      type="submit" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Iniciando sesión...
        </>
      ) : (
        "Iniciar Sesión"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-[#f8fafc] relative overflow-hidden">
      {/* Patrón geométrico decorativo */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
      
      {/* Efectos de luz blur */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0051d5]/10 rounded-full blur-3xl z-0" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#0051d5]/10 rounded-full blur-3xl z-0" />

      <Card className="relative z-10 w-full max-w-md bg-white border border-[#c6c6cd] shadow-lg rounded-2xl overflow-hidden py-6">
        <CardHeader className="text-center flex flex-col items-center pb-2">
          <div className="p-3 bg-[#0051d5]/10 text-[#0051d5] rounded-2xl mb-4 border border-[#0051d5]/20">
            <Ticket size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-[#131b2e] tracking-tight">ServiceDesk Pro</CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            Plataforma Corporativa de Gestión de Incidentes
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={dispatch} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Correo Electrónico
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={16} />
                </span>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="ejemplo@empresa.com"
                  required
                  className="pl-10 h-11 border-gray-300 rounded-lg focus-visible:ring-[#0051d5] focus-visible:border-[#0051d5] transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contraseña
                </Label>
                <Link href="/forgot-password" className="text-[11px] font-semibold text-[#0051d5] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={16} />
                </span>
                <Input 
                  id="password" 
                  type="password" 
                  name="password" 
                  placeholder="••••••••"
                  required 
                  className="pl-10 h-11 border-gray-300 rounded-lg focus-visible:ring-[#0051d5] focus-visible:border-[#0051d5] transition-all"
                />
              </div>
            </div>
            
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#ba1a1a] font-medium">
                {errorMessage}
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="pt-2 pb-0 flex flex-col gap-2">
          <div className="text-xs text-center w-full text-gray-500">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-[#0051d5] font-semibold hover:underline transition-colors">
              Regístrate aquí
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
