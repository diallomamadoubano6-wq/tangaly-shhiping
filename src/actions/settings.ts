'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session.user as any;
}

export async function updateProfile(nom: string, email: string) {
  try {
    const user = await getSessionUser();
    
    // Check if email already used by someone else
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { success: false, message: 'Cet email est déjà utilisé par un autre compte.' };
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { nom, email }
    });

    revalidatePath('/operations/settings');
    revalidatePath('/admin/settings');
    return { success: true, message: 'Profil mis à jour avec succès.' };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: 'Erreur lors de la mise à jour du profil.' };
  }
}

export async function updatePassword(password: string) {
  try {
    const user = await getSessionUser();
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: 'Erreur lors de la mise à jour du mot de passe.' };
  }
}
