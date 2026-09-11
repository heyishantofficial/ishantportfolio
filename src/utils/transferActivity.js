/**
 * Transfer activity store.
 *
 * Uploads and saves used to fail silently: the file appeared in Finder, the
 * rename showed on screen, and nothing said whether either had actually
 * reached the server. A save that dies leaves the change in this browser
 * only, and the next reload quietly replaces it with the server's older copy
 * — which is how work disappeared without anyone seeing it happen.
 *
 * Everything that crosses the network registers here so admin mode can show
 * it: bytes moved, percent done, and — most importantly — failures, kept on
 * screen until they are dismissed rather than vanishing into a console log.
 */

const listeners = new Set();

// id -> { id, name, size, sent, percent, status, error, kind, startedAt, endedAt }
const transfers = new Map();

let saveState = {
  status: 'idle',      // idle | saving | saved | error
  message: '',
  lastSavedAt: null,
  lastError: null,
  payloadBytes: null   // size of the last filesystem payload we sent
};

function snapshot() {
  const all = [...transfers.values()].sort((a, b) => b.startedAt - a.startedAt);
  const active = all.filter((t) => t.status === 'uploading');
  const failed = all.filter((t) => t.status === 'error');

  const totalBytes = active.reduce((sum, t) => sum + (t.size || 0), 0);
  const sentBytes = active.reduce((sum, t) => sum + (t.sent || 0), 0);

  return {
    transfers: all,
    active,
    failed,
    activeCount: active.length,
    failedCount: failed.length,
    // Aggregate progress across everything in flight, so the UI can show one
    // bar for a multi-file drop instead of a stack of competing ones.
    totalBytes,
    sentBytes,
    percent: totalBytes > 0 ? Math.min(100, Math.round((sentBytes / totalBytes) * 100)) : 0,
    save: { ...saveState }
  };
}

function emit() {
  const state = snapshot();
  listeners.forEach((fn) => {
    try { fn(state); } catch { /* a broken listener must not stop the others */ }
  });
}

export function subscribeTransfers(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getTransferState() {
  return snapshot();
}

export function startTransfer({ id, name, size, kind = 'upload' }) {
  transfers.set(id, {
    id,
    name,
    size: size || 0,
    sent: 0,
    percent: 0,
    status: 'uploading',
    error: null,
    kind,
    startedAt: Date.now(),
    endedAt: null
  });
  emit();
  return id;
}

export function updateTransfer(id, sent) {
  const t = transfers.get(id);
  if (!t || t.status !== 'uploading') return;
  t.sent = sent;
  t.percent = t.size > 0 ? Math.min(100, Math.round((sent / t.size) * 100)) : 0;
  emit();
}

export function finishTransfer(id, { ok, error, url } = {}) {
  const t = transfers.get(id);
  if (!t) return;
  t.status = ok ? 'done' : 'error';
  t.error = ok ? null : (error || 'Upload failed');
  t.url = url || null;
  t.endedAt = Date.now();
  if (ok) {
    t.sent = t.size;
    t.percent = 100;
    // Successful transfers clear themselves; failures stay until dismissed,
    // because a failure is the whole reason this panel exists.
    setTimeout(() => {
      transfers.delete(id);
      emit();
    }, 4000);
  }
  emit();
}

export function dismissTransfer(id) {
  transfers.delete(id);
  emit();
}

export function clearFinishedTransfers() {
  for (const [id, t] of transfers) {
    if (t.status !== 'uploading') transfers.delete(id);
  }
  emit();
}

export function setSaveState(next) {
  saveState = { ...saveState, ...next };
  emit();
}

export function formatTransferBytes(bytes) {
  if (!+bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}
