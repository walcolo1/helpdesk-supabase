import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStorageOverview, getOldTicketsForCleanup } from "@/actions/storage";
import { StorageClient } from "@/components/storage/storage-client";

export const dynamic = "force-dynamic";

export default async function StoragePage() {
  const session = await auth();

  // Bloquear acceso si no es admin
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  // Carga inicial
  const [overview, candidates] = await Promise.all([
    getStorageOverview(),
    getOldTicketsForCleanup({ olderThanOneYear: false, isClosed: false, isResolved: false, hasAttachments: false }),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-[#131b2e] dark:text-white">
          Gestión de Almacenamiento
        </h1>
        <p className="text-gray-500 text-sm">
          Monitorea el espacio de base de datos, buckets de Supabase y elimina manualmente de forma selectiva tickets antiguos o cerrados.
        </p>
      </div>

      <StorageClient initialOverview={overview} initialCandidates={candidates} />
    </div>
  );
}
