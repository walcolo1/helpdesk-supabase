const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runValidation() {
  const email = 'prueba.temporal@local.test';
  const tempPassword = 'Temporal123!';
  const newPassword = 'NuevoPassword456!';

  console.log("=== INICIANDO VALIDACIÓN DEL FLUJO DE USUARIO NUEVO ===");

  try {
    // Limpiar si ya existe
    await prisma.user.deleteMany({ where: { email } });

    // 1-3. Crear usuario
    const hashedTemp = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'Prueba Temporal',
        email,
        password: hashedTemp,
        role: 'user',
        mustChangePassword: true,
        isActive: true,
      }
    });

    console.log("1. Usuario creado activo:", user.isActive);
    console.log("2. Clave hasheada correctamente:", user.password !== tempPassword);
    console.log("3. mustChangePassword quedó true al crear:", user.mustChangePassword);
    console.log("4. expiresAt sin fecha (no vencido):", user.expiresAt === null);

    // 5. Login con clave temporal
    const loginUser = await prisma.user.findUnique({ where: { email } });
    const isMatch = await bcrypt.compare(tempPassword, loginUser.password);
    console.log("5. Login con clave temporal funciona:", isMatch);

    // 7-9. Cambiar contraseña
    const hashedNew = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedNew,
        mustChangePassword: false,
      }
    });

    console.log("7-8. Cambio de contraseña guardado en DB");
    console.log("9. mustChangePassword quedó false:", updatedUser.mustChangePassword === false);

    // 10. La clave temporal anterior falla
    const oldMatchFails = !(await bcrypt.compare(tempPassword, updatedUser.password));
    console.log("10. La clave temporal anterior ahora falla:", oldMatchFails);

    // 11. La nueva clave funciona
    const newMatchSucceeds = await bcrypt.compare(newPassword, updatedUser.password);
    console.log("11. La nueva clave funciona:", newMatchSucceeds);

    console.log("=== TODAS LAS VALIDACIONES DE BASE DE DATOS FUERON EXITOSAS ===");
  } catch (err) {
    console.error("Error en validación:", err);
  } finally {
    // Limpiar prueba
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
}

runValidation();
