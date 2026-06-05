import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, getAttachmentsBucket } from "@/lib/supabase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: ticketId, attachmentId } = params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { createdById: true },
  });

  if (!ticket) {
    return new NextResponse("Ticket no encontrado", { status: 404 });
  }

  const role = session.user.role;
  const isOwner = ticket.createdById === session.user.id;
  const isPrivileged = role === "admin" || role === "agent";

  if (!isPrivileged && !isOwner) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.ticketId !== ticketId) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  // Generar signed URL temporal (10 minutos) desde Supabase Storage
  const supabase = getSupabaseAdmin();
  const bucket = getAttachmentsBucket();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(attachment.filePath, 600);

  if (error || !data?.signedUrl) {
    console.error("[attachments:download] Error al generar signed URL:", error);
    return new NextResponse("No se pudo generar el enlace de descarga.", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
