'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { formatDuration, type WorkView } from '@/lib/media';
import { Lightbox } from './Lightbox';

type Filter = { id: string; label: string };

const KIND_LABEL: Record<string, { text: string; color: string }> = {
  video: { text: '▶ video', color: 'bg-yellow' },
  youtube: { text: '▶ youtube', color: 'bg-pink' },
  image: { text: '◼ photo', color: 'bg-sky' },
  link: { text: '↗ link', color: 'bg-mint' },
};

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Tile({ item, onOpen }: { item: WorkView; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const showPreview = hover && item.kind === 'video' && Boolean(item.preview);

  useEffect(() => {
    if (showPreview) video.current?.play().catch(() => {});
  }, [showPreview]);

  return (
    <button
      type="button"
      className="tile"
      style={{ viewTransitionName: `w-${item.id}` }}
      onClick={onOpen}
      onPointerEnter={() => canHover() && !reduce() && setHover(true)}
      onPointerLeave={() => setHover(false)}
      aria-label={`${item.title}${item.brand ? `, ${item.brand}` : ''}. Open ${item.kind === 'image' ? 'photo' : 'player'}`}
    >
      <span className="tile-media" style={{ aspectRatio: `${item.w} / ${item.h}` }}>
        {item.thumb ? <img src={item.thumb} alt="" loading="lazy" decoding="async" /> : null}
        {showPreview ? <video ref={video} src={item.preview} muted loop playsInline aria-hidden="true" /> : null}
        <span className="tile-kind">
          <span className={`sticker ${KIND_LABEL[item.kind].color}`} style={{ ['--r' as string]: '-3deg' }}>
            {KIND_LABEL[item.kind].text}
          </span>
        </span>
        {item.duration ? <span className="tile-time">{formatDuration(item.duration)}</span> : null}
      </span>
      <span className="tile-title">{item.title}</span>
      {item.brand ? <span className="tile-brand">{item.brand}</span> : null}
    </button>
  );
}

/** Masonry grid of work with optional filters and a lightbox player. */
export function WorkGrid({ items, filters }: { items: WorkView[]; filters?: Filter[] }) {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<number | null>(null);

  // A link like /work#ai opens with that filter. Read after hydration: the page
  // is prerendered without a hash, so starting from it would mismatch.
  useEffect(() => {
    if (!filters) return;
    const fromHash = window.location.hash.slice(1);
    // oxlint-disable-next-line react/set-state-in-effect
    if (filters.some((f) => f.id === fromHash)) setFilter(fromHash);
  }, [filters]);

  const shown = useMemo(() => (filter === 'all' ? items : items.filter((w) => w.category === filter)), [filter, items]);

  const choose = (id: string) => {
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
      {filters ? (
        <div className="filters" role="group" aria-label="Filter work">
          {[{ id: 'all', label: 'All' }, ...filters].map((f) => {
            const count = f.id === 'all' ? items.length : items.filter((w) => w.category === f.id).length;
            if (!count) return null;
            return (
              <button key={f.id} type="button" className="filter-chip" aria-pressed={filter === f.id} onClick={() => choose(f.id)}>
                {f.label} <span className="count">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="work-grid">
        {shown.map((item, i) => (
          <Tile key={item.id} item={item} onOpen={() => setOpen(i)} />
        ))}
      </div>
      <Lightbox items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}

/** Polaroids that open in the same player (journey camera rolls, case BTS). */
export function PolaroidRoll({ items, className = 'camera-roll' }: { items: (WorkView & { caption?: string })[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const tilts = [-3, 2.5, -1.5, 3, -2.5, 1.5];
  const tapes = ['', 'tape-blue', 'tape-pink', 'tape-mint'];
  return (
    <>
      <div className={className}>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(i)}
            style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'inherit', color: 'inherit' }}
            aria-label={`Open ${item.caption ?? item.title}`}
          >
            <figure className={`polaroid tape ${tapes[i % tapes.length]}`} style={{ ['--r' as string]: `${tilts[i % tilts.length]}deg`, ['--ratio' as string]: item.shape === 'wide' ? '4 / 3' : '4 / 5' }}>
              {item.thumb ? <img src={item.thumb} alt={item.caption ?? item.title} loading="lazy" decoding="async" /> : null}
              {item.kind === 'video' || item.kind === 'youtube' ? (
                <span className="play-badge" aria-hidden="true" style={{ bottom: 40 }}>
                  <span>▶</span>
                </span>
              ) : null}
              <figcaption>{item.caption ?? item.title}</figcaption>
            </figure>
          </button>
        ))}
      </div>
      <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
