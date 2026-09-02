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
const FALLBACK = { wallpaper: 'video', lockWallpaper: 'custom' };

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
app.use(express.json({ limit: '4kb' }));

// Public: every visitor reads the current global defaults on boot.
// The stored password is never included in the response.
app.get('/api/settings', async (_req, res) => {
  const { wallpaper, lockWallpaper, updatedAt } = await readState();
  res.set('Cache-Control', 'no-store');
  res.json({ wallpaper, lockWallpaper, updatedAt });
});

// Admin: unlock the System Settings panel.
app.post('/api/settings/verify', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ ok: true });
});

// Admin: publish the current wallpaper as the default for every visitor.
app.post('/api/settings', async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { wallpaper, lockWallpaper } = req.body || {};
  if (!VALID_WALLPAPERS.includes(wallpaper) || !VALID_WALLPAPERS.includes(lockWallpaper)) {
    return res.status(400).json({
      error: 'Uploaded wallpapers only exist in your own browser, so they cannot be published to visitors. Pick one of the built-in wallpapers.'
    });
  }

  const state = await readState();
  const next = { ...state, wallpaper, lockWallpaper, updatedAt: new Date().toISOString() };
  try {
    await writeState(next);
    res.json({ wallpaper: next.wallpaper, lockWallpaper: next.lockWallpaper, updatedAt: next.updatedAt });
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

// Static built site + SPA fallback
app.use(express.static(DIST));
app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio running on port ${PORT} — settings stored at ${SETTINGS_FILE}`);
});
