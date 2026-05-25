import { getTickets } from "@/actions/tickets";
import { TicketTable } from "@/components/tickets/ticket-table";
import { ExportButton } from "@/components/export-button";
import { TicketSearch } from "@/components/tickets/ticket-search";
import { auth } from "@/auth";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const [tickets, session] = await Promise.all([getTickets(), auth()]);
  const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "agent";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mis Tickets</h1>
        <div className="flex items-center gap-2">
          <TicketSearch />
          {isPrivileged && (
            <ExportButton type="tickets" label="Exportar CSV" variant="outline" />
          )}
          <Link href="/dashboard/tickets/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-900/90 h-10 px-4 py-2 gap-2">
            <PlusCircle size={16} />
            Nuevo Ticket
          </Link>
        </div>
      </div>

      <TicketTable tickets={tickets} />
    </div>
  );
}
