"use client";

import { useState, useRef } from "react";
import { uploadTicketAttachment } from "@/actions/attachments";
import { Paperclip, Download, Loader2, UploadCloud, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      } else if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Paperclip size={16} /> Archivos Adjuntos ({attachments.length})
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
              className="h-8 gap-1.5"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              {isUploading ? "Subiendo..." : "Adjuntar archivo"}
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-4">No hay archivos adjuntos</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white rounded-md text-gray-400 shadow-sm shrink-0">
                  <FileIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatSize(attachment.fileSize)} • Subido por {attachment.uploadedBy.name}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="opacity-0 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
              >
                <a href={`/api/tickets/${ticketId}/attachments/${attachment.id}`} download>
                  <Download size={14} />
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
