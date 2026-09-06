import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NodeIcon from './NodeIcon';
import { DESKTOP_ORDER, findNode, getParentId, itemCountLabel } from '../data/ishantOS';
import { useFileSystem } from '../utils/useFileSystem';
import { useAdminAuth } from '../utils/useAdminAuth';
import AdminAuthModal from '../components/AdminAuthModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { playMacClick, playTrashSound } from '../utils/macAudioEngine';
import { Trash2, Lock, Edit3, Copy, Clipboard, CopyPlus } from 'lucide-react';

const HINT_KEY = 'ishantos.hint.dismissed';
const POSITIONS_KEY = 'ishantos.desktop.positions_v4';
const LEGACY_POSITIONS_KEY = 'ishantos.desktop.positions';

const ITEM_W = 100;
const ITEM_H = 108;
const TOP_MARGIN = 38;
const LEFT_MARGIN = 20;

function getDefaultPosition(index, totalItems = 7) {
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
  // If window height comfortably allows the default desktop items in 1 column:
  const minHeightForSingleCol = TOP_MARGIN + totalItems * ITEM_H + 40;
  const usableH = Math.max(200, windowH - 80);
  const rowsPerCol = (windowH >= minHeightForSingleCol) 
    ? totalItems 
    : Math.max(1, Math.floor(usableH / ITEM_H));

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
 * The desktop: items that can be dragged freely to any location on the desktop screen,
 * scattered randomly, or snapped back into a clean grid alignment.
 *
 * Below the phone breakpoint this becomes a touch list for mobile accessibility.
 */
export default function DesktopItems({ isCompact, onOpenNode, onGetInfo, onPlayClick, isMuted }) {
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');
  const renameInputRef = useRef(null);

  const { version, deleteNode, renameNode, clipboard, copyNode, pasteNode, duplicateNode } = useFileSystem();
  const { isAdmin } = useAdminAuth();

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      playTrashSound(isMuted);
      await deleteNode(deleteTarget.id);
      setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    if (pendingAction) {
      if (pendingAction.type === 'paste') {
        await pasteNode(pendingAction.targetId || 'home');
        playMacClick(isMuted);
      } else if (pendingAction.type === 'duplicate') {
        const parentId = getParentId(pendingAction.targetId) || 'home';
        await duplicateNode(pendingAction.targetId, parentId);
        playMacClick(isMuted);
      }
      setPendingAction(null);
    }
  };

  const startRenaming = useCallback((node) => {
    if (!isAdmin) {
      setShowAuthModal(true);
      return;
    }
    setRenamingId(node.id);
    setRenameText(node.name);
  }, [isAdmin]);

  const commitRename = useCallback(async (nodeId) => {
    if (renameText && renameText.trim()) {
      await renameNode(nodeId, renameText.trim());
    }
    setRenamingId(null);
  }, [renameText, renameNode]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  useEffect(() => {
    if (renamingId) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    }
  }, [renamingId]);

  const items = useMemo(() => {
    const homeNode = findNode('home');
    const allChildren = homeNode?.children || [];
    const ordered = DESKTOP_ORDER.map(findNode).filter(Boolean);
    const orderedIds = new Set(ordered.map((n) => n.id));
    const extra = allChildren.filter((n) => n && !orderedIds.has(n.id));
    return [...ordered, ...extra];
  }, [version]);

  const [positions, setPositions] = useState(() => {
    const saved = loadSavedPositions();
    const initial = {};
    items.forEach((node, idx) => {
      if (saved[node.id] && typeof saved[node.id].x === 'number' && typeof saved[node.id].y === 'number') {
        initial[node.id] = saved[node.id];
      } else {
        initial[node.id] = getDefaultPosition(idx, items.length);
      }
    });
    return initial;
  });

  // Assign default positions to newly added/pasted items
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      items.forEach((node, idx) => {
        if (!next[node.id]) {
          next[node.id] = getDefaultPosition(idx, items.length);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items]);

  const dragInfo = useRef(null);

  // Scatter folders randomly across the desktop within safe bounds
  const randomizePositions = useCallback(() => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minX = 24;
    const maxX = Math.max(minX + 50, winW - 130);
    const minY = 46;
    const maxY = Math.max(minY + 50, winH - 160);

    const newPos = {};
    const placed = [];

    items.forEach((node) => {
      let attempts = 0;
      let x = minX;
      let y = minY;
      let ok = false;

      while (attempts < 40 && !ok) {
        x = Math.round(minX + Math.random() * (maxX - minX));
        y = Math.round(minY + Math.random() * (maxY - minY));
        const collision = placed.some(p => Math.hypot(p.x - x, p.y - y) < 105);
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
      gridPos[node.id] = getDefaultPosition(idx, items.length);
    });
    setPositions(gridPos);
    try {
      localStorage.removeItem(POSITIONS_KEY);
      localStorage.removeItem('ishantos.desktop.positions_v3');
      localStorage.removeItem(LEGACY_POSITIONS_KEY);
    } catch {}
  }, [items]);

  // Listen to system events from desktop context menu
  useEffect(() => {
    const handleRandomize = () => randomizePositions();
    const handleReset = () => resetPositions();
    window.addEventListener('ishantos:randomize-folders', handleRandomize);
    window.addEventListener('ishantos:reset-folders', handleReset);
    window.addEventListener('storage', handleReset);
    return () => {
      window.removeEventListener('ishantos:randomize-folders', handleRandomize);
      window.removeEventListener('ishantos:reset-folders', handleReset);
      window.removeEventListener('storage', handleReset);
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
        onClick={() => {
          setSelectedId(null);
          if (renamingId) commitRename(renamingId);
        }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isAdmin) {
                    e.preventDefault();
                    startRenaming(node);
                  } else {
                    onOpenNode(node);
                  }
                } else if ((e.key === 'Backspace' || e.key === 'Delete') && isAdmin) {
                  e.preventDefault();
                  setDeleteTarget(node);
                } else if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C') && isAdmin) {
                  e.preventDefault();
                  copyNode(node);
                  playMacClick(isMuted);
                } else if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D') && isAdmin) {
                  e.preventDefault();
                  const parentId = getParentId(node.id) || 'home';
                  duplicateNode(node.id, parentId);
                  playMacClick(isMuted);
                } else if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V') && isAdmin && clipboard) {
                  e.preventDefault();
                  const targetParentId = node.kind === 'folder' ? node.id : 'home';
                  pasteNode(targetParentId);
                  playMacClick(isMuted);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedId(node.id);
                setMenu({ x: e.clientX, y: e.clientY, id: node.id });
              }}
              title={node.description}
              tabIndex={0}
              className={`absolute pointer-events-auto touch-none w-[100px] p-1.5 rounded-lg flex flex-col items-center text-center gap-1 focus:outline-none select-none transition-transform ${
                isDragging
                  ? 'cursor-grabbing z-30 scale-105 opacity-90'
                  : 'cursor-grab z-10 hover:scale-[1.02]'
              }`}
            >
              <div className="relative mb-0.5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]">
                <NodeIcon node={node} size={54} />
              </div>
              {renamingId === node.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename(node.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  onBlur={() => commitRename(node.id)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[11.5px] font-medium leading-tight px-1.5 py-0.5 rounded bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-2 border-[#007aff] shadow-xl outline-none text-center max-w-[100px] w-full z-40"
                />
              ) : (
                <span
                  onClick={(e) => {
                    if (isSelected && isAdmin) {
                      e.stopPropagation();
                      startRenaming(node);
                    }
                  }}
                  title={node.name}
                  className={`text-[11.5px] font-medium leading-tight whitespace-nowrap max-w-[98px] truncate px-1.5 py-0.5 rounded-[4px] pointer-events-auto transition-colors ${
                    isSelected
                      ? 'bg-[#007aff] text-white shadow-sm font-semibold'
                      : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                  }`}
                >
                  {node.name}
                </span>
              )}
              {node.kind === 'folder' && (
                <span className="text-[9.5px] text-white/80 font-normal whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none -mt-0.5">
                  {itemCountLabel(node)}
                </span>
              )}
            </div>

          );
        })}
      </div>

      {menu && (() => {
        const targetNode = findNode(menu.id);
        return (
          <div
            style={{ top: menu.y, left: menu.x }}
            className="fixed z-[99998] w-56 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px] select-none animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { if (targetNode) onOpenNode(targetNode); setMenu(null); }}
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

            {isAdmin ? (
              <>
                <div className="my-1 border-t border-black/10 dark:border-white/15" />

                {/* Copy */}
                <button
                  onClick={() => {
                    if (targetNode) {
                      copyNode(targetNode);
                      playMacClick(isMuted);
                    }
                    setMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">⌘C</span>
                </button>

                {/* Duplicate */}
                <button
                  onClick={async () => {
                    const targetId = menu.id;
                    setMenu(null);
                    const parentId = getParentId(targetId) || 'home';
                    await duplicateNode(targetId, parentId);
                    playMacClick(isMuted);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CopyPlus className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">⌘D</span>
                </button>

                {/* Paste into Folder if folder and clipboard has node */}
                {targetNode?.kind === 'folder' && clipboard && (
                  <button
                    onClick={async () => {
                      const folderId = menu.id;
                      setMenu(null);
                      await pasteNode(folderId);
                      playMacClick(isMuted);
                    }}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center justify-between text-blue-600 dark:text-blue-400 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate mr-2">
                      <Clipboard className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Paste into "{targetNode.name}"</span>
                    </span>
                    <span className="text-[10px] opacity-60 font-mono shrink-0">⌘V</span>
                  </button>
                )}

                <div className="my-1 border-t border-black/10 dark:border-white/15" />
                <button
                  onClick={() => {
                    const target = findNode(menu.id);
                    setMenu(null);
                    if (target) startRenaming(target);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    const target = findNode(menu.id) || { id: menu.id, name: 'this item', kind: 'folder' };
                    setDeleteTarget(target);
                    setMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <>
                <div className="my-1 border-t border-black/10 dark:border-white/15" />
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Login to Edit...</span>
                </button>
              </>
            )}
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
        );
      })()}

      {/* Admin Auth Modal for Desktop context menu */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
        initialPrompt="Enter admin password to manage, paste, and duplicate folders and files."
      />

      {/* Confirmation Modal before deleting */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        target={deleteTarget}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

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
