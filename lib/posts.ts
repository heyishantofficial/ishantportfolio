// Reads the Markdown posts in content/posts/ when the site is built (server only:
// it uses the file system, so never import it from a 'use client' file).
//
// A post is content/posts/<slug>.md: a --- block of fields, then the body.
// Mistakes (a missing field, a typo in a key, an image that isn't there) stop the
// build with a message that names the file, so a broken post never goes live.

import fs from 'node:fs';
import path from 'node:path';
import { Marked, type Token, type Tokens } from 'marked';
import { type PostKind, type PostSummary } from '@/content/writing';
import { WORKS } from '@/content/works';
import { IS_DRAFT } from './draft';
import { imageMeta, photoSrc, workById, type WorkView } from './media';
import { PostError, WORK_LINE, parsePost, slugify } from '../server/post-format.mjs';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

export type PostBlock = { type: 'html'; html: string } | { type: 'work'; items: WorkView[] };

export interface Post extends PostSummary {
  role?: string;
  results: { value: string; label: string }[];
  blocks: PostBlock[];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const YOUTUBE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/;

/** Local image paths: "photo.jpg" means public/posts/<slug>/photo.jpg. Checks the file is there. */
function localSrc(src: string, slug: string, file: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  const url = src.startsWith('/') ? src : `/posts/${slug}/${src}`;
  const onDisk = path.join(PUBLIC_DIR, decodeURI(url.split(/[?#]/)[0]));
  if (!onDisk.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(onDisk)) {
    throw new PostError(file, `can't find the image "${src}". Put it at public${decodeURI(url)}.`);
  }
  return url;
}

/** cover: a file (cover.jpg, /posts/...), a piece of work's id (its poster), or a photo id from content/media.json. */
function coverSrc(value: string | undefined, slug: string, file: string) {
  if (!value) return undefined;
  if (/\.[a-z0-9]{2,5}$/i.test(value) || value.startsWith('/') || /^https?:/.test(value)) return localSrc(value, slug, file);
  const work = workById(value);
  if (work?.thumb) return work.thumb;
  if (imageMeta(value)) return photoSrc(value, 1280);
  throw new PostError(file, `cover "${value}" isn't an image file, a work id from content/works.ts, or a photo id from content/media.json.`);
}

function markdown(slug: string, file: string) {
  const ids = new Map<string, number>();
  const md = new Marked({ gfm: true, breaks: true });
  md.use({
    renderer: {
      // One h1 per page (the title), so "# Heading" in a post becomes an h2. Every heading gets an anchor.
      heading({ tokens, depth, text: raw }) {
        const level = Math.min(6, Math.max(2, depth));
        const base = slugify(raw) || 'section';
        const n = ids.get(base) ?? 0;
        ids.set(base, n + 1);
        const id = n ? `${base}-${n + 1}` : base;
        return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      paragraph({ tokens }) {
        const parts = tokens.filter((t: Token) => t.type !== 'br' && !(t.type === 'text' && !t.raw.trim()));
        // A YouTube link on its own line plays in the post.
        const only = parts.length === 1 ? parts[0] : undefined;
        if (only?.type === 'link') {
          const link = only as Tokens.Link;
          const yt = YOUTUBE.exec(link.href);
          if (yt && (link.autolink || link.text === link.href)) {
            const tall = /\/shorts\//.test(link.href);
            return `<div class="post-embed${tall ? ' tall' : ''}"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&amp;modestbranding=1&amp;playsinline=1" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>\n`;
          }
        }
        // Images on their own become taped photos; several in a row become a little gallery.
        if (parts.length && parts.every((t: Token) => t.type === 'image')) {
          const figs = (parts as Tokens.Image[]).map((img) => {
            const caption = img.title ? `<figcaption>${esc(img.title)}</figcaption>` : '';
            return `<figure class="post-figure"><img src="${esc(localSrc(img.href, slug, file))}" alt="${esc(img.text)}" loading="lazy" decoding="async">${caption}</figure>`;
          });
          return figs.length === 1 ? `${figs[0]}\n` : `<div class="post-gallery">${figs.join('')}</div>\n`;
        }
        return false;
      },
      image({ href, text: alt, title }) {
        return `<img src="${esc(localSrc(href, slug, file))}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`;
      },
      link({ href, title, tokens }) {
        const external = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?heyishant\.com(\/|$)/.test(href);
        const attrs = `${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}`;
        return `<a href="${esc(href)}"${attrs}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });
  return md;
}

const KNOWN_WORK = new Set(WORKS.map((w) => w.id));

function body(src: string, slug: string, file: string): PostBlock[] {
  const md = markdown(slug, file);
  const blocks: PostBlock[] = [];
  let last = 0;
  const html = (chunk: string) => {
    if (chunk.trim()) blocks.push({ type: 'html', html: md.parse(chunk, { async: false }) });
  };
  for (const m of src.matchAll(WORK_LINE)) {
    html(src.slice(last, m.index));
    last = m.index + m[0].length;
    const ids = m[1].split(/[\s,]+/).filter(Boolean);
    const unknown = ids.filter((id) => !KNOWN_WORK.has(id));
    if (unknown.length) throw new PostError(file, `[[work: ...]] names ${unknown.map((u) => `"${u}"`).join(', ')}, which isn't in content/works.ts.`);
    // A video that hasn't been encoded yet is skipped, as everywhere else on the site.
    const items = ids.map(workById).filter((w): w is WorkView => Boolean(w));
    if (items.length) blocks.push({ type: 'work', items });
  }
  html(src.slice(last));
  return blocks;
}

const words = (src: string) =>
  src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>|\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)|https?:\/\/\S+/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function readPost(file: string): Post {
  const p = parsePost(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'), file);
  return {
    ...p,
    kind: p.kind as PostKind,
    dateLabel: DATE_FMT.format(new Date(`${p.date}T00:00:00Z`)),
    minutes: Math.max(1, Math.round(words(p.body) / 220)),
    cover: coverSrc(p.cover, p.slug, file),
    blocks: body(p.body, p.slug, file),
  };
}

let cache: Post[] | undefined;

function allPosts(): Post[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const files = fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_')) : [];
  cache = files.map(readPost).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return cache;
}

/** Posts to show: drafts (draft: true) only on preview builds, newest first. */
export const getPosts = (): Post[] => allPosts().filter((p) => IS_DRAFT || !p.draft);

/** Published posts only, whatever the build. For the feed and the sitemap. */
export const getPublishedPosts = (): Post[] => allPosts().filter((p) => !p.draft);

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const summaryOf = ({ slug, kind, title, summary, date, dateLabel, minutes, brand, cover, tags, draft }: Post): PostSummary => ({
  slug,
  kind,
  title,
  summary,
  date,
  dateLabel,
  minutes,
  brand,
  cover,
  tags,
  draft,
});
