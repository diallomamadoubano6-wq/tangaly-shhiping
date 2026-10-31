/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ArticleTarifItem = {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  prixParKg: number | null;
  prixParPiece: number | null;
  unite: 'KG' | 'PIECE' | 'KG_ET_PIECE';
  direction: 'USA_CONAKRY' | 'CONAKRY_USA' | 'LES_DEUX';
  service: 'AERIEN' | 'MARITIME' | 'LES_DEUX';
  devise: string;
  actif: boolean;
};

export type ShipmentArticleInput = {
  articleTarifId?: string | null;
  nom: string;
  unite: 'KG' | 'PIECE';
  quantite: number;
  prixUnitaire: number;
  reductionPct: number;
  reductionMontant: number;
  prixFinal: number;
  raisonReduction?: string | null;
};

// ─── ADMIN : Récupérer tous les articles du catalogue ───────────────────────
export async function getArticlesTarifs(): Promise<{ success: boolean; data: ArticleTarifItem[] }> {
  try {
    const articles = await (prisma as any).articleTarif.findMany({
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
    return { success: true, data: articles };
  } catch (error) {
    console.error('getArticlesTarifs error:', error);
    return { success: false, data: [] };
  }
}

// ─── ADMIN : Récupérer les articles actifs (pour agents) ────────────────────
export async function getArticlesTarifsActifs(direction?: string, service?: string): Promise<{ success: boolean; data: ArticleTarifItem[] }> {
  try {
    const where: any = { actif: true };
    if (direction) {
      where.OR = [
        { direction: direction },
        { direction: 'LES_DEUX' },
      ];
    }
    if (service) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { service: service },
            { service: 'LES_DEUX' },
          ],
        },
      ];
    }
    const articles = await (prisma as any).articleTarif.findMany({
      where,
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
    return { success: true, data: articles };
  } catch (error) {
    console.error('getArticlesTarifsActifs error:', error);
    return { success: false, data: [] };
  }
}

// ─── ADMIN : Créer un article ─────────────────────────────────────────────
export async function createArticleTarif(data: {
  nom: string;
  description?: string;
  categorie?: string;
  prixParKg?: number | null;
  prixParPiece?: number | null;
  unite: 'KG' | 'PIECE' | 'KG_ET_PIECE';
  direction: 'USA_CONAKRY' | 'CONAKRY_USA' | 'LES_DEUX';
  service: 'AERIEN' | 'MARITIME' | 'LES_DEUX';
  devise?: string;
  actif?: boolean;
}) {
  try {
    const article = await (prisma as any).articleTarif.create({
      data: {
        nom: data.nom,
        description: data.description || null,
        categorie: data.categorie || null,
        prixParKg: data.prixParKg ?? null,
        prixParPiece: data.prixParPiece ?? null,
        unite: data.unite,
        direction: data.direction,
        service: data.service,
        devise: data.devise || 'USD',
        actif: data.actif ?? true,
      },
    });
    revalidatePath('/admin/tarifs');
    revalidatePath('/operations/new');
    return { success: true, data: article };
  } catch (error) {
    console.error('createArticleTarif error:', error);
    return { success: false, message: 'Erreur lors de la création.' };
  }
}

// ─── ADMIN : Modifier un article ──────────────────────────────────────────
export async function updateArticleTarif(id: string, data: Partial<{
  nom: string;
  description: string | null;
  categorie: string | null;
  prixParKg: number | null;
  prixParPiece: number | null;
  unite: string;
  direction: string;
  service: string;
  devise: string;
  actif: boolean;
}>) {
  try {
    const article = await (prisma as any).articleTarif.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/tarifs');
    revalidatePath('/operations/new');
    return { success: true, data: article };
  } catch (error) {
    console.error('updateArticleTarif error:', error);
    return { success: false, message: 'Erreur lors de la mise à jour.' };
  }
}

// ─── ADMIN : Supprimer un article ────────────────────────────────────────
export async function deleteArticleTarif(id: string) {
  try {
    await (prisma as any).articleTarif.delete({ where: { id } });
    revalidatePath('/admin/tarifs');
    return { success: true };
  } catch (error) {
    console.error('deleteArticleTarif error:', error);
    return { success: false, message: 'Erreur lors de la suppression.' };
  }
}

// ─── AGENT : Enregistrer les articles d'une expédition ─────────────────────
export async function saveShipmentArticles(shipmentId: string, articles: ShipmentArticleInput[]) {
  try {
    // Supprimer les anciens articles si recréation
    await (prisma as any).shipmentArticle.deleteMany({ where: { shipmentId } });

    if (articles.length === 0) return { success: true };

    await (prisma as any).shipmentArticle.createMany({
      data: articles.map(a => ({
        shipmentId,
        articleTarifId: a.articleTarifId || null,
        nom: a.nom,
        unite: a.unite,
        quantite: Number(a.quantite),
        prixUnitaire: Number(a.prixUnitaire),
        reductionPct: Number(a.reductionPct) || 0,
        reductionMontant: Number(a.reductionMontant) || 0,
        prixFinal: Number(a.prixFinal),
        raisonReduction: a.raisonReduction || null,
      })),
    });

    revalidatePath('/operations/shipments');
    revalidatePath('/admin/shipments');
    return { success: true };
  } catch (error) {
    console.error('saveShipmentArticles error:', error);
    return { success: false, message: 'Erreur enregistrement articles.' };
  }
}

// ─── Récupérer les articles d'une expédition ──────────────────────────────
export async function getShipmentArticles(shipmentId: string) {
  try {
    const articles = await (prisma as any).shipmentArticle.findMany({
      where: { shipmentId },
      include: { articleTarif: { select: { nom: true, categorie: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: articles };
  } catch (error) {
    console.error('getShipmentArticles error:', error);
    return { success: false, data: [] };
  }
}
