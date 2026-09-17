'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAdminDashboardStats() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const totalShipments = await prisma.shipment.count();
    const pendingShipments = await prisma.shipment.count({ where: { statut: 'PENDING' } });
    const transitShipments = await prisma.shipment.count({ where: { statut: 'TRANSIT' } });
    const deliveredShipments = await prisma.shipment.count({ where: { statut: 'DELIVERED' } });
    
    // Calculate total collected amount
    const result = await prisma.shipment.aggregate({
      _sum: {
        amountPaid: true,
      }
    });

    const recentShipments = await prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });

    return {
      success: true,
      stats: {
        totalExpeditions: totalShipments,
        enAttente: pendingShipments,
        enTransit: transitShipments,
        livres: deliveredShipments,
        montantCollecte: result._sum.amountPaid || 0,
      },
      recentShipments: recentShipments.map(s => ({
        id: s.id,
        tracking_number: s.tracking_number,
        expediteur: s.client?.user?.nom || 'Inconnu',
        destinataire: s.receiverName || 'Inconnu',
        destination: s.destination,
        poids: s.poids ? `${s.poids} kg` : '-',
        statut: s.statut,
        montant: s.totalAmount || 0,
      }))
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { success: false, stats: null, recentShipments: [] };
  }
}
