import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('--- RÉINITIALISATION DE LA BASE DE DONNÉES ---');

  // Trouver l'administrateur
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { email: 'admin@tangaly.com' }
      ]
    }
  });

  if (!admin) {
    throw new Error("Compte administrateur introuvable ! Abandon de sécurité.");
  }

  console.log(`✓ Compte administrateur préservé : ${admin.nom} (${admin.email}, ID: ${admin.id})`);

  // Suppression dans l'ordre des contraintes de clés étrangères
  const deletedTracking = await prisma.trackingEvent.deleteMany({});
  console.log(`✓ Événements de suivi supprimés : ${deletedTracking.count}`);

  try {
    const deletedDocs = await prisma.document.deleteMany({});
    console.log(`✓ Documents supprimés : ${deletedDocs.count}`);
  } catch (e) {}

  try {
    const deletedNotifs = await prisma.notification.deleteMany({});
    console.log(`✓ Notifications supprimées : ${deletedNotifs.count}`);
  } catch (e) {}

  const deletedShipments = await prisma.shipment.deleteMany({});
  console.log(`✓ Expéditions / Colis supprimés : ${deletedShipments.count}`);

  const deletedClients = await prisma.client.deleteMany({});
  console.log(`✓ Clients supprimés : ${deletedClients.count}`);

  try {
    const deletedQuotes = await prisma.quote.deleteMany({});
    console.log(`✓ Devis supprimés : ${deletedQuotes.count}`);
  } catch (e) {}

  try {
    const deletedAudit = await prisma.auditLog.deleteMany({});
    console.log(`✓ Journaux d'audit supprimés : ${deletedAudit.count}`);
  } catch (e) {}

  try {
    const deletedSync = await prisma.syncLog.deleteMany({});
    console.log(`✓ Logs de synchronisation supprimés : ${deletedSync.count}`);
  } catch (e) {}

  // Supprimer tous les utilisateurs SAUF l'administrateur
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: admin.id }
    }
  });
  console.log(`✓ Autres utilisateurs supprimés : ${deletedUsers.count}`);

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
