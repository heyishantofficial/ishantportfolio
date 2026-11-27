import type { CSSProperties, ReactNode } from 'react';
import { IS_DRAFT } from '@/lib/draft';
import { imageMeta, photoSrc, photoSrcSet } from '@/lib/media';

type Color = 'yellow' | 'mint' | 'pink' | 'sky' | 'sand' | 'blush' | 'blue' | 'green' | 'orange';

const vars = (o: Record<string, string | number | undefined>) => o as CSSProperties;

/** Pixel heading whose letters can drop in one by one. Screen readers get the plain word. */
export function PixelLetters({ text, enter = false }: { text: string; enter?: boolean }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={enter ? 'enter-drop' : undefined}>
        {[...text].map((ch, i) => (
          <span key={i} style={vars({ '--i': i })}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </span>
    </>
  );
}

export function Sticker({
  children,
  color = 'yellow',
  r = -2,
  className = '',
  i,
  enter = false,
}: {
  children: ReactNode;
  color?: Color;
  r?: number;
  className?: string;
  i?: number;
  enter?: boolean;
}) {
  return (
    <span className={`sticker bg-${color} ${enter ? 'enter-pop' : ''} ${className}`} style={vars({ '--r': `${r}deg`, '--i': i })}>
      {children}
    </span>
  );
}

export function Ticket({ label, emoji, color = 'yellow' }: { label: string; emoji: readonly [string, string] | readonly string[]; color?: Color }) {
  return (
    <span className="ticket-wrap">
      <span className={`ticket bg-${color}`}>
        {label}
        <span className="emo" aria-hidden="true">
          <i>{emoji[0]}</i>
          <i>{emoji[1]}</i>
        </span>
      </span>
    </span>
  );
}

/** A taped polaroid of one of the site's photos (content/media.json). */
export function Polaroid({
  id,
  alt,
  caption,
  r = -3,
  tape = 'yellow',
  className = '',
  sizes = '(max-width: 700px) 45vw, 220px',
  eager = false,
  style,
}: {
  id: string;
  alt: string;
  caption?: string;
  r?: number;
  tape?: 'yellow' | 'blue' | 'pink' | 'mint' | 'none';
  className?: string;
  sizes?: string;
  eager?: boolean;
  style?: CSSProperties;
}) {
  const m = imageMeta(id);
  if (!m) return null;
  const tapeClass = tape === 'none' ? '' : `tape ${tape === 'yellow' ? '' : `tape-${tape}`}`;
  return (
    <figure className={`polaroid ${tapeClass} ${className}`} style={{ ...vars({ '--r': `${r}deg`, '--ratio': `${m.w} / ${m.h}` }), ...style }}>
      <img
        src={photoSrc(id, 640)}
        srcSet={photoSrcSet(id)}
        sizes={sizes}
        alt={alt}
        width={m.w}
        height={m.h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** Lists what's missing. Only rendered on preview builds (NEXT_PUBLIC_DRAFT=1). */
export function DraftNote({ title = 'Needs from you', items }: { title?: string; items?: readonly string[] }) {
  if (!IS_DRAFT || !items || items.length === 0) return null;
  return (
    <aside className="draft-note">
      <span className="label">✎ {title} · preview only</span>
      <ul>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </aside>
  );
}

export function SectionHead({ hand, title, children, id }: { hand?: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <header className="sec-head">
      {hand ? <span className="hand">{hand}</span> : null}
      <h2 className="px t-2 balance" id={id}>
        {title}
      </h2>
      {children}
    </header>
  );
}

export function SmileyFace({ className = 'smiley', title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle className="face" cx="60" cy="60" r="55" />
      <g className="pupils">
        <ellipse className="eye" cx="43" cy="50" rx="6.5" ry="10" />
        <ellipse className="eye" cx="77" cy="50" rx="6.5" ry="10" />
      </g>
      <path className="mouth" d="M36 74 Q60 98 84 74" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9h3.5v11H4zM5.75 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h3.3v1.6h.05c.46-.87 1.6-1.8 3.3-1.8 3.5 0 4.15 2.3 4.15 5.3V20h-3.5v-5.2c0-1.25-.02-2.85-1.74-2.85-1.74 0-2 1.36-2 2.76V20H10z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18.1 5.6 12 5.6 12 5.6s-6.1 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.8.5 7.9.5 7.9.5s6.1 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15.2V8.8l5.3 3.2z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
    </svg>
  ),
};

export const socialIcon = (id: string) => ICONS[id] ?? null;

export const SOCIAL_BG: Record<string, string> = {
  instagram: 'var(--blush)',
  linkedin: 'var(--sky)',
  youtube: 'var(--yellow)',
  x: 'var(--mint)',
  github: 'var(--sand)',
};
