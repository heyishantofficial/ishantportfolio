import React, { useState, useEffect } from 'react';
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
  const [showCyberdeck, setShowCyberdeck] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [wallpaper, setWallpaper] = useState('custom');
  const [isMuted, setIsMuted] = useState(false);
  const [isHardwareFrame, setIsHardwareFrame] = useState(false);

  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Open apps state object
  const [openApps, setOpenApps] = useState({
    finder: true,
    notes: false
  });

  const [activeAppTitle, setActiveAppTitle] = useState('Finder');

  // Trigger Boot Chime on first click/interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      playBootChime(isMuted);
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [isMuted]);

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
    setOpenApps(prev => ({ ...prev, [appId]: false }));
  };

  const wallpaperClasses = {
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
        <div className={`w-full h-full max-h-full ${wallpaperClasses[wallpaper] || 'wallpaper-custom'} text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col justify-between`}>
          
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
                  onClose={() => setShowCyberdeck(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </MacBookDeviceFrame>
    </div>
  );
}
