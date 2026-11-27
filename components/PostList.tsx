'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { POST_KINDS, type PostKind, type PostSummary } from '@/content/writing';
import { Sticker } from './ui';

const TILT = [-0.8, 0.7, -0.4, 1, -1.1, 0.5];
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function PostCard({ p, lead, i }: { p: PostSummary; lead: boolean; i: number }) {
  const k = POST_KINDS[p.kind];
  return (
    <article className={`post-card${lead ? ' lead' : ''}`} style={{ '--r': `${TILT[i % TILT.length]}deg`, viewTransitionName: `p-${p.slug}` } as CSSProperties}>
      <div className="post-card-top">
        <Sticker color={k.color} r={-2}>
          {k.icon} {k.label}
        </Sticker>
        {p.draft ? (
          <Sticker color="orange" r={2}>
            draft
          </Sticker>
        ) : null}
        <span className="label muted">
          <time dateTime={p.date}>{p.dateLabel}</time> · {p.minutes} min read
        </span>
      </div>
      <div className="post-card-body">
        <div className="post-card-text">
          {p.brand ? (
            <p className="hand post-card-brand">
              {k.brandWord} {p.brand}
            </p>
          ) : null}
          <h2 className="px post-card-title balance">
            <Link href={`/writing/${p.slug}`}>{p.title}</Link>
          </h2>
          <p className="post-card-summary">{p.summary}</p>
          {p.tags.length ? (
            <div className="chip-row">
              {p.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <span className="post-card-more" aria-hidden="true">
            read it ↗
          </span>
        </div>
        {p.cover ? (
          <div className="post-card-cover">
            <img src={p.cover} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Every post as an index card, newest first, with a filter per kind. */
export function PostList({ posts }: { posts: PostSummary[] }) {
  const [filter, setFilter] = useState<'all' | PostKind>('all');
  const kinds = (Object.keys(POST_KINDS) as PostKind[]).filter((k) => posts.some((p) => p.kind === k));

  // /writing#dream-campaign opens on that kind. Read after hydration, like the work filters.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    // oxlint-disable-next-line react/set-state-in-effect
    if (fromHash in POST_KINDS) setFilter(fromHash as PostKind);
  }, []);

  const shown = useMemo(() => (filter === 'all' ? posts : posts.filter((p) => p.kind === filter)), [filter, posts]);

  const choose = (id: 'all' | PostKind) => {
    const apply = () => {
      setFilter(id);
      history.replaceState(null, '', id === 'all' ? window.location.pathname : `#${id}`);
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reduce()) doc.startViewTransition(() => flushSync(apply));
    else apply();
  };

  return (
    <>
      {kinds.length > 1 ? (
        <div className="filters" role="group" aria-label="Filter posts">
          <button type="button" className="filter-chip" aria-pressed={filter === 'all'} onClick={() => choose('all')}>
            All <span className="count">{posts.length}</span>
          </button>
          {kinds.map((k) => (
            <button key={k} type="button" className="filter-chip" aria-pressed={filter === k} onClick={() => choose(k)}>
              {POST_KINDS[k].plural} <span className="count">{posts.filter((p) => p.kind === k).length}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="post-grid">
        {shown.map((p, i) => (
          <PostCard key={p.slug} p={p} lead={i === 0} i={i} />
        ))}
      </div>
    </>
  );
}
