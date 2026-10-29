const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Initialisation des comptes utilisateurs Tangaly ---');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  // 1. Super Administrateur (SEUL compte conservé)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tangaly.com' },
    update: {
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      nom: 'Administrateur Tangaly',
      email: 'admin@tangaly.com',
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
      localisation: 'Conakry',
    },
  });
  console.log('✓ Compte Admin prêt :', admin.email);

  console.log('--- Initialisation terminée : Compte Administrateur configuré ---');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
