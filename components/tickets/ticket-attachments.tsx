"use client";

import { useState, useRef } from "react";
import { uploadTicketAttachment } from "@/actions/attachments";
import { Paperclip, Download, Loader2, UploadCloud, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TicketAttachments({
  ticketId,
  attachments,
  canUpload
}: {
  ticketId: string;
  attachments: {
    id: string;
    fileName: string;
    fileSize: number;
    createdAt: Date;
    uploadedBy: { name: string };
  }[];
  canUpload: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTicketAttachment(ticketId, formData);
      
      if (!result.success) {
        const errResult = result as { success: false; error: string };
        alert(errResult.error || "Error al subir el archivo");
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.refresh();
      }
    } catch (error: any) {
      alert("Error inesperado al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-xs font-bold text-[#131b2e] flex items-center gap-2 uppercase tracking-wider">
          <Paperclip size={14} className="text-[#0051d5]" /> Adjuntos ({attachments.length})
        </h2>
        
        {canUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200 bg-white hover:bg-gray-50 text-[#0051d5] hover:text-[#003fb3] transition-colors"
            >
              {isUploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
              {isUploading ? "Subiendo..." : "Adjuntar"}
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-4">No hay archivos adjuntos</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-[#f8fafc] hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-2 bg-white rounded-md text-[#0051d5]/70 shadow-sm shrink-0 border border-gray-100">
                  <FileIcon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#131b2e] truncate" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {formatSize(attachment.fileSize)} • {attachment.uploadedBy.name}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="opacity-0 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 text-gray-400 hover:text-[#0051d5] hover:bg-white hover:border hover:border-gray-200"
              >
                <a href={`/api/tickets/${ticketId}/attachments/${attachment.id}`} download>
                  <Download size={12} />
                  <span className="sr-only">Descargar</span>
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
