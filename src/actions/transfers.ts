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
}) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user) {
      return { success: false, message: 'Non autorisé. Veuillez vous connecter.' };
    }

    const agentName = user.nom || user.name || 'Agent Tangaly';
    const agencyName = user.localisation || 'Agence Tangaly';
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
      agentId: user.id || null,
      agentEmail: user.email || null,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    // Sauvegarde en base de données via AuditLog (module FINANCE)
    const audit = await prisma.auditLog.create({
      data: {
        userId: user.id || null,
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
 * Récupérer l'historique des versements pour l'agent connecté uniquement
 */
export async function getAgentTransfers(): Promise<{ success: boolean; data: TransferItem[] }> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user) {
      return { success: true, data: [] };
    }

    const currentUserId = user.id;
    const currentUserName = (user.nom || user.name || '').trim().toLowerCase();
    const currentUserEmail = (user.email || '').trim().toLowerCase();

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

        // STRICT FILTER : Vérifier si ce versement appartient bien à l'agent connecté
        const isOwner =
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
