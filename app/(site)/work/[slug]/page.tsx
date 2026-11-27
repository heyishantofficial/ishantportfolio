import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { CaseCover } from '@/components/CaseCard';
import { DraftNote } from '@/components/ui';
import { PolaroidRoll, WorkGrid } from '@/components/WorkGrid';
import { CASES, caseBySlug } from '@/content/cases';
import { ALL_WORK, rollItem } from '@/lib/media';

export const dynamicParams = false;

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.title} · ${c.brand}`,
    description: c.oneLiner,
    alternates: { canonical: `/work/${c.slug}` },
  };
}

const NOTE_COLORS = ['var(--yellow)', 'var(--mint)', 'var(--sky)', 'var(--blush)', 'var(--sand)'];

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) notFound();

  const idx = CASES.findIndex((x) => x.slug === c.slug);
  const next = CASES[(idx + 1) % CASES.length];
  const works = ALL_WORK.filter((w) => w.caseSlug === c.slug);
  const notes = [
    { k: 'Brand', v: c.brand },
    c.role && { k: 'Role', v: c.role },
    c.period && { k: 'When', v: c.period },
    c.team && { k: 'Team', v: c.team },
    c.tools?.length && { k: 'Tools', v: c.tools.join(', ') },
    { k: 'Pieces', v: String(works.length) },
  ].filter(Boolean) as { k: string; v: string }[];

  const bts = (c.bts ?? [])
    .map((id) => rollItem(id, id.replace(/^ep0\d-/, '').replace(/-/g, ' ')))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <article className="container">
      <p className="label" style={{ paddingTop: 28, margin: 0 }}>
        <Link href="/work" className="link-underline">
          ← all work
        </Link>
      </p>

      <header className="case-hero">
        <div style={{ minWidth: 0 }}>
          <p className="label muted" style={{ margin: 0 }}>
            ✦ {c.tab} · {c.brand}
          </p>
          <h1 className="px t-1 balance" style={{ margin: '14px 0 18px' }}>
            {c.title}
          </h1>
          <p className="lede">{c.oneLiner}</p>
          <div className="case-meta">
            {notes.map((n, i) => (
              <div key={n.k} className="meta-note" style={{ background: NOTE_COLORS[i % NOTE_COLORS.length], '--r': `${[-1.5, 1, -0.5, 1.5, -1, 0.5][i]}deg` } as CSSProperties}>
                <span className="label">{n.k}</span>
                <b>{n.v}</b>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', justifyItems: 'center' }}>
          <CaseCover c={c} large />
        </div>
      </header>

      {c.context ? (
        <section className="case-block">
          <h2 className="hand">the context</h2>
          <p>{c.context}</p>
        </section>
      ) : null}
      {c.brief ? (
        <section className="case-block">
          <h2 className="hand">the brief</h2>
          <p>{c.brief}</p>
        </section>
      ) : null}
      {c.idea ? (
        <section className="case-block">
          <h2 className="hand">the idea</h2>
          <p>{c.idea}</p>
        </section>
      ) : null}
      {c.results?.length ? (
        <section className="case-block">
          <h2 className="hand">the results</h2>
          <div className="results">
            {c.results.map((r, i) => (
              <div key={r.label} className="result" style={{ background: NOTE_COLORS[i % NOTE_COLORS.length], '--r': `${[-1.5, 1.2, -0.8][i % 3]}deg` } as CSSProperties}>
                <b>{r.value}</b>
                <span className="label">{r.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {c.todo?.length ? (
        <div style={{ paddingBlock: 12 }}>
          <DraftNote title="This case still needs" items={c.todo} />
        </div>
      ) : null}

      <section className="case-block" style={{ display: 'block' }}>
        <h2 className="hand" style={{ marginBottom: 24 }}>
          what we made
        </h2>
        <WorkGrid items={works} />
      </section>

      {bts.length ? (
        <section className="case-block" style={{ display: 'block' }}>
          <h2 className="hand" style={{ marginBottom: 12 }}>
            behind the scenes
          </h2>
          <PolaroidRoll items={bts} className="bts-row" />
        </section>
      ) : null}

      <Link href={`/work/${next.slug}`} className="next-case" style={{ borderTop: '1.5px dashed var(--line)' }}>
        <span className="label muted">next case</span>
        <span className="px t-2">{next.title} →</span>
        <span className="muted">{next.brand}</span>
      </Link>
    </article>
  );
}
