import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Search, LayoutGrid, List as ListIcon,
  FileText, Sparkles, Mail, Link2, FileType2, Info, HardDrive, X
} from 'lucide-react';
import OSWindow from './OSWindow';
import NodeIcon from './NodeIcon';
import { DESKTOP_ORDER, findNode, getParentId, getPath, itemCountLabel } from '../data/ishantOS';

const KIND_LABEL = {
  folder: 'Folder',
  text: 'Text Document',
  project: 'Case Study',
  pdf: 'PDF Document',
  mail: 'Message',
  link: 'Web Link'
};

const KIND_ICON = {
  text: FileText,
  project: Sparkles,
  pdf: FileType2,
  mail: Mail,
  link: Link2
};

export default function FinderWindow({
  win, isActive, isCompact, onClose, onMinimize, onToggleMaximize, onFocus, onMove, onResize,
  onOpenNode, onGetInfo, onPlayClick
}) {
  // Per-window navigation history, so Back/Forward behave like Finder's.
  const [history, setHistory] = useState([win.nodeId || 'home']);
  const [cursor, setCursor] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState(win.view || 'grid');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(null);
  const gridRef = useRef(null);

  const currentId = history[cursor];
  const node = findNode(currentId);
  const path = useMemo(() => getPath(currentId), [currentId]);

  const children = useMemo(() => {
    const items = node?.children || [];
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [node, query]);

  // A selection that no longer exists in the current folder is confusing.
  useEffect(() => { setSelectedId(null); }, [currentId]);

  const navigate = (nodeId) => {
    setHistory((prev) => [...prev.slice(0, cursor + 1), nodeId]);
    setCursor((c) => c + 1);
    setQuery('');
  };

  const goBack = () => cursor > 0 && setCursor((c) => c - 1);
  const goForward = () => cursor < history.length - 1 && setCursor((c) => c + 1);
  const goUp = () => {
    const parent = getParentId(currentId);
    if (parent) navigate(parent);
  };

  const open = (child) => {
    onPlayClick?.();
    if (child.kind === 'folder') navigate(child.id);
    else onOpenNode(child);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setMenu(null); return; }

    const index = children.findIndex((c) => c.id === selectedId);

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = children[index] || children[0];
      if (target) open(target);
      return;
    }
    if (e.key === 'Backspace' || (e.metaKey && e.key === '[')) {
      e.preventDefault();
      if (cursor > 0) goBack(); else goUp();
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;

    e.preventDefault();
    if (!children.length) return;

    // The grid wraps at 4 across on desktop; the list view is a single column.
    const perRow = view === 'grid' ? 4 : 1;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow }[e.key];
    const nextIndex = index === -1 ? 0 : Math.min(children.length - 1, Math.max(0, index + delta));
    setSelectedId(children[nextIndex].id);
  };

  const toolbar = (
    <>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={goBack}
          disabled={cursor === 0}
          aria-label="Back"
          className="w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-200 enabled:hover:bg-black/5 dark:enabled:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
          title="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goForward}
          disabled={cursor >= history.length - 1}
          aria-label="Forward"
          className="w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-200 enabled:hover:bg-black/5 dark:enabled:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
          title="Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 min-w-0 mx-1">
        <img src="/icons/Folder.png" alt="" className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-sm opacity-90" />
        <h2 className="text-[13px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
          {node?.name || 'Finder'}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-2.5 shrink-0">
        <div className="mac-segmented-control hidden sm:inline-flex">
          <button
            onClick={() => setView('grid')}
            aria-label="Icon view"
            aria-pressed={view === 'grid'}
            className={`mac-segmented-btn ${view === 'grid' ? 'mac-segmented-btn-active' : ''}`}
            title="Icons"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={`mac-segmented-btn ${view === 'list' ? 'mac-segmented-btn-active' : ''}`}
            title="List"
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label={`Search in ${node?.name || 'folder'}`}
            className="mac-search-field w-28 sm:w-36 focus:w-44 pr-6"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 w-3.5 h-3.5 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-[9px]"
              title="Clear search"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <OSWindow
      win={win}
      isActive={isActive}
      isCompact={isCompact}
      title={node?.name || 'Finder'}
      onClose={onClose}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
      onFocus={onFocus}
      onMove={onMove}
      onResize={onResize}
      toolbar={toolbar}
    >
      <div className="h-full flex" onClick={() => setMenu(null)}>
        {/* Sidebar */}
        <nav
          aria-label="Favourites"
          className="hidden sm:flex w-44 shrink-0 flex-col gap-0.5 p-2.5 border-r border-black/[0.08] dark:border-white/[0.08] bg-[var(--mac-glass-sidebar)] overflow-y-auto select-none"
        >
          <div className="px-2 pt-0.5 pb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
            Favorites
          </div>
          {DESKTOP_ORDER.map((id) => {
            const item = findNode(id);
            if (!item) return null;
            const isHere = path.some((p) => p.id === id);
            return (
              <button
                key={id}
                onClick={() => (item.kind === 'folder' ? navigate(id) : onOpenNode(item))}
                className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12.5px] font-medium flex items-center gap-2.5 transition-all ${
                  isHere
                    ? 'bg-[#007aff] text-white shadow-sm font-semibold'
                    : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                }`}
              >
                <NodeIcon node={item} size={16} className={isHere ? 'brightness-110' : ''} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>


        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="listbox"
            aria-label={`Contents of ${node?.name || 'folder'}`}
            className="flex-1 overflow-y-auto p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--os-accent)]"
            onClick={() => setSelectedId(null)}
          >
            {node?.statusLine && (
              <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-1 px-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {Object.entries(node.statusLine).map(([label, value]) => (
                  <div key={label} className="flex gap-1.5">
                    <dt className="uppercase tracking-wider">{label}:</dt>
                    <dd className="font-bold text-slate-800 dark:text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {children.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">
                {query ? `Nothing here matches "${query}".` : 'This folder is empty.'}
              </p>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {children.map((child) => (
                  <GridItem
                    key={child.id}
                    node={child}
                    isSelected={selectedId === child.id}
                    onSelect={() => { onPlayClick?.(); setSelectedId(child.id); }}
                    onOpen={() => open(child)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedId(child.id);
                      setMenu({ x: e.clientX, y: e.clientY, node: child });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div role="presentation" className="divide-y divide-black/5 dark:divide-white/5">
                {children.map((child) => (
                  <ListItem
                    key={child.id}
                    node={child}
                    isSelected={selectedId === child.id}
                    onSelect={() => { onPlayClick?.(); setSelectedId(child.id); }}
                    onOpen={() => open(child)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedId(child.id);
                      setMenu({ x: e.clientX, y: e.clientY, node: child });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Breadcrumb / path bar */}
          <div className="shrink-0 h-7 px-3 flex items-center gap-1.5 border-t border-black/[0.08] dark:border-white/[0.08] bg-[var(--mac-glass-footer)] text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto select-none">
            <HardDrive className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-medium">Macintosh HD</span>
            <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-60" />
            {path.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-60" />}
                <button
                  onClick={() => p.kind === 'folder' && navigate(p.id)}
                  className={`flex items-center gap-1 hover:text-[#007aff] font-medium whitespace-nowrap transition-colors ${
                    i === path.length - 1 ? 'text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold' : ''
                  }`}
                >
                  {p.name}
                </button>
              </React.Fragment>
            ))}
            <span className="ml-auto pl-3 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
              {children.length} item{children.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Item context menu — Get Info lives here, as in Finder */}
      {menu && (
        <div
          style={{ top: menu.y - (win.y || 0), left: menu.x - (win.x || 0) }}
          className="fixed z-[999] w-44 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { open(menu.node); setMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white"
          >
            Open
          </button>
          <button
            onClick={() => { onGetInfo(menu.node.id); setMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
          >
            <Info className="w-3.5 h-3.5" /> Get Info
          </button>
        </div>
      )}
    </OSWindow>
  );
}

function GridItem({ node, isSelected, onSelect, onOpen, onContextMenu }) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      title={node.description}
      className={`p-2.5 rounded-lg flex flex-col items-center text-center gap-1 cursor-pointer transition-colors group ${
        isSelected ? 'bg-black/[0.04] dark:bg-white/[0.06]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className="relative mb-1 transition-transform group-active:scale-95">
        <NodeIcon node={node} size={58} />
      </div>
      <span
        className={`text-[12px] font-medium leading-tight line-clamp-2 px-2 py-0.5 rounded-[4px] transition-colors max-w-[110px] break-words ${
          isSelected
            ? 'bg-[#007aff] text-white shadow-sm font-semibold'
            : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
        }`}
      >
        {node.name}
      </span>
      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
        {node.kind === 'folder' ? itemCountLabel(node) : KIND_LABEL[node.kind]}
      </span>
    </div>
  );
}

function ListItem({ node, isSelected, onSelect, onOpen, onContextMenu }) {
  const Icon = KIND_ICON[node.kind];
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={`px-2.5 py-1.5 flex items-center gap-3 cursor-pointer rounded-md transition-colors ${
        isSelected
          ? 'bg-[#007aff] text-white shadow-sm'
          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
      }`}
    >
      <NodeIcon node={node} size={22} />
      <div className="min-w-0 flex-1">
        <div className={`text-[12.5px] font-medium truncate ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
          {node.name}
        </div>
        {node.description && (
          <div className={`text-[10.5px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {node.description}
          </div>
        )}
      </div>
      <div className={`hidden sm:flex items-center gap-1.5 text-[10.5px] shrink-0 ${isSelected ? 'text-white/85' : 'text-slate-400'}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{node.kind === 'folder' ? itemCountLabel(node) : KIND_LABEL[node.kind]}</span>
      </div>
    </div>
  );
}

