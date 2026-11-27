import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';
import { IS_DRAFT } from '@/lib/draft';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // Preview builds (new.heyishant.com) ask search engines to stay away.
  if (IS_DRAFT) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE.url}/sitemap.xml` };
}
