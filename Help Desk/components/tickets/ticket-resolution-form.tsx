"use client";

import { useState, useTransition } from "react";
import { resolveTicket, closeTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-green-100 bg-green-50/30 dark:bg-green-900/10 dark:border-green-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isAlreadyResolved ? "Finalizar Ticket" : "Gestionar Resolución"}
        </CardTitle>
        <CardDescription>
          {isAlreadyResolved
            ? "El ticket está pendiente de confirmación por el usuario. Puedes cerrarlo definitivamente si es necesario."
            : "Selecciona cómo deseas marcar este ticket."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Selector de modo (solo si no está ya resuelto/tracking) */}
        {!isAlreadyResolved && !mode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode("resolve")}
              className="flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <UserCheck size={16} />
                Resuelto — Pendiente de usuario
              </div>
              <p className="text-xs text-emerald-600/80 leading-relaxed">
                El ticket queda resuelto pero el usuario final debe confirmar el cierre. Sigue visible en su lista.
              </p>
            </button>
            <button
              onClick={() => setMode("tracking")}
              className="flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 border-teal-200 bg-teal-50 hover:border-teal-400 hover:bg-teal-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                <Clock size={16} />
                Seguimiento a largo plazo
              </div>
              <p className="text-xs text-teal-600/80 leading-relaxed">
                El caso requiere monitoreo continuo. No se cierra hasta que el usuario confirme o lo cierre un agente.
              </p>
            </button>
            <button
              onClick={() => setMode("close")}
              className="flex flex-col items-start gap-1.5 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors text-left sm:col-span-2"
            >
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <XCircle size={16} />
                Cerrar definitivamente
              </div>
              <p className="text-xs text-gray-500/80 leading-relaxed">
                El ticket se cierra de forma inmediata sin esperar confirmación del usuario.
              </p>
            </button>
          </div>
        )}

        {/* Formulario de notas + acción (cuando se ha seleccionado un modo) */}
        {(mode || isAlreadyResolved) && (
          <div className="space-y-3">
            {mode && !isAlreadyResolved && (
              <button
                onClick={() => setMode(null)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                ← Cambiar opción
              </button>
            )}

            <Textarea
              placeholder="Describa la solución aplicada o las notas de seguimiento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white dark:bg-slate-950 border-green-200 focus-visible:ring-green-500"
              rows={3}
            />

            <div className="flex gap-2">
              {/* Botón según el modo activo */}
              {mode === "resolve" && (
                <Button
                  onClick={handleResolve}
                  disabled={isPending || !notes.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                  Marcar como Resuelto
                </Button>
              )}
              {mode === "tracking" && (
                <Button
                  onClick={handleTracking}
                  disabled={isPending || !notes.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  Marcar en Seguimiento
                </Button>
              )}
              {(mode === "close" || isAlreadyResolved) && (
                <Button
                  onClick={handleClose}
                  disabled={isPending || !notes.trim()}
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:bg-gray-50 flex-1"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Cerrar Definitivamente
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
