"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { userConfirmCloseTicket } from "@/actions/tickets";
import { toast } from "sonner";

interface Props {
  ticketId: string;
}

export function TicketUserCloseButton({ ticketId }: Props) {
  const [isPending, setIsPending] = useState(false);

  async function handleClose() {
    try {
      setIsPending(true);
      await userConfirmCloseTicket(ticketId);
      toast.success("Ticket cerrado exitosamente");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al cerrar el ticket");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 dark:bg-blue-900/10 dark:border-blue-900/30">
      <div>
        <h4 className="font-medium text-blue-900 dark:text-blue-400">¿El problema ha sido solucionado?</h4>
        <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
          Por favor, confirma si la solución proporcionada resolvió tu problema para cerrar definitivamente este ticket.
        </p>
      </div>
      <Button 
        onClick={handleClose} 
        disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Sí, cerrar ticket
      </Button>
    </div>
  );
}
