import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
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
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
// Written once per container start. If bootCount stops climbing across
// deploys, DATA_DIR is not on a mounted volume and every redeploy is
// silently destroying the admin's folders, uploads and settings.
const BOOT_MARKER = path.join(DATA_DIR, 'boot-marker.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
// Names typed on the lock screen. Kept apart from analytics.json because
// /api/analytics is public and these are personal.
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const MAX_VISITOR_ENTRIES = 5000;

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
  bgVideoVolume: 5,
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
    contactEmail: 'heyishant@gmail.com'
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
  // Binary uploads carry no JSON body to hold the password, so the header is
  // checked too. Everything else keeps sending it in the body as before.
  const supplied = (req.body || {}).password || req.get('x-admin-password');
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

  // 2. Fallback: synthesize from individual filesystem and settings files.
  //
  // There is deliberately no fallback to a snapshot committed in the repo.
  // Those files are baked into the image at build time, so reading them
  // here meant an empty DATA_DIR resurrected whatever state happened to be
  // committed — the site travelling back in time on every redeploy. An
  // empty DATA_DIR must read as empty, so the loss is visible immediately
  // instead of being masked by a months-old snapshot.
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

  // Nothing is mirrored back into src/ or public/ any more. Those writes
  // landed inside the running container, never reached git, and were thrown
  // away on the next deploy — while making the panel look like it had saved
  // to the repo. DATA_DIR (on its mounted volume) is the only source of truth.
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
        // Only the master snapshot on the persistent volume — never a
        // snapshot baked into the image. See readMasterSnapshot().
        const raw = await fs.readFile(MASTER_FILE, 'utf8');
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

const DEFAULT_ANALYTICS = {
  totalVisits: 0,
  appsLaunched: {},
  projectsViewed: {},
  conversions: {
    resumeViews: 0,
    emailCopies: 0,
    socialClicks: {}
  },
  platforms: {
    macos: 0,
    ios: 0
  },
  recentEvents: [],
  firstTrackedAt: null,
  updatedAt: null
};

async function readAnalyticsState() {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 0,
      appsLaunched: parsed.appsLaunched && typeof parsed.appsLaunched === 'object' ? parsed.appsLaunched : {},
      projectsViewed: parsed.projectsViewed && typeof parsed.projectsViewed === 'object' ? parsed.projectsViewed : {},
      conversions: {
        resumeViews: typeof parsed.conversions?.resumeViews === 'number' ? parsed.conversions.resumeViews : 0,
        emailCopies: typeof parsed.conversions?.emailCopies === 'number' ? parsed.conversions.emailCopies : 0,
        socialClicks: parsed.conversions?.socialClicks && typeof parsed.conversions?.socialClicks === 'object' ? parsed.conversions.socialClicks : {}
      },
      platforms: {
        macos: typeof parsed.platforms?.macos === 'number' ? parsed.platforms.macos : 0,
        ios: typeof parsed.platforms?.ios === 'number' ? parsed.platforms.ios : 0
      },
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : [],
      firstTrackedAt: parsed.firstTrackedAt || null,
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    return { ...DEFAULT_ANALYTICS };
  }
}

let saveAnalyticsTimer = null;
let pendingAnalyticsState = null;

