import { getSystemSetting } from "@/actions/settings";
import Link from "next/link";
import { Mail, ArrowLeft, Ticket, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const supportEmail = await getSystemSetting("password_recovery_email");

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
          <CardTitle className="text-xl font-bold text-[#131b2e] tracking-tight">Recuperación de Contraseña</CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            ServiceDesk Pro
          </CardDescription>
        </CardHeader>
        
        <CardContent className="mt-4">
          {supportEmail ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                Para restablecer tu contraseña, por favor ponte en contacto con nuestro equipo de soporte enviando un correo a:
              </p>
              
              <div className="flex items-center justify-center p-4 bg-[#f8fafc] border border-gray-200 rounded-xl hover:border-[#0051d5]/30 hover:bg-[#0051d5]/5 transition-all group">
                <a 
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-2.5 text-sm font-bold text-[#0051d5] hover:text-[#003fb3] break-all select-all"
                >
                  <Mail size={18} className="shrink-0 text-[#0051d5] group-hover:scale-110 transition-transform" />
                  {supportEmail}
                </a>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px] text-blue-700 leading-relaxed">
                <strong>Nota:</strong> Indique en el correo su nombre completo, área de trabajo y el correo electrónico institucional asociado a su cuenta.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
              <div className="flex justify-center text-[#ba1a1a]">
                <AlertTriangle size={24} />
              </div>
              <p className="text-xs font-semibold text-[#ba1a1a]">
                No hay correo de soporte configurado.
              </p>
              <p className="text-[11px] text-gray-500 leading-normal">
                Por favor, contacte directamente al administrador del sistema.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-4 pb-0">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-[#131b2e] transition-colors w-full uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
