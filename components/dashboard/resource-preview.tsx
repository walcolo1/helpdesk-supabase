import Link from "next/link";
import { getActiveResources } from "@/actions/resources";
import { FileText, Download, Folder } from "lucide-react";

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
    <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#131b2e] flex items-center gap-2 uppercase tracking-wider">
          <Folder size={16} className="text-[#0051d5]" />
          Centro de Recursos
        </h3>
        {isAdmin && (
          <Link 
            href="/dashboard/resources/manage" 
            className="text-xs text-[#0051d5] hover:text-[#003fb3] font-semibold transition-colors uppercase tracking-wider"
          >
            Gestionar
          </Link>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
            <FileText size={32} className="text-gray-300 mb-3" />
            <p className="text-xs font-semibold text-[#131b2e]">Sin recursos disponibles</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {isAdmin ? "Sube manuales o formatos para tu equipo." : "Pronto habrá material de consulta."}
            </p>
            {isAdmin && (
              <Link 
                href="/dashboard/resources/manage" 
                className="mt-4 text-[10px] font-bold bg-[#0051d5]/10 text-[#0051d5] px-3 py-1.5 rounded-lg hover:bg-[#0051d5]/20 transition-colors uppercase tracking-wider border border-[#0051d5]/10"
              >
                Subir archivo
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
                <div className="p-2 bg-[#0051d5]/10 text-[#0051d5] rounded-lg shrink-0 border border-[#0051d5]/10">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#131b2e] truncate group-hover:text-[#0051d5] transition-colors" title={resource.title}>
                    {resource.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span className="truncate max-w-[120px] font-mono">{resource.fileName}</span>
                    <span>•</span>
                    <span>{resource.fileSize ? formatBytes(resource.fileSize) : "N/A"}</span>
                  </div>
                </div>
                {resource.downloadUrl ? (
                  <a 
                    href={resource.downloadUrl} 
                    download={resource.fileName} 
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-400 hover:text-[#0051d5] hover:bg-[#0051d5]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Descargar archivo"
                  >
                    <Download size={14} />
                  </a>
                ) : (
                  <span
                    className="p-1.5 text-gray-300 rounded-md cursor-not-allowed"
                    title="Enlace de descarga no disponible. Verifica la configuración de Supabase Storage."
                  >
                    <Download size={14} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {resources.length > 0 && (
          <div className="pt-4 flex justify-center border-t border-gray-100 mt-4">
            <Link 
              href="/dashboard/resources"
              className="text-[10px] font-bold text-gray-400 hover:text-[#0051d5] transition-colors uppercase tracking-wider"
            >
              Ver todos los recursos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
