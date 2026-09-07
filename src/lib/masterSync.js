/**
 * IshantOS Master Sync Engine
 * Aggregates complete website state (custom folders/files, renames, deletions,
 * notes body edits, folder icons, wallpapers, dock & social settings)
 * into a single unified snapshot and publishes it as the global Master Version.
 */

import { getFSCacheState, applyFSSnapshot } from '../data/ishantOS';
import { getAllFolderIcons, setLocalFolderIcons, DEFAULT_SETTINGS } from './siteSettings';
import { getAdminPassword, setAdminStatus } from '../utils/useAdminAuth';

const BROADCAST_CHANNEL_NAME = 'ishant_master_sync';

/**
 * Creates a BroadcastChannel instance for tab-to-tab sync
 */
export function getMasterSyncChannel() {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Gathers the complete state of the website in the current browser window
 */
export function getCurrentWebsiteSnapshot(activeSettings = {}) {
  const fsState = getFSCacheState();

  // Read folder icons
  let folderIcons = activeSettings.folderIcons;
  if (!folderIcons || Object.keys(folderIcons).length === 0) {
    try {
      folderIcons = getAllFolderIcons() || {};
    } catch {
      folderIcons = {};
    }
  }

  // Read wallpapers
  let wallpaper = activeSettings.wallpaper;
  if (!wallpaper && typeof window !== 'undefined') {
    wallpaper = localStorage.getItem('site_wallpaper') || DEFAULT_SETTINGS.wallpaper;
  }

  let lockWallpaper = activeSettings.lockWallpaper;
  if (!lockWallpaper && typeof window !== 'undefined') {
    lockWallpaper = localStorage.getItem('site_lockWallpaper') || DEFAULT_SETTINGS.lockWallpaper;
  }

  // Read socials
  let socialLinks = activeSettings.socialLinks;
  if (!socialLinks && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('site_socialLinks');
      socialLinks = stored ? JSON.parse(stored) : DEFAULT_SETTINGS.socialLinks;
    } catch {
      socialLinks = DEFAULT_SETTINGS.socialLinks;
    }
  }

  // Read dashboard config
  let dashboardConfig = activeSettings.dashboardConfig;
  if (!dashboardConfig && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('site_dashboardConfig');
      dashboardConfig = stored ? JSON.parse(stored) : DEFAULT_SETTINGS.dashboardConfig;
    } catch {
      dashboardConfig = DEFAULT_SETTINGS.dashboardConfig;
    }
  }

  const now = new Date().toISOString();
  const masterVersionId = `master_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    version: 1,
    masterVersionId,
    updatedAt: now,
    filesystem: {
      customNodes: fsState.customNodes || [],
      renames: fsState.renames || {},
      deleted: fsState.deleted || [],
      edits: fsState.edits || {},
      updatedAt: now
    },
    settings: {
      wallpaper: wallpaper || DEFAULT_SETTINGS.wallpaper,
      lockWallpaper: lockWallpaper || DEFAULT_SETTINGS.lockWallpaper,
      socialLinks: socialLinks || DEFAULT_SETTINGS.socialLinks,
      dashboardConfig: dashboardConfig || DEFAULT_SETTINGS.dashboardConfig,
      folderIcons: folderIcons || {},
      updatedAt: now
    },
    meta: {
      device: typeof navigator !== 'undefined' ? `${navigator.platform || 'Web'}` : 'Web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      customNodesCount: (fsState.customNodes || []).length,
      renamesCount: Object.keys(fsState.renames || {}).length,
      deletedCount: (fsState.deleted || []).length,
      editsCount: Object.keys(fsState.edits || {}).length,
      folderIconsCount: Object.keys(folderIcons || {}).length
    }
  };
}

/**
 * Fetches the active master snapshot from the server
 */
export async function fetchMasterSnapshot() {
  try {
    const res = await fetch('/api/master-sync', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.ok ? data.masterSnapshot : null;
  } catch (err) {
    console.warn('[masterSync] Failed to fetch master snapshot:', err.message);
    return null;
  }
}

/**
 * Saves and publishes the current window version as the Authoritative Master Version
 */
export async function runMasterSync(providedPassword = null, currentSettings = {}) {
  const password = (providedPassword || getAdminPassword() || '').trim();
  if (!password) {
    throw new Error('Admin password required to publish Master Version.');
  }

  const snapshot = getCurrentWebsiteSnapshot(currentSettings);

  const res = await fetch('/api/master-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password,
      snapshot
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Master Sync failed with status ${res.status}`);
  }

  // Ensure session password is confirmed
  setAdminStatus(true, password);

  // Apply to local state and IndexedDB
  await applyFSSnapshot(snapshot.filesystem, true);
  if (snapshot.settings?.folderIcons) {
    setLocalFolderIcons(snapshot.settings.folderIcons);
  }

  // Broadcast to other open tabs in real-time
  try {
    const channel = getMasterSyncChannel();
    if (channel) {
      channel.postMessage({
        type: 'MASTER_SYNC_UPDATED',
        snapshot,
        timestamp: Date.now()
      });
      channel.close();
    }
  } catch (err) {
    console.warn('[masterSync] Broadcast failed:', err.message);
  }

  return {
    ok: true,
    masterVersionId: data.masterVersionId || snapshot.masterVersionId,
    updatedAt: data.updatedAt || snapshot.updatedAt,
    snapshot,
    message: data.message || 'Master Version published successfully.'
  };
}

