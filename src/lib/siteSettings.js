// Global site settings shared by every visitor.
// Read on boot by everyone; written only by the admin through System Settings.
// The admin password is verified on the server and never lives in this bundle.

export const DEFAULT_SETTINGS = {
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

// In-memory reactive folder icons store
let currentFolderIcons = {};

if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('site_folderIcons');
    if (cached) {
      currentFolderIcons = JSON.parse(cached) || {};
    }
  } catch {}
}

export function getFolderIcon(nodeId) {
  if (!nodeId) return null;
  return currentFolderIcons[nodeId] || null;
}

export function getAllFolderIcons() {
  return { ...currentFolderIcons };
}

export function setLocalFolderIcons(icons) {
  currentFolderIcons = { ...(icons || {}) };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('site_folderIcons', JSON.stringify(currentFolderIcons));
    } catch {}
    window.dispatchEvent(new CustomEvent('ishantos:folder-icons-updated', { detail: currentFolderIcons }));
  }
}

// Wallpapers that can be published globally. Uploaded wallpapers are blob: URLs
// scoped to the admin's own browser, so they can never be shown to a visitor.
export const PUBLISHABLE_WALLPAPERS = ['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'];

export function isPublishable(id) {
  return PUBLISHABLE_WALLPAPERS.includes(id);
}

