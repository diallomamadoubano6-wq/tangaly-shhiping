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

export async function getCmsSettings() {
  const settings = await prisma.cmsSetting.findMany();
  const config: Record<string, string> = {};
  settings.forEach(s => { config[s.key] = s.value; });
  return config;
}

export async function updateCmsSetting(key: string, value: string, description?: string) {
  await requireAdmin();
  await prisma.cmsSetting.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description: description || '' }
  });
  revalidatePath('/');
}

export async function getArticles() {
  return await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createArticle(data: any) {
  await requireAdmin();
  const article = await prisma.article.create({ data });
  revalidatePath('/blog');
  return article;
}

export async function updateArticle(id: string, data: any) {
  await requireAdmin();
  const article = await prisma.article.update({ where: { id }, data });
  revalidatePath('/blog');
  return article;
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath('/blog');
}

export async function getFaqs() {
  return await prisma.faq.findMany({ orderBy: { ordre: 'asc' } });
}

export async function createFaq(data: any) {
  await requireAdmin();
  const faq = await prisma.faq.create({ data });
  revalidatePath('/faq');
  return faq;
}

export async function updateFaq(id: string, data: any) {
  await requireAdmin();
  const faq = await prisma.faq.update({ where: { id }, data });
  revalidatePath('/faq');
  return faq;
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  await prisma.faq.delete({ where: { id } });
  revalidatePath('/faq');
}

export async function getPages() {
  return await prisma.page.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createPage(data: any) {
  await requireAdmin();
  const page = await prisma.page.create({ data });
  revalidatePath(`/${data.slug}`);
  return page;
}

export async function updatePage(id: string, data: any) {
  await requireAdmin();
  const page = await prisma.page.update({ where: { id }, data });
  revalidatePath(`/${data.slug}`);
  return page;
}

export async function deletePage(id: string) {
  await requireAdmin();
  await prisma.page.delete({ where: { id } });
}

export async function getMedias() {
  return await prisma.media.findMany({ orderBy: { createdAt: 'desc' } });
}
