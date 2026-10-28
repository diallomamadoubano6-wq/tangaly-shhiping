const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const agencies = await prisma.agency.findMany();
  console.log('Agencies:', agencies);
}
check().finally(() => prisma.$disconnect());
