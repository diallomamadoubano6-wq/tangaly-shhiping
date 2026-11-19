'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function checkStaffAuth() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'AGENT'].includes(role)) {
    throw new Error('Unauthorized');
  }
}

export async function getClients() {
  await checkStaffAuth();
  
  try {
    const clients = await prisma.client.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, data: [] };
  }
}
