import type { MetadataRoute } from 'next';
import { CASES } from '@/content/cases';
import { SITE } from '@/content/site';
import { getPublishedPosts } from '@/lib/posts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/work', '/writing', '/journey', '/playground', '/contact', ...CASES.map((c) => `/work/${c.slug}`)];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.7 })),
    ...getPublishedPosts().map((p) => ({ url: `${SITE.url}/writing/${p.slug}`, lastModified: p.date, changeFrequency: 'yearly' as const, priority: 0.6 })),
  ];
}
