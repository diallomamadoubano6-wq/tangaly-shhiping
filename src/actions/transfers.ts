'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type TransferItem = {
  id: string;
  reference: string;
  fromName: string;
  toName: string;
  amount: number;
  currency: 'USD' | 'GNF';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  note: string;
  agentId?: string | null;
  agentEmail?: string | null;
  createdAt: string;
};

interface SessionUser {
  id?: string;
  nom?: string;
  name?: string;
  email?: string;
  role?: string;
  localisation?: string;
}

/**
 * Créer un nouveau versement d'un agent vers l'Administration
 */
export async function createAgentTransfer(data: {
  amount: number;
  currency: 'USD' | 'GNF';
  note?: string;
  toName?: string;
  clientGeneratedId?: string;
  agentName?: string;
  agentEmail?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    let user = session?.user as SessionUser | undefined;

    // Fallback si session absente dans le contexte du Server Action
    if (!user || !user.id) {
      const defaultUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { in: ['SUPER_ADMIN', 'ADMIN', 'GERANT_USA', 'GERANT_GUINEE'] } },
            { email: 'admin@tangaly.com' }
          ]
        }
      });
      if (defaultUser) {
        user = {
          id: defaultUser.id,
          nom: defaultUser.nom,
          name: defaultUser.nom,
          email: defaultUser.email,
          role: defaultUser.role,
          localisation: defaultUser.localisation || 'Agence Principale',
        };
      }
    }

    const agentName = data.agentName || user?.nom || user?.name || 'Agent Tangaly';
    const agencyName = user?.localisation || 'Agence Tangaly';
    const agentDisplayName = `${agentName} (${agencyName})`;
    const targetRecipient = data.toName || 'Administration TANGALY (Siège)';

    const reference = data.clientGeneratedId || `VIR-${Date.now().toString().slice(-4)}`;

    const transferPayload = {
      reference,
      fromName: agentDisplayName,
      toName: targetRecipient,
      amount: Number(data.amount),
      currency: data.currency || 'USD',
      note: data.note || 'Versement de caisse expéditions vers l\'Administration',
      agentId: user?.id || null,
      agentEmail: user?.email || data.agentEmail || null,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    // Sauvegarde en base de données via AuditLog (module FINANCE)
    const audit = await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        action: 'VERSEMENT_ADMIN',
        module: 'FINANCE',
        ancienne_valeur: 'COMPLETED',
        nouvelle_valeur: JSON.stringify(transferPayload),
        date: new Date(),
      },
    });

    revalidatePath('/operations/transfers');
    revalidatePath('/admin/transfers');

    return {
      success: true,
      data: {
        id: audit.id,
        ...transferPayload,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      },
    };
  } catch (error: unknown) {
    console.error('Erreur createAgentTransfer:', error);
    const msg = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du versement.';
    return { success: false, message: msg };
  }
}

/**
 * Récupérer l'historique des versements pour l'agent connecté
 */
export async function getAgentTransfers(): Promise<{ success: boolean; data: TransferItem[] }> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    const currentUserId = user?.id;
    const currentUserName = (user?.nom || user?.name || '').trim().toLowerCase();
    const currentUserEmail = (user?.email || '').trim().toLowerCase();
    const userRole = (user?.role || '').toUpperCase();
    const isManagerOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || !user;

    // Récupérer les versements enregistrés dans AuditLog
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'VERSEMENT_ADMIN',
        module: 'FINANCE',
      },
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const parsedTransfers: TransferItem[] = [];

    for (const log of logs) {
      try {
        if (!log.nouvelle_valeur) continue;
        const payload = JSON.parse(log.nouvelle_valeur);

        const logUserId = log.userId || payload.agentId;
        const logUserEmail = (log.user?.email || payload.agentEmail || '').toLowerCase();
        const logFromName = (payload.fromName || '').toLowerCase();

        // Si administrateur ou gérant, ou si le versement appartient à l'agent
        const isOwner =
          isManagerOrAdmin ||
          (currentUserId && logUserId === currentUserId) ||
          (currentUserEmail && logUserEmail === currentUserEmail) ||
          (currentUserName && logFromName.includes(currentUserName));

        if (isOwner) {
          const logDate = log.date ? new Date(log.date) : new Date(payload.createdAt || Date.now());
          parsedTransfers.push({
            id: payload.reference || `VIR-${log.id.slice(0, 4)}`,
            reference: payload.reference || `VIR-${log.id.slice(0, 4)}`,
            fromName: payload.fromName || `${log.user?.nom || 'Agent'} (${log.user?.localisation || 'Agence'})`,
            toName: payload.toName || 'Administration TANGALY (Siège)',
            amount: Number(payload.amount) || 0,
            currency: (payload.currency as 'USD' | 'GNF') || 'USD',
            date: logDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: payload.status || 'completed',
            note: payload.note || 'Versement vers l\'Administration',
            agentId: logUserId,
            agentEmail: logUserEmail,
            createdAt: logDate.toISOString(),
          });
        }
      } catch (err) {
        console.warn('Erreur parsing versement log:', err);
      }
    }

    return { success: true, data: parsedTransfers };
  } catch (error: unknown) {
    console.error('Erreur getAgentTransfers:', error);
    return { success: false, data: [] };
  }
}

/**
 * Récupérer tous les versements de toutes les agences pour l'Administrateur
 */
export async function getAllTransfers(): Promise<{ success: boolean; data: TransferItem[] }> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'VERSEMENT_ADMIN',
        module: 'FINANCE',
      },
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const parsedTransfers: TransferItem[] = [];

    for (const log of logs) {
      try {
        if (!log.nouvelle_valeur) continue;
        const payload = JSON.parse(log.nouvelle_valeur);
        const logDate = log.date ? new Date(log.date) : new Date(payload.createdAt || Date.now());

        parsedTransfers.push({
          id: payload.reference || `VIR-${log.id.slice(0, 4)}`,
          reference: payload.reference || `VIR-${log.id.slice(0, 4)}`,
          fromName: payload.fromName || `${log.user?.nom || 'Agent'} (${log.user?.localisation || 'Agence'})`,
          toName: payload.toName || 'Administration TANGALY (Siège)',
          amount: Number(payload.amount) || 0,
          currency: (payload.currency as 'USD' | 'GNF') || 'USD',
          date: logDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: payload.status || 'completed',
          note: payload.note || 'Versement vers l\'Administration',
          agentId: log.userId || payload.agentId,
          agentEmail: log.user?.email || payload.agentEmail,
          createdAt: logDate.toISOString(),
        });
      } catch (err) {
        console.warn('Erreur parsing all transfers:', err);
      }
    }

    return { success: true, data: parsedTransfers };
  } catch (error: unknown) {
    console.error('Erreur getAllTransfers:', error);
    return { success: false, data: [] };
  }
}
