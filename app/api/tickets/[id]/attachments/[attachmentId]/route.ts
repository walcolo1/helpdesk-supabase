import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "storage", "attachments");

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

  const filePath = join(UPLOAD_DIR, attachment.filePath);
  if (!existsSync(filePath)) {
    return new NextResponse("Archivo físico no encontrado", { status: 404 });
  }

  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": attachment.fileType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    },
  });
}
