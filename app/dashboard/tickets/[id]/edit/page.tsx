import { getTicketById } from "@/actions/tickets";
import { EditTicketForm } from "@/components/tickets/edit-ticket-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const [session, ticket] = await Promise.all([
    auth(),
    getTicketById(params.id),
  ]);

  if (!ticket) notFound();

  // Verificación de autorización en el servidor antes de renderizar
  const role = session?.user?.role ?? "";
  const isPrivileged = role === "admin" || role === "agent";
  const isOwner = ticket.createdById === session?.user?.id;

  if (!isPrivileged && !isOwner) {
    redirect(`/dashboard/tickets/${params.id}`);
  }

  // Carga de agentes disponibles (solo relevante para privilegiados)
  const agents = isPrivileged
    ? await prisma.user.findMany({
        where: { role: { in: ["admin", "agent"] }, isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/tickets/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Detalle del ticket
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Editar</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Editar Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isPrivileged
            ? "Actualiza el estado, prioridad y asignación del ticket."
            : "Actualiza la prioridad de tu ticket."}
        </p>
      </div>

      <EditTicketForm
        ticket={ticket}
        agents={agents}
        isPrivileged={isPrivileged}
      />
    </div>
  );
}
