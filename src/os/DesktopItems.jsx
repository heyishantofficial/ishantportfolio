import React, { useCallback, useEffect, useRef, useState } from 'react';
import NodeIcon from './NodeIcon';
import { DESKTOP_ORDER, findNode, itemCountLabel } from '../data/ishantOS';

const HINT_KEY = 'ishantos.hint.dismissed';
const POSITIONS_KEY = 'ishantos.desktop.positions';

const ITEM_W = 92;
const ITEM_H = 96;
const TOP_MARGIN = 44;
const LEFT_MARGIN = 20;

function getDefaultPosition(index) {
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const usableH = Math.max(200, windowH - 140);
  const rowsPerCol = Math.max(1, Math.floor(usableH / ITEM_H));

  const col = Math.floor(index / rowsPerCol);
  const row = index % rowsPerCol;

  return {
    x: LEFT_MARGIN + col * (ITEM_W + 16),
    y: TOP_MARGIN + row * ITEM_H
  };
}

function loadSavedPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

/**
 * The desktop: seven items that can be dragged freely to any location on the desktop screen,
 * scattered randomly, or snapped back into a clean grid alignment.
 *
 * Below the phone breakpoint this becomes a touch list for mobile accessibility.
 */
export default function DesktopItems({ isCompact, onOpenNode, onGetInfo, onPlayClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const items = DESKTOP_ORDER.map(findNode).filter(Boolean);

  const [positions, setPositions] = useState(() => {
    const saved = loadSavedPositions();
    const initial = {};
    items.forEach((node, idx) => {
      if (saved[node.id] && typeof saved[node.id].x === 'number' && typeof saved[node.id].y === 'number') {
        initial[node.id] = saved[node.id];
      } else {
        initial[node.id] = getDefaultPosition(idx);
      }
    });
    return initial;
  });

  const dragInfo = useRef(null);

  // Scatter folders randomly across the desktop within safe bounds
  const randomizePositions = useCallback(() => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minX = 24;
    const maxX = Math.max(minX + 50, winW - 120);
    const minY = 46;
    const maxY = Math.max(minY + 50, winH - 160);

    const newPos = {};
    const placed = [];

    items.forEach((node) => {
      let attempts = 0;
      let x = minX;
      let y = minY;
      let ok = false;

      while (attempts < 35 && !ok) {
        x = Math.round(minX + Math.random() * (maxX - minX));
        y = Math.round(minY + Math.random() * (maxY - minY));
        const collision = placed.some(p => Math.hypot(p.x - x, p.y - y) < 85);
        if (!collision) ok = true;
        attempts++;
      }

      placed.push({ x, y });
      newPos[node.id] = { x, y };
    });

    setPositions(newPos);
    try {
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(newPos));
    } catch {}
  }, [items]);

  // Clean up and snap back to clean column grid
  const resetPositions = useCallback(() => {
    const gridPos = {};
    items.forEach((node, idx) => {
      gridPos[node.id] = getDefaultPosition(idx);
    });
    setPositions(gridPos);
    try {
      localStorage.removeItem(POSITIONS_KEY);
    } catch {}
  }, [items]);

  // Listen to system events from desktop context menu
  useEffect(() => {
    const handleRandomize = () => randomizePositions();
    const handleReset = () => resetPositions();
    window.addEventListener('ishantos:randomize-folders', handleRandomize);
    window.addEventListener('ishantos:reset-folders', handleReset);
    return () => {
      window.removeEventListener('ishantos:randomize-folders', handleRandomize);
      window.removeEventListener('ishantos:reset-folders', handleReset);
    };
  }, [randomizePositions, resetPositions]);

  // Keep positions clamped if window resizes
  useEffect(() => {
    const handleResize = () => {
      setPositions(prev => {
        let changed = false;
        const next = { ...prev };
        const maxX = Math.max(16, window.innerWidth - 110);
        const maxY = Math.max(36, window.innerHeight - 130);

        items.forEach(node => {
          if (next[node.id]) {
            const clampedX = Math.min(Math.max(16, next[node.id].x), maxX);
            const clampedY = Math.min(Math.max(36, next[node.id].y), maxY);
            if (clampedX !== next[node.id].x || clampedY !== next[node.id].y) {
              next[node.id] = { x: clampedX, y: clampedY };
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  // Pointer drag event handlers
  const handlePointerDown = (e, nodeId) => {
    if (e.button !== 0) return; // Only primary click
    e.stopPropagation();

    const currentPos = positions[nodeId] || { x: 24, y: 48 };
    dragInfo.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      originX: currentPos.x,
      originY: currentPos.y,
      hasDragged: false
    };

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragInfo.current) return;
    const { nodeId, startX, startY, originX, originY, hasDragged } = dragInfo.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasDragged && Math.hypot(dx, dy) > 4) {
      dragInfo.current.hasDragged = true;
      setActiveDragId(nodeId);
      setSelectedId(nodeId);
    }

    if (dragInfo.current.hasDragged) {
      const maxX = Math.max(16, window.innerWidth - 110);
      const maxY = Math.max(36, window.innerHeight - 120);
      const newX = Math.min(Math.max(16, originX + dx), maxX);
      const newY = Math.min(Math.max(36, originY + dy), maxY);

      setPositions(prev => ({
        ...prev,
        [nodeId]: { x: newX, y: newY }
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (!dragInfo.current) return;
    const { nodeId, hasDragged } = dragInfo.current;

    if (hasDragged) {
      setPositions(latest => {
        try {
          localStorage.setItem(POSITIONS_KEY, JSON.stringify(latest));
        } catch {}
        return latest;
      });
    } else {
      onPlayClick?.();
      setSelectedId(nodeId);
    }

    dragInfo.current = null;
    setActiveDragId(null);
  };

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
      <div className="mac-desktop-icons absolute inset-x-0 top-10 bottom-24 z-[10] px-5 overflow-y-auto flex flex-col justify-center">
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
        className="mac-desktop-icons absolute inset-0 z-[10] pointer-events-none select-none overflow-hidden"
        onClick={() => setSelectedId(null)}
      >
        {items.map((node) => {
          const isSelected = selectedId === node.id;
          const isDragging = activeDragId === node.id;
          const pos = positions[node.id] || { x: 24, y: 48 };

          return (
            <div
              key={node.id}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transition: isDragging
                  ? 'none'
                  : 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.12s ease'
              }}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={(e) => { e.stopPropagation(); onOpenNode(node); }}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpenNode(node); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedId(node.id);
                setMenu({ x: e.clientX, y: e.clientY, id: node.id });
              }}
              title={node.description}
              tabIndex={0}
              className={`absolute pointer-events-auto touch-none w-[92px] p-2 rounded-xl flex flex-col items-center text-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white select-none ${
                isDragging
                  ? 'cursor-grabbing z-30 scale-105 shadow-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/60'
                  : 'cursor-grab z-10'
              } ${
                isSelected && !isDragging ? 'bg-white/25 backdrop-blur-md ring-1 ring-white/50' : !isDragging ? 'hover:bg-white/10' : ''
              }`}
            >
              <NodeIcon node={node} size={52} />
              <span className="text-[11px] font-bold text-white leading-tight drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)] line-clamp-2 pointer-events-none">
                {node.name}
              </span>
              {node.kind === 'folder' && (
                <span className="text-[9px] text-white/70 drop-shadow pointer-events-none">{itemCountLabel(node)}</span>
              )}
            </div>
          );
        })}
      </div>

      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[99998] w-52 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px] select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onOpenNode(findNode(menu.id)); setMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2"
          >
            <span>📂 Open</span>
          </button>
          <button
            onClick={() => { onGetInfo(menu.id); setMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2"
          >
            <span>ℹ️ Get Info</span>
          </button>
          <div className="my-1 border-t border-black/10 dark:border-white/15" />
          <button
            onClick={() => { randomizePositions(); setMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2"
          >
            <span>🎲 Scatter Folders Randomly</span>
          </button>
          <button
            onClick={() => { resetPositions(); setMenu(null); }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2"
          >
            <span>🧹 Clean Up / Reset Grid</span>
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
