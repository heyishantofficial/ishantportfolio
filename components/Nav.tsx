'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SITE } from '@/content/site';
import { track } from '@/lib/analytics';
import { SOCIAL_BG, SmileyFace, socialIcon } from './ui';

const TABS = [
  { href: '/', label: 'Home', icon: '★' },
  { href: '/work', label: 'Work', icon: '▶' },
  { href: '/journey', label: 'Journey', icon: '✎' },
  { href: '/playground', label: 'Playground', icon: '◆' },
];

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

export function Nav() {
  const path = usePathname() || '/';
  // The menu remembers the page it was opened on, so moving to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const setOpen = (next: boolean) => setOpenOn(next ? path : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navSocials = SITE.socials.filter((s) => ['instagram', 'linkedin', 'youtube'].includes(s.id));

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand-mark" aria-label="Ishant, home">
            <SmileyFace className="smiley smiley-sm" />
            <span className="px">ishant</span>
          </Link>

          <nav aria-label="Main">
            <div className="nav-tabs">
              {TABS.map((t) => (
                <Link key={t.href} href={t.href} aria-current={isActive(path, t.href) ? 'page' : undefined}>
                  <span aria-hidden="true">{t.icon}</span>
                  {t.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="nav-right">
            <div className="socials">
              {navSocials.map((s) => (
                <a
                  key={s.id}
                  className="social-dot"
                  style={{ background: SOCIAL_BG[s.id] }}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  onClick={() => track('social_click', { network: s.id, where: 'nav' })}
                >
                  {socialIcon(s.id)}
                </a>
              ))}
            </div>
            <a className="btn btn-ghost btn-sm nav-resume" href={SITE.resume} target="_blank" rel="noopener" onClick={() => track('resume_download', { where: 'nav' })}>
              Resume ↓
            </a>
            <Link className="btn btn-sm" href="/contact" style={{ boxShadow: '3px 3px 0 var(--yellow)' }}>
              ♥ Contact
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm menu-btn"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div id="mobile-menu" className="mobile-menu">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="big" aria-current={isActive(path, t.href) ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
          <Link href="/contact" className="big">
            Contact
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <a className="btn btn-ghost btn-sm" href={SITE.resume} target="_blank" rel="noopener" onClick={() => track('resume_download', { where: 'menu' })}>
              Resume ↓
            </a>
            {SITE.socials.map((s) => (
              <a key={s.id} className="social-dot" style={{ background: SOCIAL_BG[s.id], width: 40, height: 40 }} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                {socialIcon(s.id)}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
