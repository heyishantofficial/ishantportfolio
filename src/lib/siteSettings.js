// Global site settings shared by every visitor.
// Read on boot by everyone; written only by the admin through System Settings.

export const DEFAULT_SETTINGS = {
  wallpaper: 'video',
  lockWallpaper: 'custom'
};

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
    // Server unreachable (or running the static build without it) — use the built-in defaults.
    return DEFAULT_SETTINGS;
  }
}

export async function verifyAdminPassword(password) {
  const res = await fetch('/api/settings/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not verify password.');
  }
  return true;
}

export async function saveSiteSettings({ password, wallpaper, lockWallpaper }) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, wallpaper, lockWallpaper })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not save settings.');
  }
  return res.json();
}
