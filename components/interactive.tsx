'use client';

import { useEffect, useRef, useState } from 'react';
import { initAnalytics, track } from '@/lib/analytics';
import { SmileyFace } from './ui';

/** Starts analytics after the page is idle (production only, never localhost). */
export function AnalyticsInit() {
  useEffect(() => initAnalytics(), []);
  return null;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The big smiley: blinks on its own (CSS) and watches the pointer. */
export function WatchingSmiley({ className = 'smiley' }: { className?: string }) {
  const wrap = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || reducedMotion() || !window.matchMedia('(hover: hover)').matches) return;
    const pupils = el.querySelector<SVGGElement>('.pupils');
    if (!pupils) return;
    let x = 0;
    let y = 0;
    let queued = false;
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.42;
        const a = Math.atan2(y - cy, x - cx);
        const d = Math.min(1, Math.hypot(x - cx, y - cy) / 280);
        pupils.setAttribute('transform', `translate(${(Math.cos(a) * 6 * d).toFixed(2)} ${(Math.sin(a) * 5 * d).toFixed(2)})`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return (
    <span ref={wrap} style={{ display: 'inline-block' }}>
      <SmileyFace className={className} />
    </span>
  );
}

/** Copies the email, with a small confetti burst. Falls back to selecting the text. */
export function CopyEmail({ email, where }: { email: string; where: string }) {
  const [copied, setCopied] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      track('email_copy', { where });
      if (!reducedMotion() && btn.current) {
        const r = btn.current.getBoundingClientRect();
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 70,
          spread: 70,
          startVelocity: 32,
          scalar: 0.9,
          origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
          colors: ['#f7c948', '#ff4d8d', '#2b57d6', '#16b06a', '#ff6a35'],
        });
      }
    } catch {
      const chip = document.getElementById(`email-${where}`);
      if (chip) {
        const range = document.createRange();
        range.selectNodeContents(chip);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <span className="talk-actions">
      <span id={`email-${where}`} className="email-chip">
        {email}
      </span>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <button ref={btn} type="button" className="btn" onClick={onCopy}>
          {copied ? 'Copied ✓' : 'Copy email'}
        </button>
        {copied ? (
          <span className="copied-sticker sticker bg-mint" style={{ ['--r' as string]: '6deg' }} role="status">
            see you in my inbox
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** A muted loop in a phone frame that plays only while on screen. */
export function PhoneVideo({ src, poster, label }: { src?: string; poster?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className="phone">
      <span className="notch" aria-hidden="true" />
      {src ? (
        <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} />
      ) : poster ? (
        <img src={poster} alt={label} loading="lazy" />
      ) : null}
    </div>
  );
}