/**
 * Applies a full master snapshot to the active browser instance
 */
export async function applyMasterSnapshotToWindow(snapshot, callbacks = {}) {
  if (!snapshot) return;

  // 1. Hydrate filesystem tree
  if (snapshot.filesystem) {
    await applyFSSnapshot(snapshot.filesystem, true);
  }

  // 2. Hydrate folder icons
  if (snapshot.settings?.folderIcons) {
    setLocalFolderIcons(snapshot.settings.folderIcons);
    if (callbacks.onUpdateFolderIcons) {
      callbacks.onUpdateFolderIcons(snapshot.settings.folderIcons);
    }
  }

  // 3. Hydrate wallpapers
  if (snapshot.settings?.wallpaper && callbacks.onChangeWallpaper) {
    callbacks.onChangeWallpaper(snapshot.settings.wallpaper);
  }
  if (snapshot.settings?.lockWallpaper && callbacks.onChangeLockWallpaper) {
    callbacks.onChangeLockWallpaper(snapshot.settings.lockWallpaper);
  }

  // 4. Hydrate social links
  if (snapshot.settings?.socialLinks && callbacks.onUpdateSocialLinks) {
    callbacks.onUpdateSocialLinks(snapshot.settings.socialLinks);
    try {
      localStorage.setItem('site_socialLinks', JSON.stringify(snapshot.settings.socialLinks));
    } catch {}
  }

  // 5. Hydrate dashboard config
  if (snapshot.settings?.dashboardConfig && callbacks.onUpdateDashboardConfig) {
    callbacks.onUpdateDashboardConfig(snapshot.settings.dashboardConfig);
    try {
      localStorage.setItem('site_dashboardConfig', JSON.stringify(snapshot.settings.dashboardConfig));
    } catch {}
  }
}

/**
 * Exports the snapshot as a downloadable JSON file
 */
export function exportMasterSnapshotJson(snapshot = null) {
  const data = snapshot || getCurrentWebsiteSnapshot();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `ishant-portfolio-master-snapshot-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a snapshot from a user-uploaded JSON file
 */
export function importMasterSnapshotJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided.'));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object') {
          return reject(new Error('Invalid JSON file.'));
        }
        if (!parsed.filesystem && !parsed.settings) {
          return reject(new Error('Snapshot does not contain valid filesystem or settings.'));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse snapshot JSON: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsText(file);
  });
}
