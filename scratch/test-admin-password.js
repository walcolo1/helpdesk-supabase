const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const originalUrl = process.env.DATABASE_URL || "postgresql://postgres.skjmcecphluebvtmnrji:WZNElszIv9mjP0TU@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
// Replace port 5432 with 6543 and add pgbouncer=true
const pooledUrl = originalUrl.replace(':5432/', ':6543/').concat('?pgbouncer=true');

console.log("Original URL:", originalUrl.replace(/:[^:@]+@/, ':***@'));
console.log("Pooled URL:", pooledUrl.replace(/:[^:@]+@/, ':***@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: pooledUrl
    }
  }
});

async function run() {
  console.log("Checking admin password with pgbouncer=true...");
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@helpdesk.local' }
    });
    if (!admin) {
      console.log("Admin admin@helpdesk.local not found!");
      return;
    }
    const match = await bcrypt.compare('admin123', admin.password);
    console.log("Does 'admin123' match current password?", match);
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

run().finally(() => prisma.$disconnect());
