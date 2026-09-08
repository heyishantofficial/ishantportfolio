import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, MoreHorizontal, Search, Mic, Clock, 
  Folder as FolderIcon, Users, FileText, Download, 
  Briefcase, Rocket, Sparkles, Code, 
  Coffee, Mail, X, Check, Film, Music, Image as ImageIcon,
  Globe, Play, Compass, Link2
} from 'lucide-react';
import { findNode, DESKTOP_ORDER, itemCountLabel, allNodes } from '../data/ishantOS';
import { useFileSystem } from '../utils/useFileSystem';
import { PROJECTS_DATA } from '../data/projectsData';
import IOSMediaViewer from './IOSMediaViewer';
import { getFolderIcon } from '../lib/siteSettings';
import { FolderArtwork } from '../data/folderIconsCatalog';
import { isYouTubeUrl, isInstagramUrl } from '../utils/mediaHelpers';

// Universal iOS folder badge helper
function getFolderBadge(node) {
  if (!node) return <FolderIcon className="w-4 h-4 text-white/80" />;

  // 1. Check custom icon set via Settings
  const customIconKey = getFolderIcon(node.id) || node.icon;
  if (customIconKey && customIconKey !== 'default') {
    return <FolderArtwork iconKey={customIconKey} size={28} />;
  }

  // 2. Curated native-styled emblems
  switch (node.id) {
    case 'about-me':
      return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
          IC
        </div>
      );
    case 'work':
      return (
        <div className="w-8 h-8 rounded-xl bg-[#007aff] flex items-center justify-center text-white shadow-sm">
          <Briefcase className="w-4 h-4" />
        </div>
      );
    case 'ai-lab':
    case 'work-ai-creative':
    case 'lab-ai-workflows':
      return (
        <div className="w-8 h-8 rounded-xl bg-[#7c1cf0] flex items-center justify-center text-white shadow-sm">
          <Code className="w-4 h-4" />
        </div>
      );
    case 'experience':
    case 'burner-media':
      return (
        <div className="w-8 h-8 rounded-xl bg-[#ff9500] flex items-center justify-center text-white shadow-sm">
          <Rocket className="w-4 h-4" />
        </div>
      );
    case 'random':
    case 'lab-vibecoded':
      return (
        <div className="w-8 h-8 rounded-xl bg-[#ff2d55] flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    case 'contact':
      return (
        <div className="w-8 h-8 rounded-xl bg-[#34c759] flex items-center justify-center text-white shadow-sm">
          <Coffee className="w-4 h-4" />
        </div>
      );
    case 'work-campaigns':
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    case 'work-brand-films':
    case 'work-editing':
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm">
          <Film className="w-4 h-4" />
        </div>
      );
    case 'work-social':
      return (
        <div className="w-8 h-8 rounded-xl bg-pink-600 flex items-center justify-center text-white shadow-sm">
          <Globe className="w-4 h-4" />
        </div>
      );
    case 'work-strategy':
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
          <Compass className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white shadow-sm">
          <FolderIcon className="w-4 h-4 text-white/90" />
        </div>
      );
  }
}

// Universal node subtext helper
function getNodeSubtext(child) {
  if (child.subtext) return child.subtext;
  if (child.kind === 'folder' || child.children) {
    return itemCountLabel(child);
  }
  if (child.kind === 'project' || child.project) {
    const p = child.project || child;
    const parts = [p.category || p.client, p.year].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : 'Case Study';
  }
  if (child.kind === 'video' || child.platform === 'youtube') {
    return child.platform === 'youtube' ? 'YouTube Video' : 'Video';
  }
  if (child.kind === 'link') {
    return 'Web Link';
  }
  if (child.kind === 'image') return 'Image';
  if (child.kind === 'audio') return 'Audio';
  if (child.kind === 'pdf') return 'PDF Document';
  if (child.kind === 'text') return 'Text Document';
  return child.description || 'Document';
}

