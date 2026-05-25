import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./form";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const isAuthorized = role === "admin" || role === "agent";

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center px-4">
        <div className="max-w-md p-6 bg-white dark:bg-slate-950 rounded-xl border border-red-200 dark:border-red-900 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Solo los administradores y agentes pueden crear nuevas cuentas de usuario.
          </p>
        </div>
      </div>
    );
  }

  return <RegisterForm />;
}
