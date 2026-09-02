import React from 'react';
import { 
  Wifi, Volume2, VolumeX, Music, Sun, Moon, Sparkles, Sliders, Check, ShieldCheck, Airplay
} from 'lucide-react';
import { playMacClick } from '../utils/macAudioEngine';

export default function MacControlCenter({ 
  onClose, 
  isDarkMode, 
  onToggleDarkMode, 
  wallpaper, 
  onChangeWallpaper,
  isMuted,
  onToggleMute,
  volume = 20,
  onVolumeChange,
  showCyberdeck,
  onToggleCyberdeck
}) {
  const wallpapers = [
    { id: 'video', name: 'Live Video 🔊', bgClass: 'wallpaper-video' },
    { id: 'custom', name: 'Custom Photo', bgClass: 'wallpaper-custom' },
    { id: 'sequoia', name: 'Sequoia Sky', bgClass: 'bg-gradient-to-br from-indigo-900 via-sky-800 to-slate-900' },
    { id: 'sonoma', name: 'Sonoma Sunset', bgClass: 'bg-gradient-to-br from-amber-600 via-rose-700 to-purple-900' },
    { id: 'neon', name: 'Cyberpunk Neon', bgClass: 'bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950' },
    { id: 'aurora', name: 'Dark Aurora', bgClass: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950' }
  ];

  return (
    <div 
      className="fixed top-8 right-3 w-80 bg-[var(--mac-glass-bg)] backdrop-blur-3xl rounded-2xl p-3.5 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.38)] border border-white/60 dark:border-white/15 z-[9995] text-slate-800 dark:text-slate-100 font-sans animate-in fade-in slide-in-from-top-2 duration-150 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-2 mb-3">
        <span className="font-extrabold text-xs tracking-tight">macOS Control Center</span>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Wi-Fi Tile */}
        <div className="p-2.5 rounded-xl bg-white/65 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 flex items-center gap-2.5 shadow-sm">
          <div className="w-7 h-7 rounded-full bg-[#007aff] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs truncate">Wi-Fi</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Hire Me 5G</div>
          </div>
        </div>

        {/* Display / Dark Mode Tile */}
        <div 
          onClick={() => { playMacClick(isMuted); onToggleDarkMode(); }}
          className="p-2.5 rounded-xl bg-white/65 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 flex items-center gap-2.5 shadow-sm cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition-all active:scale-98"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm ${isDarkMode ? 'bg-indigo-600' : 'bg-amber-500'}`}>
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs truncate">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Click to Toggle</div>
          </div>
        </div>
      </div>

      {/* Wallpaper Switcher */}
      <div className="p-3 rounded-xl bg-white/65 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>Desktop Wallpaper</span>
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {wallpapers.map((wp) => (
            <button
              key={wp.id}
              onClick={() => { playMacClick(isMuted); onChangeWallpaper(wp.id); }}
              style={wp.id === 'custom' ? { backgroundImage: "url('/bg-photo.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' } : wp.id === 'video' ? { backgroundColor: '#0f172a' } : {}}
              className={`p-2 rounded-lg text-left text-[11px] font-semibold text-white ${wp.bgClass} flex items-center justify-between shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
                wallpaper === wp.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <span className="truncate">{wp.name}</span>
              {wallpaper === wp.id && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </button>
          ))}
        </div>
      </div>

            {/* iPod Classic Player Tile */}
      <div 
        onClick={() => { playMacClick(isMuted); onToggleCyberdeck && onToggleCyberdeck(); }}
        className={`p-2.5 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer transition-all mb-3 ${
          showCyberdeck 
            ? "bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white border-pink-400/40 shadow-md" 
            : "bg-white/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 shadow">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs">iPod Classic Player</div>
            <div className="text-[10px] opacity-80">{showCyberdeck ? "Active on Screen" : "Click to Show"}</div>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${showCyberdeck ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
          {showCyberdeck ? "ON" : "OFF"}
        </span>
      </div>

      {/* Sound Volume Control Tile */}
      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-xs space-y-2">
        <div className="flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-500" />
            <span>Sound Volume</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
      </div>

    </div>
  );
}