// Authentic Apple iOS Files Folder Component
function IOSBlueFolder({ title, itemCount, badge, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform select-none"
    >
      {/* iOS Blue Folder Silhouette */}
      <div className="relative w-20 h-16 flex items-center justify-center drop-shadow-md">
        <svg viewBox="0 0 84 66" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="iosFolderBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ac2ff" />
              <stop offset="100%" stopColor="#318fe7" />
            </linearGradient>
            <linearGradient id="iosFolderFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ea3f7" />
              <stop offset="100%" stopColor="#257cd4" />
            </linearGradient>
          </defs>
          
          {/* Back Tab + Folder Body */}
          <path
            d="M 6 13 C 6 8.5, 9.5 5, 14 5 L 32 5 C 35.5 5, 38.5 7.5, 40.5 11 L 43 15 L 70 15 C 74.5 15, 78 18.5, 78 23 L 78 55 C 78 59.5, 74.5 63, 70 63 L 14 63 C 9.5 63, 6 59.5, 6 55 Z"
            fill="url(#iosFolderBack)"
          />
          
          {/* Front Pocket Flap */}
          <path
            d="M 6 25 C 6 20.5, 9.5 18, 14 18 L 70 18 C 74.5 18, 78 20.5, 78 25 L 78 55 C 78 59.5, 74.5 63, 70 63 L 14 63 C 9.5 63, 6 59.5, 6 55 Z"
            fill="url(#iosFolderFront)"
          />
          {/* Subtle Top Highlight */}
          <path
            d="M 14 18 L 70 18"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>

        {/* Embedded Center App Badge / Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
          {badge}
        </div>
      </div>

      {/* Label and Item Count */}
      <div className="w-full text-center px-1">
        <span className="text-xs font-medium text-white tracking-tight line-clamp-1 block drop-shadow-sm">
          {title}
        </span>
        <span className="text-[11px] text-[#8e8e93] block mt-0.5 font-normal">
          {itemCount}
        </span>
      </div>
    </div>
  );
}

