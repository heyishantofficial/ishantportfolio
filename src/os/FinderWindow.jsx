import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Search, LayoutGrid, List as ListIcon,
  FileText, Sparkles, Mail, Link2, FileType2, Info, HardDrive, X,
  Lock, Unlock, FolderPlus, Upload, Edit3, Trash2, ShieldCheck
} from 'lucide-react';
import OSWindow from './OSWindow';
import NodeIcon from './NodeIcon';
import { DESKTOP_ORDER, findNode, getParentId, getPath, itemCountLabel } from '../data/ishantOS';
import { useAdminAuth } from '../utils/useAdminAuth';
import { useFileSystem } from '../utils/useFileSystem';
import { readFileAsNode } from '../utils/fsStorage';
import AdminAuthModal from '../components/AdminAuthModal';

const KIND_LABEL = {
  folder: 'Folder',
  text: 'Text Document',
  project: 'Case Study',
  pdf: 'PDF Document',
  mail: 'Message',
  link: 'Web Link',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  file: 'Document'
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
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Admin & FileSystem hooks
  const { isAdmin, lock } = useAdminAuth();
  const { addFolder, addFile, renameNode, deleteNode, version } = useFileSystem();

  // Auth modal & pending action states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPrompt, setAuthPrompt] = useState('');
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Renaming state
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);

  const currentId = history[cursor];
  const node = findNode(currentId);
  const path = useMemo(() => getPath(currentId), [currentId, version]);

  const children = useMemo(() => {
    // version forces re-evaluation when folders/files are added/renamed/deleted
    const items = node?.children || [];
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [node, query, version]);

  // A selection that no longer exists in the current folder is confusing.
  useEffect(() => {
    setSelectedId(null);
    setRenamingId(null);
  }, [currentId]);

  const navigate = (nodeId) => {
    setHistory((prev) => [...prev.slice(0, cursor + 1), nodeId]);
    setCursor((c) => c + 1);
    setQuery('');
    setSelectedId(null);
    setRenamingId(null);
  };

  const goBack = () => {
    if (cursor > 0) {
      setCursor((c) => c - 1);
      setSelectedId(null);
      setRenamingId(null);
    }
  };

  const goForward = () => {
    if (cursor < history.length - 1) {
      setCursor((c) => c + 1);
      setSelectedId(null);
      setRenamingId(null);
    }
  };

  const goUp = () => {
    const parent = getParentId(currentId);
    if (parent) navigate(parent);
  };

  const open = (child) => {
    if (renamingId === child.id) return;
    onPlayClick?.();
    if (child.kind === 'folder') navigate(child.id);
    else onOpenNode(child);
  };

  // Renaming helpers
  const startRenaming = useCallback((item) => {
    if (!isAdmin) {
      setAuthPrompt('Enter admin password to rename files and folders.');
      setPendingAction({ type: 'rename', node: item });
      setShowAuthModal(true);
      return;
    }
    setRenamingId(item.id);
    setRenameText(item.name);
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

  // Creation helpers
  const handleNewFolder = useCallback(async () => {
    if (!isAdmin) {
      setAuthPrompt('Enter admin password to create a new folder.');
      setPendingAction({ type: 'new-folder' });
      setShowAuthModal(true);
      return;
    }

    const newFolder = await addFolder(currentId, 'untitled folder');
    if (newFolder) {
      setSelectedId(newFolder.id);
      setRenamingId(newFolder.id);
      setRenameText('untitled folder');
    }
  }, [isAdmin, addFolder, currentId]);

  const handleNewTextFile = useCallback(async () => {
    if (!isAdmin) {
      setAuthPrompt('Enter admin password to create a new file.');
      setPendingAction({ type: 'new-file' });
      setShowAuthModal(true);
      return;
    }

    const newFile = await addFile(currentId, {
      name: 'notes.txt',
      kind: 'text',
      body: 'New text document.\nCreated on ' + new Date().toLocaleString(),
      description: 'Text document'
    });

    if (newFile) {
      setSelectedId(newFile.id);
      setRenamingId(newFile.id);
      setRenameText('notes.txt');
    }
  }, [isAdmin, addFile, currentId]);

  // File Uploading & Processing
  const processUploadedFiles = useCallback(async (files) => {
    for (const file of files) {
      const payload = await readFileAsNode(file);
      const added = await addFile(currentId, payload);
      if (added) setSelectedId(added.id);
    }
  }, [addFile, currentId]);

  const handleFileInputChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (isAdmin) {
      await processUploadedFiles(files);
    } else {
      setPendingUploadFiles(files);
      setAuthPrompt(`Enter password to upload ${files.length} file${files.length > 1 ? 's' : ''}.`);
      setShowAuthModal(true);
    }
    e.target.value = '';
  }, [isAdmin, processUploadedFiles]);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    if (isAdmin) {
      await processUploadedFiles(files);
    } else {
      setPendingUploadFiles(files);
      setAuthPrompt(`Admin password required to upload ${files.length} file${files.length > 1 ? 's' : ''} to "${node?.name || 'this folder'}".`);
      setShowAuthModal(true);
    }
  }, [isAdmin, processUploadedFiles, node]);

  // Auth Success Callback
  const handleAuthSuccess = useCallback(() => {
    if (pendingUploadFiles.length > 0) {
      processUploadedFiles(pendingUploadFiles);
      setPendingUploadFiles([]);
    }
    if (pendingAction?.type === 'new-folder') {
      handleNewFolder();
      setPendingAction(null);
    } else if (pendingAction?.type === 'new-file') {
      handleNewTextFile();
      setPendingAction(null);
    } else if (pendingAction?.type === 'rename' && pendingAction.node) {
      startRenaming(pendingAction.node);
      setPendingAction(null);
    }
  }, [pendingUploadFiles, pendingAction, processUploadedFiles, handleNewFolder, handleNewTextFile, startRenaming]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (renamingId) return; // Don't interrupt while renaming
    if (e.key === 'Escape') { setMenu(null); setShowAdminDropdown(false); return; }

    const index = children.findIndex((c) => c.id === selectedId);

    // In macOS Finder, Return starts renaming selected item!
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = children[index] || children[0];
      if (target) {
        if (isAdmin && selectedId === target.id) {
          startRenaming(target);
        } else {
          open(target);
        }
      }
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

    const perRow = view === 'grid' ? 4 : 1;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow }[e.key];
    const nextIndex = index === -1 ? 0 : Math.min(children.length - 1, Math.max(0, index + delta));
    setSelectedId(children[nextIndex].id);
  };

  const toolbar = (
    <>
      {/* Navigation history */}
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

      {/* Current Folder Title */}
      <div className="flex items-center gap-1.5 min-w-0 mx-1">
        <img src="/icons/Folder.png" alt="" className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-sm opacity-90" />
        <h2 className="text-[13px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
          {node?.name || 'Finder'}
        </h2>
      </div>

      {/* Right Controls: View Switcher, Search Bar, Admin Access Icon & Tools */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {/* View Switcher */}
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

        {/* Search Field */}
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label={`Search in ${node?.name || 'folder'}`}
            className="mac-search-field w-24 sm:w-32 focus:w-40 pr-6"
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

        {/* Divider */}
        <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10" />

        {/* Admin Quick Action Buttons (shown when unlocked) */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewFolder}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
              title="Upload File"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Admin Access Icon / Button near Search Icon */}
        <div className="relative">
          <button
            onClick={() => {
              if (isAdmin) {
                setShowAdminDropdown(!showAdminDropdown);
              } else {
                setAuthPrompt('Enter administrator password ("ishucreationz") to manage folders, upload files, and rename items.');
                setShowAuthModal(true);
              }
            }}
            aria-label={isAdmin ? 'Admin Mode Active' : 'Admin Access Locked'}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all active:scale-95 ${
              isAdmin
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 ring-1 ring-amber-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={isAdmin ? 'Admin Mode Active (Click to manage/lock)' : 'Admin Access (Locked - Click to modify)'}
          >
            {isAdmin ? (
              <div className="relative flex items-center justify-center">
                <Unlock className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              </div>
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Admin Popover Dropdown when unlocked */}
          {showAdminDropdown && isAdmin && (
            <div
              className="absolute right-0 top-full mt-1.5 w-48 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px] z-[999] animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 flex items-center gap-2 border-b border-black/5 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Admin Mode Active</span>
              </div>
              <button
                onClick={() => { handleNewFolder(); setShowAdminDropdown(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" /> New Folder
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); setShowAdminDropdown(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Files...
              </button>
              <div className="my-1 border-t border-black/5 dark:border-white/5" />
              <button
                onClick={() => { lock(); setShowAdminDropdown(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500 hover:text-white flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> Lock Admin Mode
              </button>
            </div>
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
      <div
        className="h-full flex relative"
        onClick={() => { setMenu(null); setShowAdminDropdown(false); }}
      >
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

        {/* Content Area with Drag-and-Drop & Rename Support */}
        <div
          className="flex-1 min-w-0 flex flex-col relative"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Native Drag & Drop Upload Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-30 bg-[#007aff]/10 dark:bg-[#007aff]/20 backdrop-blur-md border-2 border-dashed border-[#007aff] rounded-xl flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150 m-2">
              <div className="w-14 h-14 rounded-2xl bg-[#007aff] text-white flex items-center justify-center shadow-xl shadow-blue-500/30 mb-3 animate-bounce">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Drop files to upload
              </h3>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-1">
                Files will be saved into <span className="font-semibold text-[#007aff]">{node?.name || 'this folder'}</span>
              </p>
            </div>
          )}

          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="listbox"
            aria-label={`Contents of ${node?.name || 'folder'}`}
            className="flex-1 overflow-y-auto p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--os-accent)]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedId(null);
                setRenamingId(null);
              }
            }}
            onContextMenu={(e) => {
              // Right-clicking empty space
              if (e.target === e.currentTarget || e.target.classList?.contains('grid') || e.target.tagName === 'P') {
                e.preventDefault();
                setSelectedId(null);
                setMenu({ x: e.clientX, y: e.clientY, isBackground: true });
              }
            }}
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
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 select-none">
                <p className="text-xs text-slate-400 mb-2">
                  {query ? `Nothing here matches "${query}".` : 'This folder is empty.'}
                </p>
                {isAdmin && !query && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleNewFolder}
                      className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium bg-[#007aff] text-white hover:bg-[#0069dc] flex items-center gap-1.5 shadow-sm"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> New Folder
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Files
                    </button>
                  </div>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {children.map((child) => (
                  <GridItem
                    key={child.id}
                    node={child}
                    isSelected={selectedId === child.id}
                    isRenaming={renamingId === child.id}
                    renameText={renameText}
                    setRenameText={setRenameText}
                    commitRename={commitRename}
                    cancelRename={cancelRename}
                    isAdmin={isAdmin}
                    onSelect={() => {
                      onPlayClick?.();
                      setSelectedId(child.id);
                    }}
                    onOpen={() => open(child)}
                    onStartRename={() => startRenaming(child)}
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
                    isRenaming={renamingId === child.id}
                    renameText={renameText}
                    setRenameText={setRenameText}
                    commitRename={commitRename}
                    cancelRename={cancelRename}
                    isAdmin={isAdmin}
                    onSelect={() => {
                      onPlayClick?.();
                      setSelectedId(child.id);
                    }}
                    onOpen={() => open(child)}
                    onStartRename={() => startRenaming(child)}
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

      {/* Context Menu */}
      {menu && (
        <div
          style={{ top: menu.y - (win.y || 0), left: menu.x - (win.x || 0) }}
          className="fixed z-[999] w-48 py-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl text-[12px] select-none animate-in fade-in zoom-in-95 duration-75"
          onClick={(e) => e.stopPropagation()}
        >
          {menu.isBackground ? (
            <>
              {isAdmin ? (
                <>
                  <button
                    onClick={() => { handleNewFolder(); setMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> New Folder
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Files...
                  </button>
                  <button
                    onClick={() => { handleNewTextFile(); setMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> New Text File
                  </button>
                  <div className="my-1 border-t border-black/5 dark:border-white/5" />
                  <button
                    onClick={() => { onGetInfo(currentId); setMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5" /> Get Info
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthPrompt('Enter admin password to create folders and files.');
                    setShowAuthModal(true);
                    setMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2 text-amber-600 dark:text-amber-400"
                >
                  <Lock className="w-3.5 h-3.5" /> Admin Login to Edit...
                </button>
              )}
            </>
          ) : (
            <>
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

              <div className="my-1 border-t border-black/5 dark:border-white/5" />

              {isAdmin ? (
                <>
                  <button
                    onClick={() => { startRenaming(menu.node); setMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Rename
                  </button>
                  {menu.node.isCustom && (
                    <button
                      onClick={() => { deleteNode(menu.node.id); setMenu(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthPrompt('Enter admin password to rename or modify items.');
                    setShowAuthModal(true);
                    setMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007aff] hover:text-white flex items-center gap-2 text-slate-500"
                >
                  <Lock className="w-3.5 h-3.5" /> Rename (Admin Only)...
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingUploadFiles([]);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
        initialPrompt={authPrompt}
      />
    </OSWindow>
  );
}

function GridItem({
  node, isSelected, isRenaming, renameText, setRenameText,
  commitRename, cancelRename, isAdmin, onSelect, onOpen, onStartRename, onContextMenu
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
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

      {isRenaming ? (
        <input
          ref={inputRef}
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
          className="text-[12px] font-medium leading-tight px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[#1d1d1f] dark:text-[#f5f5f7] border-2 border-[#007aff] shadow-md outline-none text-center max-w-[120px] w-full"
        />
      ) : (
        <span
          onClick={(e) => {
            // Clicking name of already selected item triggers renaming if Admin
            if (isSelected && isAdmin) {
              e.stopPropagation();
              onStartRename();
            }
          }}
          className={`text-[12px] font-medium leading-tight line-clamp-2 px-2 py-0.5 rounded-[4px] transition-colors max-w-[110px] break-words ${
            isSelected
              ? 'bg-[#007aff] text-white shadow-sm font-semibold'
              : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
          }`}
        >
          {node.name}
        </span>
      )}

      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
        {node.kind === 'folder' ? itemCountLabel(node) : KIND_LABEL[node.kind] || 'Item'}
      </span>
    </div>
  );
}

function ListItem({
  node, isSelected, isRenaming, renameText, setRenameText,
  commitRename, cancelRename, isAdmin, onSelect, onOpen, onStartRename, onContextMenu
}) {
  const Icon = KIND_ICON[node.kind];
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
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
        {isRenaming ? (
          <input
            ref={inputRef}
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
            className="text-[12.5px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[#1d1d1f] dark:text-[#f5f5f7] border-2 border-[#007aff] shadow-md outline-none max-w-sm w-full"
          />
        ) : (
          <div
            onClick={(e) => {
              if (isSelected && isAdmin) {
                e.stopPropagation();
                onStartRename();
              }
            }}
            className={`text-[12.5px] font-medium truncate ${isSelected ? 'text-white' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}
          >
            {node.name}
          </div>
        )}
        {node.description && (
          <div className={`text-[10.5px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {node.description}
          </div>
        )}
      </div>
      <div className={`hidden sm:flex items-center gap-1.5 text-[10.5px] shrink-0 ${isSelected ? 'text-white/85' : 'text-slate-400'}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{node.kind === 'folder' ? itemCountLabel(node) : KIND_LABEL[node.kind] || 'Item'}</span>
      </div>
    </div>
  );
}
