import { TicketForm } from "@/components/tickets/ticket-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  
  const services = await prisma.service.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nuevo Ticket</h1>
        <p className="text-gray-500">
          Complete la siguiente información para crear un nuevo ticket de soporte.
        </p>
      </div>

      <TicketForm categories={categories} services={services} />
    </div>
  );
}
