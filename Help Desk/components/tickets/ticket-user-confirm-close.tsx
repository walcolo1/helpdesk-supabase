"use client";

import { useTransition } from "react";
import { userConfirmCloseTicket } from "@/actions/tickets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

interface TicketUserConfirmCloseProps {
  ticketId: string;
  currentStatus: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export function TicketUserConfirmClose({
  ticketId,
  currentStatus,
  resolvedBy,
  resolvedAt,
}: TicketUserConfirmCloseProps) {
  const [isPending, startTransition] = useTransition();

  const isTracking = currentStatus === "tracking";

  const handleConfirm = () => {
    if (!confirm("¿Confirmas que tu problema ha sido resuelto y deseas cerrar este ticket?")) return;
    startTransition(async () => {
      try {
        await userConfirmCloseTicket(ticketId);
      } catch (error: any) {
        alert(error.message || "No se pudo cerrar el ticket.");
      }
    });
  };

  return (
    <Card
      className={
        isTracking
          ? "border-teal-200 bg-teal-50/40 dark:bg-teal-900/10 dark:border-teal-900/30"
          : "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10 dark:border-emerald-900/30"
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div
            className={`p-2.5 rounded-full shrink-0 ${
              isTracking
                ? "bg-teal-100 text-teal-600 dark:bg-teal-900/40"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
            }`}
          >
            {isTracking ? <Clock size={20} /> : <CheckCircle2 size={20} />}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold mb-1 ${
                isTracking ? "text-teal-900 dark:text-teal-400" : "text-emerald-900 dark:text-emerald-400"
              }`}
            >
              {isTracking
                ? "Tu ticket está en Seguimiento a Largo Plazo"
                : "Tu ticket ha sido marcado como Resuelto"}
            </h3>

            <p
              className={`text-xs leading-relaxed mb-3 ${
                isTracking ? "text-teal-700 dark:text-teal-500" : "text-emerald-700 dark:text-emerald-500"
              }`}
            >
              {isTracking
                ? "El equipo de soporte está monitoreando tu caso. Cuando consideres que el problema está completamente resuelto, puedes confirmar el cierre."
                : "El equipo de soporte ha aplicado una solución a tu solicitud. Si tu problema fue resuelto, confirma el cierre del ticket."}
            </p>

            {/* Info del agente que resolvió */}
            {resolvedBy && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                <ShieldCheck size={12} />
                <span>
                  Atendido por <strong className="text-gray-600">{resolvedBy}</strong>
                  {resolvedAt &&
                    ` · ${new Intl.DateTimeFormat("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(resolvedAt))}`}
                </span>
              </div>
            )}

            {/* Botón de confirmación */}
            <Button
              onClick={handleConfirm}
              disabled={isPending}
              size="sm"
              className={
                isTracking
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Cerrando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="mr-2" />
                  Confirmar Cierre del Ticket
                </>
              )}
            </Button>

            <p className="text-[10px] text-gray-400 mt-2">
              Si el problema persiste, puedes seguir comentando en el ticket antes de confirmarlo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
