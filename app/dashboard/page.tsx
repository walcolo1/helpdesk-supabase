import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getRecentTickets } from "@/actions/dashboard";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { ResourcePreview } from "@/components/dashboard/resource-preview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session?.user?.mustChangePassword === true) {
    redirect("/dashboard/profile?mustChange=1");
  }

  const userName = session?.user?.name || "Usuario";
  const userRole = session?.user?.role || "user";

  const [stats, recentTickets] = await Promise.all([
    getDashboardStats(),
    getRecentTickets()
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">
          Bienvenido, {userName}
        </h1>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Rol actual: {userRole === 'admin' ? 'Administrador del Sistema' : userRole === 'agent' ? 'Agente de Soporte' : 'Usuario Final'}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <DashboardStats stats={stats} role={userRole} />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2">
            <RecentTickets tickets={recentTickets} />
          </section>
          <section className="xl:col-span-1">
            <ResourcePreview role={userRole} />
          </section>
        </div>
      </div>
    </div>
  );
}