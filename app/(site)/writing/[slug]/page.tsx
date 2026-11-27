import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { DraftNote, Sticker } from '@/components/ui';
import { WorkGrid } from '@/components/WorkGrid';
import { SITE } from '@/content/site';
import { POST_KINDS, WRITING } from '@/content/writing';
import { getPost, getPosts } from '@/lib/posts';

export const dynamicParams = false;

// A static export needs at least one page per dynamic route. With no posts yet,
// build a placeholder that 404s (the server never links to it).
const EMPTY = '_none';

export function generateStaticParams() {
  const posts = getPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: EMPTY }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/writing/${p.slug}` },
    openGraph: {
      type: 'article',
      title: p.title,
      description: p.summary,
      publishedTime: p.date,
      authors: [SITE.name],
      tags: p.tags,
      ...(p.cover ? { images: [{ url: p.cover, alt: p.title }] } : {}),
    },
  };
}

const NOTE_COLORS = ['var(--yellow)', 'var(--mint)', 'var(--sky)', 'var(--blush)', 'var(--sand)'];
const TILT = [-1.5, 1, -0.5, 1.5, -1, 0.5];

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  const k = POST_KINDS[p.kind];
  const all = getPosts();
  const next = all.length > 1 ? all[(all.findIndex((x) => x.slug === p.slug) + 1) % all.length] : undefined;
  const dream = p.kind === 'dream-campaign' && p.brand;

  const notes = [
    p.brand && { k: p.kind === 'dream-campaign' ? 'For' : 'Brand', v: p.brand },
    p.role && { k: 'Role', v: p.role },
    { k: 'Posted', v: p.dateLabel },
    { k: 'Read', v: `${p.minutes} min` },
  ].filter(Boolean) as { k: string; v: string }[];

  const ld = {
    '@context': 'https://schema.org',
    '@type': p.kind === 'blog' ? 'BlogPosting' : 'Article',
    headline: p.title,
    description: p.summary,
    datePublished: p.date,
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/writing/${p.slug}`,
    ...(p.cover ? { image: `${SITE.url}${p.cover}` } : {}),
  };

  return (
    <article className="container container-narrow">
      <p className="label" style={{ paddingTop: 28, margin: 0 }}>
        <Link href="/writing" className="link-underline">
          ← all writing
        </Link>
      </p>

      <header className="post-head">
        <div className="post-kicker">
          <Link href={`/writing#${p.kind}`} style={{ textDecoration: 'none' }}>
            <Sticker color={k.color} r={-2}>
              {k.icon} {k.label}
            </Sticker>
          </Link>
          {p.draft ? (
            <Sticker color="orange" r={2}>
              draft · preview only
            </Sticker>
          ) : null}
        </div>
        <h1 className="px t-2 balance" style={{ margin: 0 }}>
          {p.title}
        </h1>
        <p className="lede" style={{ margin: 0 }}>
          {p.summary}
        </p>
        <div className="case-meta" style={{ marginTop: 6 }}>
          {notes.map((n, i) => (
            <div key={n.k} className="meta-note" style={{ background: NOTE_COLORS[i % NOTE_COLORS.length], '--r': `${TILT[i]}deg` } as CSSProperties}>
              <span className="label">{n.k}</span>
              <b>{n.v}</b>
            </div>
          ))}
        </div>
        {dream ? <p className="margin-note post-dream-note">{WRITING.dreamNote(p.brand!)}</p> : null}
        {p.draft ? (
          <DraftNote title="This post is a draft" items={['It only shows on the preview site.', 'Delete the "draft: true" line to publish it.']} />
        ) : null}
      </header>

      {p.cover ? (
        <figure className="post-cover tape">
          <img src={p.cover} alt="" decoding="async" />
        </figure>
      ) : null}

      {p.results.length ? (
        <section className="post-results" aria-label="Results">
          <div className="results">
            {p.results.map((r, i) => (
              <div key={r.label} className="result" style={{ background: NOTE_COLORS[i % NOTE_COLORS.length], '--r': `${[-1.5, 1.2, -0.8][i % 3]}deg` } as CSSProperties}>
                <b>{r.value}</b>
                <span className="label">{r.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="post-body">
        {p.blocks.map((b, i) =>
          b.type === 'html' ? (
            <div key={i} className="post-html" dangerouslySetInnerHTML={{ __html: b.html }} />
          ) : (
            <div key={i} className={`post-works n-${Math.min(b.items.length, 3)}${b.items.length === 1 ? ` ${b.items[0].shape}` : ''}`}>
              <WorkGrid items={b.items} />
            </div>
          ),
        )}
      </div>

      {p.tags.length ? (
        <div className="chip-row post-tags">
          {p.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <aside className="post-cta">
        <span className="hand">{WRITING.cta.hand}</span>
        <p>{dream ? WRITING.cta.dream(p.brand!) : WRITING.cta.text}</p>
        <Link className="btn" href="/contact">
          say hi 👋
        </Link>
      </aside>

      {next ? (
        <Link href={`/writing/${next.slug}`} className="next-case" style={{ borderTop: '1.5px dashed var(--line)' }}>
          <span className="label muted">keep reading · {POST_KINDS[next.kind].label}</span>
          <span className="px t-3 balance">{next.title} →</span>
          <span className="muted">{next.summary}</span>
        </Link>
      ) : (
        <div style={{ height: 64 }} />
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </article>
  );
}
