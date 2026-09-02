/**
 * IshantOS IndexedDB Storage
 * Safely persists custom folders, uploaded files (images, videos, PDFs, docs),
 * and renamed nodes without hitting localStorage 5MB quota limits.
 */

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
 * Reads a File object and converts it into a node payload
 */
export function readFileAsNode(file) {
  return new Promise((resolve) => {
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

    const reader = new FileReader();

    if (isText) {
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
    } else {
      reader.onload = () => {
        const dataUrl = reader.result;
        resolve({
          name: file.name,
          kind,
          preview: dataUrl,
          dataUrl,
          file: dataUrl,
          description: `${formatBytes(file.size)} ${kind.toUpperCase()} file`,
          meta: {
            size: formatBytes(file.size),
            type: file.type || 'application/octet-stream',
            owner: 'Ishant (Admin)'
          }
        });
      };
      reader.onerror = () => {
        resolve({
          name: file.name,
          kind: 'file',
          description: formatBytes(file.size),
          meta: { size: formatBytes(file.size) }
        });
      };
      reader.readAsDataURL(file);
    }
  });
}
