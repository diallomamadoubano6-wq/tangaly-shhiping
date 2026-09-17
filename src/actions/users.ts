'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function getUsers() {
  await checkAdminAuth();
  
  try {
    const users = await prisma.user.findMany({
      include: {
        agency: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // On ne renvoie jamais les mots de passe côté client
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);
    
    return { success: true, data: safeUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, data: [] };
  }
}

export async function getAgencies() {
  await checkAdminAuth();
  
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { nom: 'asc' }
    });
    return { success: true, data: agencies };
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return { success: false, data: [] };
  }
}

export async function createUser(data: any) {
  await checkAdminAuth();
  
  try {
    // Vérifier si l'email existe
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, message: 'Cet email est déjà utilisé.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        nom: data.nom,
        email: data.email,
        password_hash: hashedPassword,
        role: data.role,
        localisation: data.localisation || 'Conakry',
        agencyId: data.agencyId || null
      }
    });

    // Si c'est un client, on peut aussi créer le profil Client
    if (data.role === 'CLIENT') {
      await prisma.client.create({
        data: {
          userId: user.id,
          agencyId: data.agencyId || null,
        }
      });
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: 'Erreur lors de la création de l\'utilisateur' };
  }
}

export async function updateUser(id: string, data: any) {
  await checkAdminAuth();
  
  try {
    // Update simple pour l'instant (nom, role, agency, localisation)
    await prisma.user.update({
      where: { id },
      data: {
        nom: data.nom,
        role: data.role,
        localisation: data.localisation,
        agencyId: data.agencyId || null,
      }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: 'Erreur lors de la mise à jour' };
  }
}
