'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface NotificationItem {
  id: string;
  sujet: string;
  message: string;
  type: 'VERSEMENT' | 'EXPEDITION' | 'PAIEMENT' | 'SYSTEME';
  lu: boolean;
  link?: string;
  createdAt: string;
  dateFormatted: string;
}

/**
 * Créer une nouvelle notification dans le système
 */
export async function createNotification(data: {
  userId?: string | null;
  clientId?: string | null;
  shipmentId?: string | null;
  sujet: string;
  message: string;
  type?: 'VERSEMENT' | 'EXPEDITION' | 'PAIEMENT' | 'SYSTEME';
  canal?: string;
  link?: string;
}) {
  try {
    const notif = await prisma.notification.create({
      data: {
        userId: data.userId || null,
        clientId: data.clientId || null,
        shipmentId: data.shipmentId || null,
        sujet: data.sujet,
        message: data.message,
        type: data.type || 'VERSEMENT',
        canal: data.canal || 'ADMIN',
        lu: false,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/operations');
    return { success: true, data: notif };
  } catch (error) {
    console.warn('Erreur creation notification:', error);
    return { success: false };
  }
}

/**
 * Récupérer les notifications pour l'Administrateur (avec les versements en attente en temps réel)
 */
export async function getAdminNotifications(): Promise<{
  success: boolean;
  unreadCount: number;
  data: NotificationItem[];
}> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    const notifItems: NotificationItem[] = [];
    const seenIds = new Set<string>();

    // 1. Récupérer les notifications enregistrées dans la table Notification
    try {
      const dbNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            { canal: 'ADMIN' },
            ...(user?.id ? [{ userId: user.id }] : []),
            { type: 'VERSEMENT' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      for (const n of dbNotifs) {
        seenIds.add(n.id);
        const d = new Date(n.createdAt);
        notifItems.push({
          id: n.id,
          sujet: n.sujet || 'Notification Administrative',
          message: n.message || '',
          type: (n.type as any) || 'VERSEMENT',
          lu: Boolean(n.lu),
          link: n.type === 'VERSEMENT' ? '/admin/transfers' : n.shipmentId ? '/admin/shipments' : undefined,
          createdAt: d.toISOString(),
          dateFormatted: formatRelativeTime(d),
        });
      }
    } catch (e) {
      console.warn('DB notification read warning:', e);
    }

    // 2. Synchroniser les versements d'agents en attente (CashRemittance / AuditLog)
    // pour garantir qu'un virement fait par un agent apparaît TOUJOURS en notification
    try {
      // Dans CashRemittance
      const pendingRemittances = await (prisma as any).cashRemittance.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const r of pendingRemittances) {
        const fakeId = `remit-${r.id}`;
        if (!seenIds.has(fakeId)) {
          seenIds.add(fakeId);
          const d = new Date(r.createdAt);
          notifItems.push({
            id: fakeId,
            sujet: 'Nouveau versement reçu',
            message: `${r.fromName} a transmis un versement de ${r.amount} ${r.currency} (${r.reference}). En attente de validation.`,
            type: 'VERSEMENT',
            lu: false,
            link: '/admin/transfers',
            createdAt: d.toISOString(),
            dateFormatted: formatRelativeTime(d),
          });
        }
      }
    } catch {
      // Table CashRemittance pas encore déployée
    }

    // Compléter avec AuditLog pour les versements récents non encore validés
    try {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'VERSEMENT_ADMIN', module: 'FINANCE' },
        orderBy: { date: 'desc' },
        take: 10,
      });

      for (const log of logs) {
        if (!log.nouvelle_valeur) continue;
        try {
          const payload = JSON.parse(log.nouvelle_valeur);
          const fakeId = `log-${log.id}`;
          if (payload.status === 'pending' && !seenIds.has(fakeId)) {
            seenIds.add(fakeId);
            const d = log.date ? new Date(log.date) : new Date();
            notifItems.push({
              id: fakeId,
              sujet: 'Nouveau versement reçu',
              message: `${payload.fromName || 'Agent'} a transmis un versement de ${payload.amount} ${payload.currency} (${payload.reference || 'VIR'}).`,
              type: 'VERSEMENT',
              lu: false,
              link: '/admin/transfers',
              createdAt: d.toISOString(),
              dateFormatted: formatRelativeTime(d),
            });
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    // Trier par date décroissante
    notifItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifItems.filter(n => !n.lu).length;

    return {
      success: true,
      unreadCount,
      data: notifItems.slice(0, 15),
    };
  } catch (error) {
    console.error('Erreur getAdminNotifications:', error);
    return { success: false, unreadCount: 0, data: [] };
  }
}

/**
 * Récupérer les notifications pour un agent connecté
 */
export async function getAgentNotifications(): Promise<{
  success: boolean;
  unreadCount: number;
  data: NotificationItem[];
}> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.id) return { success: true, unreadCount: 0, data: [] };

    const notifs = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { canal: 'AGENT' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const items: NotificationItem[] = notifs.map(n => {
      const d = new Date(n.createdAt);
      return {
        id: n.id,
        sujet: n.sujet || 'Information Agent',
        message: n.message || '',
        type: (n.type as any) || 'VERSEMENT',
        lu: Boolean(n.lu),
        link: n.type === 'VERSEMENT' ? '/operations/transfers' : undefined,
        createdAt: d.toISOString(),
        dateFormatted: formatRelativeTime(d),
      };
    });

    return {
      success: true,
      unreadCount: items.filter(i => !i.lu).length,
      data: items,
    };
  } catch (error) {
    console.error('Erreur getAgentNotifications:', error);
    return { success: false, unreadCount: 0, data: [] };
  }
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    await prisma.notification.updateMany({
      where: user?.role === 'SUPER_ADMIN' ? {} : (user?.id ? { userId: user.id } : {}),
      data: { lu: true },
    });

    revalidatePath('/admin');
    revalidatePath('/operations');
    return { success: true };
  } catch (error) {
    console.error('Erreur markAllNotificationsAsRead:', error);
    return { success: false };
  }
}

/**
 * Marquer une notification individuelle comme lue
 */
export async function markNotificationAsRead(id: string) {
  try {
    if (!id.startsWith('remit-') && !id.startsWith('log-')) {
      await prisma.notification.update({
        where: { id },
        data: { lu: true },
      });
    }
    revalidatePath('/admin');
    revalidatePath('/operations');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

function formatRelativeTime(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
