const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStorageLogic() {
  console.log("=== INICIANDO VALIDACION DE GESTION DE ALMACENAMIENTO ===");

  try {
    // 1. Probar consulta de tamaño de base de datos
    console.log("1. Probando consulta pg_database_size...");
    const result = await prisma.$queryRaw`
      SELECT pg_database_size(current_database())::bigint AS size
    `;
    const size = Number(result[0]?.size || 0);
    console.log(`- Tamaño de la DB: ${size} bytes (${(size / (1024 * 1024)).toFixed(2)} MB)`);

    // 2. Probar buscar tickets y adjuntos
    console.log("2. Probando obtencion de candidatos de limpieza...");
    const tickets = await prisma.ticket.findMany({
      include: {
        createdBy: { select: { name: true } },
        attachments: { select: { fileSize: true } },
      },
      take: 5,
    });
    console.log(`- Candidatos cargados: ${tickets.length} tickets de muestra`);
    for (const t of tickets) {
      const attachmentCount = t.attachments.length;
      const attachmentSize = t.attachments.reduce((sum, att) => sum + att.fileSize, 0);
      console.log(`  * Ticket ${t.ticketNumber}: ${attachmentCount} adjuntos (${(attachmentSize / 1024).toFixed(2)} KB)`);
    }

    console.log("=== PRUEBAS DE LOGICA DE ALMACENAMIENTO COMPLETADAS CON EXITO ===");
  } catch (err) {
    console.error("Error durante pruebas de almacenamiento:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testStorageLogic();
