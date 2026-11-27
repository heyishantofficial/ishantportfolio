import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CaseCard } from '@/components/CaseCard';
import { CopyEmail, WatchingSmiley } from '@/components/interactive';
import { PixelLetters, Polaroid, SOCIAL_BG, Sticker, Ticket, socialIcon } from '@/components/ui';
import { CASES } from '@/content/cases';
import { EPISODES } from '@/content/episodes';
import { SITE } from '@/content/site';
import { ALL_WORK } from '@/lib/media';

const v = (o: Record<string, string | number>) => o as CSSProperties;

function Hero() {
  const [s0, s1, ...rest] = SITE.heroStickers;
  return (
    <section className="hero container" aria-labelledby="hero-name">
      <div className="hero-inner">
        <Polaroid id="me-bw" className="hero-float left float-y" r={-6} caption="hi, it's me" alt="Ishant, black and white portrait" eager />
        <Polaroid id="me-cat" className="hero-float right float-y late" r={5} tape="pink" caption="me & my manager" alt="Ishant pulling a face behind a cat" eager />

        <p className="hand intro enter-rise" style={v({ '--i': 0 })}>
          my name is
        </p>
        <div className="name-row">
          {s0 ? (
            <span className="wob">
              <Sticker color={s0.color} r={s0.r} enter i={0}>
                {s0.text}
              </Sticker>
            </span>
          ) : null}
          <h1 id="hero-name" className="px hero-name">
            <span className="doodle enter-doodle">
              <PixelLetters text="Ishant" enter />
            </span>
            <span className="sr-only"> Chauhan, {SITE.role}</span>
          </h1>
          {s1 ? (
            <span className="wob slow">
              <Sticker color={s1.color} r={s1.r} enter i={1}>
                {s1.text}
              </Sticker>
            </span>
          ) : null}
        </div>
        <div className="hero-stickers">
          {rest.map((s, i) => (
            <Sticker key={s.text} color={s.color} r={s.r} enter i={i + 2}>
              {s.text}
            </Sticker>
          ))}
        </div>
        <p className="status-line label enter-rise" style={v({ '--i': 2 })}>
          <span className="dot" aria-hidden="true" />
          {SITE.status}
        </p>
        <p className="hero-headline enter-rise" style={v({ '--i': 3 })}>
          {SITE.tagline}
        </p>
        <p className="cycle-line enter-rise" style={v({ '--i': 4 })}>
          Sometimes it&apos;s <span className="sr-only">{SITE.cycleWords.join(', ')}</span>
          <span className="cycle" aria-hidden="true">
            {SITE.cycleWords.map((w) => (
              <i key={w}>{w}</i>
            ))}
          </span>
        </p>
        <div className="hero-ctas enter-rise" style={v({ '--i': 5 })}>
          <Link className="btn" href="/contact">
            say hi 👋
          </Link>
          <a className="btn btn-ghost" href="#work">
            see the work ↓
          </a>
        </div>
      </div>
    </section>
  );
}

function WhatsUp() {
  return (
    <section className="section container" aria-labelledby="whatsup">
      <header className="sec-head" style={{ justifyItems: 'center', textAlign: 'center' }}>
        <span className="hand">about me!</span>
        <h2 id="whatsup" className="box-label" style={{ margin: 0 }}>
          what&apos;s up
        </h2>
      </header>
      <div className="whatsup">
        <Polaroid id="ep02-200k" className="wp-a reveal" r={-4} caption="200K at house of growth" alt="The House of Growth team celebrating 200K followers" />
        <div className="whatsup-text reveal">
          <p className="hand big">{SITE.aboutShort.join(' ')}</p>
          <div className="tickets">
            {SITE.skills.map((s) => (
              <Ticket key={s.label} label={s.label} emoji={s.emoji} color={s.color} />
            ))}
          </div>
          <p className="label muted" style={{ margin: '10px 0 0' }}>
            i like to read about
          </p>
          <div className="reading">
            {SITE.readingList.map((t, i) => (
              <Sticker key={t} color={(['sand', 'mint', 'sky', 'blush'] as const)[i % 4]} r={[-3, 2, -1, 3][i % 4]}>
                {t}
              </Sticker>
            ))}
          </div>
          <Link className="btn btn-ghost" href="/journey" style={{ marginTop: 10 }}>
            read the whole story ↗
          </Link>
        </div>
        <Polaroid id="ep02-play-button" className="wp-b reveal" r={4} tape="blue" caption="the silver play button" alt="The House of Growth team holding the YouTube Silver Play Button" />
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section id="work" className="section container" aria-labelledby="featured">
      <header className="sec-head">
        <span className="hand">explore my work!</span>
        <h2 id="featured" className="px t-1">
          Featured work
        </h2>
        <p className="muted lede">A few things I helped make: campaigns, channels and ads that had to perform.</p>
      </header>
      <div className="case-stack">
        {CASES.map((c, i) => (
          <CaseCard key={c.slug} c={c} i={i} />
        ))}
      </div>
      <div style={{ marginTop: 56, display: 'flex', justifyContent: 'center' }}>
        <Link className="btn" href="/work">
          see all {ALL_WORK.length} pieces ↗
        </Link>
      </div>
    </section>
  );
}

