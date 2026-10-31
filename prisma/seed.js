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

  console.log('--- Initialisation du catalogue des articles New York ---');
  const articlesToSeed = [
    {
      nom: 'Médicaments traditionnels',
      categorie: 'Produits traditionnels et de soin',
      description: 'Plantes et décoctions traditionnelles',
      prixParKg: 15,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Coton à usage médicinal traditionnel',
      categorie: 'Produits traditionnels et de soin',
      description: 'Coton naturel et mèches médicinales traditionnelles',
      prixParKg: 12,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Beurre de karité',
      categorie: 'Produits traditionnels et de soin',
      description: 'Beurre de karité pur de Guinée (pot ou vrac)',
      prixParKg: 14,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'LES_DEUX',
      devise: 'USD',
    },
    {
      nom: 'Savon noir',
      categorie: 'Produits traditionnels et de soin',
      description: 'Savon noir traditionnel artisanal',
      prixParKg: 12,
      prixParPiece: 5,
      unite: 'KG_ET_PIECE',
      direction: 'CONAKRY_USA',
      service: 'LES_DEUX',
      devise: 'USD',
    },
    {
      nom: 'Cosmétiques',
      categorie: 'Produits traditionnels et de soin',
      description: 'Produits de beauté et soins corporels',
      prixParKg: 15,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Pommades pour femmes',
      categorie: 'Produits traditionnels et de soin',
      description: 'Pommades corporelles et crèmes de soins féminins',
      prixParKg: 14,
      prixParPiece: 10,
      unite: 'KG_ET_PIECE',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Parfums',
      categorie: 'Produits traditionnels et de soin',
      description: 'Parfums et eaux de senteur',
      prixParKg: null,
      prixParPiece: 15,
      unite: 'PIECE',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Huile rouge',
      categorie: 'Produits alimentaires',
      description: 'Huile de palme rouge pure de Guinée (bidon étanche)',
      prixParKg: 15,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Poisson fumé',
      categorie: 'Produits alimentaires',
      description: 'Poisson fumé artisanal conditionné sous vide',
      prixParKg: 18,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Poisson séché',
      categorie: 'Produits alimentaires',
      description: 'Poisson séché traditionnel bien emballé',
      prixParKg: 18,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Soumbara',
      categorie: 'Produits alimentaires',
      description: 'Épice traditionnelle Soumbara (poudre ou boules)',
      prixParKg: 15,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Pâte d’arachide',
      categorie: 'Produits alimentaires',
      description: 'Pâte d\'arachide locale fraîche (pot ou seau)',
      prixParKg: 12,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Attiéké',
      categorie: 'Produits alimentaires',
      description: 'Semoule de manioc attiéké séchée ou fraîche sous vide',
      prixParKg: 12,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Vêtements',
      categorie: 'Vêtements et accessoires',
      description: 'Habits confectionnés, tenues diverses au kilo',
      prixParKg: 15,
      prixParPiece: null,
      unite: 'KG',
      direction: 'CONAKRY_USA',
      service: 'LES_DEUX',
      devise: 'USD',
    },
    {
      nom: 'Chaussures de marque',
      categorie: 'Vêtements et accessoires',
      description: 'Paire de chaussures, baskets ou souliers de marque',
      prixParKg: null,
      prixParPiece: 25,
      unite: 'PIECE',
      direction: 'LES_DEUX',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Pagnes africains et tissus pour femmes',
      categorie: 'Vêtements et accessoires',
      description: 'Pagnes traditionnels (lépis, kendeli, wax, bazin)',
      prixParKg: 16,
      prixParPiece: 20,
      unite: 'KG_ET_PIECE',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Ceintures',
      categorie: 'Vêtements et accessoires',
      description: 'Ceintures en cuir et accessoires de mode',
      prixParKg: null,
      prixParPiece: 10,
      unite: 'PIECE',
      direction: 'LES_DEUX',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Téléphones iPhone',
      categorie: 'Appareils électroniques',
      description: 'Smartphones Apple iPhone (avec déclaration IMEI)',
      prixParKg: null,
      prixParPiece: 50,
      unite: 'PIECE',
      direction: 'LES_DEUX',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Tablettes pour enfants',
      categorie: 'Appareils électroniques',
      description: 'Tablettes éducatives et multimédia pour enfants',
      prixParKg: null,
      prixParPiece: 35,
      unite: 'PIECE',
      direction: 'LES_DEUX',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Documents administratifs',
      categorie: 'Documents et courriers',
      description: 'Dossiers, passeports, certificats express sous pli scellé',
      prixParKg: null,
      prixParPiece: 30,
      unite: 'PIECE',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
    {
      nom: 'Enveloppes',
      categorie: 'Documents et courriers',
      description: 'Courrier simple ou recommandé sous enveloppe renforcée',
      prixParKg: null,
      prixParPiece: 20,
      unite: 'PIECE',
      direction: 'CONAKRY_USA',
      service: 'AERIEN',
      devise: 'USD',
    },
  ];

  let addedArticles = 0;
  for (const art of articlesToSeed) {
    try {
      const existing = await prisma.articleTarif.findFirst({
        where: {
          nom: art.nom,
          categorie: art.categorie,
        },
      });

      if (!existing) {
        await prisma.articleTarif.create({
          data: {
            ...art,
            actif: true,
          },
        });
        addedArticles++;
      }
    } catch (e) {
      console.log(`Article "${art.nom}":`, e.message);
    }
  }
  console.log(`✓ Articles New York initialisés : ${addedArticles} nouveaux ajoutés`);

  console.log('--- Initialisation terminée : Compte Administrateur et Articles configurés ---');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
