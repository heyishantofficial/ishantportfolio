import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { User, X, Wifi, Battery, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import MacMenuBar from './components/MacMenuBar';
import MacControlCenter from './components/MacControlCenter';
import MacSpotlight from './components/MacSpotlight';
import IshantOS from './os/IshantOS';
import MacDock from './components/MacDock';

import ProjectModal from './components/ProjectModal';
import AnimatedQuoteHeading from './components/AnimatedQuoteHeading';
import { CircularProgressCombined } from './components/CircularProgress';
import { playBootChime, playMacClick, setSystemVolume } from './utils/macAudioEngine';
import { DEFAULT_SETTINGS } from './lib/siteSettings';
import { preloadBootAssets, preloadDeferredAssets } from './lib/bootPreloader';
import { useFileSystem } from './utils/useFileSystem';
import { useAdminAuth } from './utils/useAdminAuth';
import AdminAuthModal from './components/AdminAuthModal';

const NexusCyberdeckPlayer = React.lazy(() => import('./components/NexusCyberdeckPlayer'));
const IOSMobileOS = React.lazy(() => import('./components/IOSMobileOS'));

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCyberdeck, setShowCyberdeck] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [wallpaper, setWallpaper] = useState(DEFAULT_SETTINGS.wallpaper);
  const [lockWallpaper, setLockWallpaper] = useState(DEFAULT_SETTINGS.lockWallpaper);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_isMuted');
        if (cached !== null) return cached === 'true';
      } catch {}
    }
    return DEFAULT_SETTINGS.isMuted ?? false;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_volume');
        if (cached !== null && !isNaN(Number(cached))) return Number(cached);
      } catch {}
    }
    return DEFAULT_SETTINGS.volume ?? 20;
  });
  const [bgVideoSound, setBgVideoSound] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_bgVideoSound');
        if (cached !== null) return cached === 'true';
      } catch {}
    }
    return DEFAULT_SETTINGS.bgVideoSound ?? true;
  });
  const [bgVideoVolume, setBgVideoVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('site_bgVideoVolume');
        if (cached !== null && !isNaN(Number(cached))) {
          const num = Number(cached);
          if (num === 80) {
            localStorage.setItem('site_bgVideoVolume', '5');
            return 5;
          }
          return num;
        }
      } catch {}
    }
    return DEFAULT_SETTINGS.bgVideoVolume ?? 5;
  });
  const [isIpodPlaying, setIsIpodPlaying] = useState(false);

  // Security state. The real password lives on the server (ADMIN_PASSWORD).
  // Mirrors the server-side admin password so the UI can reflect a change in-session.
  const [, setSystemPassword] = useState('');
  const [customUploadDesktop, setCustomUploadDesktop] = useState(null);
  const [customUploadLock, setCustomUploadLock] = useState(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState('wallpaper');
  const [desktopContextMenu, setDesktopContextMenu] = useState(null);
  const [desktopNotice, setDesktopNotice] = useState(null);

  const { clipboard, pasteNode } = useFileSystem();
  const { isAdmin } = useAdminAuth();
  const [showDesktopAuthModal, setShowDesktopAuthModal] = useState(false);

  const handleDesktopPaste = async () => {
    setDesktopContextMenu(null);
    if (!clipboard) return;
    if (!isAdmin) {
      setShowDesktopAuthModal(true);
      return;
    }
    await pasteNode('home');
    playMacClick(isMuted);
  };

  const handleDesktopAuthSuccess = async () => {
    setShowDesktopAuthModal(false);
    if (clipboard) {
      await pasteNode('home');
      playMacClick(isMuted);
    }
  };

  const osRef = useRef(null);
  const videoRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  const [socialLinks, setSocialLinks] = useState(DEFAULT_SETTINGS.socialLinks);
  const [dashboardConfig, setDashboardConfig] = useState(DEFAULT_SETTINGS.dashboardConfig);
  const [folderIcons, setFolderIcons] = useState(DEFAULT_SETTINGS.folderIcons);

  // Open apps state object
  const [openApps, setOpenApps] = useState({
    finder: false,
    notes: false,
    ipod: false,
    itunes: false,
    settings: false,
    youtube: false,
    linkedin: false,
    instagram: false,
    arcade: false
  });

  const [activeAppTitle, setActiveAppTitle] = useState('Finder');
  const [loginTimeStr, setLoginTimeStr] = useState('');
  const [loginTimeShortStr, setLoginTimeShortStr] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const updateLoginTime = () => {
      const d = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      setLoginTimeStr(d.toLocaleDateString('en-US', options).replace(',', ''));
      setLoginTimeShortStr(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    };
    updateLoginTime();
    const interval = setInterval(updateLoginTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  const [isAppReady, setIsAppReady] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLockWallpaperLoaded, setIsLockWallpaperLoaded] = useState(false);
  // Choreographed desktop entrance, armed the moment the user unlocks.
  const [isDesktopEntering, setIsDesktopEntering] = useState(false);

  useEffect(() => {
    if (lockWallpaper !== 'custom' && lockWallpaper !== 'uploaded_lock' && lockWallpaper !== 'video') {
      setIsLockWallpaperLoaded(true);
    } else {
      setIsLockWallpaperLoaded(false);
    }
  }, [lockWallpaper, customUploadLock]);

  // Boot the workspace for real: hold on the loader until fonts, the published
  // settings, every dock/desktop icon, the lock wallpaper and the first decoded
  // frame of both videos are actually in the browser. Nothing is allowed to
  // arrive after the desktop paints, which is what used to make the site
  // assemble itself piece by piece in front of the visitor.
  useEffect(() => {
    let cancelled = false;

    // The ring eases toward whatever the preloader has genuinely finished
    // rather than snapping to it. The target is always real — a stage landing
    // in one lump just makes the ring travel faster, and it can never reach
    // 100% before the last asset is actually in.
    let target = 0;
    let shown = 0;
    let frame = 0;

    // Only commit when the whole number actually changes — App renders the
    // entire desktop tree, so a setState every frame would cost more than the
    // loading it is reporting on.
    let lastShown = -1;
    const tick = () => {
      shown += (target - shown) * 0.09;
      if (target >= 100 && target - shown < 0.6) shown = 100;
      const rounded = Math.floor(shown);
      if (rounded !== lastShown) {
        lastShown = rounded;
        setLoadingProgress(rounded);
      }
      if (shown < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    preloadBootAssets((percent) => {
      // Never let the ring walk backwards if a stage reports out of order.
      if (percent > target) target = percent;
    }).then(({ settings }) => {
      if (cancelled) return;
      if (settings?.wallpaper) setWallpaper(settings.wallpaper);
      if (settings?.lockWallpaper) setLockWallpaper(settings.lockWallpaper);
      if (settings?.socialLinks) setSocialLinks(settings.socialLinks);
      if (settings?.folderIcons) setFolderIcons(settings.folderIcons);
      if (settings?.dashboardConfig) {
        setDashboardConfig(settings.dashboardConfig);
        if (settings.dashboardConfig.soundEffects === false) {
          setIsMuted(true);
        }
      }
      if (typeof settings?.volume === 'number' && !isNaN(settings.volume)) {
        setVolume(settings.volume);
        try {
          localStorage.setItem('site_volume', String(settings.volume));
        } catch {}
        setSystemVolume(settings.volume, settings?.isMuted ?? false);
      }
      if (typeof settings?.isMuted === 'boolean') {
        setIsMuted(settings.isMuted);
        try {
          localStorage.setItem('site_isMuted', String(settings.isMuted));
        } catch {}
      }
      if (typeof settings?.bgVideoSound === 'boolean') {
        setBgVideoSound(settings.bgVideoSound);
        try {
          localStorage.setItem('site_bgVideoSound', String(settings.bgVideoSound));
        } catch {}
      }
      if (typeof settings?.bgVideoVolume === 'number' && !isNaN(settings.bgVideoVolume)) {
        const vol = settings.bgVideoVolume === 80 ? 5 : settings.bgVideoVolume;
        setBgVideoVolume(vol);
        try {
          localStorage.setItem('site_bgVideoVolume', String(vol));
        } catch {}
      }
      // Crisp handover to the login screen once preloading resolves
      setTimeout(() => {
        if (!cancelled) setIsBootLoading(false);
      }, 120);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  // Real-time tab sync for Master Sync updates across all open windows
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    try {
      const channel = new BroadcastChannel('ishant_master_sync');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'MASTER_SYNC_UPDATED' && event.data.snapshot?.settings) {
          const s = event.data.snapshot.settings;
          if (s.wallpaper) setWallpaper(s.wallpaper);
          if (s.lockWallpaper) setLockWallpaper(s.lockWallpaper);
          if (s.socialLinks) setSocialLinks(s.socialLinks);
          if (s.folderIcons) setFolderIcons(s.folderIcons);
          if (s.dashboardConfig) setDashboardConfig(s.dashboardConfig);
          if (typeof s.volume === 'number' && !isNaN(s.volume)) {
            setVolume(s.volume);
            try { localStorage.setItem('site_volume', String(s.volume)); } catch {}
            setSystemVolume(s.volume, s?.isMuted ?? false);
          }
          if (typeof s.isMuted === 'boolean') {
            setIsMuted(s.isMuted);
            try { localStorage.setItem('site_isMuted', String(s.isMuted)); } catch {}
          }
          if (typeof s.bgVideoSound === 'boolean') {
            setBgVideoSound(s.bgVideoSound);
            try { localStorage.setItem('site_bgVideoSound', String(s.bgVideoSound)); } catch {}
          }
          if (typeof s.bgVideoVolume === 'number' && !isNaN(s.bgVideoVolume)) {
            setBgVideoVolume(s.bgVideoVolume);
            try { localStorage.setItem('site_bgVideoVolume', String(s.bgVideoVolume)); } catch {}
          }
        }
      };
      return () => channel.close();
    } catch {}
  }, []);

  // LOGIN UNLOCK FUNCTION (NAME LOGIN)
  const handleBootSystem = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!viewerName || !viewerName.trim()) {
      setLoginError('⚠️ Please enter your name to log in!');
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
      const targetVol = getTargetVideoVolume();
      videoRef.current.muted = targetVol === 0;
      videoRef.current.volume = targetVol;
      videoRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setIsAppReady(true);
      setIsLoggingIn(false);
      setIsDesktopEntering(true);
      // Warm the non-critical assets now that nothing is competing for bandwidth.
      preloadDeferredAssets();
    }, 120);
  };

  // Drop the entrance class once the sequence has finished, so the desktop is
  // left in its normal state and a re-lock can replay it cleanly.
  useEffect(() => {
    if (!isDesktopEntering) return;
    const timer = setTimeout(() => setIsDesktopEntering(false), 1400);
    return () => clearTimeout(timer);
  }, [isDesktopEntering]);

  const handleOpenSettingsWithTab = (tabName = 'wallpaper') => {
    setSettingsInitialTab(tabName);
    setOpenApps(prev => ({ ...prev, settings: true }));
    setActiveAppTitle('System Settings');
    setDesktopContextMenu(null);
  };

  const showDesktopNotice = (text) => {
    setDesktopContextMenu(null);
    setDesktopNotice(text);
    setTimeout(() => setDesktopNotice(null), 2800);
  };

  // Right-Click Context Menu on Desktop Canvas
  const handleDesktopContextMenu = (e) => {
    // If the click is inside any window, dialog, modal, dock, or menu, ignore completely
    if (
      e.target.closest('.os-window') ||
      e.target.closest('.modal-backdrop') ||
      e.target.closest('nav') ||
      e.target.closest('header') ||
      e.target.closest('#mac-dock') ||
      e.target.closest('[role="dialog"]') ||
      e.target.closest('[role="listbox"]')
    ) {
      return;
    }
    e.preventDefault();
    setDesktopContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleGlobalClick = () => setDesktopContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Target volume calculation for the ambient background video
  const getTargetVideoVolume = useCallback(() => {
    if (isMuted || !bgVideoSound || isIpodPlaying || volume === 0 || bgVideoVolume === 0) {
      return 0;
    }
    // Perceptual audio scaling curve:
    // Video track is mixed softly (~-33 dB mean). Linear scaling at 5% volume yields -59 dB (inaudible silence).
    // Using mild power-law curves ensures 5% volume produces an audibly comfortable, gentle background ambient sound.
    const masterFactor = Math.pow(Math.max(0, Math.min(100, volume)) / 100, 0.55);
    const videoFactor = Math.pow(Math.max(0, Math.min(100, bgVideoVolume)) / 100, 0.75);
    return Math.max(0, Math.min(1, masterFactor * videoFactor));
  }, [isMuted, bgVideoSound, isIpodPlaying, volume, bgVideoVolume]);

  // Safe background video audio playback on user interaction
  useEffect(() => {
    const handleUserGesture = () => {
      if (videoRef.current) {
        const targetVol = getTargetVideoVolume();
        videoRef.current.muted = targetVol === 0;
        videoRef.current.volume = targetVol;
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('keydown', handleUserGesture, { passive: true });
    window.addEventListener('pointerdown', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
    };
  }, [getTargetVideoVolume, isAppReady]);

  // Smooth Volume Sync
  useEffect(() => {
    if (!videoRef.current) return;
    const targetVol = getTargetVideoVolume();
    const shouldMute = targetVol === 0;

    if (shouldMute) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      return;
    }

    videoRef.current.muted = false;
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
    }, 25);

    return () => clearInterval(interval);
  }, [getTargetVideoVolume, wallpaper]);

  const handleToggleBgVideoSound = () => {
    setBgVideoSound((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('site_bgVideoSound', String(next));
      } catch {}
      return next;
    });
  };

  const handleChangeBgVideoVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(100, Number(newVol) || 0));
    setBgVideoVolume(clamped);
    try {
      localStorage.setItem('site_bgVideoVolume', String(clamped));
    } catch {}
  };

  const handleVolumeChange = (newVol) => {
    const clamped = Math.max(0, Math.min(100, Number(newVol) || 0));
    setVolume(clamped);
    try {
      localStorage.setItem('site_volume', String(clamped));
    } catch {}
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      try { localStorage.setItem('site_isMuted', 'false'); } catch {}
      setSystemVolume(clamped, false);
    } else if (clamped === 0 && !isMuted) {
      setIsMuted(true);
      try { localStorage.setItem('site_isMuted', 'true'); } catch {}
      setSystemVolume(0, true);
    } else {
      setSystemVolume(clamped, isMuted);
    }
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('site_isMuted', String(next));
      } catch {}
      setSystemVolume(volume, next);
      return next;
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault();
        setShowSpotlight(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowSpotlight(false);
        setShowControlCenter(false);
        setDesktopContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchApp = (appId) => {
    // These three are folder-layer windows — the dock's old modals are bypassed.
    if (appId === "finder") {
      osRef.current?.openId("home");
      return;
    }
    if (appId === "resume" || appId === "resume.pdf") {
      osRef.current?.openId("resume");
      return;
    }
    if (appId === "trash") {
      osRef.current?.openTrash();
      return;
    }
    if (appId === "ipod" || appId === "itunes" || appId === "music" || appId === "cyberdeck") {
      const nextState = !showCyberdeck;
      setShowCyberdeck(nextState);
      setOpenApps(prev => ({ ...prev, ipod: nextState, itunes: nextState }));
      setActiveAppTitle(nextState ? "iTunes Music" : "Finder");
      return;
    }
    if (appId === "settings") {
      handleOpenSettingsWithTab("socials");
      return;
    }
    if (appId === "youtube" && dashboardConfig?.openLinksInNewTab !== false) {
      window.open(socialLinks?.youtube || 'https://youtube.com/@heyishant', '_blank', 'noopener,noreferrer');
      return;
    }
    if (appId === "linkedin" && dashboardConfig?.openLinksInNewTab !== false) {
      window.open(socialLinks?.linkedin || 'https://linkedin.com', '_blank', 'noopener,noreferrer');
      return;
    }
    if (appId === "instagram" && dashboardConfig?.openLinksInNewTab !== false) {
      window.open(socialLinks?.instagram || 'https://instagram.com/heyishant', '_blank', 'noopener,noreferrer');
      return;
    }
    const targetApp = (appId === "resume" || appId === "resume.pdf") ? "notes" : appId;
    const titleMap = {
      notes: "Notes Workspace",
      youtube: "YouTube Channel",
      linkedin: "LinkedIn Profile",
      instagram: "Instagram Profile",
      safari: "Chrome Browser",
      photos: "Photos",
      mail: "Mail",
      arcade: "Games",
      games: "Games"
    };
    setActiveAppTitle(titleMap[targetApp] || targetApp);
    setOpenApps(prev => ({
      ...prev,
      [targetApp]: true,
      [appId]: true,
      creativeApp: appId === 'ae' || appId === 'ps' || appId === 'ai' ? appId : prev.creativeApp
    }));
    if (appId === 'ae' || appId === 'ps' || appId === 'ai') {
      setOpenApps(prev => ({ ...prev, creative: true }));
    }
  };

  const handleCloseApp = (appId) => {
    if (appId === "ipod" || appId === "itunes" || appId === "music" || appId === "cyberdeck") {
      setShowCyberdeck(false);
      setOpenApps(prev => ({ ...prev, ipod: false, itunes: false }));
      return;
    }
    if (appId === "notes" || appId === "resume") {
      setOpenApps(prev => ({ ...prev, notes: false, resume: false }));
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

  // Render authentic iOS 18 Mobile Ecosystem on mobile screens
  if (isMobile && !isBootLoading) {
    return (
      <Suspense fallback={null}>
        <IOSMobileOS
          isAppReady={isAppReady}
          onUnlock={handleBootSystem}
          viewerName={viewerName}
          setViewerName={setViewerName}
          loginError={loginError}
          setLoginError={setLoginError}
          isLoggingIn={isLoggingIn}
          isShaking={isShaking}
          wallpaper={wallpaper}
          lockWallpaper={lockWallpaper}
          onChangeWallpaper={(wp) => setWallpaper(wp)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          volume={volume}
          onChangeVolume={handleVolumeChange}
          socialLinks={socialLinks}
          dashboardConfig={dashboardConfig}
          onUpdateSocialLinks={setSocialLinks}
          onUpdateDashboardConfig={setDashboardConfig}
          folderIcons={folderIcons}
          onUpdateFolderIcons={setFolderIcons}
          customUploadDesktop={customUploadDesktop}
          customUploadLock={customUploadLock}
          onUploadDesktopWallpaper={(img) => setCustomUploadDesktop(img)}
          onUploadLockWallpaper={(img) => setCustomUploadLock(img)}
          bgVideoSound={bgVideoSound}
          onToggleBgVideoSound={handleToggleBgVideoSound}
          bgVideoVolume={bgVideoVolume}
          onChangeBgVideoVolume={handleChangeBgVideoVolume}
          isIpodPlaying={isIpodPlaying}
        />
      </Suspense>
    );
  }

  return (
    <div className={`w-full h-full min-h-[100dvh] max-h-[100dvh] overflow-hidden fixed inset-0 ${isDarkMode ? 'dark' : ''}`}>

        {/* macOS Desktop Canvas */}
        <div 
          onContextMenu={handleDesktopContextMenu}
          style={{
            ...(wallpaper === 'uploaded_desktop' && customUploadDesktop ? { backgroundImage: `url(${customUploadDesktop})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
            visibility: isBootLoading ? 'hidden' : 'visible'
          }}
          className={`w-full h-full max-h-full ${isDesktopEntering ? 'mac-boot-enter' : ''} ${wallpaper === 'uploaded_desktop' ? '' : (wallpaperClasses[wallpaper] || 'wallpaper-video')} text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col justify-between`}
        >
          
          {/* Background Video element */}
          {wallpaper === 'video' && (
            <video
              ref={videoRef}
              src="/bg-video.mp4" preload="auto"
              autoPlay
              loop
              playsInline
              muted={isMuted || !bgVideoSound}
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-100 scale-100 origin-center"
            />
          )}

          {/* Uploaded Desktop Wallpaper Image */}
          {wallpaper === 'uploaded_desktop' && customUploadDesktop && (
            <img src={customUploadDesktop} alt="Desktop Custom Wallpaper" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" />
          )}
          
          {/* Top macOS Translucent Menu Bar */}
          <MacMenuBar
            activeAppTitle={activeAppTitle}
            onOpenApp={handleLaunchApp}
            onToggleControlCenter={() => setShowControlCenter(!showControlCenter)}
            isControlCenterOpen={showControlCenter}
            onToggleSpotlight={() => setShowSpotlight(!showSpotlight)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            showCyberdeck={showCyberdeck}
            onToggleCyberdeck={() => handleLaunchApp("ipod")}
            onOpenPath={(nodeId) => osRef.current?.openId(nodeId)}
            onNewFinderWindow={() => osRef.current?.newFinderWindow()}
            onCloseWindow={() => osRef.current?.closeActive()}
            onOpenPalette={() => osRef.current?.openPalette()}
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
              onToggleMute={handleToggleMute}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              showCyberdeck={showCyberdeck}
              onToggleCyberdeck={() => handleLaunchApp("ipod")}
            />
          )}

          {/* Spotlight Search Overlay */}
          {showSpotlight && (
            <MacSpotlight
              onClose={() => setShowSpotlight(false)}
              onLaunchApp={handleLaunchApp}
              onOpenNode={(node) => osRef.current?.openNode(node)}
              isMuted={isMuted}
            />
          )}

          {/* IshantOS folder layer: desktop items, windows, Cmd+K palette */}
          <IshantOS
            ref={osRef}
            isMuted={isMuted}
            onActiveTitleChange={setActiveAppTitle}
            socialLinks={socialLinks}
            contactEmail={dashboardConfig?.contactEmail}
          />

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
            onOpenPath={(nodeId) => osRef.current?.openId(nodeId)}
            onCloseApp={handleCloseApp}
            activeProject={selectedProject}
            onSelectProject={(project) => setSelectedProject(project)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            wallpaper={wallpaper}
            onChangeWallpaper={(wp) => setWallpaper(wp)}
            lockWallpaper={lockWallpaper}
            onChangeLockWallpaper={(wp) => setLockWallpaper(wp)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            volume={volume}
            onChangeVolume={handleVolumeChange}
            bgVideoSound={bgVideoSound}
            onToggleBgVideoSound={handleToggleBgVideoSound}
            bgVideoVolume={bgVideoVolume}
            onChangeBgVideoVolume={handleChangeBgVideoVolume}
            onUpdatePassword={(newPass) => setSystemPassword(newPass)}
            customUploadDesktop={customUploadDesktop}
            onUploadDesktopWallpaper={(img) => setCustomUploadDesktop(img)}
            customUploadLock={customUploadLock}
            onUploadLockWallpaper={(img) => setCustomUploadLock(img)}
            settingsInitialTab={settingsInitialTab}
            socialLinks={socialLinks}
            onUpdateSocialLinks={setSocialLinks}
            dashboardConfig={dashboardConfig}
            onUpdateDashboardConfig={setDashboardConfig}
            folderIcons={folderIcons}
            onUpdateFolderIcons={setFolderIcons}
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
                <Suspense fallback={null}>
                  <NexusCyberdeckPlayer 
                    onClose={() => handleCloseApp("ipod")}
                    masterVolume={volume}
                    isMuted={isMuted}
                    onIsPlayingChange={(playing) => setIsIpodPlaying(playing)}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transient desktop notice (Refresh easter egg) */}
          {desktopNotice && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[99997] px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 text-white text-[12px] font-medium text-center whitespace-pre-line shadow-2xl animate-fadeIn">
              {desktopNotice}
            </div>
          )}

          {/* Desktop Right Click Context Menu */}
          {desktopContextMenu && (
            <div 
              style={{ top: `${desktopContextMenu.y}px`, left: `${desktopContextMenu.x}px` }}
              className="fixed z-[99999] w-56 bg-white/85 dark:bg-slate-900/90 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/40 dark:border-slate-700/60 py-1 text-xs text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100 font-sans select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {clipboard && (
                <>
                  <button 
                    onClick={handleDesktopPaste}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium text-blue-600 dark:text-blue-400 hover:text-white transition-colors"
                  >
                    <span className="truncate mr-2">📥 Paste "{clipboard.name}"</span>
                    <span className="text-[10px] opacity-60 font-mono">⌘V</span>
                  </button>
                  <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />
                </>
              )}
              <button 
                onClick={() => { setDesktopContextMenu(null); osRef.current?.openPalette(); }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium transition-colors"
              >
                <span>⚡ Quick Access...</span>
                <span className="text-[10px] opacity-60 font-mono">⌘K</span>
              </button>
              <button 
                onClick={() => showDesktopNotice("Nothing changed.\nIt's still Ishant.")}
                className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium transition-colors"
              >
                <span>↻ Refresh</span>
              </button>
              <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />
              <button 
                onClick={() => {
                  setDesktopContextMenu(null);
                  window.dispatchEvent(new CustomEvent('ishantos:randomize-folders'));
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium transition-colors"
              >
                <span>🎲 Scatter Folders Randomly</span>
              </button>
              <button 
                onClick={() => {
                  setDesktopContextMenu(null);
                  window.dispatchEvent(new CustomEvent('ishantos:reset-folders'));
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium transition-colors"
              >
                <span>🧹 Clean Up / Reset Grid</span>
              </button>
              <div className="my-1 border-t border-slate-300/40 dark:border-slate-700/40" />
              <button 
                onClick={() => { setDesktopContextMenu(null); setIsAppReady(false); }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between font-medium transition-colors"
              >
                <span>🔒 Lock Screen</span>
              </button>
            </div>
          )}

          {/* Admin Auth Modal for desktop wallpaper paste */}
          <AdminAuthModal
            isOpen={showDesktopAuthModal}
            onClose={() => setShowDesktopAuthModal(false)}
            onSuccess={handleDesktopAuthSuccess}
            initialPrompt="Enter admin password to paste files or folders onto the Desktop."
          />
        </div>


      {/* macOS Photorealistic Login Screen Overlay */}
      <AnimatePresence>
        {!isAppReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: 'none' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] bg-[#0b0d12] flex flex-col items-center justify-between text-white select-none overflow-hidden p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] pb-[max(1rem,env(safe-area-inset-bottom,1rem))]"
            style={{
              background: 'radial-gradient(circle at 50% 35%, #1a1f2e 0%, #0b0d12 70%)'
            }}
          >
            {/* Dynamic Lock Screen Wallpaper */}
            {lockWallpaper === 'custom' && (
              <img
                src="/bg-poc.jpg"
                alt="Lock Screen Photo Background"
                onLoad={() => setIsLockWallpaperLoaded(true)}
                ref={(el) => { if (el?.complete && !isLockWallpaperLoaded) setIsLockWallpaperLoaded(true); }}
                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-700 ease-out ${
                  isLockWallpaperLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            {lockWallpaper === 'uploaded_lock' && customUploadLock && (
              <img
                src={customUploadLock}
                alt="Lock Screen Uploaded Photo"
                onLoad={() => setIsLockWallpaperLoaded(true)}
                ref={(el) => { if (el?.complete && !isLockWallpaperLoaded) setIsLockWallpaperLoaded(true); }}
                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-700 ease-out ${
                  isLockWallpaperLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            {lockWallpaper === 'video' && (
              <video
                src="/lock-video.mp4" preload="auto"
                autoPlay
                loop
                playsInline
                muted
                onLoadedData={() => setIsLockWallpaperLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-700 ease-out ${
                  isLockWallpaperLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            {lockWallpaper !== 'custom' && lockWallpaper !== 'uploaded_lock' && lockWallpaper !== 'video' && (
              <div className={`absolute inset-0 z-0 pointer-events-none ${wallpaperClasses[lockWallpaper] || 'wallpaper-custom'}`} />
            )}
            
            {/* Soft ambient gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 z-0 pointer-events-none" />
            
            {/* Top Right macOS System Status Indicators (Login Screen only) */}
            <div className={`w-full flex items-center justify-end gap-2.5 sm:gap-3 text-[11px] font-sans text-white/90 drop-shadow-sm font-medium z-10 pt-1 px-2 transition-opacity duration-500 ${isBootLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <span className="px-1.5 py-0.5 rounded border border-white/30 bg-white/10 text-[10px] font-mono tracking-wider font-semibold">
                India
              </span>
              <div className="flex items-center gap-1">
                <Battery className="w-4 h-4 text-white" />
                <span className="text-[10px] font-mono font-semibold">100%</span>
              </div>
              <Wifi className="w-3.5 h-3.5 text-white" />
              <span className="ml-1 tracking-tight font-medium font-mono text-[11px] whitespace-nowrap">
                <span className="hidden sm:inline">{loginTimeStr || 'Sat Aug 26 16:54'}</span>
                <span className="inline sm:hidden">{loginTimeShortStr || '4:54 PM'}</span>
              </span>
            </div>

            {/* Center Stage — Loading Screen vs User Login Screen */}
            <AnimatePresence mode="wait">
              {isBootLoading ? (
                <motion.div 
                  key="boot-loader"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center my-auto -translate-y-8 sm:-translate-y-12 z-10 space-y-4 text-center"
                >
                  <div className="p-8 sm:p-10 rounded-3xl mac-liquid-glass-input border border-white/30 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-2xl flex flex-col items-center justify-center gap-5">
                    <span className="font-mono text-xs font-bold tracking-wide text-white drop-shadow-md max-w-[17rem] leading-relaxed text-center">
                      Loading Ishant&rsquo;s portfolio.dmg&hellip; hope it works.
                    </span>
                    <CircularProgressCombined
                      value={loadingProgress}
                      size={80}
                      thickness={6}
                      aria-label="Loading portfolio assets"
                      className="text-black"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="login-screen"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-start mt-8 sm:mt-24 md:mt-28 lg:mt-32 mb-auto z-10 space-y-3.5 w-full max-w-2xl text-center"
                >
                  {/* One-Time Morphing Entrance & Mouse-Reactive Quote Heading */}
                  <AnimatedQuoteHeading />

                  {/* Helper Subtitle */}
                  <p className="text-[11px] sm:text-xs font-sans text-white/80 drop-shadow-md pt-3 sm:pt-4 mb-1.5 font-medium tracking-wide">
                    Enter your name to log in
                  </p>

                  {/* Liquid Glass macOS Input Form */}
                  <form onSubmit={handleBootSystem} className="relative flex items-center justify-center w-52 sm:w-60 max-w-[250px]">
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
                        autoComplete="off"
                        autoFocus
                        className={`w-full py-1.5 pl-4 pr-9 rounded-full mac-liquid-glass-input text-white placeholder-white/50 font-sans text-xs shadow-[0_6px_24px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-amber-300/70 focus:border-amber-300/80 transition-all ${
                          loginError ? 'border-amber-400 ring-2 ring-amber-400/60' : ''
                        }`}
                      />
                      <button
                        type="submit"
                        className="absolute right-1 w-5.5 h-5.5 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/30 shadow-sm"
                        title="Unlock"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>

                  {/* Validation Error Message */}
                  {loginError && (
                    <p className="font-mono text-[11px] text-amber-300 font-bold animate-fadeIn">
                      {loginError}
                    </p>
                  )}

                  {/* Click to Unlock Liquid Glass Prompt Button */}
                  <button
                    type="button"
                    onClick={handleBootSystem}
                    className="mt-2 px-4 py-1.5 rounded-full mac-liquid-glass-btn text-white/90 font-mono text-[11px] transition-all cursor-pointer active:scale-95 hover:bg-white/25 font-semibold flex items-center gap-1.5"
                  >
                    <span>{isLoggingIn ? 'Logging in...' : viewerName.trim() ? `Unlock as ${viewerName}` : 'Click to Unlock'}</span>
                    <span>🔒</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom macOS Action Buttons (Login Screen only) */}
            <div className={`flex items-center justify-center gap-10 z-10 pb-4 transition-opacity duration-500 ${isBootLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div 
                className="flex flex-col items-center cursor-pointer group" 
                onClick={() => {
                  setViewerName('');
                  setLoginError('');
                  if (nameInputRef.current) nameInputRef.current.focus();
                }}
              >
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center shadow-lg group-hover:bg-white/25 group-hover:scale-105 transition-all">
                  <X className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/80 drop-shadow-md mt-1.5">
                  Clear
                </span>
              </div>

              <div 
                className="flex flex-col items-center cursor-pointer group" 
                onClick={() => {
                  setViewerName('');
                  setLoginError('');
                  if (nameInputRef.current) nameInputRef.current.focus();
                }}
              >
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
