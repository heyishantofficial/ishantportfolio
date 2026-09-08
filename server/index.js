import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PORT = process.env.PORT || 3000;
// Set ADMIN_PASSWORD in your Dokploy env vars. It is never sent to the browser.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ishucreationz';
// Point DATA_DIR at a mounted volume so settings survive redeploys.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');
const FS_FILE = path.join(DATA_DIR, 'filesystem.json');
const MASTER_FILE = path.join(DATA_DIR, 'master-snapshot.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const SRC_DATA_DIR = path.join(ROOT, 'src', 'data');
const LOCAL_SRC_SNAPSHOT = path.join(SRC_DATA_DIR, 'masterSnapshot.json');
const PUBLIC_SNAPSHOT = path.join(ROOT, 'public', 'master-snapshot.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Wallpapers that every visitor can load. Uploaded wallpapers are deliberately
// excluded: they are blob: URLs local to the admin's own browser, so they
// cannot be served to anyone else.
const VALID_WALLPAPERS = ['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'];
const FALLBACK = { 
  wallpaper: 'video', 
  lockWallpaper: 'custom',
  volume: 20,
  isMuted: false,
  bgVideoSound: true,
  bgVideoVolume: 80,
  socialLinks: {
    youtube: 'https://youtube.com/@heyishant',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com/heyishant',
    twitter: 'https://twitter.com',
    github: 'https://github.com/heyishantofficial'
  },
  dashboardConfig: {
    openLinksInNewTab: true,
    dockMagnification: true,
    soundEffects: true,
    statusMessage: '',
    contactEmail: 'ishant.vibecode@gmail.com'
  },
  folderIcons: {}
};

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[settings] ADMIN_PASSWORD is not set — using the built-in default. Set it in your Dokploy env vars.');
}

// Constant-time compare so the password cannot be guessed by timing the response.
function passwordMatches(candidate, actual) {
  if (typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function readState() {
  try {
    const parsed = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
    return {
      wallpaper: VALID_WALLPAPERS.includes(parsed.wallpaper) ? parsed.wallpaper : FALLBACK.wallpaper,
      lockWallpaper: VALID_WALLPAPERS.includes(parsed.lockWallpaper) ? parsed.lockWallpaper : FALLBACK.lockWallpaper,
      volume: typeof parsed.volume === 'number' && !isNaN(parsed.volume) ? Math.max(0, Math.min(100, parsed.volume)) : FALLBACK.volume,
      isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : FALLBACK.isMuted,
      bgVideoSound: typeof parsed.bgVideoSound === 'boolean' ? parsed.bgVideoSound : FALLBACK.bgVideoSound,
      bgVideoVolume: typeof parsed.bgVideoVolume === 'number' && !isNaN(parsed.bgVideoVolume) ? Math.max(0, Math.min(100, parsed.bgVideoVolume)) : FALLBACK.bgVideoVolume,
      socialLinks: { ...FALLBACK.socialLinks, ...(parsed.socialLinks || {}) },
      dashboardConfig: { ...FALLBACK.dashboardConfig, ...(parsed.dashboardConfig || {}) },
      folderIcons: parsed.folderIcons && typeof parsed.folderIcons === 'object' ? parsed.folderIcons : (FALLBACK.folderIcons || {}),
      updatedAt: parsed.updatedAt || null,
      // A password set through the UI overrides the env var.
      password: typeof parsed.password === 'string' && parsed.password ? parsed.password : null
    };
  } catch {
    return { ...FALLBACK, updatedAt: null, password: null };
  }
}

async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmp, SETTINGS_FILE);
}

async function currentPassword() {
  const state = await readState();
  return state.password || ADMIN_PASSWORD;
}

async function requireAdmin(req, res) {
  const supplied = (req.body || {}).password;
  if (!passwordMatches(supplied, await currentPassword())) {
    res.status(401).json({ error: '⚠️ Incorrect password. Access denied.' });
    return false;
  }
  return true;
}

async function readMasterSnapshot() {
  // 1. Try primary storage master snapshot file
  try {
    const raw = await fs.readFile(MASTER_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.filesystem || parsed.settings)) {
      return parsed;
    }
  } catch {}

  // 2. Try committed local source snapshot in src/data/masterSnapshot.json
  try {
    const raw = await fs.readFile(LOCAL_SRC_SNAPSHOT, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.filesystem || parsed.settings)) {
      return parsed;
    }
  } catch {}

  // 3. Try public master-snapshot.json
  try {
    const raw = await fs.readFile(PUBLIC_SNAPSHOT, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.filesystem || parsed.settings)) {
      return parsed;
    }
  } catch {}

  // 4. Fallback: synthesize from individual filesystem and settings files
  const [fsState, settingsState] = await Promise.all([
    readFilesystemState(true),
    readState()
  ]);

  const sanitizedSettings = { ...settingsState };
  delete sanitizedSettings.password;

  return {
    version: 1,
    masterVersionId: 'default_initial',
    updatedAt: fsState.updatedAt || sanitizedSettings.updatedAt || null,
    filesystem: fsState,
    settings: sanitizedSettings,
    meta: {
      isInitialDefault: true
    }
  };
}

