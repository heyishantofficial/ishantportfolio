import React, { useState, useEffect, useRef } from 'react';
import { User, X, Wifi, Battery, ArrowRight, Fingerprint } from 'lucide-react';
import ishantPhotoImg from './assets/ishant-photo.png';
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
  const [loginTimeStr, setLoginTimeStr] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const updateLoginTime = () => {
      const d = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      setLoginTimeStr(d.toLocaleDateString('en-US', options).replace(',', ''));
    };
    updateLoginTime();
    const interval = setInterval(updateLoginTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleBootSystem = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoggingIn(true);
    playBootChime(isMuted);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
    setTimeout(() => {
      setIsAppReady(true);
      setIsLoggingIn(false);
    }, 450);
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

      {/* macOS Photorealistic Login Screen Overlay */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: 'none' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] bg-black/10 flex flex-col items-center justify-between text-white select-none overflow-hidden p-6"
          >
            {/* Dedicated Looping Lock Screen Video Background */}
            <video
              src="/lock-video.mp4"
              autoPlay
              loop
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
            />
            
            {/* Soft ambient gradient for UI contrast without blur */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 z-0 pointer-events-none" />
            {/* Top Right macOS System Status Indicators */}
            <div className="w-full flex items-center justify-end gap-3 text-[11px] font-sans text-white/90 drop-shadow-sm font-medium z-10 pt-1 px-2">
              <span className="px-1.5 py-0.5 rounded border border-white/30 bg-white/10 text-[10px] font-mono tracking-wider font-semibold">
                U.S.
              </span>
              <div className="flex items-center gap-1">
                <Battery className="w-4 h-4 text-white" />
                <span className="text-[10px] font-mono font-semibold">100%</span>
              </div>
              <Wifi className="w-3.5 h-3.5 text-white" />
              <span className="ml-1 tracking-tight font-medium">{loginTimeStr || 'Sat Aug 26 16:54'}</span>
            </div>

            {/* Center User Login Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center my-auto z-10"
            >
              {/* User Avatar Circle */}
              <div className="relative group cursor-pointer mb-3" onClick={handleBootSystem}>
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-800/60 backdrop-blur-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <img 
                    src={ishantPhotoImg} 
                    alt="Ishant Chauhan" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Touch ID Icon Overlay Badge */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg border border-white/40">
                  <Fingerprint className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              {/* User Name */}
              <h1 className="font-sans font-bold text-xl sm:text-2xl text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] mb-1">
                Ishant Chauhan
              </h1>

              {/* Helper Subtitle */}
              <p className="text-xs font-sans text-white/75 drop-shadow-md mb-4 font-normal tracking-wide">
                Touch ID or Enter Password
              </p>

              {/* Interactive macOS Password Pill Input */}
              <form onSubmit={handleBootSystem} className="relative flex items-center justify-center w-56 sm:w-64">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Password"
                  autoFocus
                  className="w-full py-2 pl-4 pr-10 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 text-white placeholder-white/60 font-sans text-xs shadow-[0_8px_20px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-blue-400/80 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 w-6 h-6 rounded-full bg-white/30 hover:bg-white/50 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Click to Unlock Prompt Button */}
              <button
                onClick={handleBootSystem}
                className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-all cursor-pointer shadow-md backdrop-blur-md"
              >
                {isLoggingIn ? 'Logging in...' : 'Click to Unlock System 🔓'}
              </button>
            </motion.div>

            {/* Bottom macOS Action Buttons */}
            <div className="flex items-center justify-center gap-10 z-10 pb-4">
              {/* Cancel Button */}
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleBootSystem}>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center shadow-lg group-hover:bg-white/25 group-hover:scale-105 transition-all">
                  <X className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/80 drop-shadow-md mt-1.5">
                  Cancel
                </span>
              </div>

              {/* Switch User Button */}
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleBootSystem}>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center shadow-lg group-hover:bg-white/25 group-hover:scale-105 transition-all">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/80 drop-shadow-md mt-1.5">
                  Switch User
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
