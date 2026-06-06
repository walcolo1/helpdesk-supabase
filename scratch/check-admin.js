const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Checking DB Connection and admin status...");
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@helpdesk.local' }
    });
    if (!admin) {
      console.log("Admin admin@helpdesk.local not found!");
    } else {
      console.log("Admin found!");
      console.log("Name:", admin.name);
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
      console.log("IsActive:", admin.isActive);
      console.log("MustChangePassword:", admin.mustChangePassword);
      console.log("ExpiresAt:", admin.expiresAt);
      console.log("HasPassword:", !!admin.password);
    }
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

run().finally(() => prisma.$disconnect());
