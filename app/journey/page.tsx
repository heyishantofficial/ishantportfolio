import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { DraftNote, Sticker } from '@/components/ui';
import { PolaroidRoll } from '@/components/WorkGrid';
import { EPISODES, type Episode } from '@/content/episodes';
import { SITE } from '@/content/site';
import { rollItem } from '@/lib/media';

export const metadata: Metadata = {
  title: 'The Journey',
  description: 'Five episodes: from editing a friend’s YouTube videos to AI-led creative at Emami. In my own words.',
  alternates: { canonical: '/journey' },
};

const COLOR: Record<Episode['color'], string> = {
  yellow: 'var(--yellow)',
  mint: 'var(--mint)',
  pink: 'var(--blush)',
  sky: 'var(--sky)',
  sand: 'var(--sand)',
};

function Story({ e }: { e: Episode }) {
  // Margin notes sit after the 2nd paragraph and about two-thirds of the way down.
  const spots = [Math.min(1, e.story.length - 1), Math.floor(e.story.length * 0.66)];
  return (
    <div className="prose-story">
      {e.story.map((p, i) => (
        <div key={i}>
          <p>{p}</p>
          {spots.indexOf(i) >= 0 && e.notes[spots.indexOf(i)] ? <p className="margin-note">“{e.notes[spots.indexOf(i)]}”</p> : null}
        </div>
      ))}
    </div>
  );
}

export default function JourneyPage() {
  return (
    <>
      <div className="timeline" aria-hidden="true">
        <div className="container timeline-inner">
          <span className="label">season 1</span>
          <span className="timeline-track">
            <span className="timeline-fill" />
          </span>
          <span className="timeline-marks">
            {EPISODES.map((e) => (
              <a key={e.slug} href={`#${e.slug}`} tabIndex={-1}>
                EP{e.n}
              </a>
            ))}
          </span>
        </div>
      </div>

      <header className="container section-tight">
        <div className="sec-head" style={{ marginBottom: 24 }}>
          <span className="hand">the story so far</span>
          <h1 className="px t-giant">The journey</h1>
        </div>
        <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', alignItems: 'start' }}>
          <p className="hand" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 1.9rem)', whiteSpace: 'pre-line', margin: 0, maxWidth: '34ch' }}>
            {SITE.aboutFull.split('\n\n').slice(0, 2).join('\n\n')}
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            <p className="label muted" style={{ margin: 0 }}>
              episodes
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {EPISODES.map((e) => (
                <li key={e.slug}>
                  <a href={`#${e.slug}`} style={{ display: 'flex', gap: 12, alignItems: 'baseline', textDecoration: 'none' }}>
                    <span className="px" style={{ fontSize: '1.6rem', color: 'var(--blue)' }}>
                      EP {e.n}
                    </span>
                    <span>
                      <b>{e.title}</b> <span className="muted">· {e.company}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </header>

      {EPISODES.map((e, i) => {
        const roll = e.cameraRoll.map((r) => rollItem(r.id, r.caption)).filter((x): x is NonNullable<typeof x> => Boolean(x));
        return (
          <section key={e.slug} id={e.slug} className="episode" aria-labelledby={`${e.slug}-title`}>
            <div className="container">
              <header className="episode-head">
                <span className="px num">EP {e.n}</span>
                <h2 id={`${e.slug}-title`} className="px t-2" style={{ margin: 0 }}>
                  {e.title}
                </h2>
                <p className="label muted" style={{ margin: 0 }}>
                  {e.company} · {e.period}
                </p>
              </header>
              <div className="episode-grid">
                <div style={{ minWidth: 0 }}>
                  <Story e={e} />
                </div>
                <aside className="episode-aside" style={{ display: 'grid', gap: 20 }}>
                  {e.roles.map((r, j) => (
                    <div key={r.company} className="role-card" style={{ background: COLOR[e.color], '--r': `${j % 2 ? -1.2 : 1}deg` } as CSSProperties}>
                      <span className="label">{r.period}</span>
                      <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{r.company}</h3>
                      <p style={{ margin: 0, fontWeight: 600 }}>{r.title}</p>
                      {r.aka ? (
                        <p className="hand" style={{ margin: 0, fontSize: '1.25rem' }}>
                          {r.aka}
                        </p>
                      ) : null}
                      <p style={{ margin: 0, fontSize: '0.92rem' }}>{r.notes}</p>
                    </div>
                  ))}
                  <DraftNote title={`EP ${e.n} needs`} items={e.todo} />
                </aside>
              </div>
              {roll.length ? (
                <div style={{ marginTop: 48 }}>
                  <p className="label muted" style={{ margin: 0 }}>
                    📷 camera roll
                  </p>
                  <PolaroidRoll items={roll} />
                </div>
              ) : null}
              {i === EPISODES.length - 1 ? (
                <div style={{ marginTop: 72, display: 'grid', gap: 16, justifyItems: 'start' }}>
                  <Sticker color="pink" r={-3}>
                    EP 06 · coming soon
                  </Sticker>
                  <p className="hand" style={{ fontSize: '1.9rem', margin: 0 }}>
                    maybe it&apos;s with you?
                  </p>
                  <Link className="btn" href="/contact">
                    let&apos;s talk ↗
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </>
  );
}
