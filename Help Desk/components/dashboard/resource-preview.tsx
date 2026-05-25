import Link from "next/link";
import { getActiveResources } from "@/actions/resources";
import { FileText, Download, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function ResourcePreview({ role }: { role: string }) {
  const resources = await getActiveResources(3);
  const isAdmin = role === "admin";

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Folder size={18} className="text-indigo-600" />
          Centro de Recursos
        </h3>
        {isAdmin && (
          <Link 
            href="/dashboard/resources/manage" 
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Gestionar
          </Link>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
            <FileText size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Sin recursos disponibles</p>
            <p className="text-xs text-gray-500 mt-1">
              {isAdmin ? "Sube manuales o formatos para tu equipo." : "Pronto habrá material de consulta."}
            </p>
            {isAdmin && (
              <Link 
                href="/dashboard/resources/manage" 
                className="mt-4 text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors"
              >
                Subir archivo
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-all group">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={resource.title}>
                    {resource.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span className="truncate">{resource.fileName}</span>
                    <span>•</span>
                    <span>{resource.fileSize ? formatBytes(resource.fileSize) : "N/A"}</span>
                  </div>
                </div>
                <a 
                  href={resource.fileUrl} 
                  download 
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Descargar archivo"
                >
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>
        )}

        {resources.length > 0 && (
          <div className="mt-auto pt-4 flex justify-center">
            <Link 
              href="/dashboard/resources"
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Ver todos los recursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
