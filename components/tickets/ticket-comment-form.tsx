"use client";

import { createComment } from "@/actions/tickets";
import { useRef, useTransition } from "react";
import { MessageSquare, Lock, Send } from "lucide-react";

interface TicketCommentFormProps {
  ticketId: string;
  isPrivileged: boolean;
}

export function TicketCommentForm({ ticketId, isPrivileged }: TicketCommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await createComment(ticketId, formData);
        formRef.current?.reset();
      } catch (error) {
        console.error("Error al crear comentario:", error);
        alert("No se pudo guardar el comentario.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6 mt-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare size={16} />
        Añadir comentario
      </h3>
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <textarea
          name="content"
          required
          placeholder="Escribe un comentario..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 resize-none"
        />
        
        <div className="flex items-center justify-between gap-4">
          {isPrivileged ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInternal"
                name="isInternal"
                value="true"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="isInternal" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Lock size={12} />
                Comentario interno (solo agentes)
              </label>
            </div>
          ) : (
            <div />
          )}
          
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {isPending ? "Enviando..." : (
              <>
                <Send size={14} />
                Comentar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
