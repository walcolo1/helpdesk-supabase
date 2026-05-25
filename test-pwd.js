const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runTest() {
  const email = 'test_create@helpdesk.local';
  const password = 'temporalpassword123';
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: 'Test Create',
      email,
      password: hashedPassword,
      role: 'user',
      mustChangePassword: true,
      isActive: true,
    }
  });

  console.log('Created user:', user.email);

  const userFromDb = await prisma.user.findUnique({ where: { email } });
  const match = await bcrypt.compare(password, userFromDb.password);
  console.log('Password match:', match);
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
