import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { headers } from "next/headers";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (session.user.mustChangePassword === true && !pathname.startsWith("/dashboard/profile")) {
    redirect("/dashboard/profile?mustChange=1");
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar fijo */}
      <Sidebar session={session} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar superior */}
        <header className="h-16 border-b border-[#c6c6cd] bg-white flex items-center justify-between px-6 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1 sm:flex-initial">
            <MobileSidebar session={session} />
            <div className="relative w-full hidden sm:block sm:w-72 md:w-96">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar incidentes, usuarios o recursos..."
                disabled
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f8fafc] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0051d5] focus:border-[#0051d5] text-gray-700 placeholder-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0051d5]/10 flex items-center justify-center text-[#0051d5] font-semibold text-xs border border-[#0051d5]/20 select-none">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#131b2e] leading-none">{session.user.name}</p>
                <p className="text-[10px] text-gray-500 capitalize mt-1">
                  {session.user.role === 'admin' ? 'Administrador' : session.user.role === 'agent' ? 'Agente de Soporte' : 'Usuario'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
