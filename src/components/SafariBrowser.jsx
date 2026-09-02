import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  X, 
  Plus, 
  Lock, 
  ShieldCheck, 
  BookOpen, 
  Code2, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  AlertCircle,
  Clock,
  Trash2,
  FileCode
} from 'lucide-react';

import './safari.css';

// Default curated favorites for the Safari Start Page
const DEFAULT_FAVORITES = [
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://en.m.wikipedia.org/wiki/Special:Random',
    domain: 'wikipedia.org',
    iconBg: 'bg-white text-slate-900 border border-slate-200',
    iconText: 'W',
    category: 'Knowledge'
  },
  {
    id: 'devdocs',
    name: 'DevDocs',
    url: 'https://devdocs.io',
    domain: 'devdocs.io',
    iconBg: 'bg-emerald-600 text-white',
    iconText: 'DD',
    category: 'Developer'
  },
  {
    id: 'ishant-portfolio',
    name: "Ishant's Work",
    url: 'https://heyishant.me',
    domain: 'heyishant.me',
    iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
    iconText: '⚡',
    category: 'Featured'
  },
  {
    id: 'codepen',
    name: 'CodePen',
    url: 'https://codepen.io/picks',
    domain: 'codepen.io',
    iconBg: 'bg-black text-white',
    iconText: 'CP',
    category: 'Creative'
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    domain: 'ycombinator.com',
    iconBg: 'bg-orange-500 text-white',
    iconText: 'Y',
    category: 'Tech'
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://html.duckduckgo.com/html/?q=macOS+Sequoia+Safari',
    domain: 'duckduckgo.com',
    iconBg: 'bg-orange-400 text-white',
    iconText: '🦆',
    category: 'Search'
  },
  {
    id: 'apple',
    name: 'Apple',
    url: 'https://www.apple.com/newsroom/',
    domain: 'apple.com',
    iconBg: 'bg-slate-900 text-white',
    iconText: '',
    category: 'News'
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/heyishantofficial',
    domain: 'github.com',
    iconBg: 'bg-slate-800 text-white',
    iconText: 'GH',
    category: 'Social'
  }
];

// Blocked trackers breakdown for Privacy Report
const PRIVACY_REPORT_DATA = [
  { name: 'Google Analytics & Tag Manager', category: 'Analytics', blockedCount: 19 },
  { name: 'Meta Pixel (Facebook)', category: 'Cross-Site Tracking', blockedCount: 11 },
  { name: 'DoubleClick by Google', category: 'Advertising', blockedCount: 7 },
  { name: 'Hotjar Behavioral Recording', category: 'Session Replay', blockedCount: 4 },
  { name: 'TikTok Advertising Pixel', category: 'Fingerprinting', blockedCount: 3 }
];

const MENU_BAR_H = 28;
const DOCK_GUARD = 76;
const MIN_W = 480;
const MIN_H = 340;

const getInitialBounds = () => {
  if (typeof window === 'undefined') return { x: 80, y: 50, w: 980, h: 620 };
  const w = Math.min(1040, Math.max(MIN_W, window.innerWidth - 60));
  const h = Math.min(640, Math.max(MIN_H, window.innerHeight - MENU_BAR_H - DOCK_GUARD - 20));
  const x = Math.max(16, Math.round((window.innerWidth - w) / 2));
  const y = Math.max(MENU_BAR_H + 8, Math.round((window.innerHeight - DOCK_GUARD - h) / 2));
  return { x, y, w, h };
};

