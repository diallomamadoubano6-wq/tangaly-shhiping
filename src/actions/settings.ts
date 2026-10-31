'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

interface SessionUser {
  id: string;
  nom?: string;
  email?: string;
  role?: string;
}

async function getSessionUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session.user as SessionUser;
}

export async function updateProfile(nom: string, email: string) {
  try {
    const user = await getSessionUser();
    
    // Check if email already used by someone else
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { success: false, message: 'Cet email est déjà utilisé par un autre compte.' };
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { nom, email }
    });

    revalidatePath('/operations/settings');
    revalidatePath('/admin/settings');
    return { success: true, message: 'Profil mis à jour avec succès.' };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: 'Erreur lors de la mise à jour du profil.' };
  }
}

export async function updatePassword(password: string) {
  try {
    const user = await getSessionUser();
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: 'Erreur lors de la mise à jour du mot de passe.' };
  }
}

export async function resetDatabaseAction(keepArticles: boolean = true) {
  try {
    const user = await getSessionUser();
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return { success: false, message: 'Action réservée aux administrateurs.' };
    }

    // Identifiant de l'administrateur à préserver
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { email: 'admin@tangaly.com' },
          { id: user.id }
        ]
      }
    });

    const adminId = admin ? admin.id : user.id;

    // Suppression dans l'ordre strict des clés étrangères
    const deletedPayments = await prisma.payment.deleteMany({});
    const deletedInvoices = await prisma.invoice.deleteMany({});
    await prisma.shipmentArticle.deleteMany({});
    
    let deletedCatalogCount = 0;
    if (!keepArticles) {
      const deletedCatalog = await prisma.articleTarif.deleteMany({});
      deletedCatalogCount = deletedCatalog.count;
    }

    await prisma.trackingEvent.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.cashRemittance.deleteMany({});
    const deletedShipments = await prisma.shipment.deleteMany({});
    const deletedClients = await prisma.client.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.passkey.deleteMany({
      where: { userId: { not: adminId } }
    });
    await prisma.auditLog.deleteMany({});
    await prisma.syncLog.deleteMany({});
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { not: adminId },
        role: { not: 'SUPER_ADMIN' }
      }
    });

    revalidatePath('/admin');
    revalidatePath('/admin/operations');
    revalidatePath('/admin/clients');
    revalidatePath('/admin/users');
    revalidatePath('/admin/finance');
    revalidatePath('/admin/tarifs/articles');
    revalidatePath('/operations');
    revalidatePath('/operations/tracking');
    revalidatePath('/operations/finance');

    const catalogMsg = keepArticles ? "Catalogue des articles conservé." : `${deletedCatalogCount} articles du catalogue supprimés.`;

    return {
      success: true,
      message: `Base de données remise à zéro avec succès ! (${deletedShipments.count} expéditions, ${deletedClients.count} clients, ${deletedInvoices.count} factures, ${deletedPayments.count} paiements, ${deletedUsers.count} utilisateurs supprimés. ${catalogMsg})`
    };
  } catch (error: unknown) {
    console.error("Error resetting database:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erreur lors de la réinitialisation : ${msg}` };
  }
}
