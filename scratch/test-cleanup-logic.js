const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCleanup() {
  console.log("=== PROBANDO LÓGICA DE LIMPIEZA DE TICKETS ANTIGUOS ===");

  try {
    // 1. Obtener o crear un usuario de prueba
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test.cleanup@local.test",
          role: "user"
        }
      });
    }

    // 2. Obtener o crear una categoría y servicio de prueba
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Test Category" }
      });
    }

    let service = await prisma.service.findFirst({ where: { categoryId: category.id } });
    if (!service) {
      service = await prisma.service.create({
        data: {
          name: "Test Service",
          categoryId: category.id,
        }
      });
    }

    // 3. Calcular fecha límite (1 año atrás)
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    
    const oldDate = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000); // 1 día antes del límite
    const recentDate = new Date(); // Hoy

    console.log("Fecha limite (1 año atras):", cutoff.toISOString());
    console.log("Creando ticket antiguo con fecha:", oldDate.toISOString());
    console.log("Creando ticket reciente con fecha:", recentDate.toISOString());

    // Borrar previos si quedaron huérfanos de ejecuciones anteriores
    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: { in: ["TCK-TEST-OLD", "TCK-TEST-NEW"] }
      }
    });

    const oldTicket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-TEST-OLD",
        subject: "Ticket Antiguo de Prueba",
        description: "Deberia eliminarse",
        categoryId: category.id,
        serviceId: service.id,
        createdById: user.id,
        createdAt: oldDate,
        updatedAt: oldDate,
      }
    });

    const recentTicket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-TEST-NEW",
        subject: "Ticket Reciente de Prueba",
        description: "Deberia conservarse",
        categoryId: category.id,
        serviceId: service.id,
        createdById: user.id,
        createdAt: recentDate,
        updatedAt: recentDate,
      }
    });

    // Añadir comentario e historial al antiguo para probar eliminación segura
    await prisma.ticketComment.create({
      data: {
        ticketId: oldTicket.id,
        userId: user.id,
        content: "Comentario de prueba en ticket antiguo"
      }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: oldTicket.id,
        userId: user.id,
        field: "status",
        oldValue: "open",
        newValue: "in_progress"
      }
    });

    console.log("Tickets creados exitosamente para la prueba.");

    // 4. Ejecutar la consulta de búsqueda de tickets antiguos
    const ticketsToDelete = await prisma.ticket.findMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
      select: {
        id: true,
      },
    });

    console.log("Numero de tickets antiguos detectados para eliminacion:", ticketsToDelete.length);
    const hasOld = ticketsToDelete.some(t => t.id === oldTicket.id);
    const hasNew = ticketsToDelete.some(t => t.id === recentTicket.id);
    console.log("- Encontro el ticket antiguo?:", hasOld ? "SI (Correcto)" : "NO (Incorrecto)");
    console.log("- Encontro el ticket reciente?:", hasNew ? "SI (Incorrecto)" : "NO (Correcto)");

    if (hasOld && !hasNew) {
      console.log("Ejecutando eliminacion de prueba...");
      const ticketIds = ticketsToDelete.map(t => t.id);

      await prisma.$transaction([
        prisma.ticketAttachment.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticketComment.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticketHistory.deleteMany({
          where: { ticketId: { in: ticketIds } },
        }),
        prisma.ticket.deleteMany({
          where: { id: { in: ticketIds } },
        }),
      ]);

      console.log("Eliminacion completada.");

      // Verificar que el antiguo ya no está, y el nuevo sí está
      const checkOld = await prisma.ticket.findUnique({ where: { id: oldTicket.id } });
      const checkNew = await prisma.ticket.findUnique({ where: { id: recentTicket.id } });

      console.log("Verificacion post-eliminacion:");
      console.log("- ¿Ticket antiguo eliminado?:", !checkOld ? "SI (Correcto)" : "NO (Incorrecto)");
      console.log("- ¿Ticket reciente conservado?:", checkNew ? "SI (Correcto)" : "NO (Incorrecto)");

      // Limpiar ticket reciente de prueba
      await prisma.ticket.delete({ where: { id: recentTicket.id } });
      console.log("Limpieza de datos de prueba finalizada.");
    } else {
      console.error("Fallo la deteccion inicial de tickets de prueba.");
    }

  } catch (err) {
    console.error("Error en prueba de limpieza:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanup();