export default function SafariBrowser({ onClose, onMinimize }) {
  // Window geometry, drag, resize, maximize states
  const [bounds, setBounds] = useState(getInitialBounds);
  const [prevBounds, setPrevBounds] = useState(getInitialBounds);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const dragState = useRef(null);
  const resizeState = useRef(null);

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

  // Tabs State
  const [tabs, setTabs] = useState([
    {
      id: 'tab-1',
      title: 'Start Page',
      url: '',
      history: [''],
      historyIndex: 0,
      favicon: null,
      isReader: false,
      hasError: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Address bar input state
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Inspector & Reader states
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('elements');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([
    { type: 'info', text: ' Safari WebKit Engine 605.1.15 initialized.' },
    { type: 'log', text: 'Sandbox security active: allow-scripts, allow-same-origin, allow-forms.' },
    { type: 'info', text: 'Intelligent Tracking Prevention (ITP) enabled.' }
  ]);

  // Window state (maximize / fullscreen inside IshantOS)

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Reader Settings
  const [readerTheme, setReaderTheme] = useState('light'); // light, sepia, gray, dark
  const [readerFontSize, setReaderFontSize] = useState(18);

  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Sync address bar input when active tab changes
  useEffect(() => {
    if (activeTab) {
      setAddressInput(activeTab.url);
    }
  }, [activeTab]);

  // Handle simulated progress sweep during page transitions
  const triggerLoading = () => {
    setIsLoading(true);
    setProgress(15);
    const step1 = setTimeout(() => setProgress(55), 180);
    const step2 = setTimeout(() => setProgress(88), 420);
    const step3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 250);
    }, 650);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  // Navigate to a URL or search query
  const navigateTo = (rawInput) => {
    if (!rawInput || !rawInput.trim()) {
      updateActiveTab({ url: '', title: 'Start Page', hasError: false, isReader: false });
      return;
    }

    const trimmed = rawInput.trim();
    let targetUrl = trimmed;

    // Check if it's a search query or a valid domain/URL
    const isUrl = /^(https?:\/\/|[a-z0-9]+([-.]?[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(trimmed);

    if (!isUrl) {
      // It's a search query: use DuckDuckGo HTML search
      targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(trimmed)}`;
    } else if (!/^https?:\/\//i.test(trimmed)) {
      targetUrl = `https://${trimmed}`;
    }

    // Determine domain for title
    let domain = 'Web Page';
    try {
      const parsed = new URL(targetUrl);
      domain = parsed.hostname.replace('www.', '');
    } catch {
      domain = trimmed;
    }

    triggerLoading();

    // Check if known anti-iframe site (e.g. twitter, github full page, google main page)
    const blockedDomains = ['google.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com'];
    const willBlock = blockedDomains.some(b => targetUrl.includes(b));

    updateActiveTab({
      url: targetUrl,
      title: domain.charAt(0).toUpperCase() + domain.slice(1),
      hasError: willBlock,
      isReader: false
    });
  };

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        let nextHistory = tab.history;
        let nextHistoryIndex = tab.historyIndex;

        if (updates.url !== undefined && updates.url !== tab.url) {
          nextHistory = [...tab.history.slice(0, tab.historyIndex + 1), updates.url];
          nextHistoryIndex = nextHistory.length - 1;
        }

        return {
          ...tab,
          ...updates,
          history: nextHistory,
          historyIndex: nextHistoryIndex
        };
      }
      return tab;
    }));
  };

  // Back / Forward navigation
  const goBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const newIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[newIndex];
    triggerLoading();
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      url: prevUrl,
      historyIndex: newIndex,
      title: prevUrl ? new URL(prevUrl).hostname : 'Start Page',
      hasError: false
    } : t));
  };

  const goForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const newIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[newIndex];
    triggerLoading();
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      url: nextUrl,
      historyIndex: newIndex,
      title: nextUrl ? new URL(nextUrl).hostname : 'Start Page',
      hasError: false
    } : t));
  };

  const reloadPage = () => {
    if (activeTab?.url) {
      triggerLoading();
      const currentUrl = activeTab.url;
      updateActiveTab({ url: '' });
      setTimeout(() => updateActiveTab({ url: currentUrl }), 50);
    }
  };

  // Tab management
  const addTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab = {
      id: newTabId,
      title: 'Start Page',
      url: '',
      history: [''],
      historyIndex: 0,
      favicon: null,
      isReader: false,
      hasError: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
  };

  const closeTab = (e, tabIdToClose) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // If closing the last tab, reset it to Start Page
      updateActiveTab({ url: '', title: 'Start Page', hasError: false, isReader: false });
      return;
    }
    const nextTabs = tabs.filter(t => t.id !== tabIdToClose);
    setTabs(nextTabs);
    if (activeTabId === tabIdToClose) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  // Console evaluator for Web Inspector
  const handleEvalConsole = (e) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    const cmd = consoleInput.trim();
    setConsoleLogs(prev => [...prev, { type: 'input', text: `> ${cmd}` }]);

    try {
      // Safe quick evaluation
      if (cmd === 'clear' || cmd === 'clear()') {
        setConsoleLogs([]);
        setConsoleInput('');
        return;
      }
      if (cmd === 'location' || cmd === 'window.location') {
        setConsoleLogs(prev => [...prev, { type: 'output', text: JSON.stringify({ href: activeTab?.url || 'safari://start', title: activeTab?.title }, null, 2) }]);
      } else if (cmd === 'navigator.userAgent') {
        setConsoleLogs(prev => [...prev, { type: 'output', text: '"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"' }]);
      } else {
        // eslint-disable-next-line no-eval
        const res = Function(`"use strict"; return (${cmd})`)();
        setConsoleLogs(prev => [...prev, { type: 'output', text: String(res) }]);
      }
    } catch (err) {
      setConsoleLogs(prev => [...prev, { type: 'error', text: `TypeError: ${err.message}` }]);
    }
    setConsoleInput('');
  };

  const canGoBack = activeTab && activeTab.historyIndex > 0;
  const canGoForward = activeTab && activeTab.historyIndex < activeTab.history.length - 1;

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
      {/* Invisible shield to prevent iframe capturing mouse events during drag/resize */}
      {isInteracting && (
        <div className="absolute inset-0 z-50 bg-transparent select-none" />
      )}

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
              onClick={goBack} 
              disabled={!canGoBack} 
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              className="safari-btn-icon" 
              onClick={goForward} 
              disabled={!canGoForward} 
              title="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              className="safari-btn-icon" 
              onClick={reloadPage} 
              title="Reload Page"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>

          {/* Smart Search & Address Bar */}
          <div className="safari-address-bar-wrapper" data-no-drag>
            <div className="safari-address-bar">
              {/* SSL Padlock */}
              <button 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                onClick={() => setShowCertModal(v => !v)}
                title="View site security information"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
              </button>

              {/* Reader Mode Toggle */}
              {activeTab?.url && (
                <button 
                  onClick={() => updateActiveTab({ isReader: !activeTab.isReader })}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-serif font-bold transition-all shrink-0 ${
                    activeTab.isReader 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  title="Toggle Safari Reader Mode (aA)"
                >
                  aA
                </button>
              )}

              {/* Address Input */}
              <form 
                className="flex-1 flex items-center" 
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateTo(addressInput);
                }}
              >
                <input 
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Search or enter website name"
                  className="safari-address-input"
                  spellCheck={false}
                  autoComplete="off"
                />
              </form>

              {/* Clear / Start Page Button */}
              {addressInput && (
                <button 
                  onClick={() => {
                    setAddressInput('');
                    updateActiveTab({ url: '', title: 'Start Page', hasError: false, isReader: false });
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full shrink-0"
                  title="Clear"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Progress sweep indicator */}
              {isLoading && (
                <div className="safari-progress-sweep" style={{ width: `${progress}%` }} />
              )}
            </div>

            {/* Certificate Popover */}
            {showCertModal && (
              <div className="absolute top-10 left-0 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Connection is Secure</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Your information is protected by Apple WebKit TLS encryption.
                    </p>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Host:</span>
                    <span className="font-mono font-medium truncate max-w-[170px]">{activeTab?.url ? new URL(activeTab.url).hostname : 'localhost'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocol:</span>
                    <span>TLS 1.3 (ChaCha20-Poly1305)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1" data-no-drag>
            {/* Privacy Report Quick Button */}
            <button 
              className="safari-btn-icon" 
              onClick={() => setShowPrivacyModal(v => !v)}
              title="Privacy Report (Trackers Prevented)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Web Inspector DevTools Toggle */}
            <button 
              className={`safari-btn-icon ${showInspector ? '!bg-blue-500/20 !text-blue-500' : ''}`}
              onClick={() => setShowInspector(v => !v)}
              title="Safari Web Inspector"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Share / External Link */}
            {activeTab?.url && (
              <a 
                href={activeTab.url} 
                target="_blank" 
                rel="noreferrer"
                className="safari-btn-icon"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Unified Tabs Bar */}
        <div className="safari-tabs-bar" data-no-drag>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`safari-tab-item ${isActive ? 'active' : ''}`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate flex-1">{tab.title || 'Start Page'}</span>
                <button 
                  className="safari-tab-close-btn"
                  onClick={(e) => closeTab(e, tab.id)}
                  title="Close tab"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Add Tab Button */}
          <button className="safari-tab-add-btn" onClick={addTab} title="New Tab">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Viewport Content */}
        <div className="safari-viewport">
          {/* 1. Safari Start Page (when no URL is loaded) */}
          {(!activeTab?.url || activeTab.url === 'safari://start') && (
            <div className="safari-start-page">
              <div className="safari-start-container">
                {/* Favorites Section */}
                <div>
                  <h3 className="safari-section-heading">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Favorites
                  </h3>
                  <div className="safari-favorites-grid">
                    {DEFAULT_FAVORITES.map((fav) => (
                      <button
                        key={fav.id}
                        onClick={() => navigateTo(fav.url)}
                        className="safari-favorite-card group"
                      >
                        <div className="safari-favorite-icon-box">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${fav.iconBg}`}>
                            {fav.iconText}
                          </div>
                        </div>
                        <span className="safari-favorite-label">{fav.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy Report Banner */}
                <div 
                  className="safari-privacy-card"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Privacy Report</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        In the last 30 days, Safari prevented <strong>44 trackers</strong> from profiling you.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 shrink-0">
                    View Details →
                  </span>
                </div>

                {/* Frequently Visited & Siri Suggestions */}
                <div>
                  <h3 className="safari-section-heading">
                    <Clock className="w-4 h-4 text-purple-500" />
                    Siri Suggestions & Quick Tools
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div 
                      onClick={() => navigateTo('https://devdocs.io/javascript/')}
                      className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 hover:border-blue-500/40 cursor-pointer transition-all shadow-sm flex items-center gap-3"
                    >
                      <FileCode className="w-5 h-5 text-indigo-500" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">JavaScript Reference</div>
                        <div className="text-[11px] text-slate-500 truncate">devdocs.io</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => navigateTo('https://en.m.wikipedia.org/wiki/Steve_Jobs')}
                      className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 hover:border-blue-500/40 cursor-pointer transition-all shadow-sm flex items-center gap-3"
                    >
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">Steve Jobs — Biography</div>
                        <div className="text-[11px] text-slate-500 truncate">wikipedia.org</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => updateActiveTab({ isReader: true, title: 'Clean Architecture in 2026' })}
                      className="p-3.5 rounded-xl bg-white/70 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 hover:border-blue-500/40 cursor-pointer transition-all shadow-sm flex items-center gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">Safari Reader Demo</div>
                        <div className="text-[11px] text-slate-500 truncate">Distraction-free mode</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Safari Reader Mode View */}
          {activeTab?.isReader && (
            <div className={`safari-reader-view safari-reader-theme-${readerTheme}`}>
              {/* Reader Floating Controls Bar */}
              <div className="max-w-[680px] mx-auto mb-8 flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-medium uppercase tracking-wider opacity-60">Theme:</span>
                  <button 
                    onClick={() => setReaderTheme('light')} 
                    className={`w-6 h-6 rounded-full border border-slate-300 bg-white ${readerTheme === 'light' ? 'ring-2 ring-blue-500' : ''}`}
                    title="Light theme" 
                  />
                  <button 
                    onClick={() => setReaderTheme('sepia')} 
                    className={`w-6 h-6 rounded-full border border-[#e3d7bf] bg-[#f8f1e3] ${readerTheme === 'sepia' ? 'ring-2 ring-blue-500' : ''}`}
                    title="Sepia theme" 
                  />
                  <button 
                    onClick={() => setReaderTheme('gray')} 
                    className={`w-6 h-6 rounded-full border border-zinc-600 bg-[#4a4a4c] ${readerTheme === 'gray' ? 'ring-2 ring-blue-500' : ''}`}
                    title="Gray theme" 
                  />
                  <button 
                    onClick={() => setReaderTheme('dark')} 
                    className={`w-6 h-6 rounded-full border border-zinc-700 bg-[#121212] ${readerTheme === 'dark' ? 'ring-2 ring-blue-500' : ''}`}
                    title="Night theme" 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setReaderFontSize(s => Math.max(14, s - 2))}
                    className="px-2 py-1 text-xs font-sans font-semibold rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title="Decrease font size"
                  >
                    A-
                  </button>
                  <span className="text-xs font-sans opacity-60">{readerFontSize}px</span>
                  <button 
                    onClick={() => setReaderFontSize(s => Math.min(26, s + 2))}
                    className="px-2 py-1 text-xs font-sans font-semibold rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title="Increase font size"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Reader Article Body */}
              <article className="safari-reader-article" style={{ fontSize: `${readerFontSize}px` }}>
                <h1 className="safari-reader-title">
                  {activeTab?.title || 'The Art of Vibecoding and Apple-Grade Digital Craft'}
                </h1>
                <div className="safari-reader-meta">
                  By Ishant Chauhan • Published in IshantOS Journal • 4 min read
                </div>
                <p className="mb-6 leading-relaxed">
                  When software stops behaving like rigid computer code and begins responding with physical fluidity, an interface becomes an effortless extension of human intent.
                </p>
                <p className="mb-6 leading-relaxed">
                  Every interaction must respect velocity handoff, critically damped spring physics, and continuous tactile responsiveness. In macOS Sequoia Safari, typography and visual hierarchy guide the mind effortlessly through information without friction.
                </p>
                <blockquote className="my-8 pl-4 border-l-4 border-blue-500 italic opacity-90">
                  "Simplicity is not the absence of clutter, that's a consequence of simplicity. Simplicity is somehow essentially describing the purpose and place of an object and product."
                </blockquote>
                <p className="mb-6 leading-relaxed">
                  Building inside the browser with modern CSS primitives, container queries, and sub-frame composition allows us to simulate entire operating ecosystems right on the open web.
                </p>
              </article>
            </div>
          )}

          {/* 3. Apple Connection Refused Fallback Screen */}
          {activeTab?.url && !activeTab.isReader && activeTab.hasError && (
            <div className="safari-error-screen">
              <div className="safari-error-icon-wrapper">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Safari Can’t Open the Page</h2>
              <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                Safari can’t open the page <span className="font-mono font-medium text-slate-700 dark:text-slate-300">“{activeTab.url}”</span> because the server refused embedded connection (X-Frame-Options / Content-Security-Policy).
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                  onClick={() => updateActiveTab({ isReader: true })}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Open in Safari Reader
                </button>
                <a 
                  href={activeTab.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-zinc-600 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in External Tab
                </a>
                <button 
                  onClick={() => navigateTo(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(activeTab.url)}`)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-zinc-600 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Search on DuckDuckGo
                </button>
              </div>
            </div>
          )}

          {/* 4. Live Sandboxed Iframe Browser */}
          {activeTab?.url && !activeTab.isReader && !activeTab.hasError && (
            <iframe
              src={activeTab.url}
              title={activeTab.title || 'Safari Web Content'}
              className="safari-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
              onError={() => updateActiveTab({ hasError: true })}
            />
          )}

          {/* 5. Safari Web Inspector (DevTools Drawer) */}
          {showInspector && (
            <div className="safari-inspector-drawer">
              {/* Inspector Tab Bar */}
              <div className="safari-inspector-tabs">
                <button 
                  className={`safari-inspector-tab ${inspectorTab === 'elements' ? 'active' : ''}`}
                  onClick={() => setInspectorTab('elements')}
                >
                  Elements
                </button>
                <button 
                  className={`safari-inspector-tab ${inspectorTab === 'console' ? 'active' : ''}`}
                  onClick={() => setInspectorTab('console')}
                >
                  Console ({consoleLogs.length})
                </button>
                <button 
                  className={`safari-inspector-tab ${inspectorTab === 'network' ? 'active' : ''}`}
                  onClick={() => setInspectorTab('network')}
                >
                  Network
                </button>
                <div className="ml-auto flex items-center gap-2 pr-2">
                  <button 
                    className="text-slate-400 hover:text-white text-xs"
                    onClick={() => setConsoleLogs([])}
                    title="Clear console"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    className="text-slate-400 hover:text-white text-xs"
                    onClick={() => setShowInspector(false)}
                    title="Close Inspector"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Inspector Tab Views */}
              <div className="safari-inspector-content">
                {inspectorTab === 'elements' && (
                  <div className="font-mono text-xs space-y-1 text-slate-300 leading-relaxed">
                    <div>&lt;<span className="text-rose-400">html</span> <span className="text-amber-300">lang</span>=<span className="text-emerald-300">"en"</span>&gt;</div>
                    <div className="pl-4">&lt;<span className="text-rose-400">head</span>&gt;</div>
                    <div className="pl-8 text-slate-500">&lt;!-- 12 metadata and link stylesheets --&gt;</div>
                    <div className="pl-8">&lt;<span className="text-rose-400">title</span>&gt;{activeTab?.title || 'Safari Web Document'}&lt;/<span className="text-rose-400">title</span>&gt;</div>
                    <div className="pl-4">&lt;/<span className="text-rose-400">head</span>&gt;</div>
                    <div className="pl-4">&lt;<span className="text-rose-400">body</span> <span className="text-amber-300">class</span>=<span className="text-emerald-300">"safari-viewport-rendered active-macOS-engine"</span>&gt;</div>
                    <div className="pl-8">&lt;<span className="text-rose-400">main</span> <span className="text-amber-300">id</span>=<span className="text-emerald-300">"app-root"</span>&gt;</div>
                    <div className="pl-12 text-slate-400">&lt;<span className="text-rose-400">section</span> <span className="text-amber-300">data-source</span>=<span className="text-emerald-300">"{activeTab?.url || 'safari://start'}"</span>&gt;...&lt;/<span className="text-rose-400">section</span>&gt;</div>
                    <div className="pl-8">&lt;/<span className="text-rose-400">main</span>&gt;</div>
                    <div className="pl-4">&lt;/<span className="text-rose-400">body</span>&gt;</div>
                    <div>&lt;/<span className="text-rose-400">html</span>&gt;</div>
                  </div>
                )}

                {inspectorTab === 'console' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
                      {consoleLogs.map((log, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-1.5 py-0.5 ${
                            log.type === 'error' ? 'text-rose-400 bg-rose-950/20 px-1 rounded' :
                            log.type === 'input' ? 'text-blue-400 font-semibold' :
                            log.type === 'info' ? 'text-sky-300' : 'text-slate-300'
                          }`}
                        >
                          <span className="text-slate-600 select-none">›</span>
                          <span className="whitespace-pre-wrap">{log.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Console REPL Prompt */}
                    <form onSubmit={handleEvalConsole} className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-2">
                      <span className="text-blue-400 font-bold select-none">&gt;</span>
                      <input 
                        type="text"
                        value={consoleInput}
                        onChange={(e) => setConsoleInput(e.target.value)}
                        placeholder="Evaluate JavaScript expression (e.g. navigator.userAgent, 12 * 45)..."
                        className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white"
                      />
                    </form>
                  </div>
                )}

                {inspectorTab === 'network' && (
                  <div className="font-mono text-xs space-y-2">
                    <div className="grid grid-cols-5 text-slate-500 text-[11px] pb-1 border-b border-zinc-800 font-sans font-semibold">
                      <span>Name</span>
                      <span>Status</span>
                      <span>Type</span>
                      <span>Size</span>
                      <span>Time</span>
                    </div>
                    <div className="grid grid-cols-5 items-center text-slate-300">
                      <span className="truncate text-blue-400">{activeTab?.url ? new URL(activeTab.url).pathname || '/' : 'start-page'}</span>
                      <span className="text-emerald-400">200 OK</span>
                      <span>document</span>
                      <span>14.2 KB</span>
                      <span>42 ms</span>
                    </div>
                    <div className="grid grid-cols-5 items-center text-slate-300">
                      <span className="truncate text-amber-300">safari.css</span>
                      <span className="text-emerald-400">200 OK</span>
                      <span>stylesheet</span>
                      <span>8.6 KB</span>
                      <span>18 ms</span>
                    </div>
                    <div className="grid grid-cols-5 items-center text-slate-300">
                      <span className="truncate text-purple-300">web-engine.js</span>
                      <span className="text-emerald-400">200 OK</span>
                      <span>script</span>
                      <span>32.1 KB</span>
                      <span>65 ms</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Report Modal / Popover */}
        {showPrivacyModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 max-w-lg w-full p-6 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-base">Safari Privacy Report</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent Tracking Prevention (ITP)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                  Safari uses on-device machine learning to block cross-site tracking cookies, canvas fingerprinting, and behavioral profile syndication.
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Trackers Prevented (Last 30 Days)</h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {PRIVACY_REPORT_DATA.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.category}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 font-mono text-[11px] font-bold">
                          {item.blockedCount} blocked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Window Resize Handles */}
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
    </div>
  );
}
