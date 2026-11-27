// The CMS behind /admin.
//
// Git is the source of truth. The CMS reads the site's content straight from the
// GitHub repo, keeps your edits as "unpublished changes" on the server volume,
// and "Publish" turns them into one commit on the live branch. Dokploy sees the
// push and rebuilds the site (about 3 minutes).
//
//   content/data/{site,works,cases,episodes}.json   edited as JSON
//   content/posts/<slug>.md                          Writing posts
//   content/media.json                               sizes and cache keys of media
//   public/img/..., public/posts/..., public/resume.pdf   pictures and the resume (in git)
//   /app/data/media/{v,p,files}                      videos and PDFs (volume, not git)
//
// Videos are encoded here with ffmpeg and kept in DATA_DIR/cms/staged until the
// commit lands, so a replaced video never changes the live site early.
//
// Settings (environment):
//   CMS_GITHUB_TOKEN    a GitHub token that can write this repo's contents (required to publish)
//   CMS_GITHUB_REPO     owner/name            (default heyishantofficial/ishantportfolio)
//   CMS_GITHUB_BRANCH   the branch Dokploy deploys (default main)
//   CMS_PASSWORD_HASH   optional: log in with a password (npm run cms:password makes this)
//   CMS_LOCAL_REPO      development only: read and write a folder instead of GitHub
// Logging in always works with the media key (.media-key on the owner's computer).

import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { encodeImage, encodePostImage, encodeVideo, fileHash, youtubeThumb } from './media-encode.mjs';
import { PostError, SLUG, localImages, parsePost, serializePost, workIds } from './post-format.mjs';

const env = process.env;
const REPO = env.CMS_GITHUB_REPO || 'heyishantofficial/ishantportfolio';
const BRANCH = env.CMS_GITHUB_BRANCH || 'main';
const TOKEN = env.CMS_GITHUB_TOKEN || '';
const API = (env.CMS_GITHUB_API || 'https://api.github.com').replace(/\/$/, '');
const LOCAL = env.CMS_LOCAL_REPO ? path.resolve(env.CMS_LOCAL_REPO) : null;
const PASSWORD_HASH = env.CMS_PASSWORD_HASH || '';
const X264_PRESET = env.CMS_X264_PRESET || 'fast';

const DOCS = {
  site: 'content/data/site.json',
  works: 'content/data/works.json',
  cases: 'content/data/cases.json',
  episodes: 'content/data/episodes.json',
};
const MEDIA_JSON = 'content/media.json';
const VERSION_FILE = 'public/cms-version.txt';
const POSTS_DIR = 'content/posts/';
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SESSION_DAYS = 14;
const CHUNK = 8 * 1024 * 1024;
const LIMITS = { video: 2048, image: 60, 'post-image': 60, resume: 40, file: 60 }; // MB

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const bad = (message, extra) => new HttpError(400, message, extra);

// ---------- where the repo lives: GitHub, or a local folder in development ----------

/** Git's own id for a file's content, so local files and GitHub files compare the same way. */
const gitSha = (buf) => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

function githubBackend() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'heyishant-cms',
  };
  async function gh(method, url, body) {
    const res = await fetch(`${API}/repos/${REPO}${url}`, {
      method,
      headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const hint = res.status === 401 ? ' (the token is wrong or expired)' : res.status === 403 || res.status === 404 ? ' (the token may not have access to this repo, or lacks Contents: write)' : '';
      throw new HttpError(res.status === 422 ? 409 : 502, `GitHub said ${res.status}${hint}: ${text.slice(0, 200)}`, { github: res.status });
    }
    return res.json();
  }
  const blobs = new Map();
  let tree = { commit: null, files: null };
  return {
    mode: 'github',
    async head() {
      return (await gh('GET', `/git/ref/heads/${encodeURIComponent(BRANCH)}`)).object.sha;
    },
    /** path → git blob sha, for every file in the commit. */
    async files(commit) {
      if (tree.commit === commit) return tree.files;
      const c = await gh('GET', `/git/commits/${commit}`);
      const t = await gh('GET', `/git/trees/${c.tree.sha}?recursive=1`);
      if (t.truncated) throw new HttpError(502, 'The repo is too big to list in one go.');
      tree = { commit, files: new Map(t.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha])) };
      return tree.files;
    },
    async read(commit, file) {
      const sha = (await this.files(commit)).get(file);
      if (!sha) return null;
      if (blobs.has(sha)) return blobs.get(sha);
      const b = await gh('GET', `/git/blobs/${sha}`);
      const buf = Buffer.from(b.content, 'base64');
      if (buf.length < 2_000_000) blobs.set(sha, buf);
      return buf;
    },
    /** One commit on top of `base`. Fails (409) if the branch moved meanwhile. */
    async commit(base, changes, message) {
      const files = await this.files(base);
      const entries = [];
      for (const c of changes) {
        if (c.content === null) {
          if (files.has(c.path)) entries.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
          continue;
        }
        const sha = gitSha(c.content);
        if (files.get(c.path) === sha) continue; // unchanged
        const blob = await gh('POST', '/git/blobs', { content: c.content.toString('base64'), encoding: 'base64' });
        entries.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      if (!entries.length) return { sha: base, url: null, empty: true };
      const baseCommit = await gh('GET', `/git/commits/${base}`);
      const newTree = await gh('POST', '/git/trees', { base_tree: baseCommit.tree.sha, tree: entries });
      const commit = await gh('POST', '/git/commits', { message, tree: newTree.sha, parents: [base] });
      await gh('PATCH', `/git/refs/heads/${encodeURIComponent(BRANCH)}`, { sha: commit.sha, force: false });
      return { sha: commit.sha, url: commit.html_url ?? null };
    },
  };
}

