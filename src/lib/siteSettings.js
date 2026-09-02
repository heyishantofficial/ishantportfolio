// Global site settings shared by every visitor.
// Read on boot by everyone; written only by the admin through System Settings.
// The admin password is verified on the server and never lives in this bundle.

export const DEFAULT_SETTINGS = {
  wallpaper: 'video',
  lockWallpaper: 'custom',
  socialLinks: {
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    github: 'https://github.com'
  },
  dashboardConfig: {
    openLinksInNewTab: false,
    dockMagnification: true,
    soundEffects: true,
    statusMessage: '● Vibecoding live & open for collaborations',
    contactEmail: 'ishant.vibecode@gmail.com'
  }
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
      lockWallpaper: data.lockWallpaper || DEFAULT_SETTINGS.lockWallpaper,
      socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
      dashboardConfig: { ...DEFAULT_SETTINGS.dashboardConfig, ...(data.dashboardConfig || {}) }
    };
  } catch {
    // Server unreachable or static host — fall back to localStorage / defaults
    try {
      const wp = localStorage.getItem('site_wallpaper');
      const lockWp = localStorage.getItem('site_lockWallpaper');
      const storedSocials = localStorage.getItem('site_socialLinks');
      const storedDashboard = localStorage.getItem('site_dashboardConfig');
      return {
        wallpaper: wp || DEFAULT_SETTINGS.wallpaper,
        lockWallpaper: lockWp || DEFAULT_SETTINGS.lockWallpaper,
        socialLinks: storedSocials ? { ...DEFAULT_SETTINGS.socialLinks, ...JSON.parse(storedSocials) } : DEFAULT_SETTINGS.socialLinks,
        dashboardConfig: storedDashboard ? { ...DEFAULT_SETTINGS.dashboardConfig, ...JSON.parse(storedDashboard) } : DEFAULT_SETTINGS.dashboardConfig
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

export async function saveSiteSettings({ password, wallpaper, lockWallpaper, socialLinks, dashboardConfig }) {
  try {
    return await postJson('/api/settings', { password, wallpaper, lockWallpaper, socialLinks, dashboardConfig });
  } catch (err) {
    // Fallback: save to localStorage on static host
    if (password === getStoredPassword()) {
      try {
        if (wallpaper) localStorage.setItem('site_wallpaper', wallpaper);
        if (lockWallpaper) localStorage.setItem('site_lockWallpaper', lockWallpaper);
        if (socialLinks) localStorage.setItem('site_socialLinks', JSON.stringify(socialLinks));
        if (dashboardConfig) localStorage.setItem('site_dashboardConfig', JSON.stringify(dashboardConfig));
      } catch {}
      return { ok: true, wallpaper, lockWallpaper, socialLinks, dashboardConfig, fallback: true };
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

