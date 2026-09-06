import { useState, useEffect, useCallback } from 'react';
import { findNode, getParentId, registerCustomNode } from '../data/ishantOS';
import { checkIsAdmin } from './useAdminAuth';
import { playMacClick } from './macAudioEngine';

let clipboardNode = null;
let clipboardAction = 'copy'; // 'copy' | 'cut'
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ node: clipboardNode, action: clipboardAction });
    } catch (err) {
      console.error('Clipboard listener error:', err);
    }
  });
}

export function setClipboard(node, action = 'copy') {
  clipboardNode = node ? { ...node } : null;
  clipboardAction = action;
  notify();
}

export function getClipboard() {
  return { node: clipboardNode, action: clipboardAction };
}

export function clearClipboard() {
  clipboardNode = null;
  clipboardAction = 'copy';
  notify();
}

/**
 * Generates an authentic macOS style copy name:
 * "Note 1.txt" -> "Note 1 copy.txt" -> "Note 1 copy 2.txt"
 * "Folder" -> "Folder copy" -> "Folder copy 2"
 */
export function generateCopyName(existingNames = [], originalName = 'Untitled') {
  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  let baseName = originalName;
  let ext = '';
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot > 0 && !originalName.slice(lastDot).includes(' ')) {
    baseName = originalName.slice(0, lastDot);
    ext = originalName.slice(lastDot);
  }

  const copyMatch = baseName.match(/^(.*?)\s+copy(?:\s+(\d+))?$/i);
  if (copyMatch) {
    baseName = copyMatch[1];
  }

  let candidate = `${baseName} copy${ext}`;
  let count = 2;
  while (existingNames.includes(candidate)) {
    candidate = `${baseName} copy ${count}${ext}`;
    count++;
  }
  return candidate;
}

/**
 * Deep-clones a node tree with fresh IDs and current timestamps
 */
export function cloneNodeRecursive(node, newName) {
  const prefix = node.kind === 'folder' ? 'folder' : (node.kind || 'file');
  const newId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const cloned = {
    ...node,
    id: newId,
    name: newName !== undefined ? newName : node.name,
    isCustom: true,
    createdAt: dateStr,
    modifiedAt: 'Just now'
  };

  if (Array.isArray(node.children)) {
    cloned.children = node.children.map((child) => cloneNodeRecursive(child));
  }

  return cloned;
}

/**
 * React hook to subscribe to the global OS clipboard
 */
export function useClipboard() {
  const [state, setState] = useState(() => ({ node: clipboardNode, action: clipboardAction }));

  useEffect(() => {
    const handler = (next) => setState(next);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const copy = useCallback((node) => {
    if (!node) return;
    setClipboard(node, 'copy');
  }, []);

  const cut = useCallback((node) => {
    if (!node) return;
    setClipboard(node, 'cut');
  }, []);

  const clear = useCallback(() => {
    clearClipboard();
  }, []);

  return {
    clipboard: state.node,
    clipboardAction: state.action,
    copy,
    cut,
    clear
  };
}