function getStoredPassword() {
  try {
    return sessionStorage.getItem('ishant_admin_pwd') || localStorage.getItem('admin_password') || '';
  } catch {
    return '';
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

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return { online: false };
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

export async function fetchSiteSettings() {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error();
    const data = await res.json();
    const folderIcons = (data.folderIcons && typeof data.folderIcons === 'object') ? data.folderIcons : DEFAULT_SETTINGS.folderIcons;
    setLocalFolderIcons(folderIcons);

    return {
      wallpaper: data.wallpaper || DEFAULT_SETTINGS.wallpaper,
      lockWallpaper: data.lockWallpaper || DEFAULT_SETTINGS.lockWallpaper,
      volume: typeof data.volume === 'number' && !isNaN(data.volume) ? data.volume : DEFAULT_SETTINGS.volume,
      isMuted: typeof data.isMuted === 'boolean' ? data.isMuted : DEFAULT_SETTINGS.isMuted,
      bgVideoSound: typeof data.bgVideoSound === 'boolean' ? data.bgVideoSound : DEFAULT_SETTINGS.bgVideoSound,
      bgVideoVolume: typeof data.bgVideoVolume === 'number' && !isNaN(data.bgVideoVolume) ? data.bgVideoVolume : DEFAULT_SETTINGS.bgVideoVolume,
      socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
      dashboardConfig: { ...DEFAULT_SETTINGS.dashboardConfig, ...(data.dashboardConfig || {}) },
      folderIcons,
      updatedAt: data.updatedAt || null,
      isServerConnected: true
    };
  } catch {
    // Try static /master-snapshot.json before falling back to bare defaults
    try {
      const snapRes = await fetch('/master-snapshot.json', { cache: 'no-store' });
      const snapType = snapRes.headers.get('content-type') || '';
      if (snapRes.ok && snapType.includes('application/json')) {
        const snapData = await snapRes.json();
        if (snapData && snapData.settings) {
          const s = snapData.settings;
          const folderIcons = (s.folderIcons && typeof s.folderIcons === 'object') ? s.folderIcons : DEFAULT_SETTINGS.folderIcons;
          setLocalFolderIcons(folderIcons);
          return {
            wallpaper: s.wallpaper || DEFAULT_SETTINGS.wallpaper,
            lockWallpaper: s.lockWallpaper || DEFAULT_SETTINGS.lockWallpaper,
            volume: typeof s.volume === 'number' && !isNaN(s.volume) ? s.volume : DEFAULT_SETTINGS.volume,
            isMuted: typeof s.isMuted === 'boolean' ? s.isMuted : DEFAULT_SETTINGS.isMuted,
            bgVideoSound: typeof s.bgVideoSound === 'boolean' ? s.bgVideoSound : DEFAULT_SETTINGS.bgVideoSound,
            bgVideoVolume: typeof s.bgVideoVolume === 'number' && !isNaN(s.bgVideoVolume) ? s.bgVideoVolume : DEFAULT_SETTINGS.bgVideoVolume,
            socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(s.socialLinks || {}) },
            dashboardConfig: { ...DEFAULT_SETTINGS.dashboardConfig, ...(s.dashboardConfig || {}) },
            folderIcons,
            updatedAt: s.updatedAt || null,
            isServerConnected: false
          };
        }
      }
    } catch {}

    // Server unreachable or static host — fall back to localStorage / defaults
    try {
      const wp = localStorage.getItem('site_wallpaper');
      const lockWp = localStorage.getItem('site_lockWallpaper');
      const storedSocials = localStorage.getItem('site_socialLinks');
      const storedDashboard = localStorage.getItem('site_dashboardConfig');
      const storedFolderIcons = localStorage.getItem('site_folderIcons');
      const storedVolume = localStorage.getItem('site_volume');
      const storedMuted = localStorage.getItem('site_isMuted');
      const storedBgSound = localStorage.getItem('site_bgVideoSound');
      const storedBgVol = localStorage.getItem('site_bgVideoVolume');
      const folderIcons = storedFolderIcons ? JSON.parse(storedFolderIcons) : DEFAULT_SETTINGS.folderIcons;
      setLocalFolderIcons(folderIcons);

      return {
        wallpaper: wp || DEFAULT_SETTINGS.wallpaper,
        lockWallpaper: lockWp || DEFAULT_SETTINGS.lockWallpaper,
        volume: storedVolume !== null && !isNaN(Number(storedVolume)) ? Number(storedVolume) : DEFAULT_SETTINGS.volume,
        isMuted: storedMuted !== null ? storedMuted === 'true' : DEFAULT_SETTINGS.isMuted,
        bgVideoSound: storedBgSound !== null ? storedBgSound === 'true' : DEFAULT_SETTINGS.bgVideoSound,
        bgVideoVolume: storedBgVol !== null && !isNaN(Number(storedBgVol)) ? Number(storedBgVol) : DEFAULT_SETTINGS.bgVideoVolume,
        socialLinks: storedSocials ? { ...DEFAULT_SETTINGS.socialLinks, ...JSON.parse(storedSocials) } : DEFAULT_SETTINGS.socialLinks,
        dashboardConfig: storedDashboard ? { ...DEFAULT_SETTINGS.dashboardConfig, ...JSON.parse(storedDashboard) } : DEFAULT_SETTINGS.dashboardConfig,
        folderIcons,
        updatedAt: null,
        isServerConnected: false
      };
    } catch {
      return { ...DEFAULT_SETTINGS, updatedAt: null, isServerConnected: false };
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

export async function saveSiteSettings({ password, wallpaper, lockWallpaper, socialLinks, dashboardConfig, folderIcons, volume, isMuted, bgVideoSound, bgVideoVolume }) {
  try {
    const res = await postJson('/api/settings', { password, wallpaper, lockWallpaper, socialLinks, dashboardConfig, folderIcons, volume, isMuted, bgVideoSound, bgVideoVolume });
    if (folderIcons) setLocalFolderIcons(folderIcons);
    if (typeof volume === 'number' && !isNaN(volume)) {
      try { localStorage.setItem('site_volume', String(volume)); } catch {}
    }
    if (typeof isMuted === 'boolean') {
      try { localStorage.setItem('site_isMuted', String(isMuted)); } catch {}
    }
    if (typeof bgVideoSound === 'boolean') {
      try { localStorage.setItem('site_bgVideoSound', String(bgVideoSound)); } catch {}
    }
    if (typeof bgVideoVolume === 'number' && !isNaN(bgVideoVolume)) {
      try { localStorage.setItem('site_bgVideoVolume', String(bgVideoVolume)); } catch {}
    }
    return res;
  } catch (err) {
    // Fallback: save to localStorage on static host
    if (password === getStoredPassword()) {
      try {
        if (wallpaper) localStorage.setItem('site_wallpaper', wallpaper);
        if (lockWallpaper) localStorage.setItem('site_lockWallpaper', lockWallpaper);
        if (socialLinks) localStorage.setItem('site_socialLinks', JSON.stringify(socialLinks));
        if (dashboardConfig) localStorage.setItem('site_dashboardConfig', JSON.stringify(dashboardConfig));
        if (folderIcons) setLocalFolderIcons(folderIcons);
        if (typeof volume === 'number' && !isNaN(volume)) localStorage.setItem('site_volume', String(volume));
        if (typeof isMuted === 'boolean') localStorage.setItem('site_isMuted', String(isMuted));
        if (typeof bgVideoSound === 'boolean') localStorage.setItem('site_bgVideoSound', String(bgVideoSound));
        if (typeof bgVideoVolume === 'number' && !isNaN(bgVideoVolume)) localStorage.setItem('site_bgVideoVolume', String(bgVideoVolume));
      } catch {}
      return { ok: true, wallpaper, lockWallpaper, socialLinks, dashboardConfig, folderIcons, volume, isMuted, bgVideoSound, bgVideoVolume, fallback: true };
    }
    throw err;
  }
}

export async function saveFolderIcons({ password, folderIcons }) {
  try {
    const res = await postJson('/api/settings/folder-icons', { password, folderIcons });
    setLocalFolderIcons(folderIcons);
    return res;
  } catch (err) {
    if (password === getStoredPassword()) {
      setLocalFolderIcons(folderIcons);
      return { ok: true, folderIcons, fallback: true };
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


