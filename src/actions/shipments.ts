'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user as any;
}

export async function getShipments() {
  const user = await checkAuth();
  
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        client: {
          include: {
            user: true
          }
        },
        tracking_events: {
          include: {
            user: true
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: shipments };
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return { success: false, data: [] };
  }
}

function generateTrackingNumber() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TGL-${date}-${random}`;
}

export async function createShipment(data: any) {
  const user = await checkAuth();
  
  try {
    const trackingNumber = generateTrackingNumber();
    
    const shipment = await prisma.shipment.create({
      data: {
        tracking_number: trackingNumber,
        clientId: data.clientId,
        origine: data.origine,
        destination: data.destination,
        type_transport: data.type_transport,
        poids: data.poids || null,
        volume: data.volume || null,
        statut: 'PENDING',
        tracking_events: {
          create: {
            statut: 'PENDING',
            commentaire: 'Expédition créée',
            userId: user.id
          }
        }
      },
      include: {
        client: {
          include: { user: true }
        }
      }
    });

    revalidatePath('/admin/shipments');
    return { success: true, data: shipment };
  } catch (error) {
    console.error("Error creating shipment:", error);
    return { success: false, message: 'Erreur lors de la création de l\'expédition' };
  }
}

export async function updateShipmentStatus(id: string, statut: string, commentaire?: string) {
  const user = await checkAuth();
  
  try {
    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        statut,
        tracking_events: {
          create: {
            statut,
            commentaire: commentaire || `Statut mis à jour vers ${statut}`,
            userId: user.id
          }
        }
      }
    });

    revalidatePath('/admin/shipments');
    return { success: true, data: shipment };
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return { success: false, message: 'Erreur lors de la mise à jour du statut' };
  }
}

export async function addShipmentEvent(id: string, statut: string, commentaire: string) {
  const user = await checkAuth();
  
  try {
    await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        statut,
        commentaire,
        userId: user.id
      }
    });

    // Optionally update the shipment's main status if the event matches a main status
    await prisma.shipment.update({
      where: { id },
      data: { statut }
    });

    revalidatePath('/admin/shipments');
    return { success: true };
  } catch (error) {
    console.error("Error adding shipment event:", error);
    return { success: false, message: 'Erreur lors de l\'ajout de l\'événement' };
  }
}
