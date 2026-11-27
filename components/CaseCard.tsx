import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { CaseStudy } from '@/content/cases';
import { IS_DRAFT } from '@/lib/draft';
import { posterSrc, previewSrc, ytThumb } from '@/lib/media';
import { PhoneVideo } from './interactive';
import { Polaroid } from './ui';

export function CaseCover({ c, large = false }: { c: CaseStudy; large?: boolean }) {
  const cover = c.cover;
  if (cover.kind === 'video') {
    return <PhoneVideo src={previewSrc(cover.id)} poster={posterSrc(cover.id)} label={`${c.title}, muted preview`} />;
  }
  if (cover.kind === 'youtube') {
    return (
      <div className="frame-wide" style={large ? { width: 560 } : undefined}>
        <img src={ytThumb(cover.id)} alt={`${c.title}, video thumbnail`} loading="lazy" decoding="async" />
        <span className="play-badge" aria-hidden="true">
          <span>▶</span>
        </span>
      </div>
    );
  }
  return (
    <div style={{ width: large ? 340 : 'clamp(170px, 22vw, 240px)', maxWidth: '100%' }}>
      <Polaroid id={cover.id} alt={c.title} caption={c.brand.toLowerCase()} r={4} tape="blue" />
    </div>
  );
}

export function ResultSticker({ c }: { c: CaseStudy }) {
  const first = c.results?.[0];
  if (first) {
    return (
      <span className="result-sticker">
        <b>{first.value}</b>
        <small>{first.label}</small>
      </span>
    );
  }
  if (!IS_DRAFT) return null;
  return (
    <span className="result-sticker" title="Preview only: send the number for this case">
      <b>?.?</b>
      <small>your result</small>
    </span>
  );
}

export function CaseCard({ c, i }: { c: CaseStudy; i: number }) {
  return (
    <article className={`folder c-${c.color}`} style={{ '--i': i } as CSSProperties}>
      <span className="tab">✦ {c.tab}</span>
      <div style={{ minWidth: 0 }}>
        <p className="label when" style={{ margin: 0 }}>
          {c.brand}
          {c.period ? ` · ${c.period}` : ''}
        </p>
        <h3 className="px">{c.title}</h3>
        <p className="one">{c.oneLiner}</p>
        <div className="chip-row">
          {c.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        <Link className="view" href={`/work/${c.slug}`}>
          view case ↗<span className="sr-only">: {c.title}</span>
        </Link>
      </div>
      <div className="folder-media">
        <CaseCover c={c} />
        <ResultSticker c={c} />
      </div>
    </article>
  );
}
