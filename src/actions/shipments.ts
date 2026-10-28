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

export async function findShipmentByTracking(trackingNumber: string) {
  await checkAuth();
  
  try {
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) {
      return { success: false, message: 'Veuillez saisir un numéro de suivi valide.' };
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        tracking_number: cleanNum
      },
      include: {
        client: {
          include: {
            user: {
              select: { nom: true, email: true }
            }
          }
        },
        agency: true,
        tracking_events: {
          include: {
            user: {
              select: { nom: true, role: true }
            }
          },
          orderBy: { date: 'desc' },
          take: 8
        }
      }
    });

    if (!shipment) {
      return { 
        success: false, 
        message: `Aucun colis trouvé avec le numéro "${cleanNum}". Vérifiez le code et réessayez.` 
      };
    }

    return { success: true, data: shipment };
  } catch (error) {
    console.error("Error finding shipment:", error);
    return { success: false, message: 'Erreur lors de la recherche du colis.' };
  }
}

export async function scanShipmentAction(
  trackingNumber: string, 
  newStatut?: string, 
  commentaire?: string,
  localisation?: string
) {
  const user = await checkAuth();

  try {
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) {
      return { success: false, message: 'Numéro de suivi requis.' };
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        tracking_number: cleanNum
      }
    });

    if (!shipment) {
      return { 
        success: false, 
        message: `Colis "${cleanNum}" introuvable dans la base de données.` 
      };
    }

    // Determine target status
    const targetStatus = newStatut || (
      shipment.statut === 'CREATED' ? 'RECEIVED' :
      shipment.statut === 'RECEIVED' ? 'PREPARING' :
      shipment.statut === 'PREPARING' ? 'SHIPPED' :
      shipment.statut === 'SHIPPED' ? 'ARRIVED' :
      shipment.statut === 'ARRIVED' ? 'DELIVERED' : 'DELIVERED'
    );

    const defaultLoc = localisation || (user.role === 'GERANT_USA' ? 'Hub New York, USA' : 'Hub Conakry, Guinée');
    const defaultComment = commentaire || `Pointage scan par ${user.nom || 'Agent'} — passage au statut "${targetStatus}"`;

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        statut: targetStatus,
        tracking_events: {
          create: {
            statut: targetStatus,
            commentaire: defaultComment,
            localisation: defaultLoc,
            userId: user.id
          }
        }
      },
      include: {
        client: {
          include: {
            user: {
              select: { nom: true, email: true }
            }
          }
        },
        agency: true,
        tracking_events: {
          include: {
            user: {
              select: { nom: true, role: true }
            }
          },
          orderBy: { date: 'desc' },
          take: 8
        }
      }
    });

    revalidatePath('/admin/scanner');
    revalidatePath('/admin/shipments');
    revalidatePath('/operations/scanner');
    revalidatePath(`/tracking/${cleanNum}`);

    return { 
      success: true, 
      data: updated, 
      previousStatus: shipment.statut, 
      newStatus: targetStatus 
    };
  } catch (error) {
    console.error("Error scanning shipment action:", error);
    return { success: false, message: 'Erreur lors de la mise à jour par scan.' };
  }
}

// ── Nouvelle expédition walk-in (page /operations/new) ──
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
    let client = await prisma.client.findFirst({
      where: { telephone: data.senderPhone || undefined },
    });

    if (!client) {
      const emailSafe = (data.senderPhone || `walkin-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
      const walkinEmail = `walkin-${emailSafe}@tangaly.local`;

      let walkinUser = await prisma.user.findUnique({ where: { email: walkinEmail } });
      if (!walkinUser) {
        walkinUser = await prisma.user.create({
          data: {
            nom: data.senderName || 'Client Walk-in',
            email: walkinEmail,
            password_hash: 'walkin-no-login',
            role: 'CLIENT',
          },
        });

        // Créer le profil Client associé
        client = await prisma.client.create({
          data: {
            userId: walkinUser.id,
            telephone: data.senderPhone || null,
            adresse: data.senderAddress || null,
          },
        });
      } else {
        // L'user existe mais pas le client — le créer
        client = await prisma.client.upsert({
          where: { userId: walkinUser.id },
          update: {},
          create: {
            userId: walkinUser.id,
            telephone: data.senderPhone || null,
            adresse: data.senderAddress || null,
          },
        });
      }
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
    return { success: false, message: error.message || "Erreur lors de la création de l'expédition" };
  }
}
