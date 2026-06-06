"use client";

import { useState, useTransition } from "react";
import { resolveTicket, closeTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Clock, UserCheck } from "lucide-react";

interface TicketResolutionFormProps {
  ticketId: string;
  currentStatus: string;
}

type Mode = "resolve" | "tracking" | "close" | null;

export function TicketResolutionForm({ ticketId, currentStatus }: TicketResolutionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<Mode>(null);

  // No mostrar nada si ya está cerrado
  if (currentStatus === "closed" || currentStatus === "auto_closed") return null;

  // Si ya está resuelto/tracking, solo mostrar la opción de cerrar definitivamente
  const isAlreadyResolved = currentStatus === "resolved" || currentStatus === "tracking";

  const handleResolve = () => {
    const formData = new FormData();
    formData.append("notes", notes);
    formData.append("isTracking", "false");
    startTransition(async () => {
      await resolveTicket(ticketId, formData);
      setNotes("");
      setMode(null);
    });
  };

  const handleTracking = () => {
    const formData = new FormData();
    formData.append("notes", notes);
    formData.append("isTracking", "true");
    startTransition(async () => {
      await resolveTicket(ticketId, formData);
      setNotes("");
      setMode(null);
    });
  };

  const handleClose = () => {
    const formData = new FormData();
    formData.append("notes", notes);
    startTransition(async () => {
      await closeTicket(ticketId, formData);
      setNotes("");
      setMode(null);
    });
  };

  return (
    <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
      <div className="border-b border-gray-100 pb-2 mb-3">
        <h3 className="text-xs font-bold text-[#131b2e] uppercase tracking-widest flex items-center gap-2">
          {isAlreadyResolved ? "Finalizar Ticket" : "Gestionar Resolución"}
        </h3>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {isAlreadyResolved
            ? "El ticket está pendiente de confirmación por el usuario. Puedes cerrarlo definitivamente."
            : "Selecciona una opción para actualizar la resolución de este incidente."}
        </p>
      </div>

      <div className="space-y-3">
        {/* Selector de modo compacto (solo si no está ya resuelto/tracking) */}
        {!isAlreadyResolved && !mode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setMode("resolve")}
              className="flex flex-col items-start gap-1 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/10 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                <UserCheck size={14} className="shrink-0" />
                Resuelto
              </div>
              <p className="text-[10px] text-emerald-600/80 leading-snug">
                El usuario confirma el cierre. Sigue visible en su lista.
              </p>
            </button>
            
            <button
              onClick={() => setMode("tracking")}
              className="flex flex-col items-start gap-1 p-2.5 rounded-lg border border-teal-200 bg-teal-50/10 hover:border-teal-400 hover:bg-teal-50/40 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-teal-700 font-bold text-[11px] uppercase tracking-wider">
                <Clock size={14} className="shrink-0" />
                Seguimiento
              </div>
              <p className="text-[10px] text-teal-600/80 leading-snug">
                Monitoreo continuo. No se cierra sin validación previa.
              </p>
            </button>
            
            <button
              onClick={() => setMode("close")}
              className="flex flex-col items-start gap-1 p-2.5 rounded-lg border border-gray-200 bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50/95 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-gray-700 font-bold text-[11px] uppercase tracking-wider">
                <XCircle size={14} className="shrink-0" />
                Cierre Directo
              </div>
              <p className="text-[10px] text-gray-500/80 leading-snug">
                Cierra el ticket inmediatamente sin esperar confirmación.
              </p>
            </button>
          </div>
        )}

        {/* Formulario compacto para notas + acción */}
        {(mode || isAlreadyResolved) && (
          <div className="space-y-3">
            {mode && !isAlreadyResolved && (
              <button
                onClick={() => setMode(null)}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 underline uppercase tracking-wider"
              >
                ← Volver a opciones
              </button>
            )}

            <Textarea
              placeholder="Escribe aquí los comentarios de resolución o seguimiento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white border-gray-300 focus-visible:ring-[#0051d5] text-xs py-2 min-h-[50px] resize-none"
              rows={2}
            />

            <div className="flex gap-2">
              {mode === "resolve" && (
                <Button
                  onClick={handleResolve}
                  disabled={isPending || !notes.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg transition-colors"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserCheck className="w-3.5 h-3.5 mr-1.5" />}
                  Marcar Resuelto
                </Button>
              )}
              {mode === "tracking" && (
                <Button
                  onClick={handleTracking}
                  disabled={isPending || !notes.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white flex-1 text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg transition-colors"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                  Iniciar Seguimiento
                </Button>
              )}
              {(mode === "close" || isAlreadyResolved) && (
                <Button
                  onClick={handleClose}
                  disabled={isPending || !notes.trim()}
                  className="bg-[#131b2e] hover:bg-black text-white flex-1 text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg transition-colors"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Cerrar Definitivamente
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