// File Document Icon (for PDF / TXT / Project / Video / Image / Audio / Link)
function IOSDocumentItem({ title, subtext, kind, node, onClick }) {
  const isVideo = kind === 'video' || (node && (node.videoUrl || node.platform === 'youtube'));
  const isImage = kind === 'image';
  const isAudio = kind === 'audio';
  const isLink = kind === 'link';
  const isProject = kind === 'project' || node?.project;
  const thumbUrl = node?.thumbnailUrl || node?.preview || null;

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-all select-none"
    >
      <div className="relative w-16 h-16 rounded-xl bg-neutral-800/90 border border-white/15 flex flex-col items-center justify-center shadow-lg p-2 overflow-hidden">
        {thumbUrl ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <img src={thumbUrl} alt={title} className="w-full h-full object-cover" />
            {isVideo && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        ) : kind === 'pdf' ? (
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-xs">
            PDF
          </div>
        ) : isProject ? (
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
            style={{ 
              backgroundColor: node?.project?.accent ? `${node.project.accent}33` : 'rgba(59, 130, 246, 0.2)', 
              borderColor: node?.project?.accent ? `${node.project.accent}66` : 'rgba(59, 130, 246, 0.3)', 
              borderWidth: 1 
            }}
          >
            <Sparkles className="w-5 h-5" style={{ color: node?.project?.accent || '#60a5fa' }} />
          </div>
        ) : isVideo ? (
          <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Film className="w-5 h-5" />
          </div>
        ) : isImage ? (
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ImageIcon className="w-5 h-5" />
          </div>
        ) : isAudio ? (
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Music className="w-5 h-5" />
          </div>
        ) : isLink ? (
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Globe className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/80">
            <FileText className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="w-full text-center px-1">
        <span className="text-xs font-medium text-white tracking-tight line-clamp-1 block drop-shadow-sm">
          {title}
        </span>
        <span className="text-[11px] text-[#8e8e93] block mt-0.5 font-normal truncate">
          {subtext}
        </span>
      </div>
    </div>
  );
}

export default function IOSFilesApp({ 
  onClose, 
  onSelectProject, 
  onLaunchApp 
}) {
  const { version } = useFileSystem();
  const [activeTab, setActiveTab] = useState('browse'); // 'recents' | 'shared' | 'browse'
  const [searchQuery, setSearchQuery] = useState('');
  const [folderStack, setFolderStack] = useState([]); // [{ id, name, children }]
  const [activeReaderDoc, setActiveReaderDoc] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Core root folders from IshantOS (dynamically synced with desktop filesystem & renames)
  const rootFolders = useMemo(() => {
    void version;
    const homeNode = findNode('home');
    const allChildren = homeNode?.children || [];
    const ordered = DESKTOP_ORDER.map(findNode).filter(Boolean);
    const orderedIds = new Set(ordered.map((n) => n.id));
    const extra = allChildren.filter((n) => n && !orderedIds.has(n.id));
    const nodes = [...ordered, ...extra];

    return nodes.map((node) => {
      if (node.id === 'resume' || node.kind === 'pdf') {
        return {
          id: node.id,
          name: node.name || 'Resume.pdf',
          itemsText: 'Official PDF',
          isDoc: true,
          kind: 'pdf',
          node,
          action: () => window.open(node.href || '/resume.pdf', '_blank')
        };
      }

      return {
        id: node.id,
        name: node.name,
        itemsText: itemCountLabel(node),
        node,
        badge: getFolderBadge(node)
      };
    });
  }, [version]);

  // Recents items list - dynamically synced with projects from IshantOS tree
  const recentItems = useMemo(() => {
    void version;
    const projNodes = allNodes().filter((n) => n.kind === 'project');
    return [
      {
        id: 'r-resume',
        title: 'Resume.pdf',
        subtext: 'Opened today',
        kind: 'pdf',
        action: () => window.open('/resume.pdf', '_blank')
      },
      ...projNodes.slice(0, 6).map((node) => {
        const p = node.project || {};
        const sub = [p.category || p.client, p.year].filter(Boolean).join(' · ') || 'Case Study';
        return {
          id: `r-${node.id}`,
          title: node.name || p.title,
          subtext: sub,
          kind: 'project',
          node,
          action: () => {
            if (onSelectProject) {
              const rawId = node.id ? node.id.replace(/^lab-app-|^proj-|^lab-/, '') : '';
              const pMatch = PROJECTS_DATA.find(item => item.id === node.id || item.id === rawId);
              onSelectProject({
                ...(pMatch || {}),
                ...(node.project || {}),
                ...node,
                title: node.project?.title || node.title || node.name,
                videoUrl: node.project?.videoUrl || pMatch?.videoUrl || node.videoUrl || ''
              });
            }
          }
        };
      })
    ];
  }, [version, onSelectProject]);

  // Shared items list
  const sharedItems = useMemo(() => [
    {
      id: 's-linkedin',
      name: 'LinkedIn Profile',
      itemsText: 'Collaborative',
      badge: (
        <div className="w-8 h-8 rounded-xl bg-[#0a66c2] flex items-center justify-center text-white font-bold text-xs">
          in
        </div>
      ),
      action: () => window.open('https://linkedin.com', '_blank')
    },
    {
      id: 's-mail',
      name: 'Direct Contact',
      itemsText: 'hey@ishant.com',
      badge: (
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
          <Mail className="w-4 h-4" />
        </div>
      ),
      action: () => {
        if (onLaunchApp) onLaunchApp('mail');
      }
    },
    {
      id: 's-github',
      name: 'GitHub Repositories',
      itemsText: 'Open Source',
      badge: (
        <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white border border-white/20">
          <Code className="w-4 h-4" />
        </div>
      ),
      action: () => window.open('https://github.com/heyishantofficial', '_blank')
    }
  ], [onLaunchApp]);

  // Current navigation level (dynamically resolved against live filesystem & version)
  const currentStackTop = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
  const currentFolder = useMemo(() => {
    void version;
    if (!currentStackTop) return null;
    const freshNode = findNode(currentStackTop.id);
    if (freshNode) {
      return {
        id: freshNode.id,
        name: freshNode.name,
        children: freshNode.children || []
      };
    }
    return currentStackTop;
  }, [currentStackTop, version]);

  // Handle drill down into a folder
  const handleOpenFolder = (folder) => {
    if (folder.isDoc) {
      if (folder.action) folder.action();
      return;
    }
    const node = folder.node || findNode(folder.id);
    if (node) {
      setFolderStack(prev => [...prev, {
        id: node.id,
        name: folder.name || node.name,
        children: node.children || []
      }]);
    }
  };

  // Handle drill down into a child node
  const handleChildClick = (child) => {
    if (child.kind === 'folder' || (child.children && child.children.length > 0)) {
      setFolderStack(prev => [...prev, {
        id: child.id,
        name: child.name,
        children: child.children || []
      }]);
    } else if (child.kind === 'project' || child.project) {
      const rawId = child.id ? child.id.replace(/^lab-app-|^proj-|^lab-/, '') : '';
      const pMatch = PROJECTS_DATA.find(item => item.id === child.id || item.id === rawId);
      const proj = {
        ...(pMatch || {}),
        ...(child.project || {}),
        ...child,
        title: child.project?.title || child.title || child.name,
        videoUrl: child.project?.videoUrl || pMatch?.videoUrl || child.videoUrl || ''
      };
      if (onSelectProject) {
        onSelectProject(proj);
      } else {
        setActiveReaderDoc(child);
      }
    } else if (child.kind === 'link') {
      const isEmbed = child.openMode === 'embed' || isYouTubeUrl(child.href) || isInstagramUrl(child.href) || child.videoUrl;
      if (isEmbed) {
        setActiveReaderDoc(child);
      } else if (child.href) {
        window.open(child.href, '_blank', 'noopener,noreferrer');
      } else {
        setActiveReaderDoc(child);
      }
    } else if (child.id === 'resume' || (child.kind === 'pdf' && child.href)) {
      window.open(child.href || '/resume.pdf', '_blank');
    } else {
      setActiveReaderDoc(child);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (activeReaderDoc) {
      setActiveReaderDoc(null);
      return;
    }
    if (folderStack.length > 0) {
      setFolderStack(prev => prev.slice(0, prev.length - 1));
    } else {
      if (onClose) onClose();
    }
  };

  // Filtered items based on query (fully synchronized with live filesystem)
  const displayedItems = useMemo(() => {
    if (activeTab === 'recents') {
      if (!searchQuery.trim()) return recentItems;
      return recentItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'shared') {
      if (!searchQuery.trim()) return sharedItems;
      return sharedItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // In Browse mode:
    if (currentFolder) {
      let list = currentFolder.children || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(item => 
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.project?.title && item.project.title.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return list;
    }

    // Root Browse items
    if (!searchQuery.trim()) return rootFolders;
    return rootFolders.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, currentFolder, rootFolders, recentItems, sharedItems, searchQuery]);

  return (
    <div className="w-full h-full bg-black text-white flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* 1. iOS Navigation Header */}
      <div className="w-full pt-3 pb-2 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        
        {/* Left Cross Close & Back Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { if (onClose) onClose(); }}
            className="w-8 h-8 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center active:bg-[#2c2c2e] active:scale-95 transition-all shadow-sm cursor-pointer"
            aria-label="Close Files"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
          {(folderStack.length > 0 || activeReaderDoc) && (
            <button
              onClick={handleBack}
              className="h-8 px-2.5 rounded-full bg-[#1c1c1e] text-xs font-semibold text-white flex items-center gap-1 active:bg-[#2c2c2e] active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4 -ml-0.5" /> Back
            </button>
          )}
        </div>

        {/* Center Title */}
        <h1 className="font-semibold text-base text-white tracking-tight truncate max-w-[200px] text-center">
          {activeReaderDoc ? activeReaderDoc.name : (
            currentFolder ? currentFolder.name : (
              activeTab === 'browse' ? 'On My iPhone' :
              activeTab === 'recents' ? 'Recents' : 'Shared'
            )
          )}
        </h1>

        {/* Right More Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="w-9 h-9 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center active:bg-[#2c2c2e] transition-colors"
            aria-label="More Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Quick iOS Context Popover */}
          <AnimatePresence>
            {showOptionsMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute right-0 top-11 w-48 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-50 text-xs"
              >
                <div 
                  onClick={() => {
                    setSearchQuery('');
                    setShowOptionsMenu(false);
                  }}
                  className="px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Sort by Name</span>
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div 
                  onClick={() => {
                    window.open('/resume.pdf', '_blank');
                    setShowOptionsMenu(false);
                  }}
                  className="px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Open Resume</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div 
                  onClick={() => {
                    setShowOptionsMenu(false);
                    if (onClose) onClose();
                  }}
                  className="px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-rose-400"
                >
                  <span>Close Files</span>
                  <X className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 2. iOS Search Bar */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="w-full h-10 px-3.5 rounded-xl bg-[#1c1c1e] flex items-center gap-2 border border-white/5">
          <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-white placeholder-[#8e8e93] outline-none font-normal"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="p-0.5 text-[#8e8e93] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Mic className="w-4 h-4 text-[#8e8e93] shrink-0" />
          )}
        </div>
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        
        {/* Document / Media Reader Mode */}
        {activeReaderDoc ? (
          <IOSMediaViewer
            node={activeReaderDoc}
            onBack={handleBack}
            onClose={() => setActiveReaderDoc(null)}
            isDarkMode={true}
          />
        ) : (
          <>
            {/* 3-Column iOS Folder & File Grid */}
            <div className="grid grid-cols-3 gap-y-7 gap-x-3 pt-2">
              
              {/* If in root Browse mode */}
              {activeTab === 'browse' && !currentFolder && (
                displayedItems.map((item) => (
                  item.isDoc ? (
                    <IOSDocumentItem
                      key={item.id}
                      title={item.name}
                      subtext={item.itemsText}
                      kind={item.kind}
                      onClick={item.action}
                    />
                  ) : (
                    <IOSBlueFolder
                      key={item.id}
                      title={item.name}
                      itemCount={item.itemsText}
                      badge={item.badge}
                      onClick={() => handleOpenFolder(item)}
                    />
                  )
                ))
              )}

              {/* If drilled down into a folder */}
              {activeTab === 'browse' && currentFolder && (
                displayedItems.map((child) => (
                  child.kind === 'folder' || child.children ? (
                    <IOSBlueFolder
                      key={child.id}
                      title={child.name}
                      itemCount={itemCountLabel(child)}
                      badge={getFolderBadge(child)}
                      onClick={() => handleChildClick(child)}
                    />
                  ) : (
                    <IOSDocumentItem
                      key={child.id}
                      title={child.name || child.project?.title || child.title}
                      subtext={getNodeSubtext(child)}
                      kind={child.kind}
                      node={child}
                      onClick={() => handleChildClick(child)}
                    />
                  )
                ))
              )}

              {/* Recents Tab */}
              {activeTab === 'recents' && (
                displayedItems.map((item) => (
                  <IOSDocumentItem
                    key={item.id}
                    title={item.title}
                    subtext={item.subtext}
                    kind={item.kind}
                    onClick={item.action}
                  />
                ))
              )}

              {/* Shared Tab */}
              {activeTab === 'shared' && (
                displayedItems.map((item) => (
                  <IOSBlueFolder
                    key={item.id}
                    title={item.name}
                    itemCount={item.itemsText}
                    badge={item.badge}
                    onClick={item.action}
                  />
                ))
              )}

            </div>

            {/* Empty State */}
            {displayedItems.length === 0 && (
              <div className="py-20 text-center text-[#8e8e93] text-xs">
                No items found
              </div>
            )}

            {/* Centered Total Item Count at bottom */}
            <div className="pt-10 pb-4 text-center">
              <span className="text-xs font-semibold text-white/80">
                {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </>
        )}

      </div>

      {/* 4. Bottom Floating iOS Tab Bar (Recents | Shared | Browse) */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xs mx-auto z-40">
        <div className="h-14 rounded-full bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/15 flex items-center justify-around px-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          
          {/* Tab 1: Recents */}
          <button
            onClick={() => {
              setActiveTab('recents');
              setFolderStack([]);
              setActiveReaderDoc(null);
            }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'recents' ? 'text-[#007aff]' : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-medium">Recents</span>
          </button>

          {/* Tab 2: Shared */}
          <button
            onClick={() => {
              setActiveTab('shared');
              setFolderStack([]);
              setActiveReaderDoc(null);
            }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'shared' ? 'text-[#007aff]' : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Shared</span>
          </button>

          {/* Tab 3: Browse (Active by default) */}
          <button
            onClick={() => {
              setActiveTab('browse');
              setFolderStack([]);
              setActiveReaderDoc(null);
            }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'browse' ? 'text-[#007aff]' : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <FolderIcon className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-semibold">Browse</span>
          </button>

        </div>
      </div>

    </div>
  );
}
