'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { generateDefaultClientPassword, hashPassword, normalizePhone } from '@/lib/clientAuthUtils';

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
      const rawPhone = data.senderPhone || '000000000';
      const cleanPhone = normalizePhone(rawPhone);
      const email = `client_${cleanPhone || Date.now()}@tangaly.local`;
      const defaultPassword = generateDefaultClientPassword(rawPhone);
      const passwordHash = await hashPassword(defaultPassword);

      // Check if user already exists with this phone or email
      let existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(cleanPhone ? [{ telephone: cleanPhone }] : []),
          ],
        },
        include: { client: true },
      });

      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            nom: data.senderName || 'Client Inconnu',
            email,
            telephone: cleanPhone || null,
            password_hash: passwordHash,
            mustChangePassword: true,
            role: 'CLIENT',
            client: {
              create: {
                telephone: rawPhone,
                adresse: data.senderAddress || '',
              },
            },
          },
          include: { client: true },
        });
      } else if (!existingUser.password_hash) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            telephone: cleanPhone || existingUser.telephone,
            password_hash: passwordHash,
            mustChangePassword: true,
          },
          include: { client: true },
        });
      }

      actualClientId = existingUser.client?.id;
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

function extractTrackingCode(input: string): string {
  let clean = input.trim();
  if (clean.includes('http://') || clean.includes('https://')) {
    try {
      const urlObj = new URL(clean);
      const param = urlObj.searchParams.get('tracking') || urlObj.searchParams.get('q') || urlObj.searchParams.get('data') || urlObj.searchParams.get('code');
      if (param) return param.trim();
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length > 0) return segments[segments.length - 1].trim();
    } catch {
      const match = clean.match(/TGL-[A-Za-z0-9-]+/i);
      if (match) return match[0];
    }
  }
  return clean;
}

export async function findShipmentByTracking(trackingNumber: string) {
  await checkAuth();
  
  try {
    const cleanNum = extractTrackingCode(trackingNumber);
    if (!cleanNum) {
      return { success: false, message: 'Veuillez saisir un numéro de suivi valide.' };
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { tracking_number: cleanNum },
          { id: cleanNum },
          { invoice: { number: cleanNum } }
        ]
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
        invoice: true,
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
    const cleanNum = extractTrackingCode(trackingNumber);
    if (!cleanNum) {
      return { success: false, message: 'Numéro de suivi requis.' };
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { tracking_number: cleanNum },
          { id: cleanNum },
          { invoice: { number: cleanNum } }
        ]
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

      // Créer le profil Client associé
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
    return { success: false, message: error.message || "Erreur lors de la création de l'expédition" };
  }
}
