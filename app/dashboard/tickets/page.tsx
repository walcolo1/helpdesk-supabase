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
        <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">Mis Tickets</h1>
        <div className="flex items-center gap-2">
          <TicketSearch />
          {isPrivileged && (
            <ExportButton type="tickets" label="Exportar CSV" variant="outline" />
          )}
          <Link href="/dashboard/tickets/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0051d5] disabled:pointer-events-none disabled:opacity-50 bg-[#0051d5] hover:bg-[#003fb3] text-white h-9 px-4 gap-2 shadow-sm shadow-[#0051d5]/10 uppercase tracking-wider">
            <PlusCircle size={14} />
            Nuevo Ticket
          </Link>
        </div>
      </div>

      <TicketTable tickets={tickets} />
    </div>
  );
}
