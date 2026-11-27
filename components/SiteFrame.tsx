import { SITE } from '@/content/site';
import { Footer } from './Footer';
import { AnalyticsInit } from './interactive';
import { Nav } from './Nav';

const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  jobTitle: SITE.role,
  worksFor: { '@type': 'Organization', name: SITE.company },
  url: SITE.url,
  email: `mailto:${SITE.email}`,
  sameAs: SITE.socials.map((s) => s.href),
};

/** The public site's frame: nav, footer, the first-visit splash and analytics. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="splash" aria-hidden="true">
        <p className="hand">oh, hey! you found me 👋</p>
      </div>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <AnalyticsInit />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}
