import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import useWindowManager from './useWindowManager';
import FinderWindow from './FinderWindow';
import { TextWindow, ProjectWindow, PdfWindow, MailWindow, InfoWindow, TrashWindow, MediaWindow } from './ContentWindows';
import CommandPalette from './CommandPalette';
import DesktopItems from './DesktopItems';
import NodeIcon from './NodeIcon';
import QuickLookPanel from './QuickLookPanel';
import { findNode } from '../data/ishantOS';
import { playMacClick, playQuickLookSound } from '../utils/macAudioEngine';

const COMPACT_BREAKPOINT = 640;

class QuickLookErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('QuickLook Error Boundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
          onClick={this.props.onClose}
        >
          <div
            className="p-6 rounded-2xl bg-[#1c1d22] border border-white/20 text-white max-w-sm text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-bold">Quick Look Preview</h3>
            <p className="text-[12px] text-white/60 mt-2">
              Preview could not be displayed for this item.
            </p>
            <button
              onClick={this.props.onClose}
              className="mt-4 px-4 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-[12px] font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * The folder layer of IshantOS: desktop items, every open window, the
 * minimized-window tray and the Cmd+K palette.
 *
 * App.jsx holds a ref to this so the menu bar, Spotlight, the Terminal and the
 * dock can all open the same windows without duplicating the routing logic.
 */
const IshantOS = forwardRef(function IshantOS({ isMuted, onActiveTitleChange, socialLinks, contactEmail }, ref) {
  const wm = useWindowManager();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickLook, setQuickLook] = useState(null); // { node, items: [], currentIndex: number }
  const [isCompact, setIsCompact] = useState(
    typeof window !== 'undefined' ? window.innerWidth < COMPACT_BREAKPOINT : false
  );

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < COMPACT_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const click = useCallback(() => playMacClick(isMuted), [isMuted]);

  const openQuickLook = useCallback((targetNode, siblingItems = []) => {
    let resolved = targetNode;
    if (typeof targetNode === 'string') resolved = findNode(targetNode);
    if (!resolved) return;
    const safeSiblings = (Array.isArray(siblingItems) ? siblingItems : [resolved]).filter(Boolean);
    const items = safeSiblings.length > 0 ? safeSiblings : [resolved];
    const idx = items.findIndex((item) => item?.id === resolved.id);
    playQuickLookSound(isMuted, false);
    setQuickLook({
      node: resolved,
      items,
      currentIndex: idx !== -1 ? idx : 0
    });
  }, [isMuted]);

  const closeQuickLook = useCallback(() => {
    playQuickLookSound(isMuted, true);
    setQuickLook(null);
  }, [isMuted]);

  const toggleQuickLook = useCallback((targetNode, siblingItems = []) => {
    let resolved = targetNode;
    if (typeof targetNode === 'string') resolved = findNode(targetNode);
    if (!resolved) return;
    if (quickLook && quickLook.node?.id === resolved.id) {
      closeQuickLook();
    } else {
      openQuickLook(resolved, siblingItems);
    }
  }, [quickLook, closeQuickLook, openQuickLook]);

  const navigateQuickLook = useCallback((nextNode, nextIndex) => {
    click();
    setQuickLook((prev) => (prev ? {
      ...prev,
      node: nextNode,
      currentIndex: nextIndex
    } : null));
  }, [click]);

  const openNode = useCallback((node, options) => {
    click();
    let targetNode = node;
    if (typeof node === 'string') targetNode = findNode(node);
    if (targetNode?.id === 'contact-instagram' && socialLinks?.instagram) {
      targetNode = { ...targetNode, href: socialLinks.instagram };
    }
    if (targetNode?.id === 'contact-linkedin' && socialLinks?.linkedin) {
      targetNode = { ...targetNode, href: socialLinks.linkedin };
    }
    if (targetNode?.id === 'contact-youtube' && socialLinks?.youtube) {
      targetNode = { ...targetNode, href: socialLinks.youtube };
    }
    if (targetNode?.id === 'contact-github' && socialLinks?.github) {
      targetNode = { ...targetNode, href: socialLinks.github };
    }
    return wm.openNode(targetNode, options);
  }, [wm, click, socialLinks]);

  useImperativeHandle(ref, () => ({
    openNode,
    openId: (id, options) => openNode(findNode(id), options),
    openTrash: () => wm.openWindow({ type: 'trash', nodeId: 'trash' }),
    openPalette: () => setPaletteOpen(true),
    newFinderWindow: () => wm.openWindow({ type: 'finder', nodeId: 'home', fresh: true }),
    closeActive: () => wm.activeId && wm.closeWindow(wm.activeId),
    hasWindows: () => wm.windows.length > 0,
    openQuickLook,
    toggleQuickLook,
    closeQuickLook,
    isQuickLookOpen: Boolean(quickLook)
  }), [openNode, wm, openQuickLook, toggleQuickLook, closeQuickLook, quickLook]);

  // Report the frontmost window's name to the menu bar, the way macOS does.
  useEffect(() => {
    if (!onActiveTitleChange) return;
    const active = wm.windows.find((w) => w.id === wm.activeId);
    if (!active) return;
    const node = findNode(active.nodeId);
    onActiveTitleChange(active.type === 'trash' ? 'Trash' : node?.name || 'Finder');
  }, [wm.activeId, wm.windows, onActiveTitleChange]);

  // Window-level and Quick Look shortcuts.
  useEffect(() => {
    const onKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) ||
        activeEl.isContentEditable
      );

      // Check if typing in an input or contentEditable
      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.keyCode === 32;

      // Quick Look active controls
      if (quickLook) {
        if (isSpace || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeQuickLook();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const target = quickLook.node;
          closeQuickLook();
          openNode(target);
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (quickLook.currentIndex > 0 && Array.isArray(quickLook.items)) {
            const nextIdx = quickLook.currentIndex - 1;
            const nextNode = quickLook.items[nextIdx];
            if (nextNode) navigateQuickLook(nextNode, nextIdx);
          }
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (Array.isArray(quickLook.items) && quickLook.currentIndex < quickLook.items.length - 1) {
            const nextIdx = quickLook.currentIndex + 1;
            const nextNode = quickLook.items[nextIdx];
            if (nextNode) navigateQuickLook(nextNode, nextIdx);
          }
          return;
        }
      }

      if (isInput) return; // Do not intercept other shortcuts when typing in inputs

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
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wm, paletteOpen, quickLook, closeQuickLook, navigateQuickLook, openNode]);

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
            onToggleQuickLook={toggleQuickLook}
            onQuickLookChange={openQuickLook}
            isQuickLookOpen={Boolean(quickLook)}
            quickLookNodeId={quickLook?.node?.id}
          />
        );
      case 'text': return <TextWindow key={win.id} {...shared} />;
      case 'project': return <ProjectWindow key={win.id} {...shared} />;
      case 'pdf': return <PdfWindow key={win.id} {...shared} />;
      case 'mail': return <MailWindow key={win.id} {...shared} contactEmail={contactEmail} />;
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
        isMuted={isMuted}
        onToggleQuickLook={toggleQuickLook}
        onQuickLookChange={openQuickLook}
        isQuickLookOpen={Boolean(quickLook)}
        quickLookNodeId={quickLook?.node?.id}
        isDesktopActive={!wm.activeId}
        onFocusDesktop={() => wm.focusWindow(null)}
      />

      <AnimatePresence>
        {wm.windows.filter((w) => !w.minimized).map(renderWindow)}
      </AnimatePresence>

      {/* macOS Spacebar Quick Look Preview Modal */}
      <AnimatePresence>
        {quickLook && (
          <QuickLookErrorBoundary
            key={quickLook.node?.id || 'quick-look'}
            onClose={closeQuickLook}
          >
            <QuickLookPanel
              node={quickLook.node}
              items={quickLook.items}
              currentIndex={quickLook.currentIndex}
              onNavigate={navigateQuickLook}
              onClose={closeQuickLook}
              onOpenNode={openNode}
              isMuted={isMuted}
            />
          </QuickLookErrorBoundary>
        )}
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