function scheduleAnalyticsSave(state) {
  pendingAnalyticsState = state;
  if (!saveAnalyticsTimer) {
    saveAnalyticsTimer = setTimeout(async () => {
      saveAnalyticsTimer = null;
      if (!pendingAnalyticsState) return;
      const dataToWrite = pendingAnalyticsState;
      pendingAnalyticsState = null;
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const tmp = `${ANALYTICS_FILE}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(dataToWrite, null, 2), 'utf8');
        await fs.rename(tmp, ANALYTICS_FILE);
      } catch (err) {
        console.error('[analytics] write failed:', err.message);
      }
    }, 1500);
  }
}

const app = express();

// Dokploy puts Traefik in front of this server, so the socket address is the
// proxy's, not the visitor's. Trusting that one hop makes req.ip the real
// client address, which every per-IP rate limiter below depends on. Set
// TRUST_PROXY=0 if the server is ever exposed directly with no proxy.
app.set('trust proxy', process.env.TRUST_PROXY === '0' ? false : 1);

// Defensive HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// /api/upload is skipped: its body is the raw file, which the route streams
// straight to disk. Without this a .json or .csv upload would be swallowed
// and parsed here as a request body, and the route would receive nothing.
const jsonBodyParser = express.json({ limit: '50mb' });
// /api/visitors is public and parses its own tiny body after its rate limit,
// so a flood of large bodies is refused before any of it is read.
const RAW_BODY_ROUTES = new Set(['/api/upload', '/api/upload/chunk', '/api/visitors']);
app.use((req, res, next) => (
  RAW_BODY_ROUTES.has(req.path) ? next() : jsonBodyParser(req, res, next)
));

// Serve static uploads with nosniff and restrictive CSP to prevent script execution (Stored XSS mitigation)
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (/\.pdf$/i.test(filePath)) {
      // PDFs are shown inside an <iframe> by the browser's own viewer, which
      // needs to be allowed to embed the document itself. Scripts and remote
      // fetches stay blocked, so the Stored-XSS mitigation is unchanged.
      res.setHeader('Content-Security-Policy', "default-src 'none'; object-src 'self'; frame-ancestors 'self'");
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'");
    }
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
    dataDir: DATA_DIR,
    // bootCount > 1 proves DATA_DIR survived a container rebuild, i.e. the
    // volume is really mounted. If it reads 1 after every deploy, it isn't.
    storagePersistent: bootInfo.bootCount > 1,
    bootCount: bootInfo.bootCount,
    storageFirstSeen: bootInfo.firstBootAt,
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

// Public endpoint: Fetch live YouTube playlist tracks via RSS feed
const playlistFeedCache = new Map();

app.get('/api/youtube-playlist', async (req, res) => {
  const playlistId = req.query.playlistId || req.query.list || 'PLa-RnRky6wsc';
  const noCache = req.query.nocache === '1' || req.query.refresh === '1';

  const cached = playlistFeedCache.get(playlistId);
  const now = Date.now();
  if (!noCache && cached && (now - cached.timestamp < 60000)) {
    res.set('Cache-Control', 'public, max-age=60');
    return res.json(cached.data);
  }

  try {
    const timestamp = Date.now();
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}&_cb=${timestamp}`;
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      if (cached && cached.data) {
        return res.json(cached.data);
      }
      return res.status(response.status).json({ ok: false, error: `YouTube responded with status ${response.status}` });
    }

    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    if (entries.length === 0) {
      return res.json({ ok: true, playlistId, count: 0, tracks: [] });
    }

    const tracks = entries.map(e => {
      const vId = e[1].match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
      const title = e[1].match(/<title>([^<]+)<\/title>/)?.[1] || '';
      const rawAuthor = e[1].match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)?.[1] || '';
      const author = rawAuthor.replace(/ - Topic$/, '').trim();
      return {
        videoId: vId,
        title: title.trim(),
        author: author || 'YouTube Artist',
        artwork: vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : ''
      };
    });

    const result = { ok: true, playlistId, count: tracks.length, tracks };
    playlistFeedCache.set(playlistId, { timestamp: now, data: result });

    res.set('Cache-Control', 'public, max-age=60');
    return res.json(result);
  } catch (err) {
    console.error('[youtube-playlist] Failed to fetch playlist:', playlistId, err.message);
    if (cached && cached.data) {
      return res.json(cached.data);
    }
    return res.status(500).json({ ok: false, error: err.message });
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

// Largest single file accepted by /api/upload. Raised well past the old 50 MB
// JSON ceiling because the bytes now stream straight to disk instead of being
// buffered in memory, so a big video costs the process almost nothing.
const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;

function safeUploadName(filename, ext) {
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}${ext}`;
}

// Admin: Upload media/file to static uploads directory.
//
// The body is the raw file, streamed to disk. It used to arrive as base64
// inside a JSON envelope, which was the reason uploads failed: base64 is ~33%
// larger than the file, and Express had to hold the whole encoded body in
// memory and then parse it into a second copy before a single byte was
// written. An 8 MB video cost roughly 45 MB of RSS, anything over the 50 MB
// JSON limit was rejected outright, and the container was killed under load —
// which is what the browser reported as a 502. Streaming keeps memory flat
// regardless of file size.
app.post('/api/upload', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  // Sent percent-encoded: headers are latin-1 only, and these filenames carry
  // spaces and non-ASCII characters.
  let filename = req.get('x-upload-filename') || '';
  try { filename = decodeURIComponent(filename); } catch { /* use as sent */ }
  const mimeType = req.get('x-upload-mime') || 'application/octet-stream';

  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  const ext = (path.extname(filename) || '').toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
    return res.status(400).json({
      error: 'File type not permitted for upload. Allowed formats: images, videos, audio, PDF, and text documents.'
    });
  }

  const declared = Number(req.get('content-length') || 0);
  if (declared > MAX_UPLOAD_BYTES) {
    return res.status(413).json({
      error: `File is larger than the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB upload limit.`
    });
  }

  let filePath;
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const safeName = safeUploadName(filename, ext);
    filePath = path.join(UPLOADS_DIR, safeName);

    const written = await new Promise((resolve, reject) => {
      const handleStream = async () => {
        const handle = await fs.open(filePath, 'w');
        const out = handle.createWriteStream();
        let bytes = 0;
        let aborted = false;

        const fail = (err) => {
          if (aborted) return;
          aborted = true;
          out.destroy();
          reject(err);
        };

        req.on('data', (chunk) => {
          bytes += chunk.length;
          // Guard against a body that lies about its Content-Length.
          if (bytes > MAX_UPLOAD_BYTES) {
            const err = new Error('Upload exceeds the maximum allowed size.');
            err.status = 413;
            fail(err);
          }
        });
        req.on('aborted', () => fail(new Error('Upload aborted by the client.')));
        out.on('error', fail);
        out.on('finish', () => { if (!aborted) resolve(bytes); });

        req.pipe(out);
      };
      handleStream().catch(reject);
    });

    if (written === 0) {
      await fs.unlink(filePath).catch(() => {});
      return res.status(400).json({ error: 'Upload contained no data.' });
    }

    res.json({
      ok: true,
      url: `/uploads/${path.basename(filePath)}`,
      filename: path.basename(filePath),
      size: written,
      mimeType
    });
  } catch (err) {
    // A partial file on disk is worse than none: it would be served to
    // visitors as a truncated, unplayable video.
    if (filePath) await fs.unlink(filePath).catch(() => {});
    console.error('[upload] failed:', err);
    res.status(err.status || 500).json({ error: err.status === 413 ? err.message : 'Failed to save uploaded file' });
  }
});

// ---------------------------------------------------------------------------
// Chunked uploads
//
// A single request is not allowed to take as long as a whole video needs.
// Measured against production: a request still transmitting at 60 seconds is
// killed by the proxy in front of this app and the browser sees a 502. That
// is a limit on DURATION, not size, so it hit small files on a slow uplink
// just as readily as big ones — which is why uploads looked like they failed
// at random.
//
// So the file is cut into pieces that each finish well inside that window and
// appended back together here. Upload time is now unbounded no matter how
// large the file or how slow the connection, and a piece that fails can be
// retried on its own instead of losing the entire video.
// ---------------------------------------------------------------------------
const PARTS_DIR = path.join(DATA_DIR, 'tmp-uploads');
const PART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function partFileFor(uploadId) {
  // uploadId reaches us from the client, so it must never be able to point
  // anywhere but inside PARTS_DIR.
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(uploadId || '')) return null;
  return path.join(PARTS_DIR, `${uploadId}.part`);
}

// Sweep abandoned parts so a cancelled upload cannot slowly fill the volume.
async function sweepStaleParts() {
  try {
    const entries = await fs.readdir(PARTS_DIR);
    const now = Date.now();
    for (const name of entries) {
      const full = path.join(PARTS_DIR, name);
      try {
        const st = await fs.stat(full);
        if (now - st.mtimeMs > PART_MAX_AGE_MS) await fs.unlink(full);
      } catch {}
    }
  } catch {}
}

// Begin a chunked upload: validates the name up front so a rejected file
// fails before the browser spends minutes sending it.
app.post('/api/upload/init', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { filename } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const ext = (path.extname(filename) || '').toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
    return res.status(400).json({
      error: 'File type not permitted for upload. Allowed formats: images, videos, audio, PDF, and text documents.'
    });
  }

  try {
    await fs.mkdir(PARTS_DIR, { recursive: true });
    sweepStaleParts();

    const uploadId = `${Date.now().toString(36)}${crypto.randomBytes(12).toString('hex')}`;
    await fs.writeFile(partFileFor(uploadId), '');
    res.json({ ok: true, uploadId });
  } catch (err) {
    console.error('[upload/init] failed:', err);
    res.status(500).json({ error: 'Could not start the upload.' });
  }
});

// Append one chunk. The body is raw bytes; the client sends chunks in order
// and waits for each to be acknowledged before sending the next.
app.post('/api/upload/chunk', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const partFile = partFileFor(req.get('x-upload-id'));
  if (!partFile) return res.status(400).json({ error: 'Invalid upload id.' });

  // The client resends a chunk it did not get an answer for, so it tells us
  // where the chunk belongs. If that does not match what is already on disk
  // the resend is a duplicate and appending it would corrupt the file.
  const offset = Number(req.get('x-chunk-offset') || -1);

  try {
    let current;
    try {
      current = (await fs.stat(partFile)).size;
    } catch {
      return res.status(404).json({ error: 'Upload session expired. Start again.' });
    }

    if (offset === current) {
      await new Promise((resolve, reject) => {
        const out = createWriteStream(partFile, { flags: 'a' });
        let failed = false;
        const fail = (err) => { if (!failed) { failed = true; out.destroy(); reject(err); } };
        req.on('aborted', () => fail(new Error('Chunk aborted by the client.')));
        out.on('error', fail);
        out.on('finish', () => { if (!failed) resolve(); });
        req.pipe(out);
      });
      current = (await fs.stat(partFile)).size;
    } else if (offset < current) {
      // Already have this chunk: a retry of one whose reply was lost. Drain
      // the body and report where we actually are.
      req.resume();
    } else {
      return res.status(409).json({ error: 'Chunk out of order.', received: current });
    }

    if (current > MAX_UPLOAD_BYTES) {
      await fs.unlink(partFile).catch(() => {});
      return res.status(413).json({ error: 'File exceeds the upload size limit.' });
    }

    res.json({ ok: true, received: current });
  } catch (err) {
    console.error('[upload/chunk] failed:', err);
    res.status(500).json({ error: 'Could not store that part of the file.' });
  }
});

// Finish: move the assembled file into /uploads under its real name.
app.post('/api/upload/complete', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { uploadId, filename, mimeType, size } = req.body || {};
  const partFile = partFileFor(uploadId);
  if (!partFile) return res.status(400).json({ error: 'Invalid upload id.' });
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const ext = (path.extname(filename) || '').toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
    await fs.unlink(partFile).catch(() => {});
    return res.status(400).json({ error: 'File type not permitted for upload.' });
  }

  try {
    const written = (await fs.stat(partFile)).size;

    // Refuse a short file rather than publishing a truncated video that
    // would look fine in the list and fail to play.
    if (typeof size === 'number' && size > 0 && written !== size) {
      await fs.unlink(partFile).catch(() => {});
      return res.status(400).json({
        error: `Upload incomplete (${written} of ${size} bytes). Please try again.`
      });
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const safeName = safeUploadName(filename, ext);
    await fs.rename(partFile, path.join(UPLOADS_DIR, safeName));

    res.json({
      ok: true,
      url: `/uploads/${safeName}`,
      filename: safeName,
      size: written,
      mimeType: mimeType || 'application/octet-stream'
    });
  } catch (err) {
    await fs.unlink(partFile).catch(() => {});
    console.error('[upload/complete] failed:', err);
    res.status(500).json({ error: 'Could not finish saving the file.' });
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

// Analytics endpoints
const analyticsBeaconLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many analytics events. Throttled.'
});

// Public: Get aggregate metrics for System Settings dashboard
app.get('/api/analytics', async (_req, res) => {
  try {
    const data = await readAnalyticsState();
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, analytics: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Public: Post event beacon
app.post('/api/analytics/event', analyticsBeaconLimiter, async (req, res) => {
  try {
    const { event, name, platform, meta } = req.body || {};
    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'Missing event name' });
    }

    const current = await readAnalyticsState();
    const now = new Date().toISOString();
    if (!current.firstTrackedAt) {
      current.firstTrackedAt = now;
    }
    current.updatedAt = now;

    // Sanitize values
    const safeEvent = event.slice(0, 50);
    const safeName = typeof name === 'string' ? name.slice(0, 80) : 'unknown';
    const safePlatform = platform === 'ios' ? 'ios' : 'macos';

    if (safeEvent === 'pageview' || safeEvent === 'session_start') {
      current.totalVisits = (current.totalVisits || 0) + 1;
      current.platforms[safePlatform] = (current.platforms[safePlatform] || 0) + 1;
    } else if (safeEvent === 'app_launch') {
      current.appsLaunched[safeName] = (current.appsLaunched[safeName] || 0) + 1;
    } else if (safeEvent === 'project_view') {
      current.projectsViewed[safeName] = (current.projectsViewed[safeName] || 0) + 1;
    } else if (safeEvent === 'resume_view') {
      current.conversions.resumeViews = (current.conversions.resumeViews || 0) + 1;
    } else if (safeEvent === 'email_copy') {
      current.conversions.emailCopies = (current.conversions.emailCopies || 0) + 1;
    } else if (safeEvent === 'social_click') {
      current.conversions.socialClicks[safeName] = (current.conversions.socialClicks[safeName] || 0) + 1;
    }

    // Keep the 30 most recent activity logs for live feed
    current.recentEvents.unshift({
      event: safeEvent,
      name: safeName,
      platform: safePlatform,
      time: now,
      meta: meta && typeof meta === 'object' ? meta : {}
    });
    if (current.recentEvents.length > 30) {
      current.recentEvents.length = 30;
    }

    scheduleAnalyticsSave(current);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Visitor names log. Held in memory and flushed to disk at most once every
// couple of seconds, so a flood of logins costs one file write, not thousands.
let visitorsCache = null;
let visitorsSaveTimer = null;
let visitorsWriteChain = Promise.resolve();

async function loadVisitors() {
  if (visitorsCache) return visitorsCache;
  try {
    const parsed = JSON.parse(await fs.readFile(VISITORS_FILE, 'utf8'));
    visitorsCache = Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    visitorsCache = [];
  }
  return visitorsCache;
}

function writeVisitorsNow() {
  const snapshot = JSON.stringify({ entries: visitorsCache }, null, 2);
  visitorsWriteChain = visitorsWriteChain.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${VISITORS_FILE}.tmp`;
      await fs.writeFile(tmp, snapshot, 'utf8');
      await fs.rename(tmp, VISITORS_FILE);
    } catch (err) {
      console.error('[visitors] write failed:', err.message);
    }
  });
  return visitorsWriteChain;
}

