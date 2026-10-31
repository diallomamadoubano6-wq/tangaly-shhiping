'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getClientUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  const user = session.user as any;
  // S'assurer qu'il a bien un profil client ou est SUPER_ADMIN
  // Pour un dashboard client, on requiert le profil Client
  const client = await prisma.client.findUnique({
    where: { userId: user.id }
  });
  
  if (!client) {
    throw new Error('Profil client introuvable');
  }
  
  return { user, client };
}

export async function getClientShipments() {
  try {
    const { client } = await getClientUser();
    const shipments = await prisma.shipment.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: shipments };
  } catch (error: any) {
    console.error("Error fetching client shipments:", error);
    return { success: false, message: error.message, data: [] };
  }
}

export async function getClientQuotes() {
  try {
    const { user } = await getClientUser();
    // On trouve les devis par l'email de l'utilisateur
    const quotes = await prisma.quote.findMany({
      where: { client_email: user.email },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: quotes };
  } catch (error: any) {
    console.error("Error fetching client quotes:", error);
    return { success: false, message: error.message, data: [] };
  }
}

export async function getClientDocuments() {
  try {
    const { client } = await getClientUser();
    const docs = await prisma.document.findMany({
      where: { shipment: { clientId: client.id } },
      include: { shipment: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: docs };
  } catch (error: any) {
    console.error("Error fetching client documents:", error);
    return { success: false, message: error.message, data: [] };
  }
}

export async function getClientProfile() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Non autorisé' };
    }
    const sessionUser = session.user as any;
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { client: true },
    });

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone || user.client?.telephone || '',
        adresse: user.client?.adresse || user.localisation || '',
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (error: any) {
    console.error("Error fetching client profile:", error);
    return { success: false, message: error.message };
  }
}

export async function updateClientProfile(data: {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Non autorisé' };
    }
    const sessionUser = session.user as any;
    const cleanPhone = data.telephone.replace(/[\s\-\(\)\.]/g, '').trim();

    // Vérifier si un autre utilisateur a déjà cet email
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: sessionUser.id } },
      });
      if (existingEmail) {
        return { success: false, message: 'Cet email est déjà utilisé par un autre compte.' };
      }
    }

    // Vérifier si un autre utilisateur a déjà ce téléphone
    if (cleanPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: { telephone: cleanPhone, NOT: { id: sessionUser.id } },
      });
      if (existingPhone) {
        return { success: false, message: 'Ce numéro de téléphone est déjà associé à un autre compte.' };
      }
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        nom: data.nom,
        email: data.email,
        telephone: cleanPhone || null,
        client: {
          upsert: {
            create: {
              telephone: data.telephone,
              adresse: data.adresse,
            },
            update: {
              telephone: data.telephone,
              adresse: data.adresse,
            },
          },
        },
      },
    });

    return { success: true, message: 'Profil mis à jour avec succès.' };
  } catch (error: any) {
    console.error("Error updating client profile:", error);
    return { success: false, message: error.message || 'Erreur lors de la mise à jour' };
  }
}

export async function changeClientPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: 'Non autorisé. Veuillez vous connecter.' };
    }

    if (!data.currentPassword || !data.newPassword) {
      return { success: false, message: 'Veuillez renseigner tous les champs requis.' };
    }

    if (data.newPassword.length < 6) {
      return { success: false, message: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    const sessionUser = session.user as any;
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user || !user.password_hash) {
      return { success: false, message: 'Utilisateur introuvable.' };
    }

    const bcrypt = await import('bcrypt');
    const isCurrentValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return { success: false, message: 'Le mot de passe actuel est incorrect.' };
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
        mustChangePassword: false,
      },
    });

    return { success: true, message: 'Votre mot de passe a été modifié avec succès.' };
  } catch (error: any) {
    console.error("Error changing client password:", error);
    return { success: false, message: error.message || 'Erreur lors du changement de mot de passe' };
  }
}

