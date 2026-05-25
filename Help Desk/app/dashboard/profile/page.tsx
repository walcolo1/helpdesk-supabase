import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { User, Mail, Shield, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900">
          {value || <span className="text-gray-400 font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  agent: "Agente de Soporte",
  user: "Usuario Final",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { mustChange?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const mustChange = searchParams?.mustChange === "1" || session.user.mustChangePassword;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona la información y seguridad de tu cuenta.
        </p>
      </div>

      {/* Banner de cambio obligatorio */}
      {mustChange && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Debes cambiar tu contraseña antes de continuar
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Esta es tu primera sesión. Por seguridad, establece una contraseña personal antes de acceder al sistema.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta de información */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
            <User size={18} />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Información de Cuenta</h2>
        </div>
        <div className="px-6 divide-y divide-gray-50">
          <InfoRow icon={<User size={15} />} label="Nombre" value={user.name} />
          <InfoRow icon={<Mail size={15} />} label="Correo Electrónico" value={user.email} />
          <InfoRow
            icon={<Shield size={15} />}
            label="Rol"
            value={roleLabels[user.role ?? ""] ?? user.role}
          />
        </div>
      </div>

      {/* Formulario de cambio de contraseña */}
      <ChangePasswordForm />
    </div>
  );
}
