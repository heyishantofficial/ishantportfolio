import React, { useEffect, useState } from 'react';
import NodeIcon from './NodeIcon';
import { DESKTOP_ORDER, findNode, itemCountLabel } from '../data/ishantOS';

const HINT_KEY = 'ishantos.hint.dismissed';

/**
 * The desktop: seven items, nothing else. The apps live in the Dock.
 *
 * Below the phone breakpoint this stops pretending to be a desktop and becomes
 * a touch list — same folders, same destinations, no 24px double-click targets.
 */
export default function DesktopItems({ isCompact, onOpenNode, onGetInfo, onPlayClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const items = DESKTOP_ORDER.map(findNode).filter(Boolean);

  // The Cmd+K hint is for first-time visitors; once dismissed it stays gone.
  useEffect(() => {
    if (isCompact) return;
    try {
      if (!localStorage.getItem(HINT_KEY)) {
        const timer = setTimeout(() => setShowHint(true), 2600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Private browsing or blocked storage — just skip the hint.
    }
  }, [isCompact]);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* nothing to do */ }
  };

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (isCompact) {
    return (
      <div className="absolute inset-x-0 top-10 bottom-24 z-[10] px-5 overflow-y-auto flex flex-col justify-center">
        <h1 className="text-center text-white font-black tracking-[0.24em] text-[13px] drop-shadow-lg mb-5">
          ISHANTOS
        </h1>
        <div className="space-y-2">
          {items.map((node) => (
            <button
              key={node.id}
              onClick={() => onOpenNode(node)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.99] backdrop-blur-xl border border-white/25 text-left transition-all"
            >
              <NodeIcon node={node} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-white drop-shadow">{node.name}</span>
                <span className="block text-[10px] text-white/70 truncate">{node.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="mac-desktop-icons absolute top-10 left-5 bottom-24 z-[10] flex flex-col flex-wrap content-start gap-1 select-none"
        onClick={() => setSelectedId(null)}
      >
        {items.map((node) => {
          const isSelected = selectedId === node.id;
          return (
            <button
              key={node.id}
              onClick={(e) => { e.stopPropagation(); onPlayClick?.(); setSelectedId(node.id); }}
              onDoubleClick={() => onOpenNode(node)}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpenNode(node); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedId(node.id);
                setMenu({ x: e.clientX, y: e.clientY, id: node.id });
              }}
              title={node.description}
              className={`w-[92px] p-2 rounded-xl flex flex-col items-center text-center gap-1 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isSelected ? 'bg-white/25 backdrop-blur-md ring-1 ring-white/50' : 'hover:bg-white/10'
              }`}
            >
              <NodeIcon node={node} size={52} />
              <span className="text-[11px] font-bold text-white leading-tight drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)] line-clamp-2">
                {node.name}
              </span>
              {node.kind === 'folder' && (
                <span className="text-[9px] text-white/70 drop-shadow">{itemCountLabel(node)}</span>
              )}
            </button>
          );
        })}
      </div>

      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[99998] w-44 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onOpenNode(findNode(menu.id)); setMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-[var(--os-accent)] hover:text-white"
          >
            Open
          </button>
          <button
            onClick={() => { onGetInfo(menu.id); setMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-[var(--os-accent)] hover:text-white"
          >
            Get Info
          </button>
        </div>
      )}

      {/* The recruiter shortcut — quiet, and only shown once */}
      {showHint && (
        <button
          onClick={dismissHint}
          className="fixed bottom-24 right-5 z-[150] px-3.5 py-2 rounded-xl bg-black/45 hover:bg-black/60 backdrop-blur-xl border border-white/20 text-left text-white shadow-xl transition-colors animate-fadeIn"
        >
          <span className="block text-[10px] text-white/70">Looking for the important stuff?</span>
          <span className="block text-[12px] font-bold tracking-wide">Press ⌘K</span>
        </button>
      )}
    </>
  );
}
