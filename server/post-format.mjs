// The format of a Writing post (content/posts/<slug>.md), shared by the site
// build (lib/posts.ts) and the CMS (server/cms.mjs), so both read, check and
// write posts the same way.
//
//   ---
//   title: ...
//   kind: blog | case study | dream campaign
//   date: YYYY-MM-DD
//   summary: ...
//   (brand, role, cover, tags, results, draft are optional)
//   ---
//   The post, in Markdown.

export const KINDS = ['blog', 'case-study', 'dream-campaign'];
export const FIELDS = ['title', 'kind', 'date', 'summary', 'brand', 'role', 'cover', 'tags', 'results', 'draft'];
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** [[work: id, id]] on its own line drops those pieces of work into the post. */
export const WORK_LINE = /^[ \t]*\[\[\s*work\s*:\s*([^\]]+)\]\][ \t]*$/gim;

export class PostError extends Error {
  constructor(file, message) {
    super(`content/posts/${file}: ${message}`);
    this.file = file;
    this.reason = message;
  }
}

export const slugify = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>|[*_`~]/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const unquote = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');

/** "value   # a note" → "value". A quoted value keeps everything inside its quotes; "#1" stays. */
const stripComment = (s) => {
  const quoted = /^\s*(['"]).*?\1/.exec(s);
  return quoted ? quoted[0].trim() : s.replace(/(^|\s+)#(\s.*)?$/, '').trim();
};

/** The --- block at the top. Supports `key: value`, `key: [a, b]`, true/false, `- item` lists and # comments. */
export function frontmatter(src, file) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) throw new PostError(file, 'start the file with a --- block (title, kind, date, summary), then ---, then the post.');
  const data = {};
  let list = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item) {
      if (!list) throw new PostError(file, `"${line.trim()}" is a list item, but there's no "key:" line above it.`);
      list.push(unquote(stripComment(item[1])));
      continue;
    }
    const kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) throw new PostError(file, `can't read "${line.trim()}" in the --- block. Write it as "key: value".`);
    const key = kv[1].toLowerCase();
    const value = stripComment(kv[2]);
    if (!FIELDS.includes(key)) throw new PostError(file, `"${kv[1]}" isn't a field. Use: ${FIELDS.join(', ')}.`);
    list = null;
    if (value === '') data[key] = list = [];
    else if (/^\[.*\]$/.test(value))
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map(unquote)
        .filter(Boolean);
    else if (value === 'true' || value === 'false') data[key] = value === 'true';
    else data[key] = unquote(value);
  }
  return { data, body: src.slice(m[0].length) };
}

function text(data, key, file, required = false) {
  const v = data[key];
  if (v === undefined || (Array.isArray(v) && v.length === 0) || v === '') {
    if (required) throw new PostError(file, `add "${key}:" to the --- block.`);
    return undefined;
  }
  if (typeof v !== 'string') throw new PostError(file, `"${key}" should be plain text.`);
  return v;
}

const asList = (v) => (v === undefined || typeof v === 'boolean' ? [] : Array.isArray(v) ? v : [v]);

/**
 * Reads a post file and checks its fields. Returns plain data; the site build
 * renders `body`, the CMS edits it. Throws PostError with a readable message.
 */
