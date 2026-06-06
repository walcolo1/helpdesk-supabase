"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { LayoutDashboard, Ticket, Users, LogOut, BarChart3, Zap, List, Settings } from "lucide-react";
import type { Session } from "next-auth";

export function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const role = session?.user?.role;
  const name = session?.user?.name || "Usuario";

  const getLinkClass = (href: string) => {
    const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
    return `flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
      isActive 
        ? "bg-[#0051d5] text-white shadow-sm shadow-[#0051d5]/20" 
        : "text-gray-500 hover:text-[#131b2e] hover:bg-gray-50"
    }`;
  };

  return (
    <aside className="w-[260px] bg-white border-r border-[#c6c6cd] flex flex-col hidden md:flex h-full shrink-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-[#c6c6cd] gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0051d5] flex items-center justify-center text-white">
          <Ticket size={18} />
        </div>
        <h2 className="font-bold text-sm text-[#131b2e] tracking-tight uppercase">ServiceDesk Pro</h2>
      </div>

      <div className="p-4 border-b border-gray-100 bg-[#f8fafc]/50">
        <p className="text-xs font-bold text-[#131b2e] truncate">{name}</p>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
          {role === 'admin' ? 'Administrador' : role === 'agent' ? 'Agente Soporte' : 'Usuario Final'}
        </p>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1.5 mt-2.5 text-[10px] text-[#0051d5] hover:text-[#003fb3] font-semibold transition-colors uppercase tracking-wider"
        >
          <Settings size={12} />
          Mi Perfil
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        <Link 
          href="/dashboard" 
          className={getLinkClass("/dashboard")}
        >
          <LayoutDashboard size={16} />
          Inicio
        </Link>
        <Link 
          href="/dashboard/tickets" 
          className={getLinkClass("/dashboard/tickets")}
        >
          <Ticket size={16} />
          Mis Tickets
        </Link>
        
        {role === 'admin' && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Administración</p>
            </div>
            <Link 
              href="/dashboard/users" 
              className={getLinkClass("/dashboard/users")}
            >
              <Users size={16} />
              Gestión de Usuarios
            </Link>
            <Link 
              href="/dashboard/catalog" 
              className={getLinkClass("/dashboard/catalog")}
            >
              <List size={16} />
              Catálogo de Servicios
            </Link>
            <Link 
              href="/dashboard/settings" 
              className={getLinkClass("/dashboard/settings")}
            >
              <Settings size={16} />
              Configuración
            </Link>
          </>
        )}

        {(role === 'admin' || role === 'agent') && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Operaciones</p>
            </div>
            <Link 
              href="/dashboard/tickets/queue" 
              className={getLinkClass("/dashboard/tickets/queue")}
            >
              <Zap size={16} />
              Cola Operativa
            </Link>
            <Link 
              href="/dashboard/reports" 
              className={getLinkClass("/dashboard/reports")}
            >
              <BarChart3 size={16} />
              Reportes & Analytics
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100 mt-auto">
        <form action={logout}>
          <button type="submit" className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left text-xs font-bold text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={16}/>
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
