import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, Battery, Search, Sliders, Volume2, Volume1, VolumeX, Moon, Sun, 
  Lock, RotateCcw, Power, Check, Sparkles, Folder, FileText, Globe
} from 'lucide-react';
import { PROFILE_INFO } from '../data/projectsData';
import { playMacClick } from '../utils/macAudioEngine';

export default function MacMenuBar({ 
  activeAppTitle = 'Finder',
  onOpenApp,
  onToggleControlCenter,
  isControlCenterOpen = false,
  onToggleSpotlight,
  isMuted,
  onToggleMute,
  volume = 20,
  onVolumeChange,
  isHardwareFrame,
  onToggleFrameView,
  onOpenPath,
  onNewFinderWindow,
  onCloseWindow,
  onOpenPalette
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [lockError, setLockError] = useState(false);

  const appleMenuRef = useRef(null);
  const volumeMenuRef = useRef(null);

  // Close Apple menu & Volume menu on outside click or Escape
  useEffect(() => {
    if (!showAppleMenu && !showVolumeMenu) return;

    const handleOutsideClick = (e) => {
      if (showAppleMenu && appleMenuRef.current && !appleMenuRef.current.contains(e.target)) {
        setShowAppleMenu(false);
      }
      if (showVolumeMenu && volumeMenuRef.current && !volumeMenuRef.current.contains(e.target)) {
        setShowVolumeMenu(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAppleMenu(false);
        setShowVolumeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAppleMenu, showVolumeMenu]);

  // Live macOS Clock & Date
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      setTimeStr(d.toLocaleDateString('en-US', options).replace(',', ''));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAppleMenuClick = () => {
    playMacClick(isMuted);
    setShowAppleMenu(!showAppleMenu);
  };

  const handleAppAction = (appId) => {
    playMacClick(isMuted);
    setShowAppleMenu(false);
    if (onOpenApp) onOpenApp(appId);
  };

  const openFromMenu = (nodeId) => {
    playMacClick(isMuted);
    setOpenMenu(null);
    if (onOpenPath) onOpenPath(nodeId);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    setIsLocked(false);
    setPassword('');
    setLockError(false);
  };

  return (
    <>
      {/* Top macOS Translucent Menu Bar with Liquid Glass */}
      <header className="mac-menu-bar select-none relative z-[9990] flex items-center justify-between px-3 h-7 bg-white/45 dark:bg-black/45 backdrop-blur-2xl border-b border-white/40 dark:border-white/12 text-xs font-sans text-slate-900 dark:text-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        
        {/* Left Section: Apple Logo & Active App Context Menu */}
        <div className="flex items-center gap-3">
          {/* Apple Logo  */}
          <div className="relative" ref={appleMenuRef}>
            <button
              onClick={handleAppleMenuClick}
              className={`px-1.5 py-0.5 rounded font-bold text-sm leading-none transition-colors cursor-pointer ${
                showAppleMenu ? 'bg-white/40 dark:bg-white/20' : 'hover:bg-white/30 dark:hover:bg-white/10'
              }`}
              title="Apple Menu"
            >
              
            </button>

            {/* Apple Menu Dropdown */}
            {showAppleMenu && (
              <div 
                className="absolute left-0 top-7 w-52 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl rounded-lg shadow-2xl border border-white/40 dark:border-slate-700/60 py-1 text-xs text-slate-800 dark:text-slate-100 z-[9999] animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => handleAppAction('system-info')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-semibold"
                >
                  <span>About This Mac</span>
                  <span className="text-[10px] opacity-70">M3 Max</span>
                </button>

                <button 
                  onClick={() => handleAppAction('settings')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-semibold"
                >
                  <span>System Settings...</span>
                  <span className="text-[10px] opacity-70">⚙️ Wallpapers</span>
                </button>

                <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />

                <button 
                  onClick={() => handleAppAction('finder')}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Finder Workspace</span>
                </button>

                <button 
                  onClick={() => handleAppAction('notes')}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>System Notes</span>
                </button>

                <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />

                <button 
                  onClick={() => { setShowAppleMenu(false); setIsLocked(true); }}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Screen</span>
                </button>

                <button 
                  onClick={() => { setShowAppleMenu(false); window.location.reload(); }}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Mac...</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Application Name */}
          <span className="font-extrabold tracking-tight text-xs capitalize">
            {activeAppTitle}
          </span>

          {/* File & Go menus — the keyboard-free route to everything */}
          <div className="hidden sm:flex items-center gap-0.5 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
            <MenuBarMenu
              label="File"
              isOpen={openMenu === 'file'}
              onToggle={() => { playMacClick(isMuted); setOpenMenu(openMenu === 'file' ? null : 'file'); setShowAppleMenu(false); }}
              onClose={() => setOpenMenu(null)}
              items={[
                { label: 'New Finder Window', shortcut: '\u2318N', action: () => onNewFinderWindow && onNewFinderWindow() },
                { separator: true },
                { label: 'Open Experience', action: () => openFromMenu('experience') },
                { label: 'Open Work', action: () => openFromMenu('work') },
                { label: 'Open AI Lab', action: () => openFromMenu('ai-lab') },
                { label: 'Open Resume', action: () => openFromMenu('resume') },
                { separator: true },
                { label: 'Close Window', shortcut: '\u2318W', action: () => onCloseWindow && onCloseWindow() }
              ]}
            />
            <MenuBarMenu
              label="Go"
              isOpen={openMenu === 'go'}
              onToggle={() => { playMacClick(isMuted); setOpenMenu(openMenu === 'go' ? null : 'go'); setShowAppleMenu(false); }}
              onClose={() => setOpenMenu(null)}
              items={[
                { label: 'Home', shortcut: '\u21E7\u2318H', action: () => openFromMenu('home') },
                { separator: true },
                { label: 'Experience', action: () => openFromMenu('experience') },
                { label: 'Work', action: () => openFromMenu('work') },
                { label: 'AI Lab', action: () => openFromMenu('ai-lab') },
                { label: 'About Me', action: () => openFromMenu('about-me') },
                { label: 'Random', action: () => openFromMenu('random') },
                { label: 'Contact', action: () => openFromMenu('contact') },
                { separator: true },
                { label: 'Resume.pdf', action: () => openFromMenu('resume') }
              ]}
            />
            <MenuBarMenu
              label="Window"
              isOpen={openMenu === 'window'}
              onToggle={() => { playMacClick(isMuted); setOpenMenu(openMenu === 'window' ? null : 'window'); setShowAppleMenu(false); }}
              onClose={() => setOpenMenu(null)}
              items={[
                { label: 'Quick Access...', shortcut: '\u2318K', action: () => onOpenPalette && onOpenPalette() },
                { label: 'Spotlight Search', shortcut: '\u2318Space', action: () => onToggleSpotlight && onToggleSpotlight() },
                { separator: true },
                { label: 'Control Centre', action: () => onToggleControlCenter && onToggleControlCenter() }
              ]}
            />
            <MenuBarMenu
              label="Help"
              isOpen={openMenu === 'help'}
              onToggle={() => { playMacClick(isMuted); setOpenMenu(openMenu === 'help' ? null : 'help'); setShowAppleMenu(false); }}
              onClose={() => setOpenMenu(null)}
              items={[
                { label: 'Contact Ishant', action: () => openFromMenu('contact') }
              ]}
            />
          </div>
        </div>

        {/* Right Section: Hardware View Toggle, Sound, Battery, Wi-Fi, Spotlight, Control Center, Clock */}
        <div className="flex items-center gap-2.5 font-medium text-[11px]">
          


          {/* Transparent Minimal Volume Menu Bar Control */}
          <div className="relative" ref={volumeMenuRef}>
            <button 
              onClick={() => {
                setShowVolumeMenu(!showVolumeMenu);
                setShowAppleMenu(false);
              }}
              className={`p-1 rounded cursor-pointer flex items-center transition-colors ${
                showVolumeMenu ? 'bg-white/40 dark:bg-white/20' : 'hover:bg-white/30 dark:hover:bg-white/10'
              }`}
              title="Adjust Volume"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Transparent Minimal Volume Slider Popover */}
            {showVolumeMenu && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-7 w-52 bg-black/40 dark:bg-black/50 backdrop-blur-2xl rounded-full px-3 py-2 shadow-2xl border border-white/20 dark:border-white/15 z-[9999] text-white font-sans animate-in fade-in zoom-in-95 duration-100 select-none flex items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onToggleMute}
                  className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange && onVolumeChange(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-white/30"
                />
              </div>
            )}
          </div>

          {/* Battery Status */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[10px]">98%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
          </div>

          {/* Wi-Fi Icon */}
          <Wifi className="w-3.5 h-3.5" />

          {/* Spotlight Trigger */}
          <button 
            onClick={onToggleSpotlight}
            className="p-1 rounded hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer"
            title="Spotlight Search (Cmd + K)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Control Center Toggle */}
          <button 
            data-control-center-toggle="true"
            onClick={onToggleControlCenter}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isControlCenterOpen ? 'bg-white/40 dark:bg-white/20' : 'hover:bg-white/30 dark:hover:bg-white/10'
            }`}
            title="Control Center"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Clock */}
          <span className="font-semibold tracking-tight ml-1 font-mono text-[11px]">
            {timeStr || 'Wed Aug 26 2:43 PM'}
          </span>

        </div>

      </header>

      {/* macOS Lock Screen Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-3xl flex flex-col items-center justify-center text-white font-sans animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-800 p-1 shadow-2xl mb-4">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-2xl">
              IC
            </div>
          </div>

          <h2 className="text-xl font-bold">{PROFILE_INFO.name}</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">Touch ID or Enter Password to Unlock</p>

          <form onSubmit={handleUnlock} className="flex flex-col items-center gap-3">
            <input 
              type="password" 
              placeholder="Enter password..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLockError(false); }}
              autoFocus
              className={`px-4 py-2 bg-slate-800/80 border rounded-full text-xs text-center w-60 focus:outline-none focus:ring-2 font-mono transition-all ${
                lockError 
                  ? "border-rose-500 ring-2 ring-rose-500/50 text-rose-300 animate-shake" 
                  : "border-slate-700 focus:ring-blue-500 text-white"
              }`}
            />
            {lockError && (
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                Incorrect Password. Please try again.
              </span>
            )}
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-semibold shadow-lg transition-colors cursor-pointer"
            >
              Unlock MacBook
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/**
 * A menu-bar dropdown. Clicking the label toggles it; clicking anywhere else
 * or picking an item closes it.
 */
function MenuBarMenu({ label, items, isOpen, onToggle, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const close = () => onClose();
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`px-2 py-0.5 rounded transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'hover:bg-white/30 dark:hover:bg-white/10'}`}
      >
        {label}
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-7 min-w-52 bg-white/85 dark:bg-slate-900/90 backdrop-blur-2xl rounded-lg shadow-2xl border border-white/40 dark:border-slate-700/60 py-1 text-xs text-slate-800 dark:text-slate-100 z-[9999] animate-fadeIn"
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={`sep-${i}`} className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => { item.action(); onClose(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between gap-6 font-medium"
              >
                <span>{item.label}</span>
                {item.shortcut && <span className="text-[10px] opacity-60 font-mono">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