export function parsePost(src, file) {
  const slug = file.replace(/\.md$/, '');
  if (!SLUG.test(slug)) {
    throw new PostError(file, `the file name becomes the link (/writing/${slug}), so use lowercase letters, numbers and dashes, like "${slugify(slug) || 'my-post'}.md".`);
  }
  const { data, body } = frontmatter(src, file);

  const kind = text(data, 'kind', file, true).toLowerCase().trim().replace(/\s+/g, '-');
  if (!KINDS.includes(kind)) throw new PostError(file, `kind is "${kind}". Use one of: ${KINDS.join(', ')}.`);

  const date = text(data, 'date', file, true);
  const when = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  if (!when || Number.isNaN(when.getTime()) || when.toISOString().slice(0, 10) !== date) {
    throw new PostError(file, `date is "${date}". Write it as YYYY-MM-DD, like 2026-11-27.`);
  }

  const brand = text(data, 'brand', file);
  if (kind === 'dream-campaign' && !brand) throw new PostError(file, 'a dream campaign needs "brand:" (the brand it\'s for).');
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new PostError(file, 'draft should be true or false.');

  const results = asList(data.results).map((r) => {
    const [value, ...label] = r.split('|');
    if (!label.length) throw new PostError(file, `result "${r}" needs a "|" between the number and what it means, like "2.1M | views in a month".`);
    return { value: value.trim(), label: label.join('|').trim() };
  });

  return {
    slug,
    kind,
    title: text(data, 'title', file, true),
    summary: text(data, 'summary', file, true),
    date,
    brand,
    role: text(data, 'role', file),
    cover: text(data, 'cover', file),
    tags: asList(data.tags),
    results,
    draft: data.draft === true,
    body,
  };
}

/** Local images a post uses: "photo.jpg" means public/posts/<slug>/photo.jpg. Remote URLs are skipped. */
export function localImages(post) {
  const refs = [];
  for (const m of post.body.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) refs.push(m[1]);
  if (post.cover && /\.[a-z0-9]{2,5}$/i.test(post.cover)) refs.push(post.cover);
  return refs
    .filter((src) => !/^(https?:)?\/\//.test(src) && !src.startsWith('data:'))
    .map((src) => {
      const url = src.startsWith('/') ? src : `/posts/${post.slug}/${src}`;
      return { src, path: `public${decodeURI(url.split(/[?#]/)[0])}` };
    });
}

/** Work ids a post shows with [[work: ...]]. */
export function workIds(post) {
  return [...post.body.matchAll(WORK_LINE)].flatMap((m) => m[1].split(/[\s,]+/).filter(Boolean));
}

// ---------- writing a post (the CMS) ----------

const needsQuotes = (s) => /^[\s[{'"#-]|:\s|\s#|^(true|false)$|\s$/.test(s) || s === '';
const scalar = (s) => (needsQuotes(s) ? `"${s.replace(/"/g, "'")}"` : s);
const oneLine = (s) => String(s ?? '').replace(/\s*\r?\n\s*/g, ' ').trim();

/** Turns the CMS's fields back into a post file. Always produces something parsePost accepts. */
export function serializePost(p) {
  const kindWord = { blog: 'blog', 'case-study': 'case study', 'dream-campaign': 'dream campaign' }[p.kind] ?? p.kind;
  const lines = ['---', `title: ${scalar(oneLine(p.title))}`, `kind: ${kindWord}`, `date: ${p.date}`, `summary: ${scalar(oneLine(p.summary))}`];
  if (oneLine(p.brand)) lines.push(`brand: ${scalar(oneLine(p.brand))}`);
  if (oneLine(p.role)) lines.push(`role: ${scalar(oneLine(p.role))}`);
  if (oneLine(p.cover)) lines.push(`cover: ${scalar(oneLine(p.cover))}`);
  const tags = (p.tags ?? []).map(oneLine).filter(Boolean);
  if (tags.length) {
    lines.push('tags:');
    for (const t of tags) lines.push(`  - ${scalar(t)}`);
  }
  const results = (p.results ?? []).filter((r) => oneLine(r.value) || oneLine(r.label));
  if (results.length) {
    lines.push('results:');
    for (const r of results) lines.push(`  - ${scalar(`${oneLine(r.value).replace(/\|/g, '/')} | ${oneLine(r.label)}`)}`);
  }
  if (p.draft) lines.push('draft: true');
  lines.push('---', '');
  return `${lines.join('\n')}\n${String(p.body ?? '').replace(/\r\n/g, '\n').trim()}\n`;
}
