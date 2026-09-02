import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PORT = process.env.PORT || 3000;
// Set ADMIN_PASSWORD in Dokploy env vars. Never shipped to the browser.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ishant2026';
// Point DATA_DIR at a mounted volume so settings survive redeploys.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');

const VALID_WALLPAPERS = ['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'];
const FALLBACK = { wallpaper: 'video', lockWallpaper: 'custom' };

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[settings] ADMIN_PASSWORD is not set — falling back to the built-in default. Set it in your Dokploy env vars.');
}

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      wallpaper: VALID_WALLPAPERS.includes(parsed.wallpaper) ? parsed.wallpaper : FALLBACK.wallpaper,
      lockWallpaper: VALID_WALLPAPERS.includes(parsed.lockWallpaper) ? parsed.lockWallpaper : FALLBACK.lockWallpaper,
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    return { ...FALLBACK, updatedAt: null };
  }
}

async function writeSettings(settings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), 'utf8');
  await fs.rename(tmp, SETTINGS_FILE);
}

const app = express();
app.use(express.json({ limit: '4kb' }));

// Public: every visitor reads the current global defaults on boot.
app.get('/api/settings', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await readSettings());
});

// Admin only: password is verified here, on the server.
app.post('/api/settings', async (req, res) => {
  const { password, wallpaper, lockWallpaper } = req.body || {};

  if (typeof password !== 'string' || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  if (!VALID_WALLPAPERS.includes(wallpaper) || !VALID_WALLPAPERS.includes(lockWallpaper)) {
    return res.status(400).json({ error: 'Unknown wallpaper id.' });
  }

  const settings = { wallpaper, lockWallpaper, updatedAt: new Date().toISOString() };
  try {
    await writeSettings(settings);
    res.json(settings);
  } catch (err) {
    console.error('[settings] write failed:', err);
    res.status(500).json({ error: 'Could not save settings.' });
  }
});

// Admin only: lets the Settings panel verify the password before unlocking the UI.
app.post('/api/settings/verify', (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  res.json({ ok: true });
});

// Static built site + SPA fallback
app.use(express.static(DIST));
app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio running on port ${PORT} — settings stored at ${SETTINGS_FILE}`);
});
