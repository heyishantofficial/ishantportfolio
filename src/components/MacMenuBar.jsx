import React, { useState, useEffect } from 'react';
import { 
  Wifi, Battery, Search, Sliders, Volume2, Volume1, VolumeX, Moon, Sun, 
  Lock, RotateCcw, Power, Check, Sparkles, Terminal, Folder, FileText, Globe
} from 'lucide-react';
import { PROFILE_INFO } from '../data/projectsData';
import { playMacClick } from '../utils/macAudioEngine';

export default function MacMenuBar({ 
  activeAppTitle = 'Finder',
  onOpenApp,
  onToggleControlCenter,
  onToggleSpotlight,
  isMuted,
  onToggleMute,
  volume = 50,
  onVolumeChange,
  isHardwareFrame,
  onToggleFrameView
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [lockError, setLockError] = useState(false);

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

  const handleUnlock = (e) => {
    e.preventDefault();
    // Unlocks on any key or enter
    setIsLocked(false);
    setPassword('');
    setLockError(false);
  };

  return (
    <>
      {/* Top macOS Translucent Menu Bar */}
      <header className="mac-menu-bar select-none relative z-[9990] flex items-center justify-between px-3 h-7 bg-white/20 dark:bg-black/30 backdrop-blur-xl border-b border-white/20 dark:border-white/10 text-xs font-sans text-slate-900 dark:text-slate-100 shadow-sm">
        
        {/* Left Section: Apple Logo & Active App Context Menu */}
        <div className="flex items-center gap-3">
          {/* Apple Logo  */}
          <div className="relative">
            <button
              onClick={handleAppleMenuClick}
              className="px-1.5 py-0.5 rounded hover:bg-white/30 dark:hover:bg-white/10 font-bold text-sm leading-none transition-colors cursor-pointer"
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

                <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />

                <button 
                  onClick={() => handleAppAction('finder')}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Finder Workspace</span>
                </button>

                <button 
                  onClick={() => handleAppAction('terminal')}
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal Shell</span>
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

          {/* Desktop App Options */}
          <div className="hidden sm:flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
            <span className="hover:opacity-75 cursor-pointer" onClick={() => handleAppAction('finder')}>File</span>
            <span className="hover:opacity-75 cursor-pointer" onClick={() => handleAppAction('notes')}>Edit</span>
            <span className="hover:opacity-75 cursor-pointer" onClick={() => onToggleControlCenter && onToggleControlCenter()}>View</span>
            <span className="hover:opacity-75 cursor-pointer" onClick={() => handleAppAction('safari')}>Go</span>
            <span className="hover:opacity-75 cursor-pointer" onClick={() => onToggleSpotlight && onToggleSpotlight()}>Window</span>
            <span className="hover:opacity-75 cursor-pointer" onClick={() => handleAppAction('terminal')}>Help</span>
          </div>
        </div>

        {/* Right Section: Hardware View Toggle, Sound, Battery, Wi-Fi, Spotlight, Control Center, Clock */}
        <div className="flex items-center gap-2.5 font-medium text-[11px]">
          
          {/* Hardware Frame Switcher */}
          <button 
            onClick={onToggleFrameView}
            className="px-2 py-0.5 rounded bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 transition-all font-semibold flex items-center gap-1 cursor-pointer border border-slate-900/10 dark:border-white/10 text-[10px]"
            title="Switch between Full Screen Desktop & MacBook Hardware Frame"
          >
            <span>{isHardwareFrame ? '🖥️ Fullscreen Desktop' : '💻 MacBook Frame'}</span>
          </button>

          {/* Interactive Volume Menu Bar Control */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowVolumeMenu(!showVolumeMenu);
                setShowAppleMenu(false);
              }}
              className="px-1.5 py-0.5 rounded hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer flex items-center gap-1 transition-colors"
              title={`Volume: ${isMuted ? 'Muted' : `${volume}%`} (Click to adjust)`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              ) : volume < 50 ? (
                <Volume1 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              )}
              <span className="text-[10px] font-mono font-bold tracking-tight opacity-90">
                {isMuted || volume === 0 ? 'Muted' : `${volume}%`}
              </span>
            </button>

            {/* Volume Control Popover Menu */}
            {showVolumeMenu && (
              <div 
                className="absolute right-0 top-7 w-64 bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl rounded-2xl p-3 shadow-2xl border border-white/50 dark:border-slate-700/60 z-[9999] text-slate-800 dark:text-slate-100 font-sans animate-in fade-in slide-in-from-top-1 duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <span className="font-extrabold text-xs">Sound Volume</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {isMuted || volume === 0 ? 'Muted (0%)' : `${volume}%`}
                  </span>
                </div>

                {/* Volume Range Slider Bar */}
                <div className="flex items-center gap-2.5 mb-3">
                  <button
                    onClick={onToggleMute}
                    className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-500" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange && onVolumeChange(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700"
                  />
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold font-mono">
                  <button
                    onClick={() => onVolumeChange && onVolumeChange(0)}
                    className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-center transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                  >
                    0% (Mute)
                  </button>
                  <button
                    onClick={() => onVolumeChange && onVolumeChange(50)}
                    className="py-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 text-center transition-colors cursor-pointer border border-blue-500/20"
                  >
                    50% (Default)
                  </button>
                  <button
                    onClick={() => onVolumeChange && onVolumeChange(100)}
                    className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-center transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                  >
                    100% (Max)
                  </button>
                </div>
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
            onClick={onToggleControlCenter}
            className="p-1 rounded hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer"
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
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full text-xs text-center w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
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
