const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const originalUrl = process.env.DATABASE_URL || "postgresql://postgres.skjmcecphluebvtmnrji:WZNElszIv9mjP0TU@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
const pooledUrl = originalUrl.replace(':5432/', ':6543/').concat('?pgbouncer=true');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: pooledUrl
    }
  }
});

async function run() {
  console.log("Resetting admin@helpdesk.local password to 'admin123'...");
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@helpdesk.local' }
    });
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    if (!admin) {
      console.log("Admin not found. Creating admin...");
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@helpdesk.local',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          mustChangePassword: false
        }
      });
      console.log("Admin created successfully:", newAdmin.email);
    } else {
      console.log("Admin found. Updating password...");
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@helpdesk.local' },
        data: {
          password: hashedPassword,
          isActive: true,
          mustChangePassword: false // So they don't have to change password immediately unless they want to
        }
      });
      console.log("Admin updated successfully:", updatedAdmin.email);
    }
  } catch (err) {
    console.error("Error resetting admin password:", err);
  }
}

run().finally(() => prisma.$disconnect());
