/**
 * Client API for syncing IshantOS Finder filesystem with Express backend /app/data/filesystem.json
 */

export async function fetchServerFilesystem() {
  try {
    const res = await fetch('/api/filesystem', {
      method: 'GET',
      cache: 'no-store'
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.ok) {
          return {
            customNodes: Array.isArray(data.customNodes) ? data.customNodes : [],
            renames: data.renames && typeof data.renames === 'object' ? data.renames : {},
            deleted: Array.isArray(data.deleted) ? data.deleted : [],
            edits: data.edits && typeof data.edits === 'object' ? data.edits : {},
            updatedAt: data.updatedAt || null
          };
        }
      }
    }
  } catch (err) {
    console.warn('[filesystemApi] Server endpoint unreachable, checking fallback snapshot:', err.message);
  }

  // Fallback: try static /master-snapshot.json (essential for static deployments and new mobile visitors)
  try {
    const snapRes = await fetch('/master-snapshot.json', { cache: 'no-store' });
    if (snapRes.ok) {
      const snapData = await snapRes.json();
      if (snapData && snapData.filesystem) {
        return {
          customNodes: Array.isArray(snapData.filesystem.customNodes) ? snapData.filesystem.customNodes : [],
          renames: snapData.filesystem.renames && typeof snapData.filesystem.renames === 'object' ? snapData.filesystem.renames : {},
          deleted: Array.isArray(snapData.filesystem.deleted) ? snapData.filesystem.deleted : [],
          edits: snapData.filesystem.edits && typeof snapData.filesystem.edits === 'object' ? snapData.filesystem.edits : {},
          updatedAt: snapData.filesystem.updatedAt || null
        };
      }
    }
  } catch {}

  return null;
}

export async function saveServerFilesystem({ password, customNodes, renames, deleted, edits }) {
  if (!password) {
    throw new Error('Admin password required to sync filesystem to server.');
  }

  const res = await fetch('/api/filesystem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      password,
      customNodes,
      renames,
      deleted,
      edits
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Server returned error ${res.status}`);
  }

  return data;
}
