import { getUsers } from "@/actions/users";
import { UserTable } from "@/components/users/user-table";
import { UserFilters } from "@/components/users/user-filters";
import { Users as UsersIcon, ShieldAlert, UserPlus, Globe } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UsersClientControls } from "@/components/users/users-client-controls";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams
}: {
  searchParams: { query?: string; role?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.mustChangePassword === true) {
    redirect("/dashboard/profile?mustChange=1");
  }

  const role = session.user.role;
  const isAdmin = role === "admin";
  const isAgent = role === "agent";

  // Solo admin y agent pueden ver la lista de usuarios
  if (!isAdmin && !isAgent) {
    redirect("/dashboard");
  }

  const query = searchParams.query || "";
  const roleFilter = searchParams.role || "all";
  
  const users = await getUsers(query, roleFilter);

  return (
    <div className="flex flex-col gap-8 p-1 sm:p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <UsersIcon className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Configuración de Sistema</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Administración de Usuarios
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestiona permisos, roles y accesos a la plataforma.
          </p>
        </div>
        
        {!isAdmin && !isAgent && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs font-medium">
            <ShieldAlert size={14} />
            <span>Vista de solo lectura (Modo Agente)</span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/dashboard/users/domains"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-[#131b2e] rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Globe size={16} className="text-[#0051d5]" />
              <span>Dominios permitidos</span>
            </Link>
          )}
          {(isAdmin || isAgent) && (
            <UsersClientControls />
          )}
        </div>
      </div>

      <div className="space-y-6">
        <UserFilters />
        <UserTable 
          users={users} 
          currentUserId={session.user.id!} 
          isAdmin={isAdmin} 
        />
      </div>
    </div>
  );
}