function scheduleVisitorsSave() {
  if (visitorsSaveTimer) return;
  visitorsSaveTimer = setTimeout(() => {
    visitorsSaveTimer = null;
    writeVisitorsNow();
  }, 2000);
}

// Layered flood protection for the public login endpoint. A real visitor
// logs in once, so every limit here sits far above normal use:
//   - per IP: 10 requests per 10 minutes (rate limiter below)
//   - per IP: the same name is stored once a day, repeats are ignored
//   - everyone combined: 30 new names a minute and 500 a day
// Past the combined budget, names are dropped but the reply is still
// { ok: true }, so a flooder cannot tell when they have been cut off.
// The daily cap also means a sustained flood cannot push out more than
// 500 of the stored 5000 names per day.
const VISITOR_BUDGET_PER_MINUTE = 30;
const VISITOR_BUDGET_PER_DAY = 500;
const VISITOR_REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_REPEATS = 20000;

const visitorBudget = { minute: 0, minuteResetAt: 0, day: 0, dayResetAt: 0 };
const recentVisitorLogins = new Map(); // `${ip}|${name}` -> expiry time

function takeVisitorBudget() {
  const now = Date.now();
  if (now > visitorBudget.minuteResetAt) {
    visitorBudget.minute = 0;
    visitorBudget.minuteResetAt = now + 60 * 1000;
  }
  if (now > visitorBudget.dayResetAt) {
    visitorBudget.day = 0;
    visitorBudget.dayResetAt = now + 24 * 60 * 60 * 1000;
  }
  if (visitorBudget.minute >= VISITOR_BUDGET_PER_MINUTE || visitorBudget.day >= VISITOR_BUDGET_PER_DAY) {
    return false;
  }
  visitorBudget.minute++;
  visitorBudget.day++;
  return true;
}

