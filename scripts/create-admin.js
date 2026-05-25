const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO CREACIÓN DE ADMIN INICIAL ===");

  const email = 'admin@helpdesk.local';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log(`El administrador ${email} ya existe. Saliendo...`);
    return;
  }

  // Generar clave aleatoria
  const rawPassword = 'SupabaseAdmin123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      mustChangePassword: true, // Forzamos el cambio al primer ingreso
    }
  });

  console.log(`✅ Admin creado exitosamente.`);
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Clave temporal: ${rawPassword}`);
  console.log(`⚠️ Se solicitará cambio de contraseña en el primer inicio de sesión.`);
}

main()
  .catch((e) => {
    console.error("Error al crear admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
