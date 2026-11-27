import type { Metadata, Viewport } from 'next';
import { DM_Mono, Handjet, Inter, Just_Me_Again_Down_Here } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { AnalyticsInit } from '@/components/interactive';
import { Nav } from '@/components/Nav';
import { SITE } from '@/content/site';
import { IS_DRAFT } from '@/lib/draft';
import './globals.css';

const handjet = Handjet({ subsets: ['latin'], axes: ['ELGR', 'ELSH'], variable: '--font-handjet', display: 'swap' });
const hand = Just_Me_Again_Down_Here({ subsets: ['latin'], weight: '400', variable: '--font-hand-raw', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.role}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_IN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE.name}, ${SITE.role}` }],
  },
  twitter: { card: 'summary_large_image', creator: '@heyishant' },
  alternates: { canonical: '/' },
  // Preview builds (new.heyishant.com) stay out of search results.
  ...(IS_DRAFT ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#fbfaf6',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Runs before first paint: the splash shows once per browser session.
const SPLASH = `try{var s=sessionStorage,d=document.documentElement;if(s.getItem('hi'))d.classList.add('seen');else{s.setItem('hi','1');d.classList.add('first-visit')}}catch(e){document.documentElement.classList.add('seen')}`;

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${handjet.variable} ${hand.variable} ${mono.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH }} />
      </head>
      <body>
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
      </body>
    </html>
  );
}