function isRepeatVisitorLogin(ip, name) {
  const now = Date.now();
  const key = `${ip}|${name.toLowerCase()}`;
  const expiry = recentVisitorLogins.get(key);
  if (expiry && expiry > now) return true;

  // Keep the map bounded even if a flood comes from many addresses.
  if (recentVisitorLogins.size >= MAX_TRACKED_REPEATS) {
    for (const [k, exp] of recentVisitorLogins) {
      if (exp <= now) recentVisitorLogins.delete(k);
    }
    if (recentVisitorLogins.size >= MAX_TRACKED_REPEATS) recentVisitorLogins.clear();
  }
  recentVisitorLogins.set(key, now + VISITOR_REPEAT_WINDOW_MS);
  return false;
}

const visitorLoginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many logins. Throttled.'
});

// Public: record the name a visitor typed on the lock screen. The rate limit
// runs before the body is read, and the body may be at most 1 KB.
app.post('/api/visitors', visitorLoginLimiter, express.json({ limit: '1kb' }), async (req, res) => {
  const { name, platform } = req.body || {};
  // Collapse whitespace and strip control characters before storing.
  const safeName = typeof name === 'string'
    ? name.replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
    : '';
  if (!safeName) {
    return res.status(400).json({ error: 'Missing name' });
  }

  if (isRepeatVisitorLogin(req.ip, safeName) || !takeVisitorBudget()) {
    return res.json({ ok: true });
  }

  const entries = await loadVisitors();
  entries.unshift({
    name: safeName,
    platform: platform === 'ios' ? 'ios' : 'macos',
    time: new Date().toISOString()
  });
  if (entries.length > MAX_VISITOR_ENTRIES) entries.length = MAX_VISITOR_ENTRIES;

  scheduleVisitorsSave();
  res.json({ ok: true });
});

