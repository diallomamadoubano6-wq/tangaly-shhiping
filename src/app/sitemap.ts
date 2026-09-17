import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tangaly.com';

  const routes = ['', '/services', '/blog', '/contact', '/about'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Idéalement, on irait chercher les articles de blog depuis l'API CMS ici
  /*
  const articles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/articles`).then((res) => res.json());
  const blogRoutes = articles.map((article: any) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt).toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  */

  return [...routes];
}
