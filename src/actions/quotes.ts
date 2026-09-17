'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function getQuotes() {
  await checkAdminAuth();
  
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Convert created_at to string to match client interface if needed
    const formatted = quotes.map(q => ({
      ...q,
      created_at: q.createdAt.toISOString()
    }));
    
    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return { success: false, data: [] };
  }
}

export async function updateQuote(id: string, statut: string, notes_admin: string) {
  await checkAdminAuth();
  
  try {
    await prisma.quote.update({
      where: { id },
      data: {
        statut,
        notes_admin
      }
    });

    revalidatePath('/admin/quotes');
    return { success: true };
  } catch (error) {
    console.error("Error updating quote:", error);
    return { success: false, message: 'Erreur lors de la mise à jour' };
  }
}
