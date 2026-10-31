import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('--- RÉINITIALISATION DE LA BASE DE DONNÉES ---');

  // Trouver ou recréer l'administrateur
  let admin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { email: 'admin@tangaly.com' }
      ]
    }
  });

  if (!admin) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        nom: 'Administrateur Tangaly',
        email: 'admin@tangaly.com',
        password_hash: adminPassword,
        role: 'SUPER_ADMIN',
        localisation: 'Conakry',
      }
    });
    console.log(`✓ Nouveau compte administrateur créé : ${admin.email}`);
  } else {
    console.log(`✓ Compte administrateur préservé : ${admin.nom} (${admin.email}, ID: ${admin.id})`);
  }

  // Suppression ordonnée pour respecter les contraintes d'intégrité référentielle
  try {
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✓ Paiements supprimés : ${deletedPayments.count}`);
  } catch (e) {
    console.log('Payment:', e.message);
  }

  try {
    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`✓ Factures supprimées : ${deletedInvoices.count}`);
  } catch (e) {
    console.log('Invoice:', e.message);
  }

  try {
    const deletedShipmentArticles = await prisma.shipmentArticle.deleteMany({});
    console.log(`✓ Articles d'expéditions supprimés : ${deletedShipmentArticles.count}`);
  } catch (e) {
    console.log('ShipmentArticle:', e.message);
  }

  try {
    const deletedTracking = await prisma.trackingEvent.deleteMany({});
    console.log(`✓ Événements de suivi supprimés : ${deletedTracking.count}`);
  } catch (e) {
    console.log('TrackingEvent:', e.message);
  }

  try {
    const deletedDocs = await prisma.document.deleteMany({});
    console.log(`✓ Documents supprimés : ${deletedDocs.count}`);
  } catch (e) {
    console.log('Document:', e.message);
  }

  try {
    const deletedNotifs = await prisma.notification.deleteMany({});
    console.log(`✓ Notifications supprimées : ${deletedNotifs.count}`);
  } catch (e) {
    console.log('Notification:', e.message);
  }

  try {
    const deletedRemittances = await prisma.cashRemittance.deleteMany({});
    console.log(`✓ Versements de caisse supprimés : ${deletedRemittances.count}`);
  } catch (e) {
    console.log('CashRemittance:', e.message);
  }

  try {
    const deletedShipments = await prisma.shipment.deleteMany({});
    console.log(`✓ Expéditions / Colis supprimés : ${deletedShipments.count}`);
  } catch (e) {
    console.log('Shipment:', e.message);
  }

  try {
    const deletedClients = await prisma.client.deleteMany({});
    console.log(`✓ Clients supprimés : ${deletedClients.count}`);
  } catch (e) {
    console.log('Client:', e.message);
  }

  try {
    const deletedQuotes = await prisma.quote.deleteMany({});
    console.log(`✓ Devis supprimés : ${deletedQuotes.count}`);
  } catch (e) {
    console.log('Quote:', e.message);
  }

  try {
    const deletedPasskeys = await prisma.passkey.deleteMany({
      where: { userId: { not: admin.id } }
    });
    console.log(`✓ Passkeys supprimées : ${deletedPasskeys.count}`);
  } catch (e) {
    console.log('Passkey:', e.message);
  }

  try {
    const deletedAudit = await prisma.auditLog.deleteMany({});
    console.log(`✓ Journaux d'audit supprimés : ${deletedAudit.count}`);
  } catch (e) {
    console.log('AuditLog:', e.message);
  }

  try {
    const deletedSync = await prisma.syncLog.deleteMany({});
    console.log(`✓ Logs de synchronisation supprimés : ${deletedSync.count}`);
  } catch (e) {
    console.log('SyncLog:', e.message);
  }

  // Supprimer tous les utilisateurs SAUF l'administrateur
  try {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { not: admin.id },
        role: { not: 'SUPER_ADMIN' }
      }
    });
    console.log(`✓ Autres utilisateurs supprimés : ${deletedUsers.count}`);
  } catch (e) {
    console.log('User:', e.message);
  }

  console.log('--- ÉTAT FINAL DE LA BASE DE DONNÉES ---');
  const remainingUsers = await prisma.user.findMany();
  console.log('Utilisateurs restants :', remainingUsers.map(u => ({ nom: u.nom, email: u.email, role: u.role })));

  const remainingShipments = await prisma.shipment.count();
  const remainingClients = await prisma.client.count();
  console.log('Expéditions restantes :', remainingShipments);
  console.log('Clients restants :', remainingClients);
  console.log('--- RÉINITIALISATION TERMINÉE AVEC SUCCÈS ---');
}

resetDatabase()
  .catch(err => {
    console.error('Erreur lors de la réinitialisation :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
