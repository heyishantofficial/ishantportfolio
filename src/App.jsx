import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import MacMenuBar from './components/MacMenuBar';
import MacControlCenter from './components/MacControlCenter';
import MacSpotlight from './components/MacSpotlight';
import MacDesktopIcons from './components/MacDesktopIcons';
import MacBookDeviceFrame from './components/MacBookDeviceFrame';
import MacDock from './components/MacDock';

import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import ProjectModal from './components/ProjectModal';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';
import { playBootChime } from './utils/macAudioEngine';

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCyberdeck, setShowCyberdeck] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [wallpaper, setWallpaper] = useState('video');
  const [isMuted, setIsMuted] = useState(false);
  const [isHardwareFrame, setIsHardwareFrame] = useState(false);

  const videoRef = useRef(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Open apps state object
  const [openApps, setOpenApps] = useState({
    finder: true,
    notes: false,
    ipod: true
  });

  const [activeAppTitle, setActiveAppTitle] = useState('Finder');
  const [isAppReady, setIsAppReady] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(25);


  // Smooth macOS Startup Progress & Preload
  useEffect(() => {
    if (isAppReady) return;

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90 && !isVideoLoaded) return 90;
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 10);
      });
    }, 120);

    const fallbackTimer = setTimeout(() => {
      setIsVideoLoaded(true);
      setLoadingProgress(100);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [isVideoLoaded, isAppReady]);

  const handleBootSystem = () => {
    playBootChime(isMuted);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
    setIsAppReady(true);
  };

  // Trigger Boot Chime & Video Sound on first click/interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isAppReady) {
        handleBootSystem();
      } else if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [isMuted, isAppReady]);

  // Sync background video mute state with global sound toggle
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, wallpaper]);

  // Global Keyboard Shortcuts (Cmd + K, Cmd + Space, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === ' ')) {
        e.preventDefault();
        setShowSpotlight(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowSpotlight(false);
        setShowControlCenter(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchApp = (appId) => {
    if (appId === "ipod" || appId === "music" || appId === "cyberdeck") {
      const nextState = !showCyberdeck;
      setShowCyberdeck(nextState);
      setOpenApps(prev => ({ ...prev, ipod: nextState }));
      setActiveAppTitle(nextState ? "iPod Classic" : "Finder");
      return;
    }
    setActiveAppTitle(appId);
    setOpenApps(prev => ({
      ...prev,
      [appId]: true,
      creativeApp: appId === 'ae' || appId === 'ps' || appId === 'ai' ? appId : prev.creativeApp
    }));
    if (appId === 'ae' || appId === 'ps' || appId === 'ai') {
      setOpenApps(prev => ({ ...prev, creative: true }));
    }
  };

  const handleCloseApp = (appId) => {
    if (appId === "ipod" || appId === "music" || appId === "cyberdeck") {
      setShowCyberdeck(false);
      setOpenApps(prev => ({ ...prev, ipod: false }));
      return;
    }
    setOpenApps(prev => ({ ...prev, [appId]: false }));
  };

  const wallpaperClasses = {
    video: 'wallpaper-video',
    custom: 'wallpaper-custom',
    sequoia: 'wallpaper-sequoia',
    sonoma: 'wallpaper-sonoma',
    neon: 'wallpaper-neon',
    aurora: 'wallpaper-aurora'
  };

  return (
    <div className={`w-screen h-screen max-h-screen overflow-hidden fixed inset-0 ${isDarkMode ? 'dark' : ''}`}>
      <MacBookDeviceFrame 
        isHardwareFrame={isHardwareFrame} 
        onToggleFrameView={() => setIsHardwareFrame(!isHardwareFrame)}
      >
        {/* macOS Desktop Canvas — Strictly Fits Inside Screen Bounds with NO SCROLLING */}
        <div className={`w-full h-full max-h-full ${wallpaperClasses[wallpaper] || 'wallpaper-video'} text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col justify-between`}>
          
          {/* Background Video element when video wallpaper is active */}
          {wallpaper === 'video' && (
            <video
              ref={videoRef}
              src="/bg-video.mp4"
              autoPlay
              loop
              playsInline
              muted={isMuted}
              onCanPlayThrough={() => {
                setIsVideoLoaded(true);
                setLoadingProgress(100);
              }}
              onLoadedData={() => {
                setIsVideoLoaded(true);
              }}
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-90"
            />
          )}
          
          {/* Top macOS Translucent Menu Bar */}
          <MacMenuBar
            activeAppTitle={activeAppTitle}
            onOpenApp={handleLaunchApp}
            onToggleControlCenter={() => setShowControlCenter(!showControlCenter)}
            onToggleSpotlight={() => setShowSpotlight(!showSpotlight)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            isHardwareFrame={isHardwareFrame}
            onToggleFrameView={() => setIsHardwareFrame(!isHardwareFrame)}
          />

          {/* Control Center Dropdown */}
          {showControlCenter && (
            <MacControlCenter
              onClose={() => setShowControlCenter(false)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              wallpaper={wallpaper}
              onChangeWallpaper={(wp) => setWallpaper(wp)}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              showCyberdeck={showCyberdeck}
              onToggleCyberdeck={() => handleLaunchApp("ipod")}
            />
          )}

          {/* Spotlight Search Overlay */}
          {showSpotlight && (
            <MacSpotlight
              onClose={() => setShowSpotlight(false)}
              onLaunchApp={handleLaunchApp}
              onSelectProject={(proj) => setSelectedProject(proj)}
              isMuted={isMuted}
            />
          )}

          {/* Desktop Shortcuts Grid */}
          <MacDesktopIcons 
            onOpenApp={handleLaunchApp} 
            isMuted={isMuted}
          />

          {/* Main Desktop Center Content Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-0 my-auto overflow-hidden">
            <OfficeCoutureFolder 
              onSelectProject={(project) => setSelectedProject(project)}
            />
          </div>

          {/* Project Detail Modal Overlay */}
          <ProjectModal 
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />

          {/* macOS Dock & Window Apps Manager */}
          <MacDock 
            openApps={openApps}
            onLaunchApp={handleLaunchApp}
            onCloseApp={handleCloseApp}
            activeProject={selectedProject}
            onSelectProject={(project) => setSelectedProject(project)}
            isMuted={isMuted}
          />

          {/* Nexus Cyberdeck Music Player Floating Widget */}
          <AnimatePresence>
            {showCyberdeck && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="fixed bottom-20 right-6 z-50"
              >
                <NexusCyberdeckPlayer 
                  onClose={() => handleCloseApp("ipod")}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </MacBookDeviceFrame>

      {/* macOS Startup Preloader Overlay */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(12px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleBootSystem}
            className="fixed inset-0 z-[99999] bg-[#050509] flex flex-col items-center justify-center text-white cursor-pointer select-none overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-indigo-950/20 to-transparent pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 flex flex-col items-center mb-8 text-center px-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.35)] mb-5">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current text-white drop-shadow-md" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.67-1.92-14.54-6.17-3.21-2.77-7.14-7.46-11.78-14.07-6.22-8.87-11.05-18.79-14.48-29.77-3.44-10.98-5.16-21.46-5.16-31.43 0-14.54 3.73-26.47 11.18-35.8 7.46-9.33 16.73-14.08 27.81-14.24 4.58 0 9.69 1.15 15.34 3.44 5.65 2.29 9.61 3.44 11.88 3.44 1.95 0 6.01-1.2 12.18-3.6 6.16-2.4 11.19-3.52 15.08-3.36 12.06.63 21.72 5.26 28.98 13.9-10.74 6.47-16.02 15.28-15.83 26.43.19 8.7 3.51 16.08 9.97 22.13 6.46 6.05 14.1 9.62 22.92 10.71-2.4 7.15-5.65 14.41-9.76 21.78zm-22.84-108.6c0 6.64-2.41 12.87-7.24 17.69-4.83 4.82-10.79 7.64-17.88 8.46-.27-1.12-.41-2.12-.41-3 0-6.72 2.53-13.11 7.58-18.17 5.06-5.06 11.23-7.97 18.52-8.73.19 1.03.43 2.28.43 3.75z" />
                </svg>
              </div>
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white/95 font-sans">
                Ishant Chauhan Portfolio
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1">macOS Sequoia v15.0 • Live Environment</p>
            </motion.div>

            <div className="w-64 sm:w-80 h-1.5 bg-white/10 rounded-full overflow-hidden mb-6 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full shadow-[0_0_14px_rgba(96,165,250,0.9)]"
                style={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeOut", duration: 0.15 }}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              {loadingProgress < 100 ? (
                <span className="font-mono text-xs text-slate-400 animate-pulse tracking-wide">
                  Preloading live video & desktop environment ({loadingProgress}%)...
                </span>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="px-5 py-2 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono text-xs font-bold animate-bounce shadow-xl backdrop-blur-md">
                    Click anywhere to Enter Desktop 🚀
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans">Background video buffered • Audio ready</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