function JourneyStrip() {
  return (
    <section className="section-tight container" aria-labelledby="journey-h">
      <header className="sec-head">
        <span className="hand">the story so far</span>
        <h2 id="journey-h" className="px t-2">
          The journey
        </h2>
        <p className="muted">Five episodes, from editing a friend&apos;s videos to AI-led creative for brands. Swipe through, or read it all.</p>
      </header>
      <div className="ep-strip" role="list">
        {EPISODES.map((e, i) => (
          <Link key={e.slug} role="listitem" href={`/journey#${e.slug}`} className="ep-card" style={v({ '--r': `${[-1.5, 1, -0.5, 1.5, -1][i]}deg` })}>
            <span className="top">
              <span className="px num">EP {e.n}</span>
              <Sticker color={e.color} r={4}>
                {e.period.split(' – ')[0]}
              </Sticker>
            </span>
            <span className="label">{e.company}</span>
            <h3>{e.title}</h3>
            <p>{e.logline}</p>
            <span className="bar" aria-hidden="true">
              <i style={v({ '--p': `${((i + 1) / EPISODES.length) * 100}%` })} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WorkedWith() {
  const tilt = [-2, 1.5, -1, 2, -1.5];
  const row = (hidden: boolean) =>
    SITE.brands.map((b, i) => (
      <span key={`${b}-${hidden}`} className="brand-sticker" style={v({ '--r': `${tilt[i % tilt.length]}deg` })} aria-hidden={hidden || undefined}>
        {b}
      </span>
    ));
  return (
    <section className="section-tight" aria-labelledby="brands-h">
      <div className="container" style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 id="brands-h" className="hand" style={{ fontSize: '1.8rem', margin: 0, color: 'var(--orange)' }}>
          worked with
        </h2>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}

function PlaygroundTeaser() {
  return (
    <section className="section container" aria-labelledby="play-h">
      <div className="teaser">
        <div style={{ display: 'grid', gap: 18 }}>
          <span className="hand" style={{ fontSize: '1.6rem', color: 'var(--orange)', transform: 'rotate(-3deg)', width: 'fit-content' }}>
            just for fun
          </span>
          <h2 id="play-h" className="px t-2">
            Playground
          </h2>
          <p className="muted lede">Set designs, AI experiments, side projects and a few stupid ideas. Drag them around.</p>
          <div>
            <Link className="btn" href="/playground">
              come play ↗
            </Link>
          </div>
        </div>
        <div className="teaser-pile" aria-hidden="true">
          <Polaroid id="ai-me-street" alt="" r={-8} style={{ left: '2%', top: '6%' }} tape="pink" />
          <Polaroid id="set-gc" alt="" r={5} style={{ left: '34%', top: '0%' }} />
          <Polaroid id="ai-me-retro" alt="" r={-3} style={{ left: '58%', top: '20%' }} tape="blue" />
          <Polaroid id="ep02-edit" alt="" r={7} style={{ left: '22%', top: '38%' }} tape="mint" />
        </div>
      </div>
    </section>
  );
}

function LetsTalk() {
  return (
    <section className="section container" aria-labelledby="talk-h">
      <div className="talk reveal">
        <WatchingSmiley />
        <h2 id="talk-h" className="px t-giant" style={{ margin: 0 }}>
          Let&apos;s talk
        </h2>
        <p className="hand" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', maxWidth: '28ch', margin: 0 }}>
          Got a brand problem, a weird idea, or just want to say hi? Send it over.
        </p>
        <CopyEmail email={SITE.email} where="home" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SITE.socials.map((s) => (
            <a key={s.id} className="social-dot" style={{ background: SOCIAL_BG[s.id], width: 44, height: 44 }} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} ${s.handle}`}>
              {socialIcon(s.id)}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <hr className="divider" />
      <WhatsUp />
      <Featured />
      <JourneyStrip />
      <WorkedWith />
      <PlaygroundTeaser />
      <hr className="divider" />
      <LetsTalk />
    </>
  );
}
