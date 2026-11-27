'use client';

import { useCallback, useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';
import { formatDuration, ytEmbedUrl, ytWatchUrl, type WorkView } from '@/lib/media';

/**
 * Full-screen player on a native <dialog>: focus stays inside, Esc closes,
 * ← and → move through the list. Media mounts only while open, so nothing
 * downloads until someone asks for it.
 */
export function Lightbox({ items, index, onIndex, onClose }: { items: WorkView[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = index === null ? null : items[index];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);

  const go = useCallback(
    (step: number) => {
      if (index === null) return;
      onIndex((index + step + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, go]);

  useEffect(() => {
    if (!item) return;
    track(item.kind === 'youtube' ? 'youtube_open' : item.kind === 'video' ? 'video_play' : 'image_open', { id: item.id, title: item.title, case: item.caseSlug });
  }, [item]);

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={item ? item.title : 'Player'}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {item ? (
        <div className="lb-body" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className={`lb-stage ${item.shape}`} key={item.id}>
            {item.kind === 'video' && item.full ? (
              <video src={item.full} poster={item.thumb} controls autoPlay playsInline />
            ) : item.kind === 'youtube' && item.youtubeId ? (
              <iframe
                src={ytEmbedUrl(item.youtubeId)}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : item.kind === 'image' && item.full ? (
              <img src={item.full} alt={item.title} />
            ) : null}
          </div>
          <div className="lb-meta">
            <span className="title">{item.title}</span>
            {item.brand ? <span className="label">{item.brand}</span> : null}
            {item.duration ? <span className="label">{formatDuration(item.duration)}</span> : null}
            {item.kind === 'youtube' && item.youtubeId ? (
              <a href={ytWatchUrl(item.youtubeId, item.short)} target="_blank" rel="noopener noreferrer" className="label">
                Watch on YouTube ↗
              </a>
            ) : null}
            {item.href && item.href.includes('instagram.com') ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="label">
                See the post on Instagram ↗
              </a>
            ) : null}
            <span className="label" style={{ opacity: 0.6 }}>
              {index! + 1} / {items.length}
            </span>
          </div>
        </div>
      ) : null}
      <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      {items.length > 1 ? (
        <>
          <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
          <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label="Next">
            →
          </button>
        </>
      ) : null}
    </dialog>
  );
}
