const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Load environment variable directly from .env
require('dotenv').config();

const originalUrl = process.env.DATABASE_URL || "postgresql://postgres.skjmcecphluebvtmnrji:WZNElszIv9mjP0TU@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
// Ensure it uses the robust transaction pooler port 6543 with pgbouncer=true
let pooledUrl = originalUrl;
if (pooledUrl.includes(':5432/')) {
  pooledUrl = pooledUrl.replace(':5432/', ':6543/');
}
if (!pooledUrl.includes('pgbouncer=')) {
  pooledUrl = pooledUrl.includes('?') ? `${pooledUrl}&pgbouncer=true` : `${pooledUrl}?pgbouncer=true`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: pooledUrl
    }
  }
});

const NEW_TEMP_PASSWORD = "AdminSecuredPool2026!";

async function run() {
  console.log("=== RESETTING ADMIN PASSWORD ===");
  try {
    const adminEmail = 'admin@helpdesk.local';
    
    // Hash password using bcryptjs
    const hashedPassword = await bcrypt.hash(NEW_TEMP_PASSWORD, 10);
    
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    let resultUser;
    
    if (!admin) {
      console.log("Admin not found in DB. Creating a new admin user...");
      resultUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          mustChangePassword: true,
          expiresAt: null
        }
      });
      console.log("Status: User created successfully");
    } else {
      console.log("Admin found in DB. Resetting values...");
      resultUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          isActive: true,
          mustChangePassword: true,
          expiresAt: null
        }
      });
      console.log("Status: User updated successfully");
    }
    
    // Verify using bcrypt.compare
    const match = await bcrypt.compare(NEW_TEMP_PASSWORD, resultUser.password);
    
    // Print secure stats as requested
    console.log("--- RESULTS ---");
    console.log("Email:", resultUser.email);
    console.log("IsActive:", resultUser.isActive);
    console.log("ExpiresAt:", resultUser.expiresAt);
    console.log("MustChangePassword:", resultUser.mustChangePassword);
    console.log("Role:", resultUser.role);
    console.log("Bcrypt.compare matches:", match);
    console.log("===============");
  } catch (err) {
    console.error("Critical error while resetting admin password:", err);
  }
}

run().finally(() => prisma.$disconnect());
