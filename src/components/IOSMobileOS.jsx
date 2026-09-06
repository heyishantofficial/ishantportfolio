import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Battery, Sliders, Volume2, VolumeX, Moon, Sun, 
  Lock, Unlock, ChevronRight, Play, Pause,
  ExternalLink, ArrowRight, Flashlight, Download, Radio
} from 'lucide-react';
import { PROFILE_INFO, PROJECTS_DATA } from '../data/projectsData';
import { playMacClick } from '../utils/macAudioEngine';
import AnimatedQuoteHeading from './AnimatedQuoteHeading';
import SafariBrowser from './SafariBrowser';
import SystemSettingsModal from './SystemSettingsModal';
import RetroArcadeApp from './RetroArcade/RetroArcadeApp';
import NexusCyberdeckPlayer from './NexusCyberdeckPlayer';
import { 
  QuickNotesModal, 
  PhotosModal, 
  MailModal, 
  FinderModal 
} from './macDockModals';

export default function IOSMobileOS({
  isAppReady,
  onUnlock,
  viewerName,
  setViewerName,
  loginError,
  setLoginError,
  isLoggingIn,
  isShaking,
  wallpaper,
  lockWallpaper,
  onChangeWallpaper,
  isDarkMode,
  onToggleDarkMode,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
  socialLinks,
  dashboardConfig,
  onUpdateSocialLinks,
  onUpdateDashboardConfig,
  folderIcons,
  onUpdateFolderIcons,
  customUploadDesktop,
  customUploadLock,
  onUploadDesktopWallpaper,
  onUploadLockWallpaper
}) {
  // Mobile navigation & active sheet state
  const [activeSheet, setActiveSheet] = useState(null); // 'finder' | 'safari' | 'notes' | 'work' | 'journey' | 'arcade' | 'photos' | 'settings' | 'mail' | 'cyberdeck' | 'project-detail'
  const [selectedProject, setSelectedProject] = useState(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('9:41');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isPlayingMiniAudio, setIsPlayingMiniAudio] = useState(false);

  const nameInputRef = useRef(null);

  // Live iOS Clock & Date update
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const timeStr = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`;
      setCurrentTimeStr(timeStr);

      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDateStr(d.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAppLaunch = (appKey) => {
    playMacClick(isMuted);
    if (appKey === 'youtube') {
      window.open(socialLinks?.youtube || 'https://youtube.com/@heyishant', '_blank', 'noopener,noreferrer');
      return;
    }
    if (appKey === 'linkedin') {
      window.open(socialLinks?.linkedin || 'https://linkedin.com', '_blank', 'noopener,noreferrer');
      return;
    }
    if (appKey === 'instagram') {
      window.open(socialLinks?.instagram || 'https://instagram.com/heyishant', '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveSheet(appKey);
  };

  const handleCloseSheet = () => {
    playMacClick(isMuted);
    setActiveSheet(null);
    setSelectedProject(null);
  };

  const handleOpenProjectModal = (proj) => {
    playMacClick(isMuted);
    setSelectedProject(proj);
    setActiveSheet('project-detail');
  };

  const wallpaperClasses = {
    video: 'wallpaper-video',
    custom: 'wallpaper-custom',
    sequoia: 'wallpaper-sequoia',
    sonoma: 'wallpaper-sonoma',
    neon: 'wallpaper-neon',
    aurora: 'wallpaper-aurora'
  };

  // 12 Home Screen App Grid Items
  const homeApps = [
    { id: 'finder', name: 'Files', icon: '/icons/Finder.png', isCustomIcon: true },
    { id: 'safari', name: 'Safari', icon: '/icons/Chrome.png', isCustomIcon: true },
    { id: 'notes', name: 'Notes', icon: '/icons/Notes.png', isCustomIcon: true },
    { id: 'work', name: 'Work', icon: '/icons/Folder.png', isCustomIcon: true },
    { id: 'journey', name: 'Journey', icon: '/icons/Folder.png', isCustomIcon: true },
    { id: 'arcade', name: 'Arcade', icon: '/icons/Games.png', isCustomIcon: true },
    { id: 'photos', name: 'Photos', icon: '/icons/Photos.png', isCustomIcon: true },
    { 
      id: 'settings', 
      name: 'Settings', 
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center p-3 text-white">
          <Sliders className="w-6 h-6" />
        </div>
      )
    },
    { id: 'youtube', name: 'YouTube', icon: '/icons/YouTube.png', isCustomIcon: true },
    { id: 'linkedin', name: 'LinkedIn', icon: '/icons/LinkedIn.png', isCustomIcon: true },
    { id: 'instagram', name: 'Instagram', icon: '/icons/Instagram.png', isCustomIcon: true },
    { id: 'mail', name: 'Mail', icon: '/icons/Mail.png', isCustomIcon: true }
  ];

  // 4 Bottom Dock Apps
  const dockApps = [
    { id: 'mail', name: 'Mail', icon: '/icons/Mail.png' },
    { id: 'safari', name: 'Safari', icon: '/icons/Chrome.png' },
    { id: 'notes', name: 'Notes', icon: '/icons/Notes.png' },
    { id: 'finder', name: 'Files', icon: '/icons/Finder.png' }
  ];

  return (
    <div className={`w-full h-full min-h-[100dvh] max-h-[100dvh] overflow-hidden fixed inset-0 select-none font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Dynamic Background */}
      <div 
        className={`absolute inset-0 w-full h-full -z-10 ${
          wallpaper === 'uploaded_desktop' && customUploadDesktop ? '' : (wallpaperClasses[wallpaper] || 'wallpaper-video')
        }`}
        style={wallpaper === 'uploaded_desktop' && customUploadDesktop ? { backgroundImage: `url(${customUploadDesktop})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {wallpaper === 'video' && (
          <video
            src="/bg-video.mp4"
            autoPlay
            loop
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover pointer-events-none opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Torch flashlight screen effect if toggled */}
      {isTorchOn && (
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center text-slate-900 animate-fadeIn p-6">
          <Flashlight className="w-16 h-16 mb-4 animate-pulse text-amber-500" />
          <h2 className="text-xl font-bold font-montserrat">Flashlight Mode Active</h2>
          <p className="text-xs text-slate-500 mt-1 mb-8">Tap anywhere to turn off flashlight</p>
          <button 
            onClick={() => setIsTorchOn(false)}
            className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-lg"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. iOS 18 LOCK SCREEN                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            key="ios-lockscreen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col justify-between pt-safe pb-safe px-5 text-white overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 50% 30%, rgba(26, 31, 46, 0.7) 0%, rgba(11, 13, 18, 0.9) 75%)'
            }}
          >
            {/* Top iOS Lock Status Bar */}
            <div className="w-full flex items-center justify-between text-[13px] font-semibold text-white/90 pt-1 px-2">
              <span className="font-mono tracking-tight text-xs">{currentTimeStr}</span>
              <div className="flex items-center gap-1.5 opacity-80">
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-white" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono">100%</span>
                  <Battery className="w-4 h-4 text-white fill-white/20" />
                </div>
              </div>
            </div>

            {/* iOS 18 Large Clock & Date Header */}
            <div className="flex flex-col items-center text-center mt-3 sm:mt-6">
              <span className="text-sm sm:text-base font-medium tracking-wide text-white/80 drop-shadow-md">
                {currentDateStr || 'Sunday, September 7'}
              </span>
              <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] my-1 font-montserrat">
                {currentTimeStr}
              </h1>
            </div>

            {/* Center: Quote Heading & Liquid Glass Name Unlock Input */}
            <div className="flex flex-col items-center w-full max-w-sm mx-auto my-auto space-y-4">
              {/* Interactive touch-repelling quote characters */}
              <div className="w-full scale-90 sm:scale-100 origin-center">
                <AnimatedQuoteHeading />
              </div>

              {/* Name Login Form */}
              <form onSubmit={onUnlock} className="w-full max-w-[280px]">
                <div className={`relative flex items-center ${isShaking ? 'animate-shake' : ''}`}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={viewerName}
                    onChange={(e) => {
                      setViewerName(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Enter Your Name..."
                    autoComplete="off"
                    className="w-full py-2.5 pl-4 pr-11 rounded-full mac-liquid-glass-input text-white placeholder-white/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-xl transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 w-7 h-7 rounded-full bg-white/25 hover:bg-white/40 active:scale-90 text-white flex items-center justify-center transition-transform cursor-pointer border border-white/30"
                    title="Unlock"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {loginError && (
                <p className="font-mono text-[11px] text-amber-300 font-semibold animate-fadeIn text-center">
                  {loginError}
                </p>
              )}

              {/* Unlock Action Pill */}
              <button
                type="button"
                onClick={onUnlock}
                className="px-5 py-2 rounded-full mac-liquid-glass-btn text-white text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <span>{isLoggingIn ? 'Unlocking...' : viewerName.trim() ? `Unlock as ${viewerName}` : 'Swipe or Tap to Unlock'}</span>
                <Unlock className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>

            {/* Bottom iOS Lock Actions: Flashlight & Camera / Contact */}
            <div className="w-full flex items-end justify-between px-4 pb-2">
              {/* Flashlight Shortcut */}
              <button
                type="button"
                onClick={() => {
                  playMacClick(isMuted);
                  setIsTorchOn(!isTorchOn);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-2xl border transition-all active:scale-90 shadow-xl ${
                  isTorchOn 
                    ? 'bg-white text-slate-900 border-white ring-4 ring-white/40' 
                    : 'bg-black/35 text-white border-white/20 hover:bg-black/50'
                }`}
                title="Flashlight"
              >
                <Flashlight className="w-5 h-5" />
              </button>

              {/* Home swipe indicator */}
              <div 
                onClick={onUnlock}
                className="flex flex-col items-center gap-1 cursor-pointer group pb-1"
              >
                <span className="text-[10px] font-semibold tracking-wider uppercase text-white/70 group-hover:text-white transition-colors">
                  Swipe up to open
                </span>
                <div className="ios-home-indicator animate-pulse" />
              </div>

              {/* Quick Resume Download Shortcut */}
              <a
                href="/resume.pdf"
                download="Ishant_Chauhan_Resume.pdf"
                onClick={() => playMacClick(isMuted)}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-black/35 text-white border border-white/20 hover:bg-black/50 active:scale-90 shadow-xl transition-all"
                title="Download Resume PDF"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. iOS 18 HOME SCREEN                                                     */}
      {/* ========================================================================= */}
      {isAppReady && (
        <div className="w-full h-full flex flex-col justify-between pt-safe pb-safe px-4 overflow-y-auto relative z-10 animate-fadeIn">
          
          {/* Top iOS Status Bar with Dynamic Island */}
          <div className="w-full flex items-center justify-between text-[12px] font-semibold text-white px-2 pt-1 select-none">
            {/* Clock */}
            <span className="font-mono tracking-tight font-bold pl-1">{currentTimeStr}</span>

            {/* Center Dynamic Island Pill */}
            <div 
              onClick={() => handleAppLaunch('cyberdeck')}
              className="ios-dynamic-island px-3.5 py-1 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/20" />
              <span className="text-[10px] font-mono tracking-wider text-white/90">
                {isPlayingMiniAudio ? '🎵 Vibecoding' : 'IshantOS'}
              </span>
              {isPlayingMiniAudio && (
                <div className="flex items-center gap-0.5">
                  <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* Right Status Controls */}
            <div 
              onClick={() => setShowControlCenter(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all pr-1"
              title="Open Control Center"
            >
              <Wifi className="w-3.5 h-3.5 text-white" />
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>

          {/* Main Scrollable Content Area: Smart Widgets + 4-Column App Grid */}
          <div className="flex-1 w-full max-w-md mx-auto my-auto flex flex-col justify-start gap-4 py-2">
            
            {/* Top Smart Widgets Section */}
            <div className="grid grid-cols-2 gap-3 w-full">
              
              {/* Smart Widget 1: Profile & Bio Card */}
              <div 
                onClick={() => handleAppLaunch('journey')}
                className="ios-glass-card rounded-[24px] p-3.5 flex flex-col justify-between text-white cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0 bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                    IC
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-bold truncate leading-tight">{PROFILE_INFO.name}</h2>
                    <span className="text-[10px] text-white/70 block truncate">Content & Vibecode</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Available for Projects
                  </span>
                  <p className="text-[10px] text-white/80 line-clamp-2 leading-relaxed">
                    Personal branding, viral distribution engines & AI tools.
                  </p>
                </div>
              </div>

              {/* Smart Widget 2: Cyberdeck Cassette Mini-Player Widget */}
              <div 
                className="ios-glass-card rounded-[24px] p-3.5 flex flex-col justify-between text-white cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div 
                  onClick={() => handleAppLaunch('cyberdeck')} 
                  className="flex items-center justify-between"
                >
                  <span className="text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Cyberdeck
                  </span>
                  <ExternalLink className="w-3 h-3 text-white/60 group-hover:text-white transition-colors" />
                </div>

                <div 
                  onClick={() => handleAppLaunch('cyberdeck')}
                  className="my-1 text-center"
                >
                  <span className="text-[11px] font-bold text-white block truncate">
                    Retro Synth Tape #01
                  </span>
                  <span className="text-[9px] text-white/60 block font-mono">
                    Lofi Beats & Synthwave
                  </span>
                </div>

                {/* Mini Player Controls */}
                <div className="flex items-center justify-center gap-3 pt-1 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMacClick(isMuted);
                      setIsPlayingMiniAudio(!isPlayingMiniAudio);
                    }}
                    className="w-7 h-7 rounded-full bg-white/25 hover:bg-white/40 active:scale-90 flex items-center justify-center text-white transition-all shadow"
                    title={isPlayingMiniAudio ? "Pause" : "Play"}
                  >
                    {isPlayingMiniAudio ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppLaunch('cyberdeck');
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-semibold text-white hover:bg-white/30 active:scale-95 transition-all"
                  >
                    Open Deck
                  </button>
                </div>
              </div>

            </div>

            {/* 4-Column iOS App Grid */}
            <div className="grid grid-cols-4 gap-x-3 gap-y-4 w-full py-1">
              {homeApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleAppLaunch(app.id)}
                  className="flex flex-col items-center gap-1 cursor-pointer apple-pressable"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 ios-squircle flex items-center justify-center bg-white/10 backdrop-blur-md">
                    {app.renderIcon ? (
                      app.renderIcon()
                    ) : (
                      <img 
                        src={app.icon} 
                        alt={app.name} 
                        className="w-full h-full object-cover select-none pointer-events-none" 
                        loading="lazy"
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-tight text-center truncate max-w-[64px]">
                    {app.name}
                  </span>
                </div>
              ))}
            </div>

            {/* iOS Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>

          </div>

          {/* Bottom iOS Floating Dock Container */}
          <div className="w-full max-w-[340px] mx-auto mb-1">
            <div className="ios-glass-dock rounded-[2rem] px-4 py-2.5 flex items-center justify-between shadow-2xl">
              {dockApps.map((app) => (
                <div
                  key={`dock-${app.id}`}
                  onClick={() => handleAppLaunch(app.id)}
                  className="w-13 h-13 sm:w-14 sm:h-14 ios-squircle flex items-center justify-center cursor-pointer apple-pressable"
                  title={app.name}
                >
                  <img 
                    src={app.icon} 
                    alt={app.name} 
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
              ))}
            </div>

            {/* Bottom Home Indicator Gesture Bar */}
            <div className="w-full flex items-center justify-center pt-2">
              <div className="ios-home-indicator" />
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. iOS APP MODAL SHEETS (Native Bottom Sheets for All Windows)             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/50 backdrop-blur-md">
            
            {/* Scrim click to dismiss */}
            <div 
              className="absolute inset-0 z-0" 
              onClick={handleCloseSheet} 
            />

            <motion.div
              key={`sheet-${activeSheet}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 110 || info.velocity.y > 400) {
                  handleCloseSheet();
                }
              }}
              className="relative z-10 w-full max-h-[92dvh] h-[90dvh] ios-sheet-surface rounded-t-[32px] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Top Grab Handle Pill */}
              <div className="w-full flex items-center justify-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-slate-400/40 dark:bg-white/20" />
              </div>

              {/* iOS Navigation Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight capitalize">
                    {activeSheet === 'safari' ? 'Safari Browser' :
                     activeSheet === 'finder' ? 'Files & Documents' :
                     activeSheet === 'notes' ? 'Notes Workspace' :
                     activeSheet === 'work' ? 'Featured Work' :
                     activeSheet === 'journey' ? 'The Journey & Career' :
                     activeSheet === 'arcade' ? 'Retro Arcade' :
                     activeSheet === 'photos' ? 'Photos Library' :
                     activeSheet === 'settings' ? 'System Settings' :
                     activeSheet === 'mail' ? 'Contact Ishant' :
                     activeSheet === 'cyberdeck' ? 'Nexus Cyberdeck' :
                     activeSheet === 'project-detail' ? selectedProject?.title || 'Case Study' :
                     activeSheet}
                  </span>
                </div>

                {/* Done / Close Button */}
                <button
                  onClick={handleCloseSheet}
                  className="px-3.5 py-1 rounded-full bg-slate-200/80 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/30 text-xs font-bold transition-all active:scale-95"
                >
                  Done
                </button>
              </div>

              {/* Scrollable Sheet Body Container */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                
                {/* 1. Safari Browser Sheet */}
                {activeSheet === 'safari' && (
                  <SafariBrowser 
                    onClose={handleCloseSheet} 
                    socialLinks={socialLinks} 
                    dashboardConfig={dashboardConfig}
                    isEmbedded={true}
                  />
                )}

                {/* 2. Finder / Files Sheet */}
                {activeSheet === 'finder' && (
                  <FinderModal 
                    onSelectProject={handleOpenProjectModal}
                    onLaunchApp={handleAppLaunch}
                    onClose={handleCloseSheet}
                  />
                )}

                {/* 3. Notes Workspace Sheet */}
                {activeSheet === 'notes' && (
                  <QuickNotesModal onClose={handleCloseSheet} />
                )}

                {/* 4. Projects & Work Showcase Sheet */}
                {activeSheet === 'work' && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Selected Case Studies & Vibecoded Apps
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Click on any project to explore live architecture, demo, and production metrics.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {PROJECTS_DATA.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => handleOpenProjectModal(proj)}
                          className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              {proj.year} · {proj.category}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {proj.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {proj.tagline || proj.summary}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. The Journey / Experience Sheet */}
                {activeSheet === 'journey' && (
                  <div className="p-4 space-y-4 text-xs leading-relaxed">
                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-black/10 dark:border-white/10">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Ishant Chauhan
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">
                        Content Strategist · Producer · Vibecoder
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        I build distribution machines for tech brands and write code that turns ideas into working software. 
                        Over the past 5 years, I've produced short-form engines generating millions of impressions, structured creator braindumps into video scripts, and vibecoded AI tools that automate production workflows.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        Core Pillars
                      </h4>
                      <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">01. Content Architecture</span>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">Writing high-retention hooks, scripting technical deep dives, and scaling founder media.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">02. Vibecoding & Rapid Prototyping</span>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">Using Cursor AI, LLM workflows, and modern web tech to build tactile web apps in days.</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href="/resume.pdf"
                        download="Ishant_Chauhan_Resume.pdf"
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Official Resume PDF
                      </a>
                    </div>
                  </div>
                )}

                {/* 6. Retro Arcade Game Sheet */}
                {activeSheet === 'arcade' && (
                  <div className="p-2 h-full">
                    <RetroArcadeApp onClose={handleCloseSheet} />
                  </div>
                )}

                {/* 7. Photos Library Sheet */}
                {activeSheet === 'photos' && (
                  <PhotosModal onClose={handleCloseSheet} />
                )}

                {/* 8. System Settings Sheet */}
                {activeSheet === 'settings' && (
                  <SystemSettingsModal
                    onClose={handleCloseSheet}
                    wallpaper={wallpaper}
                    onChangeWallpaper={onChangeWallpaper}
                    lockWallpaper={lockWallpaper}
                    onChangeLockWallpaper={onChangeWallpaper}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    volume={volume}
                    onChangeVolume={onChangeVolume}
                    socialLinks={socialLinks}
                    onUpdateSocialLinks={onUpdateSocialLinks}
                    dashboardConfig={dashboardConfig}
                    onUpdateDashboardConfig={onUpdateDashboardConfig}
                    folderIcons={folderIcons}
                    onUpdateFolderIcons={onUpdateFolderIcons}
                    customUploadDesktop={customUploadDesktop}
                    onUploadDesktopWallpaper={onUploadDesktopWallpaper}
                    customUploadLock={customUploadLock}
                    onUploadLockWallpaper={onUploadLockWallpaper}
                    isEmbedded={true}
                  />
                )}

                {/* 9. Mail & Contact Sheet */}
                {activeSheet === 'mail' && (
                  <MailModal 
                    onClose={handleCloseSheet}
                    contactEmail={dashboardConfig?.contactEmail}
                  />
                )}

                {/* 10. Nexus Cyberdeck Full Player Sheet */}
                {activeSheet === 'cyberdeck' && (
                  <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
                    <NexusCyberdeckPlayer 
                      onClose={handleCloseSheet}
                      masterVolume={volume}
                      isMuted={isMuted}
                      onIsPlayingChange={(playing) => setIsPlayingMiniAudio(playing)}
                    />
                  </div>
                )}

                {/* 11. Individual Project Detail Sheet */}
                {activeSheet === 'project-detail' && selectedProject && (
                  <div className="p-4 space-y-4 text-slate-800 dark:text-slate-100">
                    <div className="border-b border-black/10 dark:border-white/10 pb-3">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {selectedProject.category} · {selectedProject.year}
                      </span>
                      <h2 className="text-xl font-black mt-0.5">{selectedProject.title}</h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {selectedProject.tagline || selectedProject.summary}
                      </p>
                    </div>

                    {selectedProject.highlights && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Highlights</h4>
                        <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                          {selectedProject.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProject.demoUrl && selectedProject.demoUrl !== '#' && (
                      <div className="pt-2">
                        <a
                          href={selectedProject.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          <ExternalLink className="w-4 h-4" /> Visit Live Production App
                        </a>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. iOS CONTROL CENTER SHEET                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showControlCenter && (
          <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xl flex flex-col justify-start p-5 pt-safe text-white animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Control Centre
              </span>
              <button
                onClick={() => setShowControlCenter(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Control Tiles Grid */}
            <div className="grid grid-cols-2 gap-3 my-4">
              
              {/* Connectivity Tile */}
              <div className="p-3.5 rounded-2xl ios-glass-card space-y-2">
                <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Sound & Audio</span>
                <button
                  onClick={() => onToggleMute()}
                  className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    isMuted ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
                </button>
              </div>

              {/* Display & Dark Mode Tile */}
              <div className="p-3.5 rounded-2xl ios-glass-card space-y-2">
                <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Appearance</span>
                <button
                  onClick={() => onToggleDarkMode()}
                  className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all"
                >
                  {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </div>

            </div>

            {/* Volume Slider Tile */}
            <div className="p-4 rounded-2xl ios-glass-card space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Master Volume</span>
                <span className="font-mono text-white/70">{isMuted ? '0%' : `${volume}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 rounded-lg bg-white/30"
              />
            </div>

            {/* Quick Wallpaper Switcher */}
            <div className="p-4 rounded-2xl ios-glass-card space-y-2">
              <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Wallpapers</span>
              <div className="grid grid-cols-3 gap-2">
                {['video', 'custom', 'sequoia', 'sonoma', 'neon', 'aurora'].map((wp) => (
                  <button
                    key={wp}
                    onClick={() => {
                      playMacClick(isMuted);
                      onChangeWallpaper(wp);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold capitalize transition-all border ${
                      wallpaper === wp ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/10 text-white/80 border-white/15'
                    }`}
                  >
                    {wp}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
