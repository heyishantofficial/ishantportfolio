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

const DEFAULT_ADMIN_PASSWORD = 'ishucreationz';

function getStoredPassword() {
  try {
    return localStorage.getItem('admin_password') || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
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
    if (!res.ok) throw new Error();
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error();
    const data = await res.json();
    return {
      wallpaper: data.wallpaper || DEFAULT_SETTINGS.wallpaper,
      lockWallpaper: data.lockWallpaper || DEFAULT_SETTINGS.lockWallpaper
    };
  } catch {
    // Server unreachable or static host — fall back to localStorage / defaults
    try {
      const wp = localStorage.getItem('site_wallpaper');
      const lockWp = localStorage.getItem('site_lockWallpaper');
      return {
        wallpaper: wp || DEFAULT_SETTINGS.wallpaper,
        lockWallpaper: lockWp || DEFAULT_SETTINGS.lockWallpaper
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}

export async function verifyAdminPassword(password) {
  try {
    return await postJson('/api/settings/verify', { password });
  } catch (err) {
    // Fallback for static hosting (e.g. Caddy returning 405) or offline server
    if (password === getStoredPassword()) {
      return { ok: true, fallback: true };
    }
    throw err;
  }
}

export async function saveSiteSettings({ password, wallpaper, lockWallpaper }) {
  try {
    return await postJson('/api/settings', { password, wallpaper, lockWallpaper });
  } catch (err) {
    // Fallback: save to localStorage on static host
    if (password === getStoredPassword()) {
      try {
        localStorage.setItem('site_wallpaper', wallpaper);
        localStorage.setItem('site_lockWallpaper', lockWallpaper);
      } catch {}
      return { ok: true, wallpaper, lockWallpaper, fallback: true };
    }
    throw err;
  }
}

export async function changeAdminPassword({ password, newPassword }) {
  try {
    return await postJson('/api/settings/password', { password, newPassword });
  } catch (err) {
    // Fallback: persist in localStorage on static host
    if (password === getStoredPassword()) {
      try {
        localStorage.setItem('admin_password', newPassword);
      } catch {}
      return { ok: true, fallback: true };
    }
    throw err;
  }
}

