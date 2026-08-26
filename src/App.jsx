import React, { useState, useEffect, useRef } from 'react';
import { User, X, Wifi, Battery, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import MacMenuBar from './components/MacMenuBar';
import MacControlCenter from './components/MacControlCenter';
import MacSpotlight from './components/MacSpotlight';
import MacDesktopIcons from './components/MacDesktopIcons';
import MacDock from './components/MacDock';

import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import ProjectModal from './components/ProjectModal';
import { MorphingText } from './components/MorphingText';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';
import { playBootChime } from './utils/macAudioEngine';

const QUOTES = [
  "I believe the best ideas usually start as weird ones.",
  "Building content systems that scale organically.",
  "Vibecoding daily apps in hours, not weeks.",
  "Turning raw ideas into viral brand stories.",
  "Architecting high-conversion media pipelines."
];

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCyberdeck, setShowCyberdeck] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [wallpaper, setWallpaper] = useState('video');
  const [lockWallpaper, setLockWallpaper] = useState('custom');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(20);
  const [isIpodPlaying, setIsIpodPlaying] = useState(false);

  const videoRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Open apps state object
  const [openApps, setOpenApps] = useState({
    finder: false,
    notes: false,
    ipod: false
  });

  const [activeAppTitle, setActiveAppTitle] = useState('Finder');
  const [loginTimeStr, setLoginTimeStr] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

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
  const [bgVideoSrc, setBgVideoSrc] = useState('/bg-video.mp4');
  const [lockVideoSrc, setLockVideoSrc] = useState('/lock-video.mp4');

  // Pre-fetch video files into local RAM Blob URLs
  useEffect(() => {
    let isMounted = true;
    const cacheAndPreloadVideos = async () => {
      try {
        const [bgRes, lockRes] = await Promise.all([
          fetch('/bg-video.mp4'),
          fetch('/lock-video.mp4')
        ]);

        if (bgRes.ok && lockRes.ok) {
          const [bgBlob, lockBlob] = await Promise.all([
            bgRes.blob(),
            lockRes.blob()
          ]);

          if (isMounted) {
            const bgUrl = URL.createObjectURL(bgBlob);
            const lockUrl = URL.createObjectURL(lockBlob);
            setBgVideoSrc(bgUrl);
            setLockVideoSrc(lockUrl);
            setIsVideoLoaded(true);
            setLoadingProgress(100);
          }
        }
      } catch (err) {
        console.warn('Video pre-fetch error:', err);
      }
    };

    cacheAndPreloadVideos();

    return () => {
      isMounted = false;
    };
  }, []);

  // STRICT LOGIN UNLOCK FUNCTION
  // Unlocks ONLY when viewerName has at least 1 non-empty character and unlock is triggered
  const handleBootSystem = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!viewerName || !viewerName.trim()) {
      setLoginError('⚠️ Please enter your name to unlock!');
      setIsShaking(true);
      if (nameInputRef.current) nameInputRef.current.focus();
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);
    playBootChime(isMuted);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });

    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setIsAppReady(true);
      setIsLoggingIn(false);
    }, 450);
  };

  // Smooth Volume Sync
  useEffect(() => {
    if (!videoRef.current) return;
    const targetVol = (isMuted || isIpodPlaying || volume === 0) ? 0 : (volume / 100);
    const interval = setInterval(() => {
      if (!videoRef.current) return;
      const currentVol = videoRef.current.volume;
      const step = 0.04;

      if (Math.abs(currentVol - targetVol) <= step) {
        videoRef.current.volume = targetVol;
        videoRef.current.muted = targetVol === 0;
        clearInterval(interval);
      } else if (currentVol < targetVol) {
        videoRef.current.muted = false;
        videoRef.current.volume = Math.min(targetVol, currentVol + step);
      } else {
        videoRef.current.volume = Math.max(targetVol, currentVol - step);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isMuted, volume, isIpodPlaying, wallpaper]);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVol === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  // Global Keyboard Shortcuts
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

      {/* macOS Desktop Canvas — Fits Inside Screen Bounds */}
      <div className={`w-full h-full max-h-full ${wallpaperClasses[wallpaper] || 'wallpaper-video'} text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col justify-between`}>
        
        {/* Background Video element */}
        {wallpaper === 'video' && (
          <video
            ref={videoRef}
            src={bgVideoSrc} preload="auto"
            autoPlay
            loop
            playsInline
            muted={isMuted}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-100 scale-100 origin-center"
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
          volume={volume}
          onVolumeChange={handleVolumeChange}
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
        {selectedProject && (
          <ProjectModal 
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}

        {/* macOS Dock & Window Apps Manager */}
        <MacDock 
          openApps={openApps}
          onLaunchApp={handleLaunchApp}
          onCloseApp={handleCloseApp}
          activeProject={selectedProject}
          onSelectProject={(project) => setSelectedProject(project)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          wallpaper={wallpaper}
          onChangeWallpaper={(wp) => setWallpaper(wp)}
          lockWallpaper={lockWallpaper}
          onChangeLockWallpaper={(wp) => setLockWallpaper(wp)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          volume={volume}
          onChangeVolume={handleVolumeChange}
        />

        {/* Nexus Cyberdeck Music Player Floating Widget */}
        <AnimatePresence>
          {showCyberdeck && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.75, y: 30 }}
              animate={{ opacity: 1, scale: 0.82, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="fixed bottom-14 right-4 z-50 pointer-events-auto origin-bottom-right"
            >
              <NexusCyberdeckPlayer 
                onClose={() => handleCloseApp("ipod")}
                masterVolume={volume}
                isMuted={isMuted}
                onIsPlayingChange={(playing) => setIsIpodPlaying(playing)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* macOS Photorealistic Gated Lock Screen Overlay */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: 'none' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] bg-black/40 flex flex-col items-center justify-between text-white select-none overflow-hidden p-6"
          >
            {/* Dynamic Lock Screen Background */}
            {lockWallpaper === 'custom' && (
              <img
                src="/bg-poc.jpg"
                alt="Lock Screen Photo Background"
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
              />
            )}
            {lockWallpaper === 'video' && (
              <video
                src={lockVideoSrc} preload="auto"
                autoPlay
                loop
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
              />
            )}
            {lockWallpaper !== 'custom' && lockWallpaper !== 'video' && (
              <div className={`absolute inset-0 z-0 pointer-events-none ${wallpaperClasses[lockWallpaper] || 'wallpaper-custom'}`} />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 z-0 pointer-events-none" />

            {/* Top Right macOS Status Indicators */}
            <div className="w-full flex items-center justify-between text-[11px] font-sans text-white/90 drop-shadow-sm font-medium z-10 pt-1 px-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 font-mono text-[10px]">
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Lock Screen Gate</span>
              </div>

              <div className="flex items-center gap-3">
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
            </div>

            {/* Center User Login Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center my-auto z-10 space-y-3 w-full max-w-2xl text-center"
            >
              {/* Morphing Text Quote Heading on Lock Screen */}
              <div className="w-full mb-2">
                <MorphingText 
                  texts={QUOTES}
                  className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] font-serif-title italic"
                />
              </div>

              {/* Helper Subtitle */}
              <p className="text-xs sm:text-sm font-sans text-white/90 drop-shadow-md mb-2 font-medium tracking-wide">
                Enter your name to log in
              </p>

              {/* Viewer Name Input Form */}
              <form onSubmit={handleBootSystem} className="relative flex items-center justify-center w-64 sm:w-80">
                <div className={`w-full relative flex items-center ${isShaking ? 'animate-shake' : ''}`}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={viewerName}
                    onChange={(e) => {
                      setViewerName(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Enter Your Name..."
                    autoFocus
                    className={`w-full py-2.5 pl-5 pr-12 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border ${
                      loginError ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/40'
                    } text-white placeholder-white/70 font-sans text-xs sm:text-sm shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:ring-2 focus:ring-amber-400/80 transition-all`}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 w-7 h-7 rounded-full bg-amber-400/40 hover:bg-amber-400/60 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/30"
                    title="Unlock"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Validation Error Message */}
              {loginError && (
                <p className="font-mono text-xs text-amber-300 font-bold animate-fadeIn">
                  {loginError}
                </p>
              )}

              {/* Click to Unlock Prompt Button */}
              <button
                type="button"
                onClick={handleBootSystem}
                className="mt-3 px-6 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-mono text-xs transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 font-semibold"
              >
                {isLoggingIn ? 'Logging in...' : viewerName.trim() ? `Unlock as ${viewerName} 🔓` : 'Click to Unlock 🔒'}
              </button>
            </motion.div>

            {/* Bottom macOS Action Buttons */}
            <div className="flex items-center justify-center gap-10 z-10 pb-4">
              <div className="flex flex-col items-center cursor-pointer group" onClick={() => nameInputRef.current && nameInputRef.current.focus()}>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center shadow-lg group-hover:bg-white/25 group-hover:scale-105 transition-all">
                  <X className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/80 drop-shadow-md mt-1.5">
                  Clear
                </span>
              </div>

              <div className="flex flex-col items-center cursor-pointer group" onClick={() => nameInputRef.current && nameInputRef.current.focus()}>
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
