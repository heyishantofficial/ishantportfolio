// heyishant.com server.
//
// Serves the static site that `next build` writes to out/, and the media that
// lives on the persistent volume (DATA_DIR, /app/data in Dokploy):
//   /media/v/<id>.mp4      full videos        (scripts/encode-media.mjs)
//   /media/p/<id>.mp4      preview loops
//   /media/files/<id>.pdf  documents
//   /uploads/...           files from the old site, kept so old links still work
//
// Media gets onto the volume with `npm run media:push` (scripts/push-media.mjs),
// which uses the PUT /api/media/... below, protected by the media key.

import compression from 'compression';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const OUT = path.join(ROOT, 'out');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const MAX_UPLOAD = 800 * 1024 * 1024;
const MEDIA_DIRS = new Set(['v', 'p', 'files']);
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}\.(mp4|pdf)$/i;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Text gets compressed; video and images are already compressed.
app.use(compression());

app.get(['/health', '/api/health'], async (_req, res) => {
  const count = async (dir) => (await fsp.readdir(path.join(MEDIA_DIR, dir)).catch(() => [])).length;
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, media: { videos: await count('v'), previews: await count('p'), files: await count('files') } });
});

// ---------- media upload (admin only) ----------

// The only way in is the media key that `npm run media:key` keeps on the
// owner's computer. Only its SHA-256 is in the (public) repo, which reveals
// nothing about the key itself. There is deliberately no password option: the
// old site's password is in this public repo's history, and Dokploy still had
// it set as ADMIN_PASSWORD.
const MEDIA_KEY_HASH = (() => {
  try {
    const hex = fs.readFileSync(path.join(ROOT, 'server/media-key.sha256'), 'utf8').trim();
    return /^[a-f0-9]{64}$/.test(hex) ? Buffer.from(hex, 'hex') : null;
  } catch {
    return null;
  }
})();
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

// Compares hashes, so neither the time taken nor a length check leaks anything.
function keyOk(req) {
  const key = req.get('x-media-key');
  return Boolean(key && MEDIA_KEY_HASH && crypto.timingSafeEqual(sha256(key), MEDIA_KEY_HASH));
}

const failures = new Map();
function allowed(req, res) {
  const ip = req.ip || 'unknown';
  const entry = failures.get(ip);
  if (entry && entry.count >= 10 && Date.now() - entry.first < 15 * 60 * 1000) {
    res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    return false;
  }
  if (!MEDIA_KEY_HASH) {
    res.status(503).json({ error: 'Uploads are off: server/media-key.sha256 is missing (npm run media:key).' });
    return false;
  }
  if (!keyOk(req)) {
    const e = entry && Date.now() - entry.first < 15 * 60 * 1000 ? entry : { count: 0, first: Date.now() };
    e.count += 1;
    failures.set(ip, e);
    res.status(401).json({ error: 'Wrong or missing media key.' });
    return false;
  }
  failures.delete(ip);
  return true;
}

app.get('/api/media', async (req, res) => {
  if (!allowed(req, res)) return;
  const list = {};
  for (const dir of MEDIA_DIRS) {
    for (const name of await fsp.readdir(path.join(MEDIA_DIR, dir)).catch(() => [])) {
      const stat = await fsp.stat(path.join(MEDIA_DIR, dir, name)).catch(() => null);
      if (stat?.isFile()) list[`${dir}/${name}`] = stat.size;
    }
  }
  res.set('Cache-Control', 'no-store').json({ files: list });
});

app.put('/api/media/:dir/:name', async (req, res) => {
  if (!allowed(req, res)) return;
  const { dir, name } = req.params;
  if (!MEDIA_DIRS.has(dir) || !SAFE_NAME.test(name)) return res.status(400).json({ error: 'Bad file name.' });
  const length = Number(req.get('content-length') || 0);
  if (!length || length > MAX_UPLOAD) return res.status(413).json({ error: 'Missing or too large Content-Length.' });

  const folder = path.join(MEDIA_DIR, dir);
  await fsp.mkdir(folder, { recursive: true });
  const target = path.join(folder, name);
  const tmp = `${target}.${crypto.randomBytes(4).toString('hex')}.part`;
  try {
    await pipeline(req, fs.createWriteStream(tmp));
    const { size } = await fsp.stat(tmp);
    if (size !== length) throw new Error(`received ${size} of ${length} bytes`);
    await fsp.rename(tmp, target);
    res.json({ ok: true, path: `${dir}/${name}`, bytes: size });
  } catch (err) {
    await fsp.rm(tmp, { force: true });
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// ---------- media + old uploads ----------

app.use(
  '/media',
  express.static(MEDIA_DIR, {
    // URLs carry ?v=<hash>, so a changed file always gets a new URL.
    maxAge: '365d',
    immutable: true,
    index: false,
    setHeaders: (res, file) => {
      if (file.endsWith('.pdf')) res.setHeader('Content-Disposition', 'inline');
    },
  }),
);
app.use('/media', (_req, res) => res.status(404).end());

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', index: false }));
app.use('/uploads', (_req, res) => res.status(404).end());

// ---------- the site ----------

// Each page is out/<route>.html next to an out/<route>/ folder of navigation
// data, so express.static alone would treat /work as the folder and redirect.
// Serve the page for clean URLs, and send /work/ to /work.
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.length > 1 && req.path.endsWith('/')) {
    // Collapsing leading slashes too keeps //other.site/ from becoming an off-site redirect.
    const query = req.originalUrl.slice(req.path.length);
    return res.redirect(301, `/${req.path.replace(/^\/+|\/+$/g, '')}${query}`);
  }
  if (path.extname(req.path)) return next();
  let route;
  try {
    route = decodeURIComponent(req.path);
  } catch {
    return next();
  }
  const file = path.join(OUT, `${route === '/' ? '/index' : route}.html`);
  if (!file.startsWith(OUT + path.sep)) return next();
  const stat = await fsp.stat(file).catch(() => null);
  if (!stat?.isFile()) return next();
  res.sendFile(file, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } });
});

app.use(
  express.static(OUT, {
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, file) => {
      const rel = path.relative(OUT, file);
      if (rel.startsWith(`_next${path.sep}static`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else if (rel.startsWith(`img${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else if (/\.(html|txt)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      else res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }),
);

app.use((_req, res) => {
  res.status(404).sendFile(path.join(OUT, '404.html'), (err) => {
    if (err) res.end('Not found');
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  const videos = (await fsp.readdir(path.join(MEDIA_DIR, 'v')).catch(() => [])).length;
  console.log(`heyishant.com on :${PORT} · site ${fs.existsSync(OUT) ? 'ready' : 'MISSING (run npm run build)'} · ${videos} videos in ${MEDIA_DIR}`);
  console.log(MEDIA_KEY_HASH ? 'Media uploads: on, with the media key.' : 'Media uploads: off (no server/media-key.sha256).');
  if (process.env.ADMIN_PASSWORD) console.log('ADMIN_PASSWORD is set but unused; it can be deleted from the server settings.');
});