// Admin: list every recorded visitor name, newest first
app.get('/api/visitors', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, entries: await loadVisitors() });
});

// Admin: clear the visitor names log
app.post('/api/visitors/clear', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await loadVisitors();
  visitorsCache = [];
  clearTimeout(visitorsSaveTimer);
  visitorsSaveTimer = null;
  await writeVisitorsNow();
  res.json({ ok: true });
});

// Admin: Reset analytics stats
app.post('/api/analytics/reset', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const fresh = {
      ...DEFAULT_ANALYTICS,
      firstTrackedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(fresh, null, 2), 'utf8');
    res.json({ ok: true, message: 'Analytics reset successfully.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not reset analytics.' });
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

// Tracks whether DATA_DIR survived the last container rebuild. Populated by
// recordBoot() before the server starts listening.
const bootInfo = { bootCount: 0, firstBootAt: null };

// Stamps a marker file inside DATA_DIR on every start. The marker can only
// survive a redeploy if DATA_DIR is a mounted volume, so a bootCount that
// never climbs past 1 is proof the mount is missing — which is exactly the
// condition that silently wipes every folder, upload and setting.
async function recordBoot() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let previous = null;
    try {
      previous = JSON.parse(await fs.readFile(BOOT_MARKER, 'utf8'));
    } catch {}

    bootInfo.bootCount = Number(previous?.bootCount || 0) + 1;
    bootInfo.firstBootAt = previous?.firstBootAt || new Date().toISOString();

    await fs.writeFile(
      BOOT_MARKER,
      JSON.stringify({ ...bootInfo, lastBootAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.warn('[storage] could not write boot marker:', err.message);
    bootInfo.bootCount = 1;
    bootInfo.firstBootAt = new Date().toISOString();
  }

  if (bootInfo.bootCount === 1) {
    console.warn(
      `[storage] ${DATA_DIR} was empty at startup. If this warning appears after ` +
      'every deploy, no volume is mounted there and all admin data is being ' +
      'destroyed on each rebuild. Mount a persistent volume at this path.'
    );
  } else {
    console.log(`[storage] ${DATA_DIR} persisted across ${bootInfo.bootCount} starts since ${bootInfo.firstBootAt}.`);
  }
}

// The boot marker is diagnostics, never a reason to fail a deploy. If the
// volume is slow, hung or read-only, give up on it and listen anyway —
// otherwise a bad mount would stop the server binding and take the whole
// site down instead of just losing the bootCount reading.
const bootMarkerTimeout = new Promise((resolve) => setTimeout(resolve, 3000));

Promise.race([recordBoot(), bootMarkerTimeout]).finally(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio running on port ${PORT} — settings stored at ${SETTINGS_FILE}`);
  });

  // A slow uplink can legitimately take minutes to push a video. Node's own
  // defaults would cut that off well before the upload finished, which the
  // browser then reports as a failed upload with no explanation.
  server.requestTimeout = 0;
  server.headersTimeout = 5 * 60 * 1000;
  server.keepAliveTimeout = 75 * 1000;
});
