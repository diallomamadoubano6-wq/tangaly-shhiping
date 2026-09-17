const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log("New hash:", hash);
  const isValid = await bcrypt.compare('admin123', hash);
  console.log("Is valid:", isValid);
  
  const admin = await prisma.user.update({
    where: { email: 'admin@tangaly.com' },
    data: { password_hash: hash }
  });
  console.log('Admin updated:', admin.email);
}
main().finally(() => process.exit(0));
