/**
 * IshantOS IndexedDB Storage
 * Safely persists custom folders, uploaded files (images, videos, PDFs, docs),
 * and renamed nodes without hitting localStorage 5MB quota limits.
 */

import { getAdminPassword } from './useAdminAuth';
import { startTransfer, updateTransfer, finishTransfer } from './transferActivity';

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

// Pieces are sized to finish comfortably inside the ~60s window the proxy in
// front of the server allows a single request. 3 MB still completes in about
// half a minute on a slow uplink, and the whole file is no longer racing one
// deadline — only each piece is.
const CHUNK_BYTES = 3 * 1024 * 1024;
const CHUNK_ATTEMPTS = 4;

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
    return data;
  });
}

/**
 * Sends one slice, reporting progress. Resolves with the server's byte count.
 */
function sendChunk({ blob, uploadId, offset, password, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/chunk');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-Admin-Password', password);
    xhr.setRequestHeader('X-Upload-Id', uploadId);
    xhr.setRequestHeader('X-Chunk-Offset', String(offset));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(offset + e.loaded);
    };

    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) return resolve(data.received);
      const err = new Error(data.error || `Upload failed (${xhr.status}).`);
      // A rejected file or an expired session will fail the same way on every
      // retry, so those stop immediately instead of being attempted four times.
      err.permanent = xhr.status === 401 || xhr.status === 413 || xhr.status === 404 || xhr.status === 400;
      reject(err);
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out.'));

    xhr.send(blob);
  });
}

/**
 * Uploads a file to the server in sequential chunks.
 *
 * It used to go up as one request carrying the whole file. Anything still
 * transmitting after about 60 seconds was cut off by the proxy and surfaced
 * as a 502, so whether a file made it depended on how fast the connection was
 * that minute rather than on anything about the file. Sending it in pieces
 * removes that deadline: no single request runs long enough to hit it, and a
 * piece that does fail is retried on its own rather than losing the file.
 */
export async function uploadFileToServer(file) {
  const transferId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const password = getAdminPassword();

  if (!password) {
    // Surfaced rather than swallowed: without admin auth the file never
    // reaches the server, it only ever exists in this browser, and the
    // visitor-facing site will never show it.
    startTransfer({ id: transferId, name: file.name, size: file.size });
    finishTransfer(transferId, {
      ok: false,
      error: 'Not signed in as admin — this file was not saved to the server.'
    });
    return { ok: false, error: 'Admin authentication required.' };
  }

  startTransfer({ id: transferId, name: file.name, size: file.size });

  try {
    const { uploadId } = await postJson('/api/upload/init', {
      password,
      filename: file.name
    });

    let offset = 0;
    while (offset < file.size) {
      const end = Math.min(offset + CHUNK_BYTES, file.size);
      const blob = file.slice(offset, end);

      let sent = null;
      let lastError = null;

      for (let attempt = 1; attempt <= CHUNK_ATTEMPTS; attempt += 1) {
        try {
          sent = await sendChunk({
            blob,
            uploadId,
            offset,
            password,
            onProgress: (loaded) => updateTransfer(transferId, Math.min(loaded, file.size))
          });
          break;
        } catch (err) {
          lastError = err;
          if (err.permanent || attempt === CHUNK_ATTEMPTS) throw err;
          // Back off before retrying: an overloaded or restarting server
          // needs a moment, and hammering it is what turns a blip into a
          // failed upload.
          await new Promise((r) => setTimeout(r, 800 * attempt));
          // Show the chunk as un-sent again rather than leaving a bar that
          // crept forward on an attempt that did not land.
          updateTransfer(transferId, offset);
        }
      }

      if (sent === null) throw lastError || new Error('Upload failed.');

      // Trust the server's count: on a retried chunk whose reply was lost it
      // is already further along than this browser thinks.
      offset = sent;
    }

    const data = await postJson('/api/upload/complete', {
      password,
      uploadId,
      filename: file.name,
      mimeType: file.type,
      size: file.size
    });

    finishTransfer(transferId, { ok: true, url: data.url });
    return data;
  } catch (err) {
    const error = err.message || 'Upload failed.';
    finishTransfer(transferId, { ok: false, error });
    return { ok: false, error };
  }
}

/**
 * Turns an inline `data:` URL back into a real file and uploads it.
 *
 * This is the escape hatch for files that were added while uploads were
 * broken: their bytes only ever existed as base64 inside filesystem.json,
 * which is why that payload grew past what the server would accept and why
 * those files never appeared on any other device.
 */
export async function uploadDataUrlToServer(dataUrl, name, mimeType) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return { ok: false, error: 'Not an inline file.' };
  }

  try {
    const comma = dataUrl.indexOf(',');
    const header = dataUrl.slice(5, comma);
    const type = mimeType || header.split(';')[0] || 'application/octet-stream';
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const file = new File([bytes], name || 'file', { type });
    return await uploadFileToServer(file);
  } catch (err) {
    return { ok: false, error: err.message || 'Could not decode inline file.' };
  }
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
  let uploadedToServer = false;

  if (uploadRes && uploadRes.ok && uploadRes.url) {
    fileUrl = uploadRes.url;
    uploadedToServer = true;
  } else {
    fileUrl = dataUrl || URL.createObjectURL(file);
  }

  // Once the file lives in /uploads on the server, keeping a second full copy
  // inline as base64 is pure weight: it is ~33% larger than the original and
  // it rides inside filesystem.json, which is fetched by every visitor on
  // boot and re-POSTed in full on every single change. One 12 MB PDF kept
  // this way accounted for 33 MB of a 35 MB payload. Keep the small generated
  // thumbnail for previews and let the real bytes be served from /uploads.
  const inlineCopy = uploadedToServer ? null : dataUrl;

  return {
    name: file.name,
    kind,
    // A PDF has no image preview: pointing `preview` at the .pdf URL makes
    // every <img> that renders it a broken image (with the resume's alt text).
    // Leave it empty so viewers fall back to the real PDF embed instead.
    thumbnailUrl: isPdf ? null : (thumbnailUrl || inlineCopy || null),
    preview: isPdf ? null : (thumbnailUrl || inlineCopy || fileUrl || null),
    dataUrl: inlineCopy || (typeof fileUrl === 'string' && fileUrl.startsWith('data:') ? fileUrl : null),
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
