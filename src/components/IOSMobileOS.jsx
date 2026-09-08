import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Battery, Sliders, Volume2, VolumeX, Moon, Sun, 
  Lock, ChevronRight,
  ExternalLink, ArrowRight, Flashlight, Download, Radio,
  ArrowLeft
} from 'lucide-react';
import { PROJECTS_DATA } from '../data/projectsData';
import { findNode } from '../data/ishantOS';
import { useFileSystem } from '../utils/useFileSystem';
import { playMacClick } from '../utils/macAudioEngine';
import AnimatedQuoteHeading from './AnimatedQuoteHeading';
import NodeIcon from '../os/NodeIcon';
import { 
  PhotosModal, 
  MailModal 
} from './macDockModals';
import IOSFilesApp from './IOSFilesApp';
import IOSNotesApp from './IOSNotesApp';

const SafariBrowser = React.lazy(() => import('./SafariBrowser'));
const SystemSettingsModal = React.lazy(() => import('./SystemSettingsModal'));
const RetroArcadeApp = React.lazy(() => import('./RetroArcade/RetroArcadeApp'));
const NexusCyberdeckPlayer = React.lazy(() => import('./NexusCyberdeckPlayer'));

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
  const { version } = useFileSystem();

  // Mobile navigation & active sheet state
  const [activeSheet, setActiveSheet] = useState(null); 
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeFolderStack, setActiveFolderStack] = useState([]);
  const [activeTextFile, setActiveTextFile] = useState(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('9:41');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [homeScreenPage, setHomeScreenPage] = useState(0);

  const isDraggingRef = useRef(false);
  const nameInputRef = useRef(null);
  const videoRef = useRef(null);

  // Pause heavy background video when a sheet is open to prevent GPU/CPU contention on mobile
  useEffect(() => {
    if (!videoRef.current) return;
    if (activeSheet) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [activeSheet]);

  // Live iOS Clock & Date update (throttled to avoid redundant re-renders)
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const timeStr = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`;
      setCurrentTimeStr((prev) => (prev === timeStr ? prev : timeStr));

      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateStr = d.toLocaleDateString('en-US', options);
      setCurrentDateStr((prev) => (prev === dateStr ? prev : dateStr));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenFolder = useCallback((nodeId) => {
    playMacClick(isMuted);
    const node = findNode(nodeId);
    if (!node) return;

    if (node.id === 'resume' || node.kind === 'pdf') {
      window.open(node.href || '/resume.pdf', '_blank');
      return;
    }

    setActiveFolderStack([node.id]);
    setActiveTextFile(null);
    setActiveSheet('folder');
  }, [isMuted]);

  const handleFolderDrillDown = (childNode) => {
    playMacClick(isMuted);
    if (!childNode) return;

    if (childNode.kind === 'folder') {
      setActiveFolderStack((prev) => [...prev, childNode.id]);
      setActiveTextFile(null);
      return;
    }

    if (childNode.kind === 'project') {
      const proj = childNode.project || PROJECTS_DATA.find((p) => p.id === childNode.id) || childNode;
      setSelectedProject(proj);
      setActiveSheet('project-detail');
      return;
    }

    if (childNode.kind === 'text') {
      setActiveTextFile(childNode);
      return;
    }

    if (childNode.kind === 'pdf' || childNode.id === 'resume') {
      window.open(childNode.href || '/resume.pdf', '_blank');
      return;
    }

    if (childNode.kind === 'mail') {
      setActiveSheet('mail');
      return;
    }

    if (childNode.kind === 'link') {
      if (childNode.href) window.open(childNode.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFolderBack = () => {
    playMacClick(isMuted);
    if (activeTextFile) {
      setActiveTextFile(null);
      return;
    }
    if (activeFolderStack.length > 1) {
      setActiveFolderStack((prev) => prev.slice(0, -1));
    } else {
      handleCloseSheet();
    }
  };

  const handleAppLaunch = useCallback((appKey) => {
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
  }, [isMuted, socialLinks]);

  const handleCloseSheet = () => {
    playMacClick(isMuted);
    setActiveSheet(null);
    setSelectedProject(null);
    setActiveFolderStack([]);
    setActiveTextFile(null);
  };

  const handleOpenProjectModal = useCallback((proj) => {
    playMacClick(isMuted);
    setSelectedProject(proj);
    setActiveSheet('project-detail');
  }, [isMuted]);

  const wallpaperClasses = {
    video: 'wallpaper-video',
    custom: 'wallpaper-custom',
    sequoia: 'wallpaper-sequoia',
    sonoma: 'wallpaper-sonoma',
    neon: 'wallpaper-neon',
    aurora: 'wallpaper-aurora'
  };

  // Dynamic filesystem items for Screen 1 (derived from live IshantOS tree, renames & version)
  const page1Items = useMemo(() => {
    void version;
    const homeNode = findNode('home');
    const allChildren = homeNode?.children || [];
    // Prioritize standard portfolio order with Resume upfront for mobile convenience:
    const preferredOrder = ['about-me', 'resume', 'experience', 'work', 'ai-lab', 'random', 'contact'];
    const ordered = preferredOrder.map(findNode).filter(Boolean);
    const orderedIds = new Set(ordered.map((n) => n.id));
    const extra = allChildren.filter((n) => n && !orderedIds.has(n.id));
    const allDesktopNodes = [...ordered, ...extra];

    const mapped = allDesktopNodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.kind,
      node,
      action: () => {
        if (node.id === 'resume' || node.kind === 'pdf') {
          window.open(node.href || '/resume.pdf', '_blank');
        } else if (node.kind === 'folder') {
          handleOpenFolder(node.id);
        } else if (node.kind === 'project') {
          const proj = node.project || PROJECTS_DATA.find((p) => p.id === node.id) || node;
          handleOpenProjectModal(proj);
        } else if (node.kind === 'link') {
          if (node.href) window.open(node.href, '_blank', 'noopener,noreferrer');
        } else if (node.kind === 'text') {
          setActiveTextFile(node);
          setActiveSheet('folder');
        } else {
          handleOpenFolder(node.id);
        }
      },
      customRender: () => (
        <div className="w-full h-full flex items-center justify-center p-1.5">
          <NodeIcon node={node} size={46} />
        </div>
      )
    }));

    // Files (Finder) system app
    const filesAppItem = {
      id: 'finder',
      name: 'Files',
      type: 'app',
      icon: '/icons/Finder.png',
      action: () => handleAppLaunch('finder')
    };

    // Insert Files app cleanly into the 8th slot (or append at end)
    if (mapped.length >= 7) {
      return [...mapped.slice(0, 7), filesAppItem, ...mapped.slice(7)];
    }
    return [...mapped, filesAppItem];
  }, [version, handleOpenFolder, handleOpenProjectModal, handleAppLaunch]);

  // Page 2: System Apps, Media, Arcade & Socials (10 items)
  const page2Items = useMemo(() => [
    {
      id: 'safari',
      name: 'Safari',
      type: 'app',
      icon: '/icons/Chrome.png',
      action: () => handleAppLaunch('safari')
    },
    {
      id: 'notes',
      name: 'Notes',
      type: 'app',
      icon: '/icons/Notes.png',
      action: () => handleAppLaunch('notes')
    },
    {
      id: 'arcade',
      name: 'Arcade',
      type: 'app',
      icon: '/icons/Games.png',
      action: () => handleAppLaunch('arcade')
    },
    {
      id: 'cyberdeck',
      name: 'Cyberdeck',
      type: 'app',
      action: () => handleAppLaunch('cyberdeck'),
      customRender: () => (
        <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center p-2.5 text-white shadow-inner">
          <Radio className="w-7 h-7" />
        </div>
      )
    },
    {
      id: 'photos',
      name: 'Photos',
      type: 'app',
      icon: '/icons/Photos.png',
      action: () => handleAppLaunch('photos')
    },
    {
      id: 'settings',
      name: 'Settings',
      type: 'app',
      action: () => handleAppLaunch('settings'),
      customRender: () => (
        <div className="w-full h-full bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center p-3 text-white">
          <Sliders className="w-6 h-6" />
        </div>
      )
    },
    {
      id: 'youtube',
      name: 'YouTube',
      type: 'app',
      icon: '/icons/YouTube.png',
      action: () => handleAppLaunch('youtube')
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'app',
      icon: '/icons/LinkedIn.png',
      action: () => handleAppLaunch('linkedin')
    },
    {
      id: 'instagram',
      name: 'Instagram',
      type: 'app',
      icon: '/icons/Instagram.png',
      action: () => handleAppLaunch('instagram')
    },
    {
      id: 'mail',
      name: 'Mail',
      type: 'app',
      icon: '/icons/Mail.png',
      action: () => handleAppLaunch('mail')
    }
  ], [handleAppLaunch]);

  // 4 Bottom Dock Apps
  const dockApps = useMemo(() => [
    { id: 'mail', name: 'Mail', icon: '/icons/Mail.png', action: () => handleAppLaunch('mail') },
    { id: 'safari', name: 'Safari', icon: '/icons/Chrome.png', action: () => handleAppLaunch('safari') },
    { id: 'notes', name: 'Notes', icon: '/icons/Notes.png', action: () => handleAppLaunch('notes') },
    { id: 'finder', name: 'Files', icon: '/icons/Finder.png', action: () => handleAppLaunch('finder') }
  ], [handleAppLaunch]);

  const currentFolderId = activeFolderStack[activeFolderStack.length - 1];
  const currentFolder = useMemo(() => {
    void version;
    if (!currentFolderId) return null;
    const id = typeof currentFolderId === 'string' ? currentFolderId : currentFolderId.id;
    return findNode(id) || (typeof currentFolderId === 'object' ? currentFolderId : null);
  }, [currentFolderId, version]);

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
            ref={videoRef}
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

      {/* Torch Flashlight Screen Effect if toggled */}
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
          >
            {/* Lock Screen Wallpaper Background matching web version */}
            {lockWallpaper === 'custom' && (
              <img
                src="/bg-poc.jpg"
                alt="Lock Screen Wallpaper"
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />
            )}
            {lockWallpaper === 'uploaded_lock' && customUploadLock && (
              <img
                src={customUploadLock}
                alt="Uploaded Lock Screen Wallpaper"
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />
            )}
            {lockWallpaper === 'video' && (
              <video
                src="/lock-video.mp4"
                autoPlay
                loop
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
              />
            )}
            {lockWallpaper !== 'custom' && lockWallpaper !== 'uploaded_lock' && lockWallpaper !== 'video' && (
              <div className={`absolute inset-0 z-0 pointer-events-none ${wallpaperClasses[lockWallpaper] || 'wallpaper-custom'}`} />
            )}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-0 pointer-events-none" />

            {/* Top iOS Lock Status Bar */}
            <div className="relative z-10 w-full flex items-center justify-between text-[13px] font-semibold text-white/90 pt-1 px-2">
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
            <div className="relative z-10 flex flex-col items-center text-center mt-3 sm:mt-6">
              <span className="text-sm sm:text-base font-medium tracking-wide text-white/80 drop-shadow-md">
                {currentDateStr || 'Monday, September 8'}
              </span>
              <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] my-1 font-montserrat">
                {currentTimeStr}
              </h1>
            </div>

            {/* Center: Quote Heading & Liquid Glass Name Unlock Input */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto my-auto space-y-4">
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

              {/* Direct Tap to Unlock prompt */}
              <button
                type="button"
                onClick={onUnlock}
                className="px-5 py-2 rounded-full mac-liquid-glass-btn text-white/90 font-mono text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg"
              >
                <span>{isLoggingIn ? 'Logging in...' : 'Swipe or Tap to Unlock'}</span>
                <span>🔒</span>
              </button>
            </div>

            {/* Bottom Controls: Flashlight, Unlock Swipe Bar, Resume Download */}
            <div className="relative z-10 w-full flex items-center justify-between pb-3 px-3">
              {/* Flashlight button */}
              <button
                onClick={() => setIsTorchOn(!isTorchOn)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isTorchOn ? 'bg-amber-400 text-slate-900 shadow-amber-400/50' : 'bg-white/20 text-white hover:bg-white/30'
                } backdrop-blur-xl border border-white/20 shadow-lg active:scale-90`}
                title="Flashlight"
              >
                <Flashlight className="w-5 h-5" />
              </button>

              {/* Home swipe indicator */}
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onUnlock}>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">
                  Swipe up to open
                </span>
                <div className="w-32 h-1 bg-white/70 rounded-full shadow" />
              </div>

              {/* Resume download quick button */}
              <a
                href="/resume.pdf"
                download="Ishant_Chauhan_Resume.pdf"
                className="w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-all"
                title="Download Resume"
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
      <div className="w-full h-full flex flex-col justify-between pt-safe pb-safe px-3 sm:px-4 overflow-x-hidden select-none">

        {/* Top iOS Status Bar */}
        <div className="w-full pt-1 pb-2 flex items-center justify-between text-white drop-shadow-md select-none">
          <span className="font-semibold text-xs font-mono tracking-tight pl-2">
            {currentTimeStr}
          </span>

          <div 
            onClick={() => setShowControlCenter(true)}
            className="flex items-center gap-2 pr-2 cursor-pointer active:opacity-75"
            title="Open Control Center"
          >
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-semibold">100%</span>
              <Battery className="w-4 h-4 fill-white/30" />
            </div>
          </div>
        </div>

        {/* Horizontal Swipeable 2-Page iOS Home Screens (Adaptive to all screen widths) */}
        <div className="w-full overflow-hidden my-auto select-none">
          <motion.div
            className="flex w-full touch-pan-y"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragStart={() => {
              isDraggingRef.current = true;
            }}
            onDragEnd={(_, info) => {
              const swipeThreshold = 30;
              const velocityThreshold = 200;
              if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                setHomeScreenPage(1);
              } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                setHomeScreenPage(0);
              }
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 60);
            }}
            animate={{ x: homeScreenPage === 0 ? '0%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {/* Screen 1: Primary Authentic Folders & Files (Strictly 100% viewport width) */}
            <div className="w-full min-w-full shrink-0 flex-shrink-0 px-1 py-3 box-border">
              <div className="grid grid-cols-4 gap-y-5 sm:gap-y-7 gap-x-2 sm:gap-x-4 justify-items-center w-full max-w-sm mx-auto">
                {page1Items.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      app.action();
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-90 transition-transform select-none"
                  >
                    {/* iOS Squircle Icon */}
                    <div className="w-14 h-14 rounded-2xl ios-squircle shadow-lg flex items-center justify-center overflow-hidden border border-white/25 relative bg-white/20 backdrop-blur-md">
                      {app.customRender ? (
                        app.customRender()
                      ) : (
                        <img src={app.icon} alt={app.name} className="w-full h-full object-cover p-2 select-none pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white tracking-tight drop-shadow-md truncate max-w-[70px] text-center">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screen 2: System Apps, Entertainment & Socials (Strictly 100% viewport width) */}
            <div className="w-full min-w-full shrink-0 flex-shrink-0 px-1 py-3 box-border">
              <div className="grid grid-cols-4 gap-y-5 sm:gap-y-7 gap-x-2 sm:gap-x-4 justify-items-center w-full max-w-sm mx-auto">
                {page2Items.slice(0, 8).map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      app.action();
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-90 transition-transform select-none"
                  >
                    {/* iOS Squircle Icon */}
                    <div className="w-14 h-14 rounded-2xl ios-squircle shadow-lg flex items-center justify-center overflow-hidden border border-white/25 relative bg-white/20 backdrop-blur-md">
                      {app.customRender ? (
                        app.customRender()
                      ) : (
                        <img src={app.icon} alt={app.name} className="w-full h-full object-cover p-2 select-none pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white tracking-tight drop-shadow-md truncate max-w-[70px] text-center">
                      {app.name}
                    </span>
                  </div>
                ))}

                {/* Row 3: Neatly Centered 2 Extra Apps (Instagram & Mail) */}
                {page2Items.length > 8 && (
                  <div className="col-span-4 flex items-center justify-center gap-6 sm:gap-8 pt-1">
                    {page2Items.slice(8).map((app) => (
                      <div 
                        key={app.id}
                        onClick={() => {
                          if (isDraggingRef.current) return;
                          app.action();
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-90 transition-transform select-none"
                      >
                        <div className="w-14 h-14 rounded-2xl ios-squircle shadow-lg flex items-center justify-center overflow-hidden border border-white/25 relative bg-white/20 backdrop-blur-md">
                          {app.customRender ? (
                            app.customRender()
                          ) : (
                            <img src={app.icon} alt={app.name} className="w-full h-full object-cover p-2 select-none pointer-events-none" />
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-white tracking-tight drop-shadow-md truncate max-w-[70px] text-center">
                          {app.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Pagination Indicator Dots */}
        <div className="flex items-center justify-center gap-2 py-2 select-none z-10">
          <button
            type="button"
            onClick={() => setHomeScreenPage(0)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              homeScreenPage === 0 
                ? 'w-2 h-2 bg-white shadow scale-110' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Home Screen 1"
          />
          <button
            type="button"
            onClick={() => setHomeScreenPage(1)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              homeScreenPage === 1 
                ? 'w-2 h-2 bg-white shadow scale-110' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Home Screen 2"
          />
        </div>

        {/* Bottom Floating iOS Frosted Dock (4 Apps) */}
        <div className="w-full mb-1">
          <div className="p-2.5 rounded-3xl ios-glass-dock flex items-center justify-around max-w-sm mx-auto shadow-2xl">
            {dockApps.map((dock) => (
              <div 
                key={`dock-${dock.id}`}
                onClick={dock.action}
                className="w-12 h-12 rounded-2xl ios-squircle overflow-hidden shadow flex items-center justify-center cursor-pointer active:scale-90 transition-transform border border-white/20 bg-white/20 backdrop-blur-md"
              >
                <img src={dock.icon} alt={dock.name} className="w-full h-full object-cover p-2 select-none pointer-events-none" />
              </div>
            ))}
          </div>
          {/* Home grab bar */}
          <div className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-2 mb-1" />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. iOS 18 GESTURE BOTTOM SHEET                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-[9990] bg-black/60 flex flex-col justify-end animate-fadeIn">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 38, stiffness: 380, mass: 0.8 }}
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 350) {
                  handleCloseSheet();
                }
              }}
              className="w-full h-[90dvh] ios-sheet-surface rounded-t-[2.2rem] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
            >
              {/* Sheet Grab Bar & Header (Hidden for Files & Notes, since they render native iOS headers) */}
              {activeSheet !== 'finder' && activeSheet !== 'notes' ? (
                <div className="w-full pt-3 pb-2 px-5 flex items-center justify-between border-b border-black/10 dark:border-white/10 shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    {activeSheet === 'folder' && (activeFolderStack.length > 1 || activeTextFile) ? (
                      <button
                        onClick={handleFolderBack}
                        className="p-1 rounded-full bg-slate-200/80 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 px-2"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    ) : null}
                    <span className="font-bold text-sm tracking-tight capitalize">
                      {activeSheet === 'folder' ? (activeTextFile?.name || currentFolder?.name || 'Folder') :
                       activeSheet === 'work' ? 'Featured Work' :
                       activeSheet === 'arcade' ? 'Retro Arcade' :
                       activeSheet === 'photos' ? 'Photos Library' :
                       activeSheet === 'settings' ? 'System Settings' :
                       activeSheet === 'mail' ? 'Contact Ishant' :
                       activeSheet === 'cyberdeck' ? 'Nexus Cyberdeck' :
                       activeSheet === 'project-detail' ? selectedProject?.title || 'Case Study' :
                       activeSheet}
                    </span>
                    {activeSheet === 'folder' && currentFolder?.children && !activeTextFile && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        {currentFolder.children.length} items
                      </span>
                    )}
                  </div>

                  {/* Done / Close Button */}
                  <button
                    onClick={handleCloseSheet}
                    className="px-3.5 py-1 rounded-full bg-slate-200/80 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/30 text-xs font-bold transition-all active:scale-95"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="w-12 h-1 bg-white/25 rounded-full mx-auto my-1.5 shrink-0" />
              )}

              {/* Scrollable Sheet Body Container */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                
                {/* 1. Generic Folder / Data Explorer Sheet */}
                {activeSheet === 'folder' && (
                  <div className="p-4 space-y-4">
                    {activeTextFile ? (
                      /* Text Document Reader View */
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                            {activeTextFile.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {activeTextFile.description}
                          </p>
                          <div className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-black/5 dark:border-white/5">
                            {activeTextFile.body}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Folder Children Grid / List View */
                      <div className="space-y-3">
                        {currentFolder?.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
                            {currentFolder.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-2.5">
                          {(currentFolder?.children || []).map((child) => (
                            <div
                              key={child.id}
                              onClick={() => handleFolderDrillDown(child)}
                              className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                  <NodeIcon node={child} size={38} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                    {child.name}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {child.description || (child.children ? `${child.children.length} items` : child.kind)}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Safari Browser Sheet */}
                {activeSheet === 'safari' && (
                  <Suspense fallback={null}>
                    <SafariBrowser
                      isEmbedded={true}
                      socialLinks={socialLinks}
                      dashboardConfig={dashboardConfig}
                      onClose={handleCloseSheet}
                      onSelectProject={handleOpenProjectModal} 
                      onLaunchApp={handleAppLaunch}
                    />
                  </Suspense>
                )}

                {/* 3. Native iOS Notes App */}
                {activeSheet === 'notes' && (
                  <IOSNotesApp onClose={handleCloseSheet} />
                )}

                {/* 4. Native iOS Files App */}
                {activeSheet === 'finder' && (
                  <IOSFilesApp 
                    onClose={handleCloseSheet}
                    onSelectProject={handleOpenProjectModal} 
                    onLaunchApp={handleAppLaunch}
                  />
                )}

                {/* 5. Retro Arcade Game Sheet */}
                {activeSheet === 'arcade' && (
                  <Suspense fallback={null}>
                    <div className="p-2 h-full">
                      <RetroArcadeApp onClose={handleCloseSheet} />
                    </div>
                  </Suspense>
                )}

                {/* 6. Photos Library Sheet */}
                {activeSheet === 'photos' && (
                  <PhotosModal onClose={handleCloseSheet} />
                )}

                {/* 7. System Settings Sheet */}
                {activeSheet === 'settings' && (
                  <Suspense fallback={null}>
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
                  </Suspense>
                )}

                {/* 8. Mail & Contact Sheet */}
                {activeSheet === 'mail' && (
                  <MailModal 
                    onClose={handleCloseSheet}
                    contactEmail={dashboardConfig?.contactEmail}
                  />
                )}

                {/* 9. iOS Floating Cyberdeck Music Player Sheet */}
                {activeSheet === 'cyberdeck' && (
                  <Suspense fallback={null}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 0.88, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 30 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                      className="fixed bottom-24 inset-x-0 mx-auto z-50 flex justify-center pointer-events-auto"
                    >
                      <NexusCyberdeckPlayer
                        onClose={handleCloseSheet}
                        masterVolume={volume}
                        isMuted={isMuted}
                      />
                    </motion.div>
                  </Suspense>
                )}

                {/* 10. Individual Project Detail Sheet */}
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
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Highlights &amp; Architecture
                        </span>
                        <ul className="space-y-1">
                          {selectedProject.highlights.map((h, i) => (
                            <li key={i} className="text-xs flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProject.techStack && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Tech Stack
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProject.techStack.map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-mono">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProject.demoUrl && selectedProject.demoUrl !== '#' && (
                      <div className="pt-3">
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
                <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Sound &amp; Audio</span>
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
