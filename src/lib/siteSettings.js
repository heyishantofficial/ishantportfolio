// Global site settings shared by every visitor.
// Read on boot by everyone; written only by the admin through System Settings.
// The admin password is verified on the server and never lives in this bundle.

export const DEFAULT_SETTINGS = {
  wallpaper: 'video',
  lockWallpaper: 'custom'
};

// Wallpapers that can be published globally. Uploaded wallpapers are blob: URLs
// scoped to the admin's own browser, so they can never be shown to a visitor.
export const PUBLISHABLE_WALLPAPERS = ['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'];

export function isPublishable(id) {
  return PUBLISHABLE_WALLPAPERS.includes(id);
}

async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('Settings server unreachable. Start it with `npm start`.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export async function fetchSiteSettings() {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    return {
      wallpaper: data.wallpaper || DEFAULT_SETTINGS.wallpaper,
      lockWallpaper: data.lockWallpaper || DEFAULT_SETTINGS.lockWallpaper
    };
  } catch {
    // Server unreachable — fall back to the built-in defaults rather than a blank desktop.
    return DEFAULT_SETTINGS;
  }
}

export function verifyAdminPassword(password) {
  return postJson('/api/settings/verify', { password });
}

export function saveSiteSettings({ password, wallpaper, lockWallpaper }) {
  return postJson('/api/settings', { password, wallpaper, lockWallpaper });
}

export function changeAdminPassword({ password, newPassword }) {
  return postJson('/api/settings/password', { password, newPassword });
}