async function writeMasterSnapshot(snapshot) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });

  // 1. Write atomic master snapshot to persistent DATA_DIR
  const tmp = `${MASTER_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf8');
  await fs.rename(tmp, MASTER_FILE);

  // 2. Also write filesystem state and settings state for individual route compatibility
  if (snapshot.filesystem) {
    await writeFilesystemState(snapshot.filesystem);
  }
  if (snapshot.settings) {
    const currentState = await readState();
    await writeState({ ...currentState, ...snapshot.settings, updatedAt: snapshot.updatedAt });
  }

  // 3. Save historical rollback point
  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(SNAPSHOTS_DIR, `snapshot_${timestampStr}.json`);
    await fs.writeFile(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  } catch (err) {
    console.warn('[master-sync] could not write backup snapshot:', err.message);
  }

  // 4. Also mirror to src/data/masterSnapshot.json and public/master-snapshot.json if directories exist
  try {
    const srcExists = await fs.stat(SRC_DATA_DIR).then(() => true).catch(() => false);
    if (srcExists) {
      await fs.writeFile(LOCAL_SRC_SNAPSHOT, JSON.stringify(snapshot, null, 2), 'utf8');
    }
    const publicDir = path.join(ROOT, 'public');
    const publicExists = await fs.stat(publicDir).then(() => true).catch(() => false);
    if (publicExists) {
      await fs.writeFile(PUBLIC_SNAPSHOT, JSON.stringify(snapshot, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[master-sync] could not mirror to repo files:', err.message);
  }
}

async function readFilesystemState(skipMasterLookup = false) {
  try {
    const parsed = JSON.parse(await fs.readFile(FS_FILE, 'utf8'));
    return {
      customNodes: Array.isArray(parsed.customNodes) ? parsed.customNodes : [],
      renames: parsed.renames && typeof parsed.renames === 'object' ? parsed.renames : {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      edits: parsed.edits && typeof parsed.edits === 'object' ? parsed.edits : {},
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    if (!skipMasterLookup) {
      try {
        const raw = await fs.readFile(MASTER_FILE, 'utf8')
          .catch(() => fs.readFile(LOCAL_SRC_SNAPSHOT, 'utf8'))
          .catch(() => fs.readFile(PUBLIC_SNAPSHOT, 'utf8'));
        const parsed = JSON.parse(raw);
        if (parsed && parsed.filesystem) {
          return {
            customNodes: Array.isArray(parsed.filesystem.customNodes) ? parsed.filesystem.customNodes : [],
            renames: parsed.filesystem.renames && typeof parsed.filesystem.renames === 'object' ? parsed.filesystem.renames : {},
            deleted: Array.isArray(parsed.filesystem.deleted) ? parsed.filesystem.deleted : [],
            edits: parsed.filesystem.edits && typeof parsed.filesystem.edits === 'object' ? parsed.filesystem.edits : {},
            updatedAt: parsed.filesystem.updatedAt || parsed.updatedAt || null
          };
        }
      } catch {}
    }

    return {
      customNodes: [],
      renames: {},
      deleted: [],
      edits: {},
      updatedAt: null
    };
  }
}

async function writeFilesystemState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmp, FS_FILE);
}

const app = express();

// Defensive HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '50mb' }));

// Serve static uploads with nosniff and restrictive CSP to prevent script execution (Stored XSS mitigation)
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'");
  }
}));

// In-memory sliding-window rate limiter (zero dependencies)
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) hits.delete(key);
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
      return next();
    }
    if (record.count >= max) {
      const retrySecs = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retrySecs));
      return res.status(429).json({ error: message || 'Too many requests. Please try again later.' });
    }
    record.count++;
    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please wait 15 minutes and try again.'
});

const passwordChangeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password change attempts. Please wait 15 minutes.'
});

const scrapeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many YouTube statistics requests. Please try again in a moment.'
});

// Health check endpoint for control panel connectivity diagnosis
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    server: 'Express Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    server: 'Express Backend',
    storageFile: SETTINGS_FILE,
    timestamp: new Date().toISOString()
  });
});

// YouTube Channel Metadata In-Memory Cache (15 min TTL)
const ytCache = new Map();
const YT_CACHE_TTL = 15 * 60 * 1000;

// Strict domain validation to prevent Server-Side Request Forgery (SSRF)
const ALLOWED_YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be'
]);

function isValidYouTubeHost(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_YOUTUBE_HOSTS.has(host) || host.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

async function scrapeYouTubeChannel(input) {
  if (!input || typeof input !== 'string') return null;
  let target = input.trim();
  if (!target) return null;

  // Clean and normalize target URL
  let fetchUrl = '';
  if (target.startsWith('@')) {
    const cleanHandle = target.replace(/[^a-zA-Z0-9_.-]/g, '');
    fetchUrl = `https://www.youtube.com/@${cleanHandle}`;
  } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
    if (target.includes('youtube.com')) {
      fetchUrl = `https://${target}`;
    } else {
      const cleanHandle = target.replace(/[^a-zA-Z0-9_.-]/g, '');
      fetchUrl = `https://www.youtube.com/@${cleanHandle}`;
    }
  } else {
    fetchUrl = target;
  }

  // SSRF Defense: strictly verify the destination host is an authorized YouTube domain
  if (!isValidYouTubeHost(fetchUrl)) {
    throw new Error('Invalid YouTube target. Only official YouTube URLs or @handles are allowed.');
  }

  // Force HTTPS for all outbound requests
  fetchUrl = fetchUrl.replace(/^http:\/\//i, 'https://');

  // If it's just plain youtube.com without channel or handle, don't scrape
  try {
    const parsed = new URL(fetchUrl);
    if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
      return {
        ok: true,
        isGeneric: true,
        title: 'YouTube Channel',
        handle: '@channel',
        subscribers: 'Active',
        subscriberText: 'Subscribers',
        videos: 'Uploads',
        videoText: 'Videos',
        avatar: null,
        url: fetchUrl
      };
    }
  } catch {
    throw new Error('Failed to parse YouTube URL.');
  }

  // Check cache
  const cached = ytCache.get(fetchUrl);
  if (cached && Date.now() - cached.timestamp < YT_CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(fetchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`YouTube responded with HTTP ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData = ({.*?});<\/script>/s);
  
  let title = 'YouTube Channel';
  let handle = '';
  let subscribers = '';
  let videos = '';
  let avatar = null;
  let description = '';

  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const pageHeader = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
      const metadata = data.metadata?.channelMetadataRenderer;

      title = pageHeader?.title?.dynamicTextViewModel?.text?.content || metadata?.title || title;
      
      const rawAvatar = pageHeader?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url 
        || metadata?.avatar?.thumbnails?.slice(-1)[0]?.url 
        || null;

      if (rawAvatar) {
        // Upgrade resolution if possible
        avatar = rawAvatar.replace(/=s\d+(-c-k-c0x[0-9a-f]+-no-rj)?/i, '=s240-c-k-c0x00ffffff-no-rj');
      }

      const metadataRows = pageHeader?.metadata?.contentMetadataViewModel?.metadataRows || [];
      for (const row of metadataRows) {
        for (const part of (row.metadataParts || [])) {
          const text = part.text?.content || part.accessibilityLabel || '';
          if (text.startsWith('@')) {
            handle = text;
          } else if (/subscriber/i.test(text)) {
            subscribers = text.replace(/subscribers?/i, '').trim();
          } else if (/video/i.test(text)) {
            videos = text.replace(/videos?/i, '').trim();
          }
        }
      }

      if (!handle && metadata?.vanityChannelUrl) {
        const h = metadata.vanityChannelUrl.split('/').pop();
        if (h) handle = h.startsWith('@') ? h : `@${h}`;
      }

      description = metadata?.description || '';
    } catch (parseErr) {
      console.warn('[youtube-scraper] ytInitialData JSON parse error:', parseErr.message);
    }
  }

  // Resilient fallbacks using regex on the raw HTML
  if (!subscribers) {
    const sMatch = html.match(/([0-9.,KMBkmb]+)\s*subscribers/i);
    if (sMatch) subscribers = sMatch[1];
  }
  if (!videos) {
    const vMatch = html.match(/([0-9.,KMBkmb]+)\s*videos/i);
    if (vMatch) videos = vMatch[1];
  }
  if (!title || title === 'YouTube Channel') {
    const ogTitle = html.match(/<meta property="og:title" content="(.*?)">/i);
    if (ogTitle) title = ogTitle[1];
  }
  if (!avatar) {
    const ogImage = html.match(/<meta property="og:image" content="(.*?)">/i);
    if (ogImage) avatar = ogImage[1];
  }

  const result = {
    ok: true,
    title: title || 'YouTube Channel',
    handle: handle || (target.startsWith('@') ? target : '@channel'),
    subscribers: subscribers || 'Active',
    subscriberText: subscribers ? `${subscribers} subscribers` : 'Subscribers',
    videos: videos || 'Uploads',
    videoText: videos ? `${videos} videos` : 'Videos',
    avatar: avatar || null,
    description: description ? description.slice(0, 160) : '',
    url: fetchUrl
  };

  ytCache.set(fetchUrl, { timestamp: Date.now(), data: result });
  return result;
}

// Public endpoint: Fetch live YouTube channel metrics without API key (rate limited)
app.get('/api/youtube-stats', scrapeLimiter, async (req, res) => {
  const target = req.query.url || req.query.handle;
  if (!target) {
    return res.status(400).json({ error: 'Missing url or handle parameter' });
  }

  try {
    const stats = await scrapeYouTubeChannel(target);
    res.set('Cache-Control', 'public, max-age=300'); // 5 min browser cache
    res.json(stats);
  } catch (err) {
    console.error('[youtube-scraper] Failed to scrape:', target, err.message);
    res.status(200).json({
      ok: false,
      error: err.message,
      title: 'Ishant Chauhan',
      handle: target.startsWith('@') ? target : '@heyishant',
      subscribers: 'Active',
      videos: 'Uploads',
      avatar: null,
      fallback: true
    });
  }
});

app.get('/api/version', (_req, res) => {
  res.json({
    version: 'latest-master-sync-v1',
    timestamp: new Date().toISOString()
  });
});

function sanitizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const clone = JSON.parse(JSON.stringify(snapshot));
  if (clone.settings && typeof clone.settings === 'object') {
    delete clone.settings.password;
  }
  return clone;
}

// Public: Get active master website snapshot
app.get('/api/master-sync', async (_req, res) => {
  try {
    const rawMaster = await readMasterSnapshot();
    const master = sanitizeSnapshot(rawMaster);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      ok: true,
      masterSnapshot: master,
      masterVersionId: master?.masterVersionId || null,
      updatedAt: master?.updatedAt || null
    });
  } catch (err) {
    console.error('[master-sync] read error:', err);
    res.status(500).json({ ok: false, error: 'Failed to read master snapshot' });
  }
});

// Download standalone master snapshot JSON
app.get('/api/master-sync/download', async (_req, res) => {
  try {
    const rawMaster = await readMasterSnapshot();
    const master = sanitizeSnapshot(rawMaster);
    const filename = `ishant-portfolio-master-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(master, null, 2));
  } catch (err) {
    res.status(500).send('Error generating snapshot download');
  }
});