function localBackend(dir) {
  const inside = (file) => {
    const full = path.resolve(dir, file);
    if (!full.startsWith(dir + path.sep)) throw bad('Bad path.');
    return full;
  };
  return {
    mode: 'local',
    async head() {
      return 'working-tree';
    },
    async files() {
      // Only what the CMS asks about; hashing happens on demand.
      return {
        has: (file) => fs.existsSync(inside(file)),
        get: (file) => (fs.existsSync(inside(file)) ? gitSha(fs.readFileSync(inside(file))) : undefined),
        keys: () => listLocal(dir).values(),
      };
    },
    async read(_commit, file) {
      return fsp.readFile(inside(file)).catch(() => null);
    },
    async commit(_base, changes) {
      for (const c of changes) {
        const full = inside(c.path);
        if (c.content === null) await fsp.rm(full, { force: true });
        else {
          await fsp.mkdir(path.dirname(full), { recursive: true });
          await fsp.writeFile(full, c.content);
        }
      }
      return { sha: 'local', url: null };
    },
  };
}

function listLocal(dir) {
  const out = [];
  for (const top of ['content/posts', 'public/posts']) {
    const walk = (rel) => {
      for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
        const p = `${rel}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else out.push(p);
      }
    };
    if (fs.existsSync(path.join(dir, top))) walk(top);
  }
  return out;
}

// ---------- shape checks for the JSON documents ----------
// The site build trusts these files, so anything that would break a page is
// refused here with a message that says where.

const T = {
  str: (o = {}) => ({ t: 'str', ...o }),
  bool: () => ({ t: 'bool', opt: true }),
  num: () => ({ t: 'num' }),
  list: (of, o = {}) => ({ t: 'list', of, ...o }),
  obj: (fields, o = {}) => ({ t: 'obj', fields, ...o }),
};
const opt = (s) => ({ ...s, opt: true });

function check(spec, v, where) {
  if (v === undefined || v === null || v === '') {
    if (spec.opt) return;
    throw bad(`${where} is missing.`);
  }
  switch (spec.t) {
    case 'str':
      if (typeof v !== 'string') throw bad(`${where} should be text.`);
      if (spec.re && !spec.re.test(v)) throw bad(`${where} “${v}” ${spec.reMsg ?? 'is not allowed'}.`);
      if (spec.oneOf && !spec.oneOf.includes(v)) throw bad(`${where} should be one of: ${spec.oneOf.join(', ')}.`);
      return;
    case 'bool':
      if (typeof v !== 'boolean') throw bad(`${where} should be yes or no.`);
      return;
    case 'num':
      if (typeof v !== 'number' || !Number.isFinite(v)) throw bad(`${where} should be a number.`);
      return;
    case 'list':
      if (!Array.isArray(v)) throw bad(`${where} should be a list.`);
      if (spec.min && v.length < spec.min) throw bad(`${where} needs at least ${spec.min}.`);
      if (spec.len && v.length !== spec.len) throw bad(`${where} needs exactly ${spec.len}.`);
      v.forEach((item, i) => check(spec.of, item, `${where} #${i + 1}${item && typeof item === 'object' && (item.title || item.label || item.name) ? ` (“${item.title || item.label || item.name}”)` : ''}`));
      if (spec.unique) {
        const seen = new Set();
        for (const item of v) {
          if (seen.has(item[spec.unique])) throw bad(`${where}: “${item[spec.unique]}” is used twice. Each needs its own ${spec.unique}.`);
          seen.add(item[spec.unique]);
        }
      }
      return;
    case 'obj':
      if (typeof v !== 'object' || Array.isArray(v)) throw bad(`${where} should be a group of fields.`);
      for (const [k, s] of Object.entries(spec.fields)) check(s, v[k], `${where} → ${k}`);
      return;
  }
}

const id = (what) => T.str({ re: ID, reMsg: `isn't a valid ${what} (use lowercase letters, numbers and dashes)` });
const strList = () => T.list(T.str());
const COLORS = ['yellow', 'mint', 'pink', 'sky', 'sand', 'blush', 'blue', 'green', 'orange'];

const SPECS = {
  [DOCS.works]: T.list(
    T.obj({
      id: id('work id'),
      title: T.str(),
      brand: opt(T.str()),
      category: T.str(),
      // The kinds the site knows how to show (content/works.ts, WorkGrid).
      kind: T.str({ oneOf: ['video', 'youtube', 'image', 'link'] }),
      youtubeId: opt(T.str({ re: /^[\w-]{11}$/, reMsg: "isn't a YouTube video id" })),
      short: T.bool(),
      href: opt(T.str({ re: /^https?:\/\//, reMsg: 'should start with https://' })),
      caseSlug: opt(T.str()),
    }),
    { unique: 'id' },
  ),
  [DOCS.cases]: T.list(
    T.obj({
      slug: id('case link'),
      tab: T.str(),
      color: T.str({ oneOf: ['ink', 'yellow', 'blue', 'pink'] }),
      brand: T.str(),
      title: T.str(),
      oneLiner: T.str(),
      period: opt(T.str()),
      role: opt(T.str()),
      team: opt(T.str()),
      tools: opt(strList()),
      tags: strList(),
      cover: T.obj({ kind: T.str({ oneOf: ['youtube', 'video', 'photo'] }), id: T.str() }),
      context: opt(T.str()),
      brief: opt(T.str()),
      idea: opt(T.str()),
      results: opt(T.list(T.obj({ value: T.str(), label: T.str() }))),
      bts: opt(strList()),
      todo: opt(strList()),
    }),
    { unique: 'slug', min: 1 },
  ),
  [DOCS.episodes]: T.list(
    T.obj({
      n: T.str(),
      slug: id('episode link'),
      title: T.str(),
      company: T.str(),
      period: T.str(),
      logline: T.str(),
      color: T.str({ oneOf: ['yellow', 'mint', 'pink', 'sky', 'sand'] }),
      roles: T.list(T.obj({ company: T.str(), title: T.str(), period: T.str(), aka: opt(T.str()), notes: T.str() })),
      story: strList(),
      notes: strList(),
      cameraRoll: T.list(T.obj({ id: T.str(), caption: opt(T.str()) })),
      todo: opt(strList()),
    }),
    { unique: 'slug', min: 1 },
  ),
  [DOCS.site]: T.obj({
    name: T.str(),
    shortName: T.str(),
    role: T.str(),
    company: T.str(),
    hometown: T.str(),
    url: T.str({ re: /^https?:\/\//, reMsg: 'should start with https://' }),
    email: T.str({ re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, reMsg: "isn't an email address" }),
    resume: T.str(),
    tagline: T.str(),
    description: T.str(),
    status: T.str(),
    cycleWords: T.list(T.str(), { min: 1 }),
    heroStickers: T.list(T.obj({ text: T.str(), color: T.str({ oneOf: COLORS }), r: T.num() }), { min: 2 }),
    aboutShort: strList(),
    aboutFull: T.str(),
    readingList: strList(),
    skills: T.list(T.obj({ label: T.str(), emoji: T.list(T.str(), { len: 2 }), color: T.str({ oneOf: COLORS }) })),
    brands: T.list(T.str(), { min: 1 }),
    socials: T.list(T.obj({ id: T.str(), label: T.str(), handle: T.str(), href: T.str({ re: /^(https?:\/\/|mailto:)/, reMsg: 'should be a link' }) })),
    stupidIdeas: T.list(T.obj({ n: T.str(), text: T.str() })),
    sideProjects: T.list(T.obj({ name: T.str(), note: T.str(), href: opt(T.str()), file: opt(T.str()) })),
  }),
};

const DOC_LABEL = { [DOCS.site]: 'site text', [DOCS.works]: 'work', [DOCS.cases]: 'case studies', [DOCS.episodes]: 'journey' };

// ---------- the router ----------

export function cmsRouter({ DATA_DIR, MEDIA_DIR, mediaKeyHash }) {
  const CMS_DIR = path.join(DATA_DIR, 'cms');
  const STORE = path.join(CMS_DIR, 'store');
  const STAGED = path.join(CMS_DIR, 'staged');
  const INCOMING = path.join(CMS_DIR, 'incoming');
  const TMP = path.join(CMS_DIR, 'tmp');
  const PENDING = path.join(CMS_DIR, 'pending.json');
  const LAST = path.join(CMS_DIR, 'last-publish.json');
  for (const d of [STORE, STAGED, INCOMING, TMP]) fs.mkdirSync(d, { recursive: true });
  // Leftovers from a restart mid-upload or mid-encode.
  for (const d of [INCOMING, TMP]) for (const f of fs.readdirSync(d)) fs.rmSync(path.join(d, f), { force: true, recursive: true });

  const backend = LOCAL ? localBackend(LOCAL) : TOKEN ? githubBackend() : null;
  const mode = backend?.mode ?? 'off';

  // Sessions are signed with a secret that lives on the volume (it survives redeploys).
  const SECRET_FILE = path.join(CMS_DIR, 'secret');
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  const SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();

  const router = express.Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  // ----- login -----

  const sign = (value) => crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  const makeToken = () => {
    const exp = String(Date.now() + SESSION_DAYS * 864e5);
    return `${exp}.${sign(exp)}`;
  };
  const tokenOk = (token) => {
    const [exp, mac] = String(token || '').split('.');
    if (!exp || !mac || Number(exp) < Date.now()) return false;
    const want = Buffer.from(sign(exp));
    const got = Buffer.from(mac);
    return want.length === got.length && crypto.timingSafeEqual(want, got);
  };
  const cookieOf = (req) => /(?:^|;\s*)hi_cms=([^;]+)/.exec(req.get('cookie') || '')?.[1];
  const setCookie = (req, res, value, maxAge) =>
    res.set('Set-Cookie', `hi_cms=${value}; Path=/api/cms; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${req.secure ? '; Secure' : ''}`);

  function secretOk(given) {
    if (!given || typeof given !== 'string') return false;
    const key = given.trim();
    if (mediaKeyHash && crypto.timingSafeEqual(crypto.createHash('sha256').update(key).digest(), mediaKeyHash)) return true;
    // scrypt$N$r$p$salt$hash (npm run cms:password)
    const m = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/.exec(PASSWORD_HASH);
    if (!m) return false;
    const want = Buffer.from(m[5], 'hex');
    const got = crypto.scryptSync(given, Buffer.from(m[4], 'hex'), want.length, { N: Number(m[1]), r: Number(m[2]), p: Number(m[3]), maxmem: 256 * 1024 * 1024 });
    return crypto.timingSafeEqual(want, got);
  }

  const failures = new Map();
  router.post('/login', express.json({ limit: '4kb' }), (req, res) => {
    const ip = req.ip || 'unknown';
    const entry = failures.get(ip);
    const fresh = entry && Date.now() - entry.first < 15 * 60 * 1000;
    if (fresh && entry.count >= 8) return res.status(429).json({ error: 'Too many tries. Wait 15 minutes.' });
    if (!secretOk(req.body?.key)) {
      const e = fresh ? entry : { count: 0, first: Date.now() };
      e.count += 1;
      failures.set(ip, e);
      return res.status(401).json({ error: 'That key or password is wrong.' });
    }
    failures.delete(ip);
    setCookie(req, res, makeToken(), SESSION_DAYS * 86400);
    res.json({ ok: true });
  });

  router.post('/logout', (req, res) => {
    setCookie(req, res, '', 0);
    res.json({ ok: true });
  });

  router.get('/session', (req, res) => res.json({ ok: tokenOk(cookieOf(req)), canPassword: Boolean(PASSWORD_HASH) }));

  // Everything below needs a session. Changes also need the X-CMS header, which a
  // form or link on another site can't send, so they can't be triggered from elsewhere.
  router.use((req, res, next) => {
    if (!tokenOk(cookieOf(req))) return res.status(401).json({ error: 'Log in again.' });
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.get('x-cms') !== '1') return res.status(403).json({ error: 'Missing X-CMS header.' });
    next();
  });

  // ----- unpublished changes (on the volume) -----

  let queue = Promise.resolve();
  /** Runs fn after every earlier change finished, so pending.json is never written twice at once. */
  const serial = (fn) => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };

  const emptyPending = () => ({ changes: {}, media: { videos: {}, images: {}, files: {}, youtube: {} }, staged: {}, notes: [] });
  async function loadPending() {
    try {
      return { ...emptyPending(), ...JSON.parse(await fsp.readFile(PENDING, 'utf8')) };
    } catch {
      return emptyPending();
    }
  }
  async function savePending(p) {
    const tmp = `${PENDING}.${crypto.randomBytes(4).toString('hex')}`;
    await fsp.writeFile(tmp, JSON.stringify(p, null, 1));
    await fsp.rename(tmp, PENDING);
  }
  const note = (p, text) => {
    if (text && !p.notes.includes(text)) p.notes.push(text);
  };
  async function stash(p, file, buf, type, base) {
    const prev = p.changes[file];
    const name = `${crypto.randomBytes(8).toString('hex')}`;
    await fsp.writeFile(path.join(STORE, name), buf);
    if (prev?.file) await fsp.rm(path.join(STORE, prev.file), { force: true });
    // Keep the version the edit started from, for the "changed elsewhere" check.
    p.changes[file] = { type, file: name, base: prev ? prev.base : base ?? null };
  }
  async function unstash(p, file) {
    const prev = p.changes[file];
    if (prev?.file) await fsp.rm(path.join(STORE, prev.file), { force: true });
    delete p.changes[file];
  }
  const pendingCount = (p) => Object.keys(p.changes).length + Object.values(p.media).reduce((n, s) => n + Object.keys(s).length, 0);

  /** The repo as it will be after publishing: the branch's latest commit plus the unpublished changes. */
  async function view(p) {
    if (!backend) throw new HttpError(503, 'The CMS is not connected to GitHub yet: set CMS_GITHUB_TOKEN on the server.');
    const head = await backend.head();
    const files = await backend.files(head);
    const read = async (file) => {
      const c = p.changes[file];
      if (c) return c.type === 'delete' ? null : fsp.readFile(path.join(STORE, c.file));
      return backend.read(head, file);
    };
    const has = (file) => (p.changes[file] ? p.changes[file].type !== 'delete' : files.has(file));
    return { head, files, read, has };
  }

  const json = async (v, file) => {
    const buf = await v.read(file);
    if (!buf) throw new HttpError(500, `${file} is missing from the repo.`);
    return JSON.parse(buf.toString('utf8'));
  };

  function applyMedia(media, ops) {
    const out = { videos: {}, images: {}, files: {}, youtube: {}, ...media };
    for (const [section, entries] of Object.entries(ops)) {
      out[section] = { ...(out[section] ?? {}) };
      for (const [k, val] of Object.entries(entries)) {
        if (val === null) delete out[section][k];
        else out[section][k] = val;
      }
    }
    for (const s of Object.keys(out)) out[s] = Object.fromEntries(Object.entries(out[s]).sort(([a], [b]) => a.localeCompare(b)));
    return out;
  }

  async function postFiles(v) {
    const names = new Set();
    for (const f of v.files.keys()) if (f.startsWith(POSTS_DIR) && f.endsWith('.md') && !f.slice(POSTS_DIR.length).includes('/')) names.add(f);
    return names;
  }

  // ----- reading -----

  router.get('/state', async (req, res) => {
    const p = await loadPending();
    const v = await view(p);
    const docs = {};
    for (const [key, file] of Object.entries(DOCS)) docs[key] = { data: await json(v, file), base: p.changes[file]?.base ?? v.files.get(file) ?? null };
    const media = applyMedia(await json(v, MEDIA_JSON), p.media);

    const names = await postFiles(v);
    for (const [f, c] of Object.entries(p.changes)) {
      if (!f.startsWith(POSTS_DIR) || !f.endsWith('.md')) continue;
      if (c.type === 'delete') names.delete(f);
      else names.add(f);
    }
    const posts = [];
    for (const f of [...names].sort()) {
      const buf = await v.read(f);
      if (!buf) continue;
      const file = f.slice(POSTS_DIR.length);
      const base = p.changes[f]?.base ?? v.files.get(f) ?? null;
      try {
        const post = parsePost(buf.toString('utf8'), file);
        posts.push({ slug: post.slug, post, base, pending: Boolean(p.changes[f]) });
      } catch (err) {
        posts.push({ slug: file.replace(/\.md$/, ''), error: err.message, raw: buf.toString('utf8'), base, pending: Boolean(p.changes[f]) });
      }
    }
    // Pictures uploaded for posts, so the editor can list them.
    const postImages = {};
    const addImg = (f) => {
      const m = /^public\/posts\/([^/]+)\/([^/]+)$/.exec(f);
      if (m) (postImages[m[1]] ??= new Set()).add(m[2]);
    };
    for (const f of v.files.keys()) addImg(f);
    for (const [f, c] of Object.entries(p.changes)) if (c.type !== 'delete') addImg(f);

    let last = null;
    try {
      last = JSON.parse(await fsp.readFile(LAST, 'utf8'));
    } catch {}

    res.json({
      mode,
      repo: mode === 'github' ? REPO : null,
      branch: mode === 'github' ? BRANCH : null,
      head: v.head,
      docs,
      media,
      posts,
      postImages: Object.fromEntries(Object.entries(postImages).map(([k, s]) => [k, [...s].sort()])),
      pending: {
        count: pendingCount(p),
        notes: p.notes,
        files: Object.entries(p.changes).filter(([, c]) => c.type === 'binary').map(([f]) => f),
        staged: Object.keys(p.staged),
      },
      last,
    });
  });

  /** A file that isn't live yet (a new poster, photo or video), for previews in the editor. */
  router.get('/file', async (req, res) => {
    const file = String(req.query.path || '');
    const p = await loadPending();
    const c = p.changes[file];
    if (c && c.type !== 'delete') return res.type(path.extname(file) || 'application/octet-stream').sendFile(path.join(STORE, c.file));
    const staged = p.staged[file];
    if (staged) return res.type(path.extname(file)).sendFile(path.join(STAGED, staged));
    res.status(404).json({ error: 'Not an unpublished file.' });
  });

  // ----- saving -----

  router.put('/doc', express.json({ limit: '4mb' }), async (req, res) => {
    const { doc, data, base, note: text } = req.body ?? {};
    const file = DOCS[doc];
    if (!file) throw bad('Unknown document.');
    check(SPECS[file], data, DOC_LABEL[file].replace(/^./, (c) => c.toUpperCase()));
    const buf = Buffer.from(`${JSON.stringify(data, null, 2)}\n`);
    await serial(async () => {
      const p = await loadPending();
      const v = await view(p);
      const original = p.changes[file] ? null : await v.read(file);
      if (original && original.equals(buf)) return; // nothing changed
      const atHead = await backend.read(v.head, file);
      if (atHead && atHead.equals(buf)) await unstash(p, file);
      else await stash(p, file, buf, 'text', base);
      note(p, text);
      await savePending(p);
    });
    res.json({ ok: true });
  });

  router.put('/post', express.json({ limit: '4mb' }), async (req, res) => {
    const { slug, fields, base, isNew } = req.body ?? {};
    if (!SLUG.test(String(slug || ''))) throw bad('The link can only use lowercase letters, numbers and dashes.');
    const file = `${POSTS_DIR}${slug}.md`;
    let text;
    try {
      text = serializePost(fields ?? {});
      parsePost(text, `${slug}.md`);
    } catch (err) {
      throw bad(err instanceof PostError ? err.reason : err.message);
    }
    await serial(async () => {
      const p = await loadPending();
      const v = await view(p);
      if (isNew && v.has(file)) throw new HttpError(409, `There's already a post at /writing/${slug}. Pick another link.`);
      await stash(p, file, Buffer.from(text), 'text', base);
      note(p, `${isNew ? 'New' : 'Edit'} post “${fields.title}”`);
      await savePending(p);
    });
    res.json({ ok: true });
  });

  router.delete('/post/:slug', express.json({ limit: '4kb' }), async (req, res) => {
    const slug = req.params.slug;
    if (!SLUG.test(slug)) throw bad('Bad link.');
    const file = `${POSTS_DIR}${slug}.md`;
    await serial(async () => {
      const p = await loadPending();
      const v = await view(p);
      const prefix = `public/posts/${slug}/`;
      for (const f of Object.keys(p.changes)) if (f.startsWith(prefix)) await unstash(p, f);
      if (v.files.has(file)) {
        await unstash(p, file);
        p.changes[file] = { type: 'delete', base: req.body?.base ?? v.files.get(file) };
        for (const f of v.files.keys()) if (f.startsWith(prefix)) p.changes[f] = { type: 'delete', base: null };
        note(p, `Delete post /writing/${slug}`);
      } else {
        await unstash(p, file);
      }
      await savePending(p);
    });
    res.json({ ok: true });
  });

  router.post('/discard', express.json({ limit: '64kb' }), async (req, res) => {
    await serial(async () => {
      const p = await loadPending();
      for (const f of Object.keys(p.changes)) await unstash(p, f);
      for (const f of Object.values(p.staged)) await fsp.rm(path.join(STAGED, f), { force: true });
      await savePending(emptyPending());
    });
    res.json({ ok: true });
  });

  // ----- uploads: sent in 8 MB pieces (a proxy timeout can't cut off a big video), then encoded -----

  const uploads = new Map();
  const jobs = new Map();
  let jobChain = Promise.resolve();

  router.post('/upload', express.json({ limit: '16kb' }), async (req, res) => {
    const { purpose, filename, size, id: wanted, slug, short } = req.body ?? {};
    if (!LIMITS[purpose]) throw bad('Unknown upload type.');
    if (!Number.isInteger(size) || size <= 0) throw bad('Empty file.');
    if (size > LIMITS[purpose] * 1024 * 1024) throw bad(`That file is too big (the limit is ${LIMITS[purpose]} MB).`);
    if (['video', 'image', 'file'].includes(purpose) && !ID.test(String(wanted || ''))) throw bad('Bad media id.');
    if (purpose === 'post-image' && !SLUG.test(String(slug || ''))) throw bad('Save the post with a link first.');
    const ext = path.extname(String(filename || '')).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 6);
    const uid = crypto.randomBytes(9).toString('hex');
    const file = path.join(INCOMING, `${uid}${ext}`);
    await fsp.writeFile(file, '');
    uploads.set(uid, { purpose, filename: String(filename || 'file'), size, file, id: wanted, slug, short: Boolean(short), at: Date.now() });
    res.json({ upload: uid, chunk: CHUNK });
  });

  router.put('/upload/:uid', async (req, res) => {
    const u = uploads.get(req.params.uid);
    if (!u) throw new HttpError(404, 'This upload expired. Start it again.');
    const offset = Number(req.query.offset);
    const length = Number(req.get('content-length') || 0);
    const { size } = await fsp.stat(u.file);
    if (!Number.isInteger(offset) || offset < 0 || offset > size) throw new HttpError(409, 'Upload out of order.', { have: size });
    if (!length || length > CHUNK + 1024 || offset + length > u.size) throw bad('Bad piece size.');
    if (offset < size) await fsp.truncate(u.file, offset); // a retried piece
    await pipeline(req, fs.createWriteStream(u.file, { flags: 'a' }));
    const after = (await fsp.stat(u.file)).size;
    if (after !== offset + length) {
      await fsp.truncate(u.file, offset);
      throw new HttpError(409, 'A piece arrived incomplete. Retrying.', { have: offset });
    }
    u.at = Date.now();
    res.json({ have: after });
  });

  router.post('/upload/:uid/finish', async (req, res) => {
    const u = uploads.get(req.params.uid);
    if (!u) throw new HttpError(404, 'This upload expired. Start it again.');
    const { size } = await fsp.stat(u.file);
    if (size !== u.size) throw bad(`Only ${size} of ${u.size} bytes arrived.`);
    uploads.delete(req.params.uid);
    res.json({ job: enqueue(u) });
  });

  router.post('/youtube', express.json({ limit: '4kb' }), (req, res) => {
    const yt = String(req.body?.youtubeId || '');
    if (!/^[\w-]{11}$/.test(yt)) throw bad("That isn't a YouTube video id.");
    res.json({ job: enqueue({ purpose: 'youtube', id: yt, short: Boolean(req.body?.short) }) });
  });

  router.get('/job/:id', (req, res) => {
    const j = jobs.get(req.params.id);
    if (!j) throw new HttpError(404, 'Unknown job (the server may have restarted). Upload again.');
    res.json(j);
  });

  function enqueue(u) {
    const jid = crypto.randomBytes(8).toString('hex');
    const job = { id: jid, status: 'queued', progress: 0, message: 'Waiting…', result: null, error: null };
    jobs.set(jid, job);
    jobChain = jobChain.then(() => runJob(job, u)).catch(() => {});
    return jid;
  }

  async function runJob(job, u) {
    job.status = 'working';
    try {
      job.result = await work(job, u);
      job.status = 'done';
      job.progress = 1;
      job.message = 'Done';
    } catch (err) {
      job.status = 'error';
      job.error = err.message || String(err);
    } finally {
      if (u.file) await fsp.rm(u.file, { force: true });
      // Forget finished jobs after an hour.
      setTimeout(() => jobs.delete(job.id), 3600_000).unref();
    }
  }

  async function work(job, u) {
    const tmpDir = TMP;
    if (u.purpose === 'video') {
      job.message = 'Encoding the video…';
      const tag = crypto.randomBytes(4).toString('hex');
      const out = { full: path.join(STAGED, `${u.id}.${tag}.v.mp4`), preview: path.join(STAGED, `${u.id}.${tag}.p.mp4`), poster: path.join(TMP, `${u.id}.${tag}.webp`) };
      const entry = await encodeVideo(u.file, { ...out, tmpDir, preset: X264_PRESET, onProgress: (x) => (job.progress = Math.round(x * 90) / 100) });
      job.message = 'Saving…';
      await serial(async () => {
        const p = await loadPending();
        for (const [key, f] of [[`media/v/${u.id}.mp4`, out.full], [`media/p/${u.id}.mp4`, out.preview]]) {
          if (p.staged[key]) await fsp.rm(path.join(STAGED, p.staged[key]), { force: true });
          p.staged[key] = path.basename(f);
        }
        await stash(p, `public/img/poster/${u.id}.webp`, await fsp.readFile(out.poster), 'binary', null);
        await fsp.rm(out.poster, { force: true });
        p.media.videos[u.id] = entry;
        note(p, `Video for “${u.id}”`);
        await savePending(p);
      });
      return { id: u.id, entry, poster: `public/img/poster/${u.id}.webp`, video: `media/v/${u.id}.mp4` };
    }
    if (u.purpose === 'image') {
      job.message = 'Making web versions…';
      const big = path.join(TMP, `${u.id}-1280.webp`);
      const small = path.join(TMP, `${u.id}-640.webp`);
      const entry = await encodeImage(u.file, { big, small, tmpDir });
      await serial(async () => {
        const p = await loadPending();
        await stash(p, `public/img/photo/${u.id}-1280.webp`, await fsp.readFile(big), 'binary', null);
        await stash(p, `public/img/photo/${u.id}-640.webp`, await fsp.readFile(small), 'binary', null);
        p.media.images[u.id] = entry;
        note(p, `Photo “${u.id}”`);
        await savePending(p);
      });
      await Promise.all([fsp.rm(big, { force: true }), fsp.rm(small, { force: true })]);
      return { id: u.id, entry, photo: `public/img/photo/${u.id}-1280.webp`, thumb: `public/img/photo/${u.id}-640.webp` };
    }
    if (u.purpose === 'post-image') {
      job.message = 'Making a web version…';
      const base = path.basename(u.filename, path.extname(u.filename));
      const gif = path.extname(u.filename).toLowerCase() === '.gif';
      const name = `${(base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image').slice(0, 60)}${gif ? '.gif' : '.webp'}`;
      const out = path.join(TMP, `${crypto.randomBytes(4).toString('hex')}-${name}`);
      await encodePostImage(u.file, out, { tmpDir });
      const repoPath = `public/posts/${u.slug}/${name}`;
      await serial(async () => {
        const p = await loadPending();
        await stash(p, repoPath, await fsp.readFile(out), 'binary', null);
        note(p, `Picture ${name} for /writing/${u.slug}`);
        await savePending(p);
      });
      await fsp.rm(out, { force: true });
      return { name, path: repoPath };
    }
    if (u.purpose === 'resume' || u.purpose === 'file') {
      const head = Buffer.alloc(5);
      const fd = await fsp.open(u.file, 'r');
      await fd.read(head, 0, 5, 0);
      await fd.close();
      if (head.toString('latin1') !== '%PDF-') throw new Error("That isn't a PDF.");
      if (u.purpose === 'resume') {
        await serial(async () => {
          const p = await loadPending();
          await stash(p, 'public/resume.pdf', await fsp.readFile(u.file), 'binary', null);
          note(p, 'New resume');
          await savePending(p);
        });
        return { path: 'public/resume.pdf' };
      }
      const staged = `${u.id}.${crypto.randomBytes(4).toString('hex')}.pdf`;
      await fsp.copyFile(u.file, path.join(STAGED, staged));
      const entry = { ext: '.pdf', bytes: u.size, v: await fileHash(u.file) };
      await serial(async () => {
        const p = await loadPending();
        const key = `media/files/${u.id}.pdf`;
        if (p.staged[key]) await fsp.rm(path.join(STAGED, p.staged[key]), { force: true });
        p.staged[key] = staged;
        p.media.files[u.id] = entry;
        note(p, `Document “${u.id}”`);
        await savePending(p);
      });
      return { id: u.id, entry };
    }
    if (u.purpose === 'youtube') {
      job.message = 'Fetching the thumbnail…';
      const out = path.join(TMP, `yt-${u.id}.webp`);
      const entry = await youtubeThumb(u.id, u.short, out, { tmpDir });
      if (!entry) return { id: u.id, entry: null }; // the site falls back to YouTube's own thumbnail
      await serial(async () => {
        const p = await loadPending();
        await stash(p, `public/img/yt/${u.id}.webp`, await fsp.readFile(out), 'binary', null);
        p.media.youtube[u.id] = entry;
        await savePending(p);
      });
      await fsp.rm(out, { force: true });
      return { id: u.id, entry, thumb: `public/img/yt/${u.id}.webp` };
    }
    throw new Error('Unknown upload type.');
  }

  // Uploads nobody finished within a day are dropped.
  setInterval(() => {
    for (const [uid, u] of uploads) {
      if (Date.now() - u.at < 864e5) continue;
      uploads.delete(uid);
      fs.rmSync(u.file, { force: true });
    }
  }, 3600_000).unref();

  // ----- publishing -----

  /** Things that would break the build or a page, found before anything is committed. */
  async function preflight(p, v, media) {
    const errors = [];
    const works = await json(v, DOCS.works);
    const cases = await json(v, DOCS.cases);
    const workIdSet = new Set(works.map((w) => w.id));
    for (const w of works) {
      if (w.kind === 'video' && !media.videos[w.id]) errors.push(`Work “${w.title}” is a video but has no video uploaded.`);
      if (w.kind === 'image' && !media.images[w.id]) errors.push(`Work “${w.title}” is a photo but has no photo uploaded.`);
      if (w.kind === 'youtube' && !w.youtubeId) errors.push(`Work “${w.title}” is a YouTube video but has no YouTube link.`);
      if (w.caseSlug && !cases.some((c) => c.slug === w.caseSlug)) errors.push(`Work “${w.title}” points at a case study that doesn't exist (${w.caseSlug}).`);
    }
    for (const [file, c] of Object.entries(p.changes)) {
      if (!(file.startsWith(POSTS_DIR) && file.endsWith('.md')) || c.type === 'delete') continue;
      const name = file.slice(POSTS_DIR.length);
      let post;
      try {
        post = parsePost((await v.read(file)).toString('utf8'), name);
      } catch (err) {
        errors.push(err.message);
        continue;
      }
      for (const img of localImages(post)) if (!v.has(img.path)) errors.push(`Post “${post.title}” uses the picture “${img.src}”, which hasn't been uploaded.`);
      for (const wid of workIds(post)) if (!workIdSet.has(wid)) errors.push(`Post “${post.title}” shows work “${wid}”, which doesn't exist.`);
      if (post.cover && !/\.[a-z0-9]{2,5}$/i.test(post.cover) && !post.cover.startsWith('/') && !workIdSet.has(post.cover) && !media.images[post.cover]) {
        errors.push(`Post “${post.title}” has the cover “${post.cover}”, which isn't a picture, a work or a photo.`);
      }
    }
    return errors;
  }

  router.post('/publish', express.json({ limit: '16kb' }), async (req, res) => {
    const force = req.body?.force === true;
    const result = await serial(async () => {
      const p = await loadPending();
      if (!pendingCount(p)) throw bad('There is nothing to publish.');
      for (let attempt = 1; ; attempt++) {
        const v = await view(p);
        const conflicts = Object.entries(p.changes)
          .filter(([f, c]) => c.type !== 'binary' && c.base !== undefined && c.base !== null && (v.files.get(f) ?? null) !== c.base)
          .map(([f]) => f);
        if (conflicts.length && !force) throw new HttpError(409, 'Some of what you changed was also changed on GitHub since you started.', { conflicts });

        const media = applyMedia(await json(v, MEDIA_JSON), p.media);
        const errors = await preflight(p, v, media);
        if (errors.length) throw bad('Fix these first:', { errors });

        const publishId = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}-${crypto.randomBytes(3).toString('hex')}`;
        const changes = [];
        for (const [f, c] of Object.entries(p.changes)) changes.push({ path: f, content: c.type === 'delete' ? null : await fsp.readFile(path.join(STORE, c.file)) });
        if (Object.values(p.media).some((s) => Object.keys(s).length)) changes.push({ path: MEDIA_JSON, content: Buffer.from(`${JSON.stringify(media, null, 2)}\n`) });
        changes.push({ path: VERSION_FILE, content: Buffer.from(`${publishId}\n`) });

        const summary = p.notes.length ? p.notes.slice(0, 3).join(', ') + (p.notes.length > 3 ? ` and ${p.notes.length - 3} more` : '') : 'content update';
        const message = `cms: ${summary}\n\n${p.notes.map((n) => `- ${n}`).join('\n')}\n\nPublished from heyishant.com/admin (${publishId}).`;

        let commit;
        try {
          commit = await backend.commit(v.head, changes, message);
        } catch (err) {
          // Someone pushed in between: start again on top of their commit.
          if (err.extra?.github === 422 && attempt < 3) continue;
          throw err;
        }
        // Videos go onto the volume now. The rebuild that points pages at them takes
        // minutes, so they're always there first, and a failed commit never swaps a live video.
        for (const [key, f] of Object.entries(p.staged)) {
          const target = path.join(MEDIA_DIR, key.replace(/^media\//, ''));
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await fsp.rename(path.join(STAGED, f), target).catch(async () => {
            await fsp.copyFile(path.join(STAGED, f), target);
            await fsp.rm(path.join(STAGED, f), { force: true });
          });
        }
        for (const c of Object.values(p.changes)) if (c.file) await fsp.rm(path.join(STORE, c.file), { force: true });
        await savePending(emptyPending());
        const last = { id: publishId, sha: commit.sha, url: commit.url, at: new Date().toISOString(), notes: p.notes, mode };
        await fsp.writeFile(LAST, JSON.stringify(last, null, 2));
        return last;
      }
    });
    res.json(result);
  });

  router.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error('cms:', err);
    res.status(status).json({ error: err.message || 'Something went wrong.', ...(err.extra ?? {}) });
  });

  console.log(`CMS: ${mode === 'off' ? 'not connected (set CMS_GITHUB_TOKEN to publish)' : mode === 'local' ? `local folder ${LOCAL}` : `${REPO}@${BRANCH}`}`);
  return router;
}
