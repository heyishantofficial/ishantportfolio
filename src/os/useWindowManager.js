import { useCallback, useRef, useState } from 'react';
import { findNode } from '../data/ishantOS';
import { isYouTubeUrl } from '../utils/mediaHelpers';

// The window state model from the spec: openWindows[], activeWindow,
// minimizedWindows[], each window with a unique id so several Finder or
// project windows can exist at once.

const DEFAULT_SIZES = {
  finder: { w: 880, h: 560 },
  text: { w: 560, h: 520 },
  project: { w: 860, h: 620 },
  pdf: { w: 720, h: 620 },
  mail: { w: 560, h: 520 },
  info: { w: 320, h: 470 },
  trash: { w: 480, h: 460 },
  media: { w: 760, h: 580 }
};

// A window opened at the same spot as the last one is invisible, so each new
// window steps down and to the right until it wraps.
const CASCADE_STEP = 28;
const CASCADE_WRAP = 6;

let seq = 0;
const nextId = () => `win-${++seq}`;

export default function useWindowManager() {
  const [windows, setWindows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const topZ = useRef(10);
  const cascade = useRef(0);

  const focusWindow = useCallback((id) => {
    topZ.current += 1;
    const z = topZ.current;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)));
    setActiveId(id);
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setActiveId((current) => {
        if (current !== id) return current;
        // Focus falls to whatever is now visually on top.
        const visible = next.filter((w) => !w.minimized);
        return visible.length ? visible.reduce((a, b) => (a.z > b.z ? a : b)).id : null;
      });
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
    setActiveId(null);
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
    focusWindow(id);
  }, [focusWindow]);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id, w, h) => {
    setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, w, h } : win)));
  }, []);

  /**
   * Open a window. Re-opening the same thing focuses the existing window
   * instead of stacking a duplicate, unless `fresh` is set (File > New Window).
   */
  const openWindow = useCallback((spec) => {
    const { type, nodeId = null, fresh = false, ...rest } = spec;
    const key = `${type}:${nodeId ?? 'root'}`;

    let openedId = null;
    setWindows((prev) => {
      if (!fresh) {
        const existing = prev.find((w) => w.key === key);
        if (existing) {
          openedId = existing.id;
          topZ.current += 1;
          return prev.map((w) => (w.id === existing.id ? { ...w, z: topZ.current, minimized: false } : w));
        }
      }

      const size = DEFAULT_SIZES[type] || DEFAULT_SIZES.finder;
      const step = cascade.current % CASCADE_WRAP;
      cascade.current += 1;
      topZ.current += 1;

      const id = nextId();
      openedId = id;

      // Centre the window, then cascade off that so stacked windows stay
      // reachable rather than landing exactly on top of each other.
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
      const w = Math.min(size.w, vw - 40);
      const h = Math.min(size.h, vh - 130);

      return [
        ...prev,
        {
          id,
          key,
          type,
          nodeId,
          z: topZ.current,
          minimized: false,
          maximized: false,
          x: Math.max(12, Math.round((vw - w) / 2) + step * CASCADE_STEP - 60),
          y: Math.max(40, Math.round((vh - h) / 2) + step * CASCADE_STEP - 60),
          w,
          h,
          ...rest
        }
      ];
    });

    if (openedId) setActiveId(openedId);
    return openedId;
  }, []);

  /** Open whatever kind of thing a filesystem node is. */
  const openNode = useCallback((node, options = {}) => {
    const resolved = typeof node === 'string' ? findNode(node) : node;
    if (!resolved) return null;

    switch (resolved.kind) {
      case 'folder':
        return openWindow({ type: 'finder', nodeId: resolved.id, ...options });
      case 'text':
        return openWindow({ type: 'text', nodeId: resolved.id, ...options });
      case 'project':
        return openWindow({ type: 'project', nodeId: resolved.id, ...options });
      case 'pdf':
        return openWindow({ type: 'pdf', nodeId: resolved.id, ...options });
      case 'mail':
        return openWindow({ type: 'mail', nodeId: resolved.id, ...options });
      case 'link':
        if (resolved.openMode === 'embed' && (isYouTubeUrl(resolved.href) || resolved.videoUrl)) {
          return openWindow({ type: 'media', nodeId: resolved.id, ...options });
        }
        window.open(resolved.href, '_blank', 'noopener,noreferrer');
        return null;
      case 'image':
      case 'video':
      case 'audio':
      case 'file':
        return openWindow({ type: 'media', nodeId: resolved.id, ...options });
      default:
        return null;
    }
  }, [openWindow]);

  const openGetInfo = useCallback((nodeId) => openWindow({ type: 'info', nodeId }), [openWindow]);

  return {
    windows,
    activeId,
    openWindow,
    openNode,
    openGetInfo,
    closeWindow,
    closeAll,
    focusWindow,
    minimizeWindow,
    toggleMaximize,
    moveWindow,
    resizeWindow
  };
}
