import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getRecentTickets } from "@/actions/dashboard";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { ResourcePreview } from "@/components/dashboard/resource-preview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

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
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full p-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Bienvenido, {userName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 capitalize">
          Rol actual: {userRole === 'admin' ? 'Administrador' : userRole === 'agent' ? 'Agente de Soporte' : 'Usuario Final'}
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