"use client";

import { useState, useTransition } from "react";
import { updateSystemSetting } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setMessage({ type: "error", text: "El correo electrónico es requerido." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setMessage({ type: "error", text: "Formato de correo electrónico inválido." });
      return;
    }

    startTransition(async () => {
      const result = await updateSystemSetting("password_recovery_email", trimmedEmail);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.success) {
        setMessage({ type: "success", text: result.success });
      }
    });
  };

  return (
    <Card className="bg-white border border-[#c6c6cd] shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-sm font-bold text-[#131b2e] uppercase tracking-wider">Recuperación de Contraseña</CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Configure el correo electrónico de soporte técnico al que se dirigirán los usuarios que soliciten restablecer su contraseña.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-4">
          {message && (
            <div 
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 font-medium border ${
                message.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-[#ba1a1a]"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-[#ba1a1a] shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="recoveryEmail" className="text-xs font-semibold text-[#131b2e] uppercase tracking-wider block">
              Correo de Soporte
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={16} />
              </span>
              <Input
                id="recoveryEmail"
                type="email"
                placeholder="soporte@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
                className="pl-10 h-10 border-gray-300 rounded-lg focus-visible:ring-[#0051d5] focus-visible:border-[#0051d5] transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              Este correo se mostrará públicamente en la página de "¿Olvidaste tu contraseña?".
            </p>
          </div>
        </CardContent>

        <CardFooter className="bg-[#f8fafc] border-t border-gray-100 px-6 py-4 flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-[#0051d5] hover:bg-[#003fb3] text-white text-xs font-semibold uppercase tracking-wider gap-2 h-9 px-4 rounded-lg shadow-sm shadow-[#0051d5]/10"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={14} />
                Guardar Configuración
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
