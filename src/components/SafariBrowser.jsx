import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  X, 
  Plus, 
  Lock, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  FolderPlus
} from 'lucide-react';

import './safari.css';

const MENU_BAR_H = 28;
const DOCK_GUARD = 76;
const MIN_W = 540;
const MIN_H = 380;
const STORAGE_KEY = 'ishant_portfolio_browser_links';

// Curated default links for Ishant's Portfolio Launchpad
const DEFAULT_PORTFOLIO_LINKS = [
  // Things I Built for Fun
  {
    id: 'link-brainjot',
    title: 'Brainjot AI Notes',
    category: 'apps',
    url: 'https://heyishant.me',
    tag: 'LIVE APP',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    iconBg: 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white',
    iconEmoji: '🧠',
    description: 'AI-Powered spatial note-taking and thought architecture system for structuring raw creator braindumps into video scripts.',
    featured: true
  },
  {
    id: 'link-notchfinder',
    title: 'Notch Finder macOS',
    category: 'apps',
    url: 'https://heyishant.me',
    tag: 'UTILITY',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white',
    iconEmoji: '💻',
    description: 'macOS status bar utility turning the MacBook camera notch into a drop shelf for active content drafts and teleprompters.',
    featured: true
  },

  // Social & Professional Profiles
  {
    id: 'link-linkedin',
    title: 'LinkedIn Profile',
    category: 'social',
    url: 'https://linkedin.com',
    tag: 'PROFESSIONAL',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    iconBg: 'bg-[#0077b5] text-white',
    iconEmoji: '💼',
    description: 'Connect for content strategy, executive distribution engines, brand building, and engineering leadership insights.',
    featured: true
  },
  {
    id: 'link-github',
    title: 'GitHub Repositories',
    category: 'social',
    url: 'https://github.com/heyishantofficial',
    tag: 'OPEN SOURCE',
    badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20',
    iconBg: 'bg-slate-900 text-white',
    iconEmoji: '🐙',
    description: 'Explore vibecoded open-source applications, AI agent tools, Swift scripts, and frontend experiments.',
    featured: true
  },
  {
    id: 'link-youtube',
    title: 'YouTube Channel',
    category: 'social',
    url: 'https://youtube.com',
    tag: 'VIDEO MEDIA',
    badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
    iconBg: 'bg-red-600 text-white',
    iconEmoji: '📺',
    description: 'Deep dives on modern developer tools, vibecoding workflows, Cursor AI engineering, and visual media pacing.'
  },
  {
    id: 'link-instagram',
    title: 'Instagram',
    category: 'social',
    url: 'https://instagram.com/heyishant',
    tag: 'VISUALS',
    badgeColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
    iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white',
    iconEmoji: '📸',
    description: 'Behind the scenes of studio setups, creator lifestyle, editing breakdowns, and short-form visual edits.'
  },
  {
    id: 'link-email',
    title: 'Direct Inquiries & Email',
    category: 'social',
    url: 'mailto:ishant.vibecode@gmail.com',
    tag: 'CONTACT',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-600 text-white',
    iconEmoji: '✉️',
    description: 'Get in touch directly for collaborations, content consulting, vibecoded software, or custom builds.',
    featured: true
  },

  // Case Studies & Editorial Systems
  {
    id: 'link-pipeline',
    title: 'Multi-Channel Media Pipeline',
    category: 'systems',
    url: 'https://heyishant.me',
    tag: 'CASE STUDY',
    badgeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
    iconBg: 'bg-gradient-to-tr from-violet-600 to-indigo-700 text-white',
    iconEmoji: '⚡',
    description: 'Automated 1-to-10 media engine converting 1 weekly long-form video into 10 high-performing posts across platforms.'
  },
  {
    id: 'link-kanban',
    title: 'Creator Kanban & Research Engine',
    category: 'systems',
    url: 'https://heyishant.me',
    tag: 'WORKFLOW',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    iconBg: 'bg-gradient-to-tr from-amber-600 to-yellow-500 text-white',
    iconEmoji: '📋',
    description: 'Structured Notion workspace aggregating trending industry topics, auto-generating hooks, and tracking assets.'
  },
  {
    id: 'link-resume',
    title: 'Official Resume PDF',
    category: 'systems',
    url: '/resume.pdf',
    tag: 'DOCUMENT',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    iconBg: 'bg-rose-600 text-white',
    iconEmoji: '📄',
    description: 'Download and inspect comprehensive resume highlighting full-stack engineering and creator credentials.'
  }
];

