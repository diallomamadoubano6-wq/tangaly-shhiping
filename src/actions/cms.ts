'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { SiteContactInfo, DEFAULT_CONTACT_INFO } from '@/lib/contact';

const requireAdmin = async () => {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !session.user || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
    throw new Error('Non autorisé. Seul un administrateur peut modifier ces informations.');
  }
};

export async function getPublicContactInfo(): Promise<SiteContactInfo> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    const queryPromise = prisma.cmsSetting.findUnique({
      where: { key: 'contact_info' },
    }).catch(() => null);

    const setting = await Promise.race([queryPromise, timeoutPromise]);
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return { ...DEFAULT_CONTACT_INFO, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load contact info from DB, using fallback:', e);
  }
  return DEFAULT_CONTACT_INFO;
}

export async function updateContactInfo(info: Partial<SiteContactInfo>) {
  await requireAdmin();
  const current = await getPublicContactInfo();
  const updated = { ...current, ...info };
  await prisma.cmsSetting.upsert({
    where: { key: 'contact_info' },
    update: { value: JSON.stringify(updated), description: 'Coordonnées officielles de contact du site' },
    create: { key: 'contact_info', value: JSON.stringify(updated), description: 'Coordonnées officielles de contact du site' }
  });
  revalidatePath('/');
  revalidatePath('/contact');
  revalidatePath('/admin/cms');
  return { success: true, data: updated };
}

export async function getCmsSettings() {
  const settings = await prisma.cmsSetting.findMany();
  const config: Record<string, string> = {};
  settings.forEach((s: any) => { config[s.key] = s.value; });
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
  revalidatePath('/contact');
  revalidatePath('/admin/cms');
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
