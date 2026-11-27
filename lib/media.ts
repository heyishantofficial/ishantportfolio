import media from '@/content/media.json';
import { WORKS, type Work } from '@/content/works';

// Videos and PDFs live on the server volume under /media (see server/index.js).
// Photos, posters and YouTube thumbnails ship with the site under /img.
// Every URL carries a short content hash, so browsers can cache it for a year.
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE ?? '/media';

type VideoMeta = { w: number; h: number; duration: number; bytes: number; audio: boolean; v: string; original?: boolean };
type ImageMeta = { w: number; h: number; v: string };
type FileMeta = { ext: string; bytes: number; v: string };
type YtMeta = { w: number; h: number; short: boolean };

const videos = media.videos as Record<string, VideoMeta>;
const images = media.images as Record<string, ImageMeta>;
const files = media.files as Record<string, FileMeta>;
const youtube = media.youtube as Record<string, YtMeta>;

export const videoMeta = (id: string): VideoMeta | undefined => videos[id];
export const imageMeta = (id: string): ImageMeta | undefined => images[id];

export function videoSrc(id: string) {
  const m = videos[id];
  return m ? `${MEDIA_BASE}/v/${id}.mp4?v=${m.v}` : undefined;
}

export function previewSrc(id: string) {
  const m = videos[id];
  return m ? `${MEDIA_BASE}/p/${id}.mp4?v=${m.v}` : undefined;
}

export function posterSrc(id: string) {
  const m = videos[id];
  return m ? `/img/poster/${id}.webp?v=${m.v}` : undefined;
}

export function photoSrc(id: string, width: 640 | 1280 = 1280) {
  const m = images[id];
  return m ? `/img/photo/${id}-${width}.webp?v=${m.v}` : undefined;
}

export function photoSrcSet(id: string) {
  const m = images[id];
  if (!m) return undefined;
  return `/img/photo/${id}-640.webp?v=${m.v} 640w, /img/photo/${id}-1280.webp?v=${m.v} ${Math.min(1280, m.w)}w`;
}

export function fileSrc(id: string) {
  const m = files[id];
  return m ? `${MEDIA_BASE}/files/${id}${m.ext}?v=${m.v}` : undefined;
}

export function ytThumb(youtubeId: string) {
  return youtube[youtubeId] ? `/img/yt/${youtubeId}.webp` : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export const ytWatchUrl = (id: string, short?: boolean) =>
  short ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;

export const ytEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

export type Shape = 'tall' | 'wide' | 'square';

const shapeOf = (w: number, h: number): Shape => (h > w * 1.1 ? 'tall' : w > h * 1.1 ? 'wide' : 'square');

/** Width ÷ height for layout, and a coarse shape for picking frames. */
export function dims(id: string): { w: number; h: number; shape: Shape } | undefined {
  const m = videos[id] ?? images[id];
  return m ? { w: m.w, h: m.h, shape: shapeOf(m.w, m.h) } : undefined;
}

/** Everything a tile or the lightbox needs to show one piece of work. */
export interface WorkView extends Work {
  thumb?: string;
  preview?: string;
  full?: string;
  w: number;
  h: number;
  shape: Shape;
  duration?: number;
}

export function viewOf(work: Work): WorkView {
  if (work.kind === 'video') {
    const m = videos[work.id];
    return { ...work, thumb: posterSrc(work.id), preview: previewSrc(work.id), full: videoSrc(work.id), w: m?.w ?? 9, h: m?.h ?? 16, shape: m ? shapeOf(m.w, m.h) : 'tall', duration: m?.duration };
  }
  if (work.kind === 'image') {
    const m = images[work.id];
    return { ...work, thumb: photoSrc(work.id, 640), full: photoSrc(work.id, 1280), w: m?.w ?? 16, h: m?.h ?? 9, shape: m ? shapeOf(m.w, m.h) : 'wide' };
  }
  if (work.kind === 'youtube' && work.youtubeId) {
    const short = Boolean(work.short);
    return { ...work, thumb: ytThumb(work.youtubeId), w: short ? 9 : 16, h: short ? 16 : 9, shape: short ? 'tall' : 'wide' };
  }
  return { ...work, w: 16, h: 9, shape: 'wide' };
}

/** Works that exist (videos must have been encoded), in content order. */
export const ALL_WORK: WorkView[] = WORKS.filter((w) => w.kind !== 'video' || videos[w.id]).map(viewOf);

export const workById = (id: string) => ALL_WORK.find((w) => w.id === id);

/** A piece of work, or any photo/clip from content/media.json, ready for a polaroid + the player. */
export function rollItem(id: string, caption?: string): (WorkView & { caption?: string }) | undefined {
  const work = workById(id);
  if (work) return { ...work, caption: caption ?? work.title };
  const title = caption ?? id;
  if (videos[id]) return { ...viewOf({ id, title, category: 'youtube', kind: 'video' }), caption };
  if (images[id]) return { ...viewOf({ id, title, category: 'youtube', kind: 'image' }), caption };
  return undefined;
}

export const formatDuration = (s?: number) => {
  if (!s) return undefined;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};
