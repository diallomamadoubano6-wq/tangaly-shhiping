'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const requireAdmin = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error('Non autorisé');
  }
};

export async function getServices() {
  return await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createService(data: any) {
  await requireAdmin();
  const service = await prisma.service.create({ data });
  revalidatePath('/admin/services');
  return service;
}

export async function updateService(id: string, data: any) {
  await requireAdmin();
  const service = await prisma.service.update({ where: { id }, data });
  revalidatePath('/admin/services');
  return service;
}

export async function deleteService(id: string) {
  await requireAdmin();
  await prisma.service.delete({ where: { id } });
  revalidatePath('/admin/services');
}

export async function getTarifs() {
  return await prisma.tarif.findMany({ orderBy: { zone: 'asc' } });
}

export async function createTarif(data: any) {
  await requireAdmin();
  const tarif = await prisma.tarif.create({ data });
  revalidatePath('/admin/tarifs');
  revalidatePath('/devis');
  return tarif;
}

export async function updateTarif(id: string, data: any) {
  await requireAdmin();
  const tarif = await prisma.tarif.update({ where: { id }, data });
  revalidatePath('/admin/tarifs');
  revalidatePath('/devis');
  return tarif;
}

export async function deleteTarif(id: string) {
  await requireAdmin();
  await prisma.tarif.delete({ where: { id } });
  revalidatePath('/admin/tarifs');
  revalidatePath('/devis');
}

export async function getAgencies() {
  return await prisma.agency.findMany({ orderBy: { nom: 'asc' } });
}

export async function createAgency(data: any) {
  await requireAdmin();
  const agency = await prisma.agency.create({ data });
  revalidatePath('/admin/agences');
  return agency;
}

export async function updateAgency(id: string, data: any) {
  await requireAdmin();
  const agency = await prisma.agency.update({ where: { id }, data });
  revalidatePath('/admin/agences');
  return agency;
}

export async function deleteAgency(id: string) {
  await requireAdmin();
  await prisma.agency.delete({ where: { id } });
  revalidatePath('/admin/agences');
}
