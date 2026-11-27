import Link from 'next/link';
import { SITE } from '@/content/site';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'grid', gap: 8 }}>
          <p className="px t-3" style={{ margin: 0 }}>
            {SITE.name}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {SITE.role} · made with too much chai and a little AI.
          </p>
          <p className="label muted" style={{ margin: 0 }}>
            {/* The year is set when the site is built, which happens on every deploy. */}
            {/* oxlint-disable-next-line react/purity */}
            © {new Date().getFullYear()} · {SITE.email}
          </p>
        </div>
        <nav aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/work">Work</Link>
          <Link href="/journey">Journey</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/contact">Contact</Link>
          <a href={SITE.resume} target="_blank" rel="noopener">
            Resume
          </a>
        </nav>
      </div>
    </footer>
  );
}
