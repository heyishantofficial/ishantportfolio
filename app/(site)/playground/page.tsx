import type { Metadata } from 'next';
import { PlaygroundMat, type Piece } from '@/components/PlaygroundMat';
import { Polaroid } from '@/components/ui';
import { SITE } from '@/content/site';
import { fileSrc, posterSrc, previewSrc } from '@/lib/media';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Set designs, AI experiments, side projects and a few stupid ideas.',
  alternates: { canonical: '/playground' },
};

function Clip({ id, caption, r }: { id: string; caption: string; r: number }) {
  const src = previewSrc(id);
  if (!src) return null;
  return (
    <figure className="polaroid tape tape-blue" style={{ ['--r' as string]: `${r}deg`, width: 230 }}>
      <video src={src} poster={posterSrc(id)} muted loop autoPlay playsInline preload="metadata" style={{ aspectRatio: '16 / 9' }} aria-label={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function PlaygroundPage() {
  // The collage has three spots for stupid ideas and three for side projects.
  const [idea1, idea2, idea3] = SITE.stupidIdeas;
  const [brainjot, notch, roadmapp] = SITE.sideProjects;
  const idea = (key: string, it: typeof idea1 | undefined, x: number, y: number, r: number, bg?: string): Piece[] =>
    it ? [{ key, x, y, node: <div className="note-card" style={{ ['--r' as string]: `${r}deg`, ...(bg ? { background: bg } : {}) }}><span className="label">stupid idea {it.n}</span>{it.text}</div> }] : [];
  const project = (key: string, p: typeof brainjot | undefined, x: number, y: number, r: number): Piece[] => {
    if (!p) return [];
    const doc = p.file ? fileSrc(p.file) : undefined;
    const href = doc ?? p.href;
    if (!href) return [];
    return [
      {
        key,
        x,
        y,
        node: (
          <div className="project-card" style={{ ['--r' as string]: `${r}deg` }}>
            <span className="label muted">{doc ? 'overview deck' : 'things I build with AI'}</span>
            <span className="px">{p.name}</span>
            <span>{p.note}</span>
            <a className="link-underline label" href={href} target="_blank" rel={doc ? 'noopener' : 'noopener noreferrer'}>
              {doc ? 'open the PDF ↗' : 'open ↗'}
            </a>
          </div>
        ),
      },
    ];
  };

  const pieces: Piece[] = [
    { key: 'ai-street', x: 3, y: 4, node: <div style={{ width: 200 }}><Polaroid id="ai-me-street" alt="AI-made picture of Ishant in the street with a coffee" caption="AI me, on a coffee run" r={-6} tape="pink" /></div> },
    ...idea('note-1', idea1, 30, 3, 3),
    { key: 'set-main', x: 56, y: 5, node: <Clip id="set-main" caption="the main set" r={4} /> },
    { key: 'ai-retro', x: 6, y: 34, node: <div style={{ width: 190 }}><Polaroid id="ai-me-retro" alt="AI-made picture of Ishant in front of old computer screens" caption="AI me, hacking (not really)" r={5} tape="blue" /></div> },
    { key: 'set-gc', x: 33, y: 28, node: <div style={{ width: 250 }}><Polaroid id="set-gc" alt="A set design for a video shoot" caption="set design" r={-2} tape="mint" /></div> },
    ...idea('note-2', idea2, 52, 47, -4, 'var(--blush)'),
    { key: 'ai-sleep', x: 26, y: 58, node: <div style={{ width: 210 }}><Polaroid id="ai-me-sleep" alt="AI-made picture of Ishant asleep on a keyboard" caption="AI me, after a deadline" r={-4} /></div> },
    { key: 'set-9', x: 3, y: 66, node: <Clip id="set-9" caption="set test" r={-5} /> },
    ...idea('note-3', idea3, 50, 76, 2, 'var(--mint)'),
    { key: 'set-hog', x: 30, y: 86, node: <div style={{ width: 230 }}><Polaroid id="set-hog" alt="The House of Growth set" caption="house of growth set" r={3} tape="pink" /></div> },
    // Project cards last, so they sit on top of the pile and their links stay clickable.
    ...project('brainjot', brainjot, 74, 30, -3),
    ...project('notch', notch, 76, 60, 2),
    ...project('roadmapp', roadmapp, 74, 84, -1),
  ];

  return (
    <div className="container section-tight">
      <header className="sec-head">
        <span className="hand">just for fun</span>
        <h1 className="px t-1">Playground</h1>
        <p className="muted lede">Set designs, AI experiments, side projects and a few stupid ideas. Everything here can be dragged, thrown and shuffled.</p>
      </header>
      <PlaygroundMat pieces={pieces} label="Playground collage. Drag pieces to move them." />
    </div>
  );
}
