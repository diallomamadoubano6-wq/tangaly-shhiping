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
        },
        invoice: true
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

    let actualClientId = data.clientId;
    if (!actualClientId) {
      const phone = data.senderPhone || '000000000';
      const email = `client_${phone.replace(/\s+/g, '')}@tangaly.local`;
      const clientUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          nom: data.senderName || 'Client Inconnu',
          email,
          password_hash: '',
          role: 'CLIENT',
          client: {
            create: {
              telephone: phone,
              adresse: data.senderAddress || ''
            }
          }
        },
        include: { client: true }
      });
      actualClientId = clientUser.client?.id;
    }
    
    const shipment = await prisma.shipment.create({
      data: {
        tracking_number: trackingNumber,
        clientId: actualClientId,
        origine: data.origine,
        destination: data.destination,
        type_transport: data.type_transport,
        poids: data.poids !== undefined && data.poids !== null && data.poids !== '' ? parseFloat(data.poids) : null,
        volume: data.volume !== undefined && data.volume !== null && data.volume !== '' ? parseFloat(data.volume) : null,
        receiverName: data.receiverName || null,
        receiverPhone: data.receiverPhone || null,
        receiverAddress: data.receiverAddress || null,
        description: data.description || null,
        boxes: data.boxes ? parseInt(data.boxes) : null,
        amountPaid: data.amountPaid !== undefined && data.amountPaid !== null && data.amountPaid !== '' ? parseFloat(data.amountPaid) : null,
        paymentMethod: data.paymentMethod || null,
        freightCost: data.freightCost !== undefined && data.freightCost !== null && data.freightCost !== '' ? parseFloat(data.freightCost) : null,
        docFee: data.docFee !== undefined && data.docFee !== null && data.docFee !== '' ? parseFloat(data.docFee) : null,
        totalAmount: data.totalAmount !== undefined && data.totalAmount !== null && data.totalAmount !== '' ? parseFloat(data.totalAmount) : null,
        balance: data.balance !== undefined && data.balance !== null && data.balance !== '' ? parseFloat(data.balance) : null,
        statut: 'PENDING',
        tracking_events: {
          create: {
            statut: 'PENDING',
            commentaire: 'Expédition créée',
            userId: user.id
          }
        },
        invoice: {
          create: {
            number: `FAC-${trackingNumber.replace('TGL-', '')}`,
            clientId: actualClientId,
            subtotal: (parseFloat(data.freightCost || 0) + parseFloat(data.docFee || 0)) || 0,
            total: parseFloat(data.totalAmount || 0),
            amountPaid: parseFloat(data.amountPaid || 0),
            balance: parseFloat(data.balance || 0),
            status: parseFloat(data.balance || 0) <= 0 && parseFloat(data.totalAmount || 0) > 0 ? 'PAID' : 'PENDING',
            payments: (parseFloat(data.amountPaid || 0) > 0) ? {
              create: {
                amount: parseFloat(data.amountPaid || 0),
                method: data.paymentMethod || 'CASH',
                recordedBy: user.id
              }
            } : undefined
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

export async function registerPayment(shipmentId: string, amount: number, method: string) {
  const user = await checkAuth();
  
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { invoice: true }
    });
    
    if (!shipment || !shipment.invoice) {
      return { success: false, message: 'Facture introuvable' };
    }

    const newAmountPaid = shipment.invoice.amountPaid + amount;
    const newBalance = shipment.invoice.total - newAmountPaid;
    
    await prisma.invoice.update({
      where: { id: shipment.invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance > 0 ? newBalance : 0,
        status: newBalance <= 0 ? 'PAID' : 'PENDING',
        payments: {
          create: {
            amount: amount,
            method: method,
            recordedBy: user.id
          }
        }
      }
    });

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance > 0 ? newBalance : 0
      }
    });

    revalidatePath('/operations/invoices');
    return { success: true };
  } catch (error) {
    console.error("Error registering payment:", error);
    return { success: false, message: "Erreur lors de l'enregistrement du paiement" };
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
