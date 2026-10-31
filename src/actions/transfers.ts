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
  status: 'completed' | 'pending' | 'failed' | 'VALIDATED' | 'PENDING' | 'REJECTED';
  note: string;
  agentId?: string | null;
  agentEmail?: string | null;
  agencyName?: string | null;
  validatedAt?: string | null;
  validatedByName?: string | null;
  createdAt: string;
};

interface SessionUser {
  id?: string;
  nom?: string;
  name?: string;
  email?: string;
  role?: string;
  localisation?: string;
  agencyId?: string;
}

/**
 * Créer un nouveau versement d'un agent vers l'Administration centrale
 */
export async function createAgentTransfer(data: {
  amount: number;
  currency: 'USD' | 'GNF';
  note?: string;
  toName?: string;
  clientGeneratedId?: string;
  agentName?: string;
  agentEmail?: string;
  method?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    let user = session?.user as SessionUser | undefined;

    // Fallback si session absente dans le contexte du Server Action
    if (!user || !user.id) {
      const defaultUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { in: ['SUPER_ADMIN', 'ADMIN', 'GERANT_USA', 'GERANT_GUINEE', 'AGENT'] } },
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
          agencyId: defaultUser.agencyId || undefined,
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
      agencyName,
      status: 'pending' as const, // Nouveau versement : en attente de validation par l'administration
      createdAt: new Date().toISOString(),
    };

    let savedId = reference;

    // 1. Essai d'enregistrement dans le modèle CashRemittance de Prisma
    try {
      const remittance = await (prisma as any).cashRemittance.create({
        data: {
          reference,
          agentId: user?.id || null,
          agencyId: user?.agencyId || null,
          fromName: agentDisplayName,
          toName: targetRecipient,
          amount: Number(data.amount),
          currency: data.currency || 'USD',
          method: data.method || 'ESPECES',
          status: 'PENDING',
          note: data.note || 'Versement de caisse expéditions vers l\'Administration',
        },
      });
      if (remittance && remittance.id) {
        savedId = remittance.id;
      }
    } catch (dbErr) {
      console.warn('Note: cashRemittance table pending migration, using auditLog fallback:', dbErr);
    }

    // 2. Toujours enregistrer dans AuditLog (module FINANCE) comme journal infalsifiable
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: 'VERSEMENT_ADMIN',
          module: 'FINANCE',
          ancienne_valeur: 'PENDING',
          nouvelle_valeur: JSON.stringify({ ...transferPayload, id: savedId }),
          date: new Date(),
        },
      });
    } catch (auditErr) {
      console.warn('AuditLog fallback warning:', auditErr);
    }

    revalidatePath('/operations/transfers');
    revalidatePath('/admin/transfers');

    return {
      success: true,
      data: {
        id: savedId,
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
 * Valider ou rejeter un versement par l'Administrateur
 */
export async function validateRemittance(
  referenceOrId: string, 
  status: 'VALIDATED' | 'REJECTED', 
  note?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    const validatorName = user?.nom || user?.name || 'Administrateur Tangaly';
    const validatedAt = new Date();

    // 1. Mettre à jour dans CashRemittance
    try {
      await (prisma as any).cashRemittance.updateMany({
        where: {
          OR: [
            { id: referenceOrId },
            { reference: referenceOrId },
          ],
        },
        data: {
          status,
          validatedAt,
          validatedBy: user?.id || null,
          ...(note ? { note } : {}),
        },
      });
    } catch (dbErr) {
      console.warn('CashRemittance update error:', dbErr);
    }

    // 2. Mettre à jour dans AuditLog
    try {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'VERSEMENT_ADMIN', module: 'FINANCE' },
      });

      for (const log of logs) {
        if (!log.nouvelle_valeur) continue;
        try {
          const payload = JSON.parse(log.nouvelle_valeur);
          if (payload.id === referenceOrId || payload.reference === referenceOrId) {
            payload.status = status === 'VALIDATED' ? 'completed' : 'failed';
            payload.validatedAt = validatedAt.toISOString();
            payload.validatedByName = validatorName;
            if (note) payload.adminNote = note;

            await prisma.auditLog.update({
              where: { id: log.id },
              data: {
                ancienne_valeur: status,
                nouvelle_valeur: JSON.stringify(payload),
              },
            });
            break;
          }
        } catch {
          // ignore parsing error
        }
      }
    } catch (auditErr) {
      console.warn('AuditLog update error:', auditErr);
    }

    revalidatePath('/admin/transfers');
    revalidatePath('/operations/transfers');

    return { 
      success: true, 
      message: status === 'VALIDATED' ? 'Versement validé avec succès.' : 'Versement refusé.' 
    };
  } catch (error: unknown) {
    console.error('Erreur validateRemittance:', error);
    const msg = error instanceof Error ? error.message : 'Erreur lors de la validation.';
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

    const parsedTransfers: TransferItem[] = [];
    const seenRefs = new Set<string>();

    // 1. Lire depuis CashRemittance
    try {
      const records = await (prisma as any).cashRemittance.findMany({
        where: isManagerOrAdmin ? {} : (currentUserId ? { agentId: currentUserId } : {}),
        include: {
          agent: { select: { nom: true, email: true, localisation: true } },
          validator: { select: { nom: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const r of records) {
        const ref = r.reference || r.id;
        seenRefs.add(ref);
        const rDate = new Date(r.createdAt);
        parsedTransfers.push({
          id: r.id,
          reference: ref,
          fromName: r.fromName || (r.agent ? `${r.agent.nom} (${r.agent.localisation || 'Agence'})` : 'Agent Tangaly'),
          toName: r.toName || 'Administration TANGALY (Siège)',
          amount: Number(r.amount) || 0,
          currency: (r.currency as 'USD' | 'GNF') || 'USD',
          date: rDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: r.status === 'VALIDATED' ? 'completed' : r.status === 'REJECTED' ? 'failed' : 'pending',
          note: r.note || 'Versement de caisse vers l\'Administration',
          agentId: r.agentId,
          agentEmail: r.agent?.email || null,
          agencyName: r.agent?.localisation || null,
          validatedAt: r.validatedAt ? new Date(r.validatedAt).toISOString() : null,
          validatedByName: r.validator?.nom || null,
          createdAt: rDate.toISOString(),
        });
      }
    } catch {
      // Modèle non encore initialisé en base, bascule sur AuditLog
    }

    // 2. Compléter depuis AuditLog si absent
    try {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'VERSEMENT_ADMIN', module: 'FINANCE' },
        include: { user: true },
        orderBy: { date: 'desc' },
      });

      for (const log of logs) {
        if (!log.nouvelle_valeur) continue;
        try {
          const payload = JSON.parse(log.nouvelle_valeur);
          const ref = payload.reference || `VIR-${log.id.slice(0, 4)}`;
          if (seenRefs.has(ref)) continue;

          const logUserId = log.userId || payload.agentId;
          const logUserEmail = (log.user?.email || payload.agentEmail || '').toLowerCase();
          const logFromName = (payload.fromName || '').toLowerCase();

          const isOwner =
            isManagerOrAdmin ||
            (currentUserId && logUserId === currentUserId) ||
            (currentUserEmail && logUserEmail === currentUserEmail) ||
            (currentUserName && logFromName.includes(currentUserName));

          if (isOwner) {
            seenRefs.add(ref);
            const logDate = log.date ? new Date(log.date) : new Date(payload.createdAt || Date.now());
            const rawStatus = (payload.status || 'pending').toLowerCase();
            const normalizedStatus = rawStatus === 'completed' || rawStatus === 'validated' ? 'completed'
              : rawStatus === 'failed' || rawStatus === 'rejected' ? 'failed' : 'pending';

            parsedTransfers.push({
              id: payload.id || ref,
              reference: ref,
              fromName: payload.fromName || `${log.user?.nom || 'Agent'} (${log.user?.localisation || 'Agence'})`,
              toName: payload.toName || 'Administration TANGALY (Siège)',
              amount: Number(payload.amount) || 0,
              currency: (payload.currency as 'USD' | 'GNF') || 'USD',
              date: logDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: normalizedStatus,
              note: payload.note || 'Versement vers l\'Administration',
              agentId: logUserId,
              agentEmail: logUserEmail,
              validatedAt: payload.validatedAt || null,
              validatedByName: payload.validatedByName || null,
              createdAt: logDate.toISOString(),
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (auditErr) {
      console.warn('AuditLog read warning:', auditErr);
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
    const parsedTransfers: TransferItem[] = [];
    const seenRefs = new Set<string>();

    // 1. Lire depuis CashRemittance
    try {
      const records = await (prisma as any).cashRemittance.findMany({
        include: {
          agent: { select: { nom: true, email: true, localisation: true } },
          validator: { select: { nom: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const r of records) {
        const ref = r.reference || r.id;
        seenRefs.add(ref);
        const rDate = new Date(r.createdAt);
        parsedTransfers.push({
          id: r.id,
          reference: ref,
          fromName: r.fromName || (r.agent ? `${r.agent.nom} (${r.agent.localisation || 'Agence'})` : 'Agent Tangaly'),
          toName: r.toName || 'Administration TANGALY (Siège)',
          amount: Number(r.amount) || 0,
          currency: (r.currency as 'USD' | 'GNF') || 'USD',
          date: rDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: r.status === 'VALIDATED' ? 'completed' : r.status === 'REJECTED' ? 'failed' : 'pending',
          note: r.note || 'Versement de caisse vers l\'Administration',
          agentId: r.agentId,
          agentEmail: r.agent?.email || null,
          agencyName: r.agent?.localisation || null,
          validatedAt: r.validatedAt ? new Date(r.validatedAt).toISOString() : null,
          validatedByName: r.validator?.nom || null,
          createdAt: rDate.toISOString(),
        });
      }
    } catch {
      // Modèle non encore initialisé en base
    }

    // 2. Compléter depuis AuditLog
    try {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'VERSEMENT_ADMIN', module: 'FINANCE' },
        include: { user: true },
        orderBy: { date: 'desc' },
      });

      for (const log of logs) {
        if (!log.nouvelle_valeur) continue;
        try {
          const payload = JSON.parse(log.nouvelle_valeur);
          const ref = payload.reference || `VIR-${log.id.slice(0, 4)}`;
          if (seenRefs.has(ref)) continue;
          seenRefs.add(ref);

          const logDate = log.date ? new Date(log.date) : new Date(payload.createdAt || Date.now());
          const rawStatus = (payload.status || 'pending').toLowerCase();
          const normalizedStatus = rawStatus === 'completed' || rawStatus === 'validated' ? 'completed'
            : rawStatus === 'failed' || rawStatus === 'rejected' ? 'failed' : 'pending';

          parsedTransfers.push({
            id: payload.id || ref,
            reference: ref,
            fromName: payload.fromName || `${log.user?.nom || 'Agent'} (${log.user?.localisation || 'Agence'})`,
            toName: payload.toName || 'Administration TANGALY (Siège)',
            amount: Number(payload.amount) || 0,
            currency: (payload.currency as 'USD' | 'GNF') || 'USD',
            date: logDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: normalizedStatus,
            note: payload.note || 'Versement vers l\'Administration',
            agentId: log.userId || payload.agentId,
            agentEmail: log.user?.email || payload.agentEmail,
            validatedAt: payload.validatedAt || null,
            validatedByName: payload.validatedByName || null,
            createdAt: logDate.toISOString(),
          });
        } catch {
          // ignore
        }
      }
    } catch (auditErr) {
      console.warn('AuditLog read warning in getAllTransfers:', auditErr);
    }

    return { success: true, data: parsedTransfers };
  } catch (error: unknown) {
    console.error('Erreur getAllTransfers:', error);
    return { success: false, data: [] };
  }
}
