"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { Menu, X, LayoutDashboard, Ticket, Users, LogOut, BarChart3, Zap, List, Settings } from "lucide-react";
import type { Session } from "next-auth";

export function MobileSidebar({ session }: { session: Session }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const role = session?.user?.role;
  const name = session?.user?.name || "Usuario";

  // Close sidebar on path changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getLinkClass = (href: string) => {
    const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
    return `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
      isActive 
        ? "bg-[#0051d5] text-white shadow-sm shadow-[#0051d5]/20" 
        : "text-gray-600 hover:text-[#131b2e] hover:bg-gray-50"
    }`;
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-[#131b2e] focus:outline-none"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white border-r border-[#c6c6cd] flex flex-col z-50 transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#c6c6cd]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0051d5] flex items-center justify-center text-white">
              <Ticket size={18} />
            </div>
            <h2 className="font-bold text-sm text-[#131b2e] tracking-tight uppercase">ServiceDesk Pro</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-600 hover:text-[#131b2e] focus:outline-none"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* User profile */}
        <div className="p-5 border-b border-gray-100 bg-[#f8fafc]/50">
          <p className="text-sm font-bold text-[#131b2e] truncate">{name}</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
            {role === 'admin' ? 'Administrador' : role === 'agent' ? 'Agente Soporte' : 'Usuario Final'}
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#0051d5] hover:text-[#003fb3] font-semibold transition-colors uppercase tracking-wider"
          >
            <Settings size={14} />
            Mi Perfil
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <Link href="/dashboard" className={getLinkClass("/dashboard")}>
            <LayoutDashboard size={18} />
            Inicio
          </Link>
          <Link href="/dashboard/tickets" className={getLinkClass("/dashboard/tickets")}>
            <Ticket size={18} />
            Mis Tickets
          </Link>

          {role === 'admin' && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administración</p>
              </div>
              <Link href="/dashboard/users" className={getLinkClass("/dashboard/users")}>
                <Users size={18} />
                Gestión de Usuarios
              </Link>
              <Link href="/dashboard/catalog" className={getLinkClass("/dashboard/catalog")}>
                <List size={18} />
                Catálogo de Servicios
              </Link>
              <Link href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>
                <Settings size={18} />
                Configuración
              </Link>
            </>
          )}

          {(role === 'admin' || role === 'agent') && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operaciones</p>
              </div>
              <Link href="/dashboard/tickets/queue" className={getLinkClass("/dashboard/tickets/queue")}>
                <Zap size={18} />
                Cola Operativa
              </Link>
              <Link href="/dashboard/reports" className={getLinkClass("/dashboard/reports")}>
                <BarChart3 size={18} />
                Reportes & Analytics
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-bold text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