// Calculate initial window bounds
const getInitialBounds = () => {
  if (typeof window === 'undefined') return { x: 80, y: 50, w: 980, h: 620 };
  const w = Math.min(1060, Math.max(MIN_W, window.innerWidth - 60));
  const h = Math.min(650, Math.max(MIN_H, window.innerHeight - MENU_BAR_H - DOCK_GUARD - 20));
  const x = Math.max(16, Math.round((window.innerWidth - w) / 2));
  const y = Math.max(MENU_BAR_H + 8, Math.round((window.innerHeight - DOCK_GUARD - h) / 2));
  return { x, y, w, h };
};

const SECTIONS = [
  {
    id: 'apps',
    title: 'Things I Built for Fun',
    icon: '🚀',
    subtitle: 'Tools, utilities & daily workflow extensions'
  },
  {
    id: 'social',
    title: 'Connect & Social',
    icon: '🌐',
    subtitle: 'Profiles, channels & professional network'
  },
  {
    id: 'systems',
    title: 'Case Studies & Systems',
    icon: '⚡',
    subtitle: 'Media engines, workflows & credentials'
  },
  {
    id: 'custom',
    title: 'My Custom Links',
    icon: '📌',
    subtitle: 'Personal bookmarks & custom references'
  }
];

export default function SafariBrowser({ onClose, onMinimize, socialLinks, dashboardConfig }) {
  // Window geometry, drag, resize, maximize states
  const [bounds, setBounds] = useState(getInitialBounds);
  const [prevBounds, setPrevBounds] = useState(getInitialBounds);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const dragState = useRef(null);
  const resizeState = useRef(null);

  // Search & Link State
  const [searchQuery, setSearchQuery] = useState('');
  const [customLinks, setCustomLinks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Add Link Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('apps');
  const [newEmoji, setNewEmoji] = useState('🔗');
  const [newDescription, setNewDescription] = useState('');

  // Load custom links from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomLinks(JSON.parse(stored));
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  // Save custom links to localStorage
  const saveCustomLinks = (updated) => {
    setCustomLinks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  };

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Open any URL in a new tab with feedback
  const openInNewTab = (url, title = 'Link') => {
    if (!url) return;
    let target = url.trim();
    if (!/^https?:\/\//i.test(target) && !target.startsWith('mailto:')) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    showToast(`Opened “${title}” in new tab ↗`);
  };

  // Copy link URL
  const copyLink = (e, link) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(link.url);
    setCopiedLinkId(link.id);
    showToast(`Copied ${link.title} URL to clipboard!`);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Delete custom link
  const deleteCustomLink = (e, id) => {
    e.stopPropagation();
    const updated = customLinks.filter(l => l.id !== id);
    saveCustomLinks(updated);
    showToast('Link removed from Portfolio Hub');
  };

  // Handle Add Link submit
  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let cleanUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith('mailto:')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newLink = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      url: cleanUrl,
      category: newCategory,
      tag: 'CUSTOM',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
      iconEmoji: newEmoji || '🔗',
      description: newDescription.trim() || 'Custom portfolio link added to your browser hub.',
      isCustom: true
    };

    const updated = [newLink, ...customLinks];
    saveCustomLinks(updated);

    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setShowAddModal(false);
    showToast(`Added “${newLink.title}” to your links!`);
  };

  // Dragging toolbar
  const handleToolbarPointerDown = (e) => {
    if (isMaximized) return;
    if (e.target.closest('[data-no-drag]')) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: bounds.x,
      originY: bounds.y
    };
    setIsInteracting(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  // Resizing corner/edges
  const handleResizePointerDown = (e, direction) => {
    if (isMaximized) return;
    e.stopPropagation();
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: bounds.x,
      originY: bounds.y,
      originW: bounds.w,
      originH: bounds.h,
      direction
    };
    setIsInteracting(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = useCallback((e) => {
    if (dragState.current) {
      const { startX, startY, originX, originY } = dragState.current;
      const newX = Math.min(Math.max(originX + e.clientX - startX, -bounds.w + 120), window.innerWidth - 120);
      const newY = Math.min(Math.max(originY + e.clientY - startY, MENU_BAR_H), window.innerHeight - 60);
      setBounds(prev => ({ ...prev, x: newX, y: newY }));
    } else if (resizeState.current) {
      const { startX, startY, originX, originY, originW, originH, direction } = resizeState.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newW = originW;
      let newH = originH;
      let newX = originX;
      let newY = originY;

      if (direction.includes('e')) {
        newW = Math.max(MIN_W, Math.min(originW + deltaX, window.innerWidth - originX - 16));
      }
      if (direction.includes('s')) {
        newH = Math.max(MIN_H, Math.min(originH + deltaY, window.innerHeight - originY - DOCK_GUARD));
      }
      if (direction.includes('w')) {
        const possibleW = Math.max(MIN_W, originW - deltaX);
        newX = originX + (originW - possibleW);
        newW = possibleW;
      }

      setBounds({ x: newX, y: newY, w: newW, h: newH });
    }
  }, [bounds.w]);

  const endGesture = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
    setIsInteracting(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endGesture);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endGesture);
    };
  }, [handlePointerMove, endGesture]);

  const toggleMaximize = () => {
    if (!isMaximized) {
      setPrevBounds(bounds);
      setIsMaximized(true);
    } else {
      setIsMaximized(false);
      setBounds(prevBounds);
    }
  };

  // Combine default and custom links, applying socialLinks overrides
  const allLinks = useMemo(() => {
    const dynamicDefaults = DEFAULT_PORTFOLIO_LINKS.map(link => {
      if (link.id === 'link-instagram' && socialLinks?.instagram) {
        return { ...link, url: socialLinks.instagram };
      }
      if (link.id === 'link-youtube' && socialLinks?.youtube) {
        return { ...link, url: socialLinks.youtube };
      }
      if (link.id === 'link-linkedin' && socialLinks?.linkedin) {
        return { ...link, url: socialLinks.linkedin };
      }
      if (link.id === 'link-github' && socialLinks?.github) {
        return { ...link, url: socialLinks.github };
      }
      if (link.id === 'link-email' && dashboardConfig?.contactEmail) {
        return { ...link, url: `mailto:${dashboardConfig.contactEmail}` };
      }
      return link;
    });
    return [...customLinks, ...dynamicDefaults];
  }, [customLinks, socialLinks, dashboardConfig]);

  // Filter links based on search query
  const filteredLinks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allLinks;
    return allLinks.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    });
  }, [allLinks, searchQuery]);

  // Handle Address Bar Enter Key
  const handleAddressKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      
      const isUrl = /^(https?:\/\/|[a-z0-9]+([-.]?[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(trimmed);
      if (isUrl) {
        openInNewTab(trimmed, trimmed);
      } else {
        // Open Google search in new tab
        openInNewTab(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`, `Google: ${trimmed}`);
      }
    }
  };

  const windowStyle = isMaximized
    ? {
        top: MENU_BAR_H,
        left: 8,
        width: 'calc(100vw - 16px)',
        height: `calc(100vh - ${MENU_BAR_H + DOCK_GUARD}px)`,
        transition: isInteracting ? 'none' : 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    : {
        top: bounds.y,
        left: bounds.x,
        width: bounds.w,
        height: bounds.h,
        transition: isInteracting ? 'none' : 'box-shadow 0.2s ease'
      };

  return (
    <div 
      className="safari-floating-window" 
      style={windowStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="safari-window-container">
        {/* Safari Unified Navigation Toolbar (Draggable) */}
        <div 
          className={`safari-toolbar ${isMaximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
          onPointerDown={handleToolbarPointerDown}
          onDoubleClick={toggleMaximize}
        >
          {/* Traffic Lights */}
          <div className="safari-traffic-lights" data-no-drag>
            <button className="safari-traffic-btn safari-traffic-close" onClick={onClose} title="Close">✕</button>
            <button className="safari-traffic-btn safari-traffic-min" onClick={onMinimize || onClose} title="Minimize">—</button>
            <button className="safari-traffic-btn safari-traffic-max" onClick={toggleMaximize} title={isMaximized ? "Restore" : "Full Screen"}>⤢</button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-0.5" data-no-drag>
            <button 
              className="safari-btn-icon" 
              onClick={() => setSearchQuery('')} 
              title="All Links"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              className="safari-btn-icon opacity-50 cursor-not-allowed" 
              disabled 
              title="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              className="safari-btn-icon" 
              onClick={() => { setSearchQuery(''); showToast('Refreshed links'); }} 
              title="Reset Filters"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Smart Search & Address Bar */}
          <div className="safari-address-bar-wrapper" data-no-drag>
            <div className="safari-address-bar">
              <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleAddressKeyDown}
                placeholder="Search links, apps, or type a URL to open in a new tab..."
                className="safari-address-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5" data-no-drag>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,122,255,0.35)] border border-white/30 transition-all active:scale-95"
              title="Add a new custom link to your portfolio hub"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="safari-hub-page">
          {/* Header Banner */}
          <div className="mb-8 pb-5 border-b border-black/8 dark:border-white/10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
              Ishant’s Work & Projects
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Everything I’m building, creating, and working on.
            </p>
          </div>

          {/* Links View */}
          {filteredLinks.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-2xl mb-3">
                🔍
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No links found matching “{searchQuery}”
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                You can launch this query directly on the web or add it as a new custom bookmark to your portfolio.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openInNewTab(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, `Search ${searchQuery}`)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Search on Google ↗
                </button>
                <button
                  onClick={() => {
                    setNewTitle(searchQuery);
                    setNewUrl('https://');
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold hover:bg-black/10 text-slate-800 dark:text-slate-200"
                >
                  + Add as New Link
                </button>
              </div>
            </div>
          ) : (
            /* Categorized Sections with Headings */
            SECTIONS.map((section) => {
              const sectionLinks = filteredLinks.filter(item => 
                section.id === 'custom' ? item.isCustom : item.category === section.id
              );

              if (sectionLinks.length === 0) return null;

              return (
                <section key={section.id} className="mb-10">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-black/8 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{section.icon}</span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {section.title}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/70 dark:border-white/15 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-bold shadow-xs">
                        {sectionLinks.length}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                      {section.subtitle}
                    </span>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sectionLinks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openInNewTab(item.url, item.title)}
                        className="safari-link-card group"
                      >
                        <div>
                          {/* Top Row: Icon, Title, Badge & Actions */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                                {item.iconEmoji || '🔗'}
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {item.title}
                                </h3>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border mt-0.5 ${item.badgeColor}`}>
                                  {item.tag}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => copyLink(e, item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                title="Copy Link"
                              >
                                {copiedLinkId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {item.isCustom && (
                                <button
                                  onClick={(e) => deleteCustomLink(e, item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Delete custom link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {item.description}
                          </p>
                        </div>

                        {/* Bottom Row: URL & Launch Action */}
                        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[170px]">
                            {item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Open ↗
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div 
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="safari-resize-corner"
            title="Resize"
          />
          <div 
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            className="safari-resize-edge-e"
          />
          <div 
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            className="safari-resize-edge-s"
          />
          <div 
            onPointerDown={(e) => handleResizePointerDown(e, 'w')}
            className="safari-resize-edge-w"
          />
        </>
      )}

      {/* Add Custom Link Modal (Liquid Glass) */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/75 dark:bg-zinc-900/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-3xl border border-white/60 dark:border-white/15 max-w-md w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base">Add Portfolio Link</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLink} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Link Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Substack Newsletter or Dribbble Portfolio"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/60 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target URL</label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/60 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white font-mono shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/60 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white shadow-xs"
                  >
                    <option value="apps" className="bg-white dark:bg-zinc-900">Things I Built for Fun</option>
                    <option value="social" className="bg-white dark:bg-zinc-900">Connect & Social</option>
                    <option value="systems" className="bg-white dark:bg-zinc-900">Case Studies</option>
                    <option value="custom" className="bg-white dark:bg-zinc-900">Other Links</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    placeholder="🚀, 💡, 🌐, 🎨"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/60 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white text-center shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="One sentence summary of this destination..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/60 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold shadow-[0_2px_8px_rgba(0,122,255,0.35)] border border-white/30 active:scale-95 transition-all"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-5 right-5 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
