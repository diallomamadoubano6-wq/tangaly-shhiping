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

// ─── ADMIN : Catalogue New York (Conakry -> New York / USA) ────────────────
export const NEW_YORK_ARTICLES = [
  // 🌿 Produits traditionnels et de soin
  {
    nom: 'Médicaments traditionnels',
    categorie: 'Produits traditionnels et de soin',
    description: 'Plantes et décoctions traditionnelles',
    prixParKg: 15,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Coton à usage médicinal traditionnel',
    categorie: 'Produits traditionnels et de soin',
    description: 'Coton naturel et mèches médicinales traditionnelles',
    prixParKg: 12,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Beurre de karité',
    categorie: 'Produits traditionnels et de soin',
    description: 'Beurre de karité pur de Guinée (pot ou vrac)',
    prixParKg: 14,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'LES_DEUX' as const,
    devise: 'USD',
  },
  {
    nom: 'Savon noir',
    categorie: 'Produits traditionnels et de soin',
    description: 'Savon noir traditionnel artisanal',
    prixParKg: 12,
    prixParPiece: 5,
    unite: 'KG_ET_PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'LES_DEUX' as const,
    devise: 'USD',
  },
  {
    nom: 'Cosmétiques',
    categorie: 'Produits traditionnels et de soin',
    description: 'Produits de beauté et soins corporels',
    prixParKg: 15,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Pommades pour femmes',
    categorie: 'Produits traditionnels et de soin',
    description: 'Pommades corporelles et crèmes de soins féminins',
    prixParKg: 14,
    prixParPiece: 10,
    unite: 'KG_ET_PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Parfums',
    categorie: 'Produits traditionnels et de soin',
    description: 'Parfums et eaux de senteur',
    prixParKg: null,
    prixParPiece: 15,
    unite: 'PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },

  // 🍽️ Produits alimentaires
  {
    nom: 'Huile rouge',
    categorie: 'Produits alimentaires',
    description: 'Huile de palme rouge pure de Guinée (bidon étanche)',
    prixParKg: 15,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Poisson fumé',
    categorie: 'Produits alimentaires',
    description: 'Poisson fumé artisanal conditionné sous vide',
    prixParKg: 18,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Poisson séché',
    categorie: 'Produits alimentaires',
    description: 'Poisson séché traditionnel bien emballé',
    prixParKg: 18,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Soumbara',
    categorie: 'Produits alimentaires',
    description: 'Épice traditionnelle Soumbara (poudre ou boules)',
    prixParKg: 15,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Pâte d’arachide',
    categorie: 'Produits alimentaires',
    description: 'Pâte d\'arachide locale fraîche (pot ou seau)',
    prixParKg: 12,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Attiéké',
    categorie: 'Produits alimentaires',
    description: 'Semoule de manioc attiéké séchée ou fraîche sous vide',
    prixParKg: 12,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },

  // 👗 Vêtements et accessoires
  {
    nom: 'Vêtements',
    categorie: 'Vêtements et accessoires',
    description: 'Habits confectionnés, tenues diverses au kilo',
    prixParKg: 15,
    prixParPiece: null,
    unite: 'KG' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'LES_DEUX' as const,
    devise: 'USD',
  },
  {
    nom: 'Chaussures de marque',
    categorie: 'Vêtements et accessoires',
    description: 'Paire de chaussures, baskets ou souliers de marque',
    prixParKg: null,
    prixParPiece: 25,
    unite: 'PIECE' as const,
    direction: 'LES_DEUX' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Pagnes africains et tissus pour femmes',
    categorie: 'Vêtements et accessoires',
    description: 'Pagnes traditionnels (lépis, kendeli, wax, bazin)',
    prixParKg: 16,
    prixParPiece: 20,
    unite: 'KG_ET_PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Ceintures',
    categorie: 'Vêtements et accessoires',
    description: 'Ceintures en cuir et accessoires de mode',
    prixParKg: null,
    prixParPiece: 10,
    unite: 'PIECE' as const,
    direction: 'LES_DEUX' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },

  // 📱 Appareils électroniques
  {
    nom: 'Téléphones iPhone',
    categorie: 'Appareils électroniques',
    description: 'Smartphones Apple iPhone (avec déclaration IMEI)',
    prixParKg: null,
    prixParPiece: 50,
    unite: 'PIECE' as const,
    direction: 'LES_DEUX' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Tablettes pour enfants',
    categorie: 'Appareils électroniques',
    description: 'Tablettes éducatives et multimédia pour enfants',
    prixParKg: null,
    prixParPiece: 35,
    unite: 'PIECE' as const,
    direction: 'LES_DEUX' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },

  // 📄 Documents et courriers
  {
    nom: 'Documents administratifs',
    categorie: 'Documents et courriers',
    description: 'Dossiers, passeports, certificats express sous pli scellé',
    prixParKg: null,
    prixParPiece: 30,
    unite: 'PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
  {
    nom: 'Enveloppes',
    categorie: 'Documents et courriers',
    description: 'Courrier simple ou recommandé sous enveloppe renforcée',
    prixParKg: null,
    prixParPiece: 20,
    unite: 'PIECE' as const,
    direction: 'CONAKRY_USA' as const,
    service: 'AERIEN' as const,
    devise: 'USD',
  },
];

export async function seedNewYorkArticles() {
  try {
    let createdCount = 0;
    for (const item of NEW_YORK_ARTICLES) {
      const existing = await (prisma as any).articleTarif.findFirst({
        where: {
          nom: item.nom,
          categorie: item.categorie,
        },
      });

      if (!existing) {
        await (prisma as any).articleTarif.create({
          data: {
            nom: item.nom,
            categorie: item.categorie,
            description: item.description,
            prixParKg: item.prixParKg,
            prixParPiece: item.prixParPiece,
            unite: item.unite,
            direction: item.direction,
            service: item.service,
            devise: item.devise,
            actif: true,
          },
        });
        createdCount++;
      }
    }

    revalidatePath('/admin/tarifs');
    revalidatePath('/operations/new');

    return {
      success: true,
      count: createdCount,
      message: `${createdCount} articles d'expédition New York ajoutés au catalogue.`,
    };
  } catch (error) {
    console.error('seedNewYorkArticles error:', error);
    return {
      success: false,
      count: 0,
      message: 'Erreur lors de l\'initialisation du catalogue New York.',
    };
  }
}

