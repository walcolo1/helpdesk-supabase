import Link from "next/link";
import { logout } from "@/actions/auth";
import { LayoutDashboard, Ticket, Users, LogOut, BarChart3, Zap, List, Settings } from "lucide-react";
import type { Session } from "next-auth";

export function Sidebar({ session }: { session: Session }) {
  const role = session?.user?.role;
  const name = session?.user?.name || "Usuario";

  return (
    <aside className="w-64 bg-white border-r flex flex-col hidden md:flex h-full">
      <div className="h-16 flex items-center px-6 border-b">
        <h2 className="font-bold text-xl text-gray-800">ITSM Helpdesk</h2>
      </div>

      <div className="p-4 border-b bg-gray-50/50">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 capitalize">{role}</p>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1.5 mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <Settings size={12} />
          Mi Perfil
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <LayoutDashboard size={18} />
          Inicio
        </Link>
        <Link 
          href="/dashboard/tickets" 
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Ticket size={18} />
          Mis Tickets
        </Link>
        
        {role === 'admin' && (
          <>
            <Link 
              href="/dashboard/users" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Users size={18} />
              Gestión de Usuarios
            </Link>
            <Link 
              href="/dashboard/catalog" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <List size={18} />
              Catálogo de Servicios
            </Link>
          </>
        )}

        {(role === 'admin' || role === 'agent') && (
          <Link 
            href="/dashboard/tickets/queue" 
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Zap size={18} />
            Cola Operativa
          </Link>
        )}

        {(role === 'admin' || role === 'agent') && (
          <Link 
            href="/dashboard/reports" 
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <BarChart3 size={18} />
            Reportes & Analytics
          </Link>
        )}
      </nav>

      <div className="p-4 border-t mt-auto">
        <form action={logout}>
          <button type="submit" className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <LogOut size={18}/>
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
