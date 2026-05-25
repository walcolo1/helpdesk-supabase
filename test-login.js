const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runTest() {
  const email = 'test_create@helpdesk.local';
  const password = 'temporalpassword123';
  
  // Find the user created in the previous test
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  if (user.expiresAt && user.expiresAt < new Date()) {
    console.log("Account expired");
    return;
  }

  const passwordsMatch = await bcrypt.compare(password, user.password);
  console.log('Password match from auth.ts perspective:', passwordsMatch);
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
