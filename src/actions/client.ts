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
