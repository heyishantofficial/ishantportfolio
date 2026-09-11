/**
 * IshantOS IndexedDB Storage
 * Safely persists custom folders, uploaded files (images, videos, PDFs, docs),
 * and renamed nodes without hitting localStorage 5MB quota limits.
 */

import { getAdminPassword } from './useAdminAuth';

const DB_NAME = 'ishant_os_db';
const DB_VERSION = 1;
const STORE_FS = 'filesystem_store';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_FS)) {
        db.createObjectStore(STORE_FS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageItem(key, defaultValue = null) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FS, 'readonly');
      const store = tx.objectStore(STORE_FS);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result ? req.result.value : defaultValue);
      };
      req.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (err) {
    console.warn('IDB getStorageItem fallback to localStorage:', err);
    try {
      const val = localStorage.getItem(`ishant_fs_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export async function setStorageItem(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FS, 'readwrite');
      const store = tx.objectStore(STORE_FS);
      const req = store.put({ key, value });

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB setStorageItem fallback to localStorage:', err);
    try {
      localStorage.setItem(`ishant_fs_${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generates a lightweight compressed image thumbnail (~4-8 KB) using HTML Canvas
 */
export async function generateImageThumbnail(file, maxWidth = 200, maxHeight = 200) {
  if (typeof window === 'undefined') return null;

  // Try modern createImageBitmap (hardware accelerated, handles EXIF orientation)
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      // Fallback to standard Image below
    }
  }

  return new Promise((resolve) => {
    if (!window.URL) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const thumb = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve(thumb);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates a lightweight video snapshot thumbnail (~4-6 KB) from timestamp 0.1s
 */
export function generateVideoThumbnail(file, maxWidth = 200, maxHeight = 120) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.URL) return resolve(null);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let resolved = false;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      video.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => finish(null), 4500);

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1);
      } catch {
        finish(null);
      }
    };

    video.onseeked = () => {
      clearTimeout(timer);
      try {
        const vw = video.videoWidth || 320;
        const vh = video.videoHeight || 180;
        let w = maxWidth;
        let h = Math.round((vh * maxWidth) / vw);
        if (h > maxHeight) {
          h = maxHeight;
          w = Math.round((vw * maxHeight) / vh);
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        const thumb = canvas.toDataURL('image/jpeg', 0.65);
        finish(thumb);
      } catch {
        finish(null);
      }
    };

    video.onerror = () => finish(null);
    video.src = url;
    video.load();
  });
}

/**
 * Uploads original binary file to the Express server /api/upload
 */
export async function uploadFileToServer(file) {
  const password = getAdminPassword();
  if (!password) {
    return { ok: false, error: 'Admin authentication required.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            filename: file.name,
            dataBase64: reader.result,
            mimeType: file.type
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          resolve({ ok: false, error: errData.error || 'Upload failed' });
          return;
        }
        const data = await res.json();
        resolve(data);
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: 'Could not read file.' });
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a File object and converts it into a node payload.
 * Generates lightweight thumbnails for media previews in Finder,
 * while saving the full heavy file to the server so it is loaded strictly on demand.
 */
export async function readFileAsNode(file) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText = file.type.startsWith('text/') ||
    /\.(txt|md|json|js|jsx|ts|tsx|css|html|py|sh|csv|xml|yml|yaml)$/i.test(file.name);

  let kind = 'file';
  if (isImage) kind = 'image';
  else if (isVideo) kind = 'video';
  else if (isAudio) kind = 'audio';
  else if (isPdf) kind = 'pdf';
  else if (isText) kind = 'text';

  if (isText) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          kind: 'text',
          body: reader.result || '',
          description: `${formatBytes(file.size)} text document`,
          meta: {
            size: formatBytes(file.size),
            type: file.type || 'text/plain',
            owner: 'Ishant (Admin)'
          }
        });
      };
      reader.onerror = () => {
        resolve({
          name: file.name,
          kind: 'text',
          body: 'Failed to read file content.',
          description: 'Text file'
        });
      };
      reader.readAsText(file);
    });
  }

  // Generate lightweight visual thumbnail (~4-8 KB) for fast folder previews
  let thumbnailUrl = null;
  if (isImage) {
    thumbnailUrl = await generateImageThumbnail(file);
  } else if (isVideo) {
    thumbnailUrl = await generateVideoThumbnail(file);
  }

  // For files under 20MB, ALWAYS generate persistent base64 dataUrl so the file NEVER breaks across browser restarts, mobile sync, or server outages
  let dataUrl = null;
  if (file.size < 20 * 1024 * 1024) {
    dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // Upload full file to server uploads directory if admin is authenticated
  const uploadRes = await uploadFileToServer(file);
  let fileUrl = null;

  if (uploadRes && uploadRes.ok && uploadRes.url) {
    fileUrl = uploadRes.url;
  } else {
    fileUrl = dataUrl || URL.createObjectURL(file);
  }

  return {
    name: file.name,
    kind,
    thumbnailUrl: isPdf ? null : (thumbnailUrl || dataUrl || null),
    preview: isPdf ? null : (thumbnailUrl || dataUrl || null),
    dataUrl: dataUrl || (typeof fileUrl === 'string' && fileUrl.startsWith('data:') ? fileUrl : null),
    fileUrl,
    file: fileUrl,
    description: isPdf ? `${formatBytes(file.size)} PDF Document` : `${formatBytes(file.size)} ${kind.toUpperCase()} file`,
    meta: {
      size: formatBytes(file.size),
      type: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
      owner: 'Ishant (Admin)'
    }
  };
}
