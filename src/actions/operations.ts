'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
    // Trouver ou créer un client walk-in basé sur le téléphone de l'expéditeur
    // On cherche d'abord un user existant avec ce téléphone
    let client = await prisma.client.findFirst({
      where: {
        telephone: data.senderPhone || undefined,
      },
    });

    // Si aucun client n'existe, on crée un compte walk-in générique
    if (!client) {
      // Créer un user walk-in avec un email généré automatiquement
      const emailSafe = (data.senderPhone || `walkin-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
      const walkinEmail = `walkin-${emailSafe}@tangaly.local`;

      // Vérifier si cet email existe déjà
      const existingUser = await prisma.user.findUnique({ where: { email: walkinEmail } });

      let walkinUser = existingUser;
      if (!walkinUser) {
        walkinUser = await prisma.user.create({
          data: {
            nom: data.senderName || 'Client Walk-in',
            email: walkinEmail,
            password_hash: 'walkin-no-login',
            role: 'CLIENT',
          },
        });
      }

      // Créer le client lié à cet user
      client = await prisma.client.create({
        data: {
          userId: walkinUser.id,
          telephone: data.senderPhone || null,
          adresse: data.senderAddress || null,
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
