'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

import { generateDefaultClientPassword, hashPassword, normalizePhone } from '@/lib/clientAuthUtils';

function generateTrackingNumber() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TGL-${date}-${random}`;
}

interface OperationShipmentData {
  origine: string;
  destination: string;
  type_transport: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  description: string;
  boxes: number;
  poids: number;
  amountPaid: number;
  paymentMethod: string;
  freightCost: number;
  docFee: number;
  totalAmount: number;
  balance: number;
}

export async function createOperationShipment(data: OperationShipmentData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Non autorisé. Veuillez vous connecter.' };
  }

  const agentUser = session.user as any;

  try {
    const cleanPhone = normalizePhone(data.senderPhone);
    const defaultPassword = generateDefaultClientPassword(data.senderPhone);
    const passwordHash = await hashPassword(defaultPassword);

    // Trouver ou créer un client walk-in basé sur le téléphone de l'expéditeur
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          ...(data.senderPhone ? [{ telephone: data.senderPhone }] : []),
          ...(cleanPhone ? [{ telephone: cleanPhone }] : []),
        ],
      },
      include: { user: true },
    });

    if (!client) {
      const emailSafe = cleanPhone || `walkin-${Date.now()}`;
      const walkinEmail = `client_${emailSafe}@tangaly.local`;

      let walkinUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: walkinEmail },
            ...(cleanPhone ? [{ telephone: cleanPhone }] : []),
          ],
        },
      });

      if (!walkinUser) {
        walkinUser = await prisma.user.create({
          data: {
            nom: data.senderName || 'Client Walk-in',
            email: walkinEmail,
            telephone: cleanPhone || null,
            password_hash: passwordHash,
            mustChangePassword: true,
            role: 'CLIENT',
          },
        });
      } else if (!walkinUser.password_hash || walkinUser.password_hash === 'walkin-no-login') {
        walkinUser = await prisma.user.update({
          where: { id: walkinUser.id },
          data: {
            telephone: cleanPhone || walkinUser.telephone,
            password_hash: passwordHash,
            mustChangePassword: true,
          },
        });
      }

      // Créer le client lié à cet user
      client = await prisma.client.create({
        data: {
          userId: walkinUser.id,
          telephone: data.senderPhone || cleanPhone || null,
          adresse: data.senderAddress || null,
        },
        include: { user: true },
      });
    } else if (client.user && (!client.user.password_hash || client.user.password_hash === 'walkin-no-login')) {
      await prisma.user.update({
        where: { id: client.user.id },
        data: {
          telephone: cleanPhone || client.user.telephone,
          password_hash: passwordHash,
          mustChangePassword: true,
        },
      });
    }

    const trackingNumber = generateTrackingNumber();

    const shipment = await prisma.shipment.create({
      data: {
        tracking_number: trackingNumber,
        clientId: client.id,
        origine: data.origine,
        destination: data.destination,
        type_transport: data.type_transport,
        poids: data.poids || null,
        description: data.description || null,
        boxes: data.boxes || null,
        receiverName: data.receiverName || null,
        receiverPhone: data.receiverPhone || null,
        receiverAddress: data.receiverAddress || null,
        amountPaid: data.amountPaid ?? null,
        paymentMethod: data.paymentMethod || null,
        freightCost: data.freightCost || null,
        docFee: data.docFee || null,
        totalAmount: data.totalAmount || null,
        balance: data.balance || null,
        statut: 'PENDING',
        tracking_events: {
          create: {
            statut: 'PENDING',
            commentaire: `Expédition créée par ${agentUser.nom || agentUser.name || 'Agent'}. Expéditeur: ${data.senderName} (${data.senderPhone})`,
            userId: agentUser.id,
          },
        },
      },
    });

    revalidatePath('/operations');
    revalidatePath('/admin/shipments');

    return { success: true, data: shipment };
  } catch (error: any) {
    console.error('Error creating operation shipment:', error);
    return { success: false, message: error.message || 'Erreur lors de la création de l\'expédition' };
  }
}
