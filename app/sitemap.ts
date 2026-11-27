import type { MetadataRoute } from 'next';
import { CASES } from '@/content/cases';
import { SITE } from '@/content/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/work', '/journey', '/playground', '/contact', ...CASES.map((c) => `/work/${c.slug}`)];
  return pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.7 }));
}
