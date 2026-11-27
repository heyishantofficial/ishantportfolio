'use client';

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { track } from '@/lib/analytics';

export interface Piece {
  key: string;
  /** Start position as a percentage of the mat (top-left corner of the piece). */
  x: number;
  y: number;
  node: ReactNode;
}

type Pos = { x: number; y: number };

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The furthest each piece can sit (in % of the mat) and still be fully on it. */
function limits(mat: HTMLElement) {
  const box = mat.getBoundingClientRect();
  const out: Record<string, Pos> = {};
  for (const el of mat.querySelectorAll<HTMLElement>('[data-piece]')) {
    const r = el.getBoundingClientRect();
    out[el.dataset.piece!] = {
      x: Math.max(0, ((box.width - r.width) / box.width) * 100),
      y: Math.max(0, ((box.height - r.height) / box.height) * 100),
    };
  }
  return out;
}

/** A cutting mat where pieces can be dragged and thrown. Positions are kept as % so resizing keeps the layout. */
export function PlaygroundMat({ pieces, label }: { pieces: Piece[]; label: string }) {
  const mat = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, Pos>>(() => Object.fromEntries(pieces.map((p) => [p.key, { x: p.x, y: p.y }])));
  const [order, setOrder] = useState<string[]>(() => pieces.map((p) => p.key));
  const [shuffling, setShuffling] = useState(false);
  const dragged = useRef(false);
  const tracked = useRef(false);

  const [lim, setLim] = useState<Record<string, Pos>>({});

  const bringToFront = (key: string) => setOrder((o) => [...o.filter((k) => k !== key), key]);

  // The start positions are planned for a wide mat. Measure how far each piece
  // can go and show it no further, so on a narrow mat nothing hangs off the
  // edge. The planned position is kept, so the layout comes back when the mat
  // gets wider again.
  useLayoutEffect(() => {
    const m = mat.current;
    if (!m) return;
    const measure = () => {
      if (m.clientWidth && m.clientHeight) setLim(limits(m));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(m);
    for (const el of m.querySelectorAll('[data-piece]')) ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shown = (key: string): Pos => {
    const p = pos[key];
    const l = lim[key];
    return l ? { x: Math.min(p.x, l.x), y: Math.min(p.y, l.y) } : p;
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, key: string) => {
    if (e.button !== 0 || !mat.current) return;
    const el = e.currentTarget;
    const box = mat.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseLeft = rect.left - box.left;
    const baseTop = rect.top - box.top;
    const maxX = box.width - rect.width;
    const maxY = box.height - rect.height;
    let dx = 0;
    let dy = 0;
    let last = { x: e.clientX, y: e.clientY, t: performance.now() };
    let vx = 0;
    let vy = 0;
    dragged.current = false;
    el.setPointerCapture(e.pointerId);
    el.classList.add('lifted');
    bringToFront(key);

    const clampDelta = (nx: number, ny: number) => ({
      x: Math.min(Math.max(nx, -baseLeft), maxX - baseLeft),
      y: Math.min(Math.max(ny, -baseTop), maxY - baseTop),
    });

    const move = (ev: PointerEvent) => {
      const c = clampDelta(ev.clientX - startX, ev.clientY - startY);
      dx = c.x;
      dy = c.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) dragged.current = true;
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      vx = ((ev.clientX - last.x) / dt) * 16;
      vy = ((ev.clientY - last.y) / dt) * 16;
      last = { x: ev.clientX, y: ev.clientY, t: now };
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const commit = () => {
      el.style.transform = '';
      el.classList.remove('lifted');
      setPos((p) => ({ ...p, [key]: { x: ((baseLeft + dx) / box.width) * 100, y: ((baseTop + dy) / box.height) * 100 } }));
      if (dragged.current && !tracked.current) {
        tracked.current = true;
        track('playground_drag');
      }
    };

    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      // pointercancel means the browser took the gesture (a page scroll): just drop the piece.
      if (ev.type === 'pointercancel' || reduce() || Math.hypot(vx, vy) < 2) return commit();
      // Throw: keep sliding with friction until it stops.
      const glide = () => {
        vx *= 0.9;
        vy *= 0.9;
        const c = clampDelta(dx + vx, dy + vy);
        if (c.x !== dx + vx) vx *= -0.4; // bounce off the mat's edge
        if (c.y !== dy + vy) vy *= -0.4;
        dx = c.x;
        dy = c.y;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        if (Math.hypot(vx, vy) > 0.4) requestAnimationFrame(glide);
        else commit();
      };
      requestAnimationFrame(glide);
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, []);

  // A drag shouldn't also count as a click on a link inside the piece.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      dragged.current = false;
    }
  };

  const shuffle = () => {
    if (!mat.current) return;
    const max = limits(mat.current);
    setShuffling(true);
    setPos((p) => {
      const next: Record<string, Pos> = {};
      for (const k of Object.keys(p)) next[k] = { x: Math.random() * (max[k]?.x ?? 60), y: Math.random() * (max[k]?.y ?? 70) };
      return next;
    });
    setTimeout(() => setShuffling(false), 700);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="label muted" style={{ margin: 0 }}>
          drag things around · throw them · nothing breaks
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={shuffle}>
          ⟳ Shuffle
        </button>
      </div>
      <div ref={mat} className="mat" role="region" aria-label={label} onClickCapture={onClickCapture}>
        {pieces.map((p) => (
          <div
            key={p.key}
            data-piece={p.key}
            className="drag"
            style={{
              left: `${shown(p.key).x}%`,
              top: `${shown(p.key).y}%`,
              zIndex: order.indexOf(p.key) + 1,
              transition: shuffling ? 'left 0.6s cubic-bezier(0.22,1,0.36,1), top 0.6s cubic-bezier(0.22,1,0.36,1)' : undefined,
            }}
            onPointerDown={(e) => onPointerDown(e, p.key)}
          >
            {p.node}
          </div>
        ))}
      </div>
    </div>
  );
}
