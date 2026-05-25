import { getCategories, getServices } from "@/actions/catalog";
import { CatalogManager } from "@/components/catalog/catalog-manager";
import { LayoutGrid } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const [categories, services] = await Promise.all([
    getCategories(),
    getServices()
  ]);

  return (
    <div className="flex flex-col gap-8 p-1 sm:p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Gestión Operativa</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Catálogo de Servicios
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configura las categorías y servicios disponibles para los usuarios finales.
        </p>
      </div>

      <CatalogManager categories={categories} services={services} />
    </div>
  );
}
