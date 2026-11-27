// Talks to the CMS API (server/cms.mjs). Every change sends X-CMS: 1, which the
// server requires, so other sites can't trigger changes with a hidden form.

import type { CaseStudy } from '@/content/cases';
import type { Episode } from '@/content/episodes';
import type { SiteContent } from '@/content/site';
import type { Work } from '@/content/works';
import type { ParsedPost } from '@/server/post-format.mjs';

export interface MediaJson {
  videos: Record<string, { w: number; h: number; duration: number; bytes: number; audio: boolean; v: string }>;
  images: Record<string, { w: number; h: number; v: string }>;
  files: Record<string, { ext: string; bytes: number; v: string }>;
  youtube: Record<string, { w: number; h: number; short: boolean }>;
}

export interface Doc<T> {
  data: T;
  base: string | null;
}

export interface PostRow {
  slug: string;
  post?: ParsedPost;
  error?: string;
  raw?: string;
  base: string | null;
  pending: boolean;
}

export interface CmsState {
  mode: 'github' | 'local' | 'off';
  repo: string | null;
  branch: string | null;
  head: string;
  docs: { site: Doc<SiteContent>; works: Doc<Work[]>; cases: Doc<CaseStudy[]>; episodes: Doc<Episode[]> };
  media: MediaJson;
  posts: PostRow[];
  postImages: Record<string, string[]>;
  pending: { count: number; notes: string[]; files: string[]; staged: string[] };
  last: { id: string; sha: string; url: string | null; at: string; notes: string[]; mode: string } | null;
}

export type DocKey = keyof CmsState['docs'];

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, message: string, data: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const BASE = '/api/cms';

export async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + url, {
    method,
    credentials: 'same-origin',
    headers: { 'X-CMS': '1', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, String(data.error ?? `Request failed (${res.status})`), data);
  return data as T;
}

export const saveDoc = <K extends DocKey>(doc: K, data: CmsState['docs'][K]['data'], base: string | null, note: string) => api('PUT', '/doc', { doc, data, base, note });

// ---------- uploads: 8 MB pieces, each retried, then an encode job ----------

export type Purpose = 'video' | 'image' | 'post-image' | 'resume' | 'file';
export interface Progress {
  stage: 'uploading' | 'processing' | 'done' | 'error';
  /** 0..1 */
  value: number;
  message: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function putChunk(url: string, blob: Blob, onBytes: (n: number) => void): Promise<void> {
  // XMLHttpRequest, because fetch can't report upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-CMS', '1');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(xhr.status, (() => { try { return JSON.parse(xhr.responseText).error; } catch { return `Upload failed (${xhr.status})`; } })(), {})));
    xhr.onerror = () => reject(new ApiError(0, 'The connection dropped.', {}));
    xhr.send(blob);
  });
}

export async function waitForJob(job: string, onProgress?: (p: Progress) => void): Promise<Record<string, unknown>> {
  for (;;) {
    await sleep(900);
    const j = await api<{ status: string; progress: number; message: string; result: Record<string, unknown>; error: string | null }>('GET', `/job/${job}`);
    if (j.status === 'done') {
      onProgress?.({ stage: 'done', value: 1, message: 'Done' });
      return j.result;
    }
    if (j.status === 'error') throw new ApiError(400, j.error ?? 'Processing failed.', {});
    onProgress?.({ stage: 'processing', value: j.progress ?? 0, message: j.message });
  }
}

export async function upload(file: File, purpose: Purpose, extra: Record<string, unknown>, onProgress: (p: Progress) => void) {
  const start = await api<{ upload: string; chunk: number }>('POST', '/upload', { purpose, filename: file.name, size: file.size, ...extra });
  for (let offset = 0; offset < file.size; ) {
    const end = Math.min(file.size, offset + start.chunk);
    for (let attempt = 1; ; attempt++) {
      try {
        await putChunk(`${BASE}/upload/${start.upload}?offset=${offset}`, file.slice(offset, end), (n) =>
          onProgress({ stage: 'uploading', value: (offset + n) / file.size, message: `Uploading ${Math.round(((offset + n) / file.size) * 100)}%` }),
        );
        break;
      } catch (err) {
        if (attempt >= 5 || (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 409)) throw err;
        onProgress({ stage: 'uploading', value: offset / file.size, message: `Connection hiccup, retrying (${attempt}/4)…` });
        await sleep(1500 * attempt);
      }
    }
    offset = end;
  }
  const { job } = await api<{ job: string }>('POST', `/upload/${start.upload}/finish`);
  onProgress({ stage: 'processing', value: 0, message: 'Processing…' });
  return waitForJob(job, onProgress);
}

// ---------- where to show a file from: the live site, or the unpublished copy ----------

export function previewUrl(state: CmsState, repoPath: string, liveUrl?: string) {
  if (state.pending.files.includes(repoPath) || state.pending.staged.includes(repoPath)) return `${BASE}/file?path=${encodeURIComponent(repoPath)}`;
  return liveUrl ?? `/${repoPath.replace(/^public\//, '')}`;
}

export function photoPreview(state: CmsState, id: string, width: 640 | 1280 = 640) {
  const m = state.media.images[id];
  if (!m) return undefined;
  return previewUrl(state, `public/img/photo/${id}-${width}.webp`, `/img/photo/${id}-${width}.webp?v=${m.v}`);
}

export function posterPreview(state: CmsState, id: string) {
  const m = state.media.videos[id];
  if (!m) return undefined;
  return previewUrl(state, `public/img/poster/${id}.webp`, `/img/poster/${id}.webp?v=${m.v}`);
}

export function videoPreview(state: CmsState, id: string) {
  const m = state.media.videos[id];
  if (!m) return undefined;
  return previewUrl(state, `media/v/${id}.mp4`, `/media/v/${id}.mp4?v=${m.v}`);
}

export function ytPreview(state: CmsState, youtubeId: string) {
  return state.media.youtube[youtubeId] ? previewUrl(state, `public/img/yt/${youtubeId}.webp`) : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/** Thumbnail for any piece of work. */
export function workThumb(state: CmsState, w: Work) {
  if (w.kind === 'video') return posterPreview(state, w.id);
  if (w.kind === 'image') return photoPreview(state, w.id);
  if (w.kind === 'youtube' && w.youtubeId) return ytPreview(state, w.youtubeId);
  return undefined;
}

/** A YouTube link or id → its 11-character id, and whether it's a Short. */
export function parseYoutube(input: string): { id: string; short: boolean } | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return { id: s, short: false };
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(s);
  return m ? { id: m[1], short: /\/shorts\//.test(s) } : null;
}

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');

/** A new id from a title that isn't taken yet. */
export function freshId(title: string, taken: (id: string) => boolean, fallback = 'item') {
  const base = slugify(title) || fallback;
  if (!taken(base)) return base;
  for (let n = 2; ; n++) if (!taken(`${base}-${n}`)) return `${base}-${n}`;
}
