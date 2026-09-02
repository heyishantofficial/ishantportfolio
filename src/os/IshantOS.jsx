import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import useWindowManager from './useWindowManager';
import FinderWindow from './FinderWindow';
import { TextWindow, ProjectWindow, PdfWindow, MailWindow, InfoWindow, TrashWindow, MediaWindow } from './ContentWindows';
import CommandPalette from './CommandPalette';
import DesktopItems from './DesktopItems';
import NodeIcon from './NodeIcon';
import { findNode } from '../data/ishantOS';
import { playMacClick } from '../utils/macAudioEngine';

const COMPACT_BREAKPOINT = 640;

/**
 * The folder layer of IshantOS: desktop items, every open window, the
 * minimized-window tray and the Cmd+K palette.
 *
 * App.jsx holds a ref to this so the menu bar, Spotlight, the Terminal and the
 * dock can all open the same windows without duplicating the routing logic.
 */
const IshantOS = forwardRef(function IshantOS({ isMuted, onActiveTitleChange }, ref) {
  const wm = useWindowManager();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(
    typeof window !== 'undefined' ? window.innerWidth < COMPACT_BREAKPOINT : false
  );

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < COMPACT_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const click = useCallback(() => playMacClick(isMuted), [isMuted]);

  const openNode = useCallback((node, options) => {
    click();
    return wm.openNode(node, options);
  }, [wm, click]);

  useImperativeHandle(ref, () => ({
    openNode,
    openId: (id, options) => openNode(findNode(id), options),
    openTrash: () => wm.openWindow({ type: 'trash', nodeId: 'trash' }),
    openPalette: () => setPaletteOpen(true),
    newFinderWindow: () => wm.openWindow({ type: 'finder', nodeId: 'home', fresh: true }),
    closeActive: () => wm.activeId && wm.closeWindow(wm.activeId),
    hasWindows: () => wm.windows.length > 0
  }), [openNode, wm]);

  // Report the frontmost window's name to the menu bar, the way macOS does.
  useEffect(() => {
    if (!onActiveTitleChange) return;
    const active = wm.windows.find((w) => w.id === wm.activeId);
    if (!active) return;
    const node = findNode(active.nodeId);
    onActiveTitleChange(active.type === 'trash' ? 'Trash' : node?.name || 'Finder');
  }, [wm.activeId, wm.windows, onActiveTitleChange]);

  // Window-level shortcuts. Cmd+Space stays with Spotlight (App.jsx owns it).
  useEffect(() => {
    const onKeyDown = (e) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (meta && e.key.toLowerCase() === 'w' && wm.activeId) {
        e.preventDefault();
        wm.closeWindow(wm.activeId);
        return;
      }
      if (meta && e.key.toLowerCase() === 'm' && wm.activeId) {
        e.preventDefault();
        wm.minimizeWindow(wm.activeId);
        return;
      }
      if (e.key === 'Escape') {
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (wm.activeId) wm.closeWindow(wm.activeId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wm, paletteOpen]);

  const minimized = wm.windows.filter((w) => w.minimized);

  const renderWindow = (win) => {
    const shared = {
      win,
      isActive: win.id === wm.activeId,
      isCompact,
      onClose: () => { click(); wm.closeWindow(win.id); },
      onMinimize: () => { click(); wm.minimizeWindow(win.id); },
      onToggleMaximize: () => wm.toggleMaximize(win.id),
      onFocus: () => wm.focusWindow(win.id),
      onMove: (x, y) => wm.moveWindow(win.id, x, y),
      onResize: (w, h) => wm.resizeWindow(win.id, w, h)
    };

    switch (win.type) {
      case 'finder':
        return (
          <FinderWindow
            key={win.id}
            {...shared}
            onOpenNode={openNode}
            onGetInfo={wm.openGetInfo}
            onPlayClick={click}
          />
        );
      case 'text': return <TextWindow key={win.id} {...shared} />;
      case 'project': return <ProjectWindow key={win.id} {...shared} />;
      case 'pdf': return <PdfWindow key={win.id} {...shared} />;
      case 'mail': return <MailWindow key={win.id} {...shared} />;
      case 'info': return <InfoWindow key={win.id} {...shared} />;
      case 'trash': return <TrashWindow key={win.id} {...shared} />;
      case 'media': return <MediaWindow key={win.id} {...shared} />;
      default: return null;
    }
  };

  return (
    <>
      <DesktopItems
        isCompact={isCompact}
        onOpenNode={openNode}
        onGetInfo={wm.openGetInfo}
        onPlayClick={click}
      />

      <AnimatePresence>
        {wm.windows.filter((w) => !w.minimized).map(renderWindow)}
      </AnimatePresence>

      {/* Minimized windows park here rather than vanishing */}
      {minimized.length > 0 && (
        <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-[190] flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 shadow-xl">
          {minimized.map((win) => {
            const node = findNode(win.nodeId);
            return (
              <button
                key={win.id}
                onClick={() => wm.focusWindow(win.id)}
                title={`Restore ${node?.name || 'window'}`}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/15 hover:bg-white/30 text-white text-[10px] font-semibold transition-colors max-w-[160px]"
              >
                {node ? <NodeIcon node={node} size={14} /> : null}
                <span className="truncate">{win.type === 'trash' ? 'Trash' : node?.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} onOpenNode={openNode} />
      )}
    </>
  );
});

export default IshantOS;
