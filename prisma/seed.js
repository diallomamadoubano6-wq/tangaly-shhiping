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

  // Remise à zéro automatique après tests (exécutée une seule fois en toute sécurité)
  const RESET_KEY = 'RESET_DB_POST_TESTS_V1';
  let resetSetting = null;
  try {
    resetSetting = await prisma.cmsSetting.findUnique({
      where: { key: RESET_KEY }
    });
  } catch (err) {
    console.log('Vérification cmsSetting :', err.message);
  }

  if (!resetSetting) {
    console.log('--- EXÉCUTION DE LA REMISE À ZÉRO POST-TESTS ---');
    try {
      const p = await prisma.payment.deleteMany({});
      console.log(`✓ Paiements supprimés : ${p.count}`);
    } catch (e) {}

    try {
      const inv = await prisma.invoice.deleteMany({});
      console.log(`✓ Factures supprimées : ${inv.count}`);
    } catch (e) {}

    try {
      const sa = await prisma.shipmentArticle.deleteMany({});
      console.log(`✓ Articles d'expéditions supprimés : ${sa.count}`);
    } catch (e) {}

    try {
      const tr = await prisma.trackingEvent.deleteMany({});
      console.log(`✓ Événements de suivi supprimés : ${tr.count}`);
    } catch (e) {}

    try {
      const d = await prisma.document.deleteMany({});
      console.log(`✓ Documents supprimés : ${d.count}`);
    } catch (e) {}

    try {
      const n = await prisma.notification.deleteMany({});
      console.log(`✓ Notifications supprimées : ${n.count}`);
    } catch (e) {}

    try {
      const cr = await prisma.cashRemittance.deleteMany({});
      console.log(`✓ Versements de caisse supprimés : ${cr.count}`);
    } catch (e) {}

    try {
      const sh = await prisma.shipment.deleteMany({});
      console.log(`✓ Expéditions supprimées : ${sh.count}`);
    } catch (e) {}

    try {
      const cl = await prisma.client.deleteMany({});
      console.log(`✓ Clients supprimés : ${cl.count}`);
    } catch (e) {}

    try {
      const q = await prisma.quote.deleteMany({});
      console.log(`✓ Devis supprimés : ${q.count}`);
    } catch (e) {}

    try {
      const pk = await prisma.passkey.deleteMany({
        where: { userId: { not: admin.id } }
      });
      console.log(`✓ Passkeys supprimées : ${pk.count}`);
    } catch (e) {}

    try {
      const al = await prisma.auditLog.deleteMany({});
      console.log(`✓ Audit logs supprimés : ${al.count}`);
    } catch (e) {}

    try {
      const sl = await prisma.syncLog.deleteMany({});
      console.log(`✓ Sync logs supprimés : ${sl.count}`);
    } catch (e) {}

    try {
      const u = await prisma.user.deleteMany({
        where: {
          id: { not: admin.id },
          role: { not: 'SUPER_ADMIN' }
        }
      });
      console.log(`✓ Utilisateurs de test supprimés : ${u.count}`);
    } catch (e) {}

    try {
      await prisma.cmsSetting.upsert({
        where: { key: RESET_KEY },
        update: { value: new Date().toISOString() },
        create: {
          key: RESET_KEY,
          value: new Date().toISOString(),
          description: 'Remise à zéro post-tests exécutée'
        }
      });
      console.log('✓ Marqueur de réinitialisation enregistré (ne s\'exécutera plus aux prochains builds).');
    } catch (e) {
      console.log('Marqueur cmsSetting:', e.message);
    }
  } else {
    console.log(`✓ Remise à zéro déjà exécutée le ${resetSetting.value}. Pas de réinitialisation nécessaire.`);
  }

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