// Admin: Publish the complete website state as the authoritative Master Version
app.post('/api/master-sync', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { snapshot } = req.body || {};
  if (!snapshot || typeof snapshot !== 'object') {
    return res.status(400).json({ error: 'Missing master snapshot payload.' });
  }

  const masterVersionId = snapshot.masterVersionId || `master_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const updatedAt = new Date().toISOString();

  const validatedMaster = {
    version: 1,
    masterVersionId,
    updatedAt,
    filesystem: {
      customNodes: Array.isArray(snapshot.filesystem?.customNodes) ? snapshot.filesystem.customNodes : [],
      renames: snapshot.filesystem?.renames && typeof snapshot.filesystem.renames === 'object' ? snapshot.filesystem.renames : {},
      deleted: Array.isArray(snapshot.filesystem?.deleted) ? snapshot.filesystem.deleted : [],
      edits: snapshot.filesystem?.edits && typeof snapshot.filesystem.edits === 'object' ? snapshot.filesystem.edits : {},
      updatedAt
    },
    settings: {
      wallpaper: VALID_WALLPAPERS.includes(snapshot.settings?.wallpaper) ? snapshot.settings.wallpaper : FALLBACK.wallpaper,
      lockWallpaper: VALID_WALLPAPERS.includes(snapshot.settings?.lockWallpaper) ? snapshot.settings.lockWallpaper : FALLBACK.lockWallpaper,
      volume: typeof snapshot.settings?.volume === 'number' && !isNaN(snapshot.settings.volume) ? Math.max(0, Math.min(100, snapshot.settings.volume)) : FALLBACK.volume,
      isMuted: typeof snapshot.settings?.isMuted === 'boolean' ? snapshot.settings.isMuted : FALLBACK.isMuted,
      bgVideoSound: typeof snapshot.settings?.bgVideoSound === 'boolean' ? snapshot.settings.bgVideoSound : FALLBACK.bgVideoSound,
      bgVideoVolume: typeof snapshot.settings?.bgVideoVolume === 'number' && !isNaN(snapshot.settings.bgVideoVolume) ? Math.max(0, Math.min(100, snapshot.settings.bgVideoVolume)) : FALLBACK.bgVideoVolume,
      socialLinks: { ...FALLBACK.socialLinks, ...(snapshot.settings?.socialLinks || {}) },
      dashboardConfig: { ...FALLBACK.dashboardConfig, ...(snapshot.settings?.dashboardConfig || {}) },
      folderIcons: snapshot.settings?.folderIcons && typeof snapshot.settings.folderIcons === 'object' ? snapshot.settings.folderIcons : (FALLBACK.folderIcons || {}),
      updatedAt
    },
    meta: {
      ...(snapshot.meta || {}),
      syncedAt: updatedAt,
      masterVersionId,
      customNodeCount: (snapshot.filesystem?.customNodes || []).length,
      renameCount: Object.keys(snapshot.filesystem?.renames || {}).length
    }
  };

  try {
    await writeMasterSnapshot(validatedMaster);
    res.json({
      ok: true,
      masterVersionId,
      updatedAt,
      snapshot: validatedMaster,
      message: 'Master snapshot saved successfully. Website is now synchronized globally.'
    });
  } catch (err) {
    console.error('[master-sync] write failed:', err);
    res.status(500).json({ error: 'Could not save master snapshot.' });
  }
});

// Public: Every visitor reads the persisted filesystem on boot.
app.get('/api/filesystem', async (_req, res) => {
  const fsState = await readFilesystemState();
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    ...fsState
  });
});

// Admin: Save or sync folders, notes, renames, and deletions to the persistent server volume.
app.post('/api/filesystem', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { customNodes, renames, deleted, edits } = req.body || {};
  const current = await readFilesystemState();

  const next = {
    customNodes: Array.isArray(customNodes) ? customNodes : current.customNodes,
    renames: renames && typeof renames === 'object' ? renames : current.renames,
    deleted: Array.isArray(deleted) ? deleted : current.deleted,
    edits: edits && typeof edits === 'object' ? edits : current.edits,
    updatedAt: new Date().toISOString()
  };

  try {
    await writeFilesystemState(next);
    res.json({
      ok: true,
      updatedAt: next.updatedAt,
      customCount: next.customNodes.length
    });
  } catch (err) {
    console.error('[filesystem] write failed:', err);
    res.status(500).json({ error: 'Could not save filesystem state to server.' });
  }
});

const ALLOWED_UPLOAD_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico',
  '.mp4', '.webm', '.mov', '.m4v',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
  '.pdf', '.txt', '.md', '.json', '.csv'
]);

// Admin: Upload media/file to static uploads directory
app.post('/api/upload', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { filename, dataBase64, mimeType } = req.body || {};
    if (!filename || !dataBase64) {
      return res.status(400).json({ error: 'Missing filename or data' });
    }

    const ext = (path.extname(filename) || '').toLowerCase();
    if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
      return res.status(400).json({ 
        error: 'File type not permitted for upload. Allowed formats: images, videos, audio, PDF, and text documents.' 
      });
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    const base64Data = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    res.json({
      ok: true,
      url: fileUrl,
      filename: safeName,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream'
    });
  } catch (err) {
    console.error('[upload] failed:', err);
    res.status(500).json({ error: 'Failed to save uploaded file' });
  }
});

// Public: every visitor reads the current global defaults on boot.
// The stored password is never included in the response.
app.get('/api/settings', async (_req, res) => {
  const { wallpaper, lockWallpaper, socialLinks, dashboardConfig, folderIcons, volume, isMuted, bgVideoSound, bgVideoVolume, updatedAt } = await readState();
  res.set('Cache-Control', 'no-store');
  res.json({
    wallpaper,
    lockWallpaper,
    socialLinks,
    dashboardConfig,
    folderIcons: folderIcons || {},
    volume: typeof volume === 'number' ? volume : FALLBACK.volume,
    isMuted: typeof isMuted === 'boolean' ? isMuted : FALLBACK.isMuted,
    bgVideoSound: typeof bgVideoSound === 'boolean' ? bgVideoSound : FALLBACK.bgVideoSound,
    bgVideoVolume: typeof bgVideoVolume === 'number' ? bgVideoVolume : FALLBACK.bgVideoVolume,
    updatedAt,
    serverStatus: 'online'
  });
});

// Admin: unlock the System Settings panel (rate limited)
app.post('/api/settings/verify', authLimiter, async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ ok: true });
});

// Admin: publish settings as the default for every visitor.
app.post('/api/settings', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { wallpaper, lockWallpaper, socialLinks, dashboardConfig, folderIcons, volume, isMuted, bgVideoSound, bgVideoVolume } = req.body || {};
  if (wallpaper && !VALID_WALLPAPERS.includes(wallpaper)) {
    return res.status(400).json({
      error: 'Uploaded wallpapers only exist in your own browser, so they cannot be published to visitors. Pick one of the built-in wallpapers.'
    });
  }
  if (lockWallpaper && !VALID_WALLPAPERS.includes(lockWallpaper)) {
    return res.status(400).json({
      error: 'Uploaded lock wallpapers only exist in your own browser, so they cannot be published to visitors. Pick one of the built-in wallpapers.'
    });
  }

  const state = await readState();
  const next = { 
    ...state, 
    ...(wallpaper ? { wallpaper } : {}), 
    ...(lockWallpaper ? { lockWallpaper } : {}), 
    ...(typeof volume === 'number' && !isNaN(volume) ? { volume: Math.max(0, Math.min(100, volume)) } : {}),
    ...(typeof isMuted === 'boolean' ? { isMuted } : {}),
    ...(typeof bgVideoSound === 'boolean' ? { bgVideoSound } : {}),
    ...(typeof bgVideoVolume === 'number' && !isNaN(bgVideoVolume) ? { bgVideoVolume: Math.max(0, Math.min(100, bgVideoVolume)) } : {}),
    ...(socialLinks ? { socialLinks: { ...state.socialLinks, ...socialLinks } } : {}),
    ...(dashboardConfig ? { dashboardConfig: { ...state.dashboardConfig, ...dashboardConfig } } : {}),
    ...(folderIcons && typeof folderIcons === 'object' ? { folderIcons } : {}),
    updatedAt: new Date().toISOString() 
  };
  try {
    await writeState(next);
    res.json({ 
      wallpaper: next.wallpaper, 
      lockWallpaper: next.lockWallpaper, 
      volume: next.volume,
      isMuted: next.isMuted,
      bgVideoSound: next.bgVideoSound,
      bgVideoVolume: next.bgVideoVolume,
      socialLinks: next.socialLinks,
      dashboardConfig: next.dashboardConfig,
      folderIcons: next.folderIcons,
      updatedAt: next.updatedAt 
    });
  } catch (err) {
    console.error('[settings] write failed:', err);
    res.status(500).json({ error: 'Could not save settings.' });
  }
});

// Admin: update folder icons directly
app.post('/api/settings/folder-icons', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { folderIcons } = req.body || {};
  if (!folderIcons || typeof folderIcons !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid folderIcons object' });
  }

  const state = await readState();
  const next = {
    ...state,
    folderIcons,
    updatedAt: new Date().toISOString()
  };

  try {
    await writeState(next);
    res.json({
      ok: true,
      folderIcons: next.folderIcons,
      updatedAt: next.updatedAt
    });
  } catch (err) {
    console.error('[settings] folder-icons write failed:', err);
    res.status(500).json({ error: 'Could not save folder icons.' });
  }
});

// Admin: change the password. Persists, so it survives a reload and a redeploy (rate limited)
app.post('/api/settings/password', passwordChangeLimiter, async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }

  const state = await readState();
  try {
    await writeState({ ...state, password: newPassword.trim() });
    res.json({ ok: true });
  } catch (err) {
    console.error('[settings] password write failed:', err);
    res.status(500).json({ error: 'Could not save the new password.' });
  }
});

// Static built site + SPA fallback with no-cache for index.html
app.use(express.static(DIST, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
app.get(/.*/, (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio running on port ${PORT} — settings stored at ${SETTINGS_FILE}`);
});
