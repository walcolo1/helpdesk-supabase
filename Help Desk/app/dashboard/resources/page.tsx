import { auth } from "@/auth";
import { getActiveResources } from "@/actions/resources";
import { FileText, Download } from "lucide-react";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const resources = await getActiveResources();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Recursos</h1>
        <p className="text-gray-500 mt-1">Manuales, formatos y plantillas corporativas.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay recursos</h3>
            <p className="text-gray-500 mt-1">Aún no se ha subido ningún documento al sistema.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {resources.map((resource) => (
              <div key={resource.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-gray-500 mt-1 mb-2">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-mono bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {resource.fileName}
                      </span>
                      <span>{resource.fileSize ? formatBytes(resource.fileSize) : "N/A"}</span>
                      <span>•</span>
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <a 
                    href={resource.fileUrl} 
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download size={16} />
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
