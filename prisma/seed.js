const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Initialisation des comptes utilisateurs Tangaly ---');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  // 1. Super Administrateur
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

  // 2. Agent Opérations
  const agent = await prisma.user.upsert({
    where: { email: 'agent@tangaly.com' },
    update: {
      password_hash: agentPassword,
      role: 'AGENT',
    },
    create: {
      nom: 'Agent Tangaly NY',
      email: 'agent@tangaly.com',
      password_hash: agentPassword,
      role: 'AGENT',
      localisation: 'New York',
    },
  });
  console.log('✓ Compte Agent prêt :', agent.email);

  // 3. Client Test
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@tangaly.com' },
    update: {
      password_hash: clientPassword,
      role: 'CLIENT',
    },
    create: {
      nom: 'Client Démo',
      email: 'client@tangaly.com',
      password_hash: clientPassword,
      role: 'CLIENT',
      localisation: 'Conakry',
      client: {
        create: {
          telephone: '+224 620 00 00 00',
          adresse: 'Kaloum, Conakry',
        },
      },
    },
  });
  console.log('✓ Compte Client prêt :', clientUser.email);

  console.log('--- Tous les comptes ont été configurés avec succès ---');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
