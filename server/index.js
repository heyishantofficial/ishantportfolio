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

// Wallpapers that every visitor can load. Uploaded wallpapers are deliberately
// excluded: they are blob: URLs local to the admin's own browser, so they
// cannot be served to anyone else.
const VALID_WALLPAPERS = ['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'];
const FALLBACK = { 
  wallpaper: 'video', 
  lockWallpaper: 'custom',
  socialLinks: {
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com/heyishant',
    twitter: 'https://twitter.com',
    github: 'https://github.com/heyishantofficial'
  },
  dashboardConfig: {
    openLinksInNewTab: false,
    dockMagnification: true,
    soundEffects: true,
    statusMessage: '',
    contactEmail: 'ishant.vibecode@gmail.com'
  }
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
      socialLinks: { ...FALLBACK.socialLinks, ...(parsed.socialLinks || {}) },
      dashboardConfig: { ...FALLBACK.dashboardConfig, ...(parsed.dashboardConfig || {}) },
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

const app = express();
app.use(express.json({ limit: '16kb' }));

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

async function scrapeYouTubeChannel(input) {
  if (!input || typeof input !== 'string') return null;
  let target = input.trim();
  if (!target) return null;

  // Clean and normalize target URL
  let fetchUrl = target;
  if (target.startsWith('@')) {
    fetchUrl = `https://www.youtube.com/${target}`;
  } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
    if (target.includes('youtube.com')) {
      fetchUrl = `https://${target}`;
    } else {
      fetchUrl = `https://www.youtube.com/@${target}`;
    }
  }

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
    // If URL parsing fails, proceed with fetchUrl
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

// Public endpoint: Fetch live YouTube channel metrics without API key
app.get('/api/youtube-stats', async (req, res) => {
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
    version: 'latest-admin-notes',
    timestamp: new Date().toISOString()
  });
});

// Public: every visitor reads the current global defaults on boot.
// The stored password is never included in the response.
app.get('/api/settings', async (_req, res) => {
  const { wallpaper, lockWallpaper, socialLinks, dashboardConfig, updatedAt } = await readState();
  res.set('Cache-Control', 'no-store');
  res.json({
    wallpaper,
    lockWallpaper,
    socialLinks,
    dashboardConfig,
    updatedAt,
    serverStatus: 'online'
  });
});

// Admin: unlock the System Settings panel.
app.post('/api/settings/verify', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ ok: true });
});

// Admin: publish settings as the default for every visitor.
app.post('/api/settings', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { wallpaper, lockWallpaper, socialLinks, dashboardConfig } = req.body || {};
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
    ...(socialLinks ? { socialLinks: { ...state.socialLinks, ...socialLinks } } : {}),
    ...(dashboardConfig ? { dashboardConfig: { ...state.dashboardConfig, ...dashboardConfig } } : {}),
    updatedAt: new Date().toISOString() 
  };
  try {
    await writeState(next);
    res.json({ 
      wallpaper: next.wallpaper, 
      lockWallpaper: next.lockWallpaper, 
      socialLinks: next.socialLinks,
      dashboardConfig: next.dashboardConfig,
      updatedAt: next.updatedAt 
    });
  } catch (err) {
    console.error('[settings] write failed:', err);
    res.status(500).json({ error: 'Could not save settings.' });
  }
});

// Admin: change the password. Persists, so it survives a reload and a redeploy.
app.post('/api/settings/password', async (req, res) => {
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
