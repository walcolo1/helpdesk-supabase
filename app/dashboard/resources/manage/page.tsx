import { auth } from "@/auth";
import { getAllResources } from "@/actions/resources";
import { ResourceTable } from "@/components/resources/resource-table";
import { ResourceUploadForm } from "@/components/resources/resource-upload-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManageResourcesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/resources");
  }

  const resources = await getAllResources();

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full p-2">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/resources" 
          className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Recursos</h1>
          <p className="text-gray-500 mt-1">Sube y administra documentos para todos los usuarios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <ResourceUploadForm />
        </div>
        <div className="lg:col-span-2">
          <ResourceTable resources={resources} />
        </div>
      </div>
    </div>
  );
}
