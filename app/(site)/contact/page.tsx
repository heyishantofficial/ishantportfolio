import type { Metadata } from 'next';
import { CopyEmail, WatchingSmiley } from '@/components/interactive';
import { SOCIAL_BG, socialIcon } from '@/components/ui';
import { SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Got a brand problem, a weird idea, or just want to say hi? Write to Ishant.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="container section">
      <div className="contact-grid">
        <div style={{ display: 'grid', gap: 22, justifyItems: 'start' }}>
          <span className="hand" style={{ fontSize: '1.7rem', color: 'var(--orange)', transform: 'rotate(-3deg)' }}>
            drop a line
          </span>
          <h1 className="px t-giant" style={{ margin: 0 }}>
            Let&apos;s talk
          </h1>
          <p className="lede">
            Got a brand problem, a campaign that needs a weird idea, or a content team that needs a system? Or you just want to say hi? Send it over. I read
            every message.
          </p>
          <CopyEmail email={SITE.email} where="contact" />
          <p className="muted" style={{ margin: 0 }}>
            or{' '}
            <a className="link-underline" href={`mailto:${SITE.email}?subject=Hi%20Ishant`}>
              open your mail app
            </a>
            {' · '}
            <a className="link-underline" href={SITE.resume} target="_blank" rel="noopener">
              grab the resume
            </a>
          </p>
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <WatchingSmiley />
          </div>
          <p className="label muted" style={{ margin: 0 }}>
            elsewhere
          </p>
          <div className="social-list">
            {SITE.socials.map((s) => (
              <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer">
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="social-dot" style={{ background: SOCIAL_BG[s.id] }} aria-hidden="true">
                    {socialIcon(s.id)}
                  </span>
                  <b>{s.label}</b>
                </span>
                <span className="label muted">{s.handle} ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
