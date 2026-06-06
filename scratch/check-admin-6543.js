const { PrismaClient } = require('@prisma/client');

// Override database url to use port 6543
const originalUrl = process.env.DATABASE_URL || "postgresql://postgres.skjmcecphluebvtmnrji:WZNElszIv9mjP0TU@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
const pooledUrl = originalUrl.replace(':5432/', ':6543/');

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
  console.log("Checking DB Connection on port 6543...");
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
    console.error("Error executing query on 6543:", err);
  }
}

run().finally(() => prisma.$disconnect());
