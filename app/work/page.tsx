import type { Metadata } from 'next';
import Link from 'next/link';
import { WorkGrid } from '@/components/WorkGrid';
import { CASES } from '@/content/cases';
import { CATEGORIES } from '@/content/works';
import { ALL_WORK } from '@/lib/media';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Campaigns, brand content, YouTube, AI-led ads and set design by Ishant Chauhan.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <div className="container section-tight">
      <header className="sec-head">
        <span className="hand">everything, in one place</span>
        <h1 className="px t-1">All work</h1>
        <p className="muted lede">
          {ALL_WORK.length} pieces across campaigns, brand content, YouTube, AI and set design. Tap anything to play it. The four I&apos;d start with:{' '}
          {CASES.map((c, i) => (
            <span key={c.slug}>
              <Link href={`/work/${c.slug}`} className="link-underline">
                {c.title}
              </Link>
              {i < CASES.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </header>
      <WorkGrid items={ALL_WORK} filters={CATEGORIES} />
    </div>
  );
}
