import React, { useState, useRef } from 'react';
import { Sliders } from 'lucide-react';
import SystemSettingsModal from './SystemSettingsModal';
import './macDock.css';
import { 
  CreativeStudioModal, 
  DiagnosticsModal, 
  QuickNotesModal, 
  PhotosModal, 
  InstagramModal, 
  MailModal, 
  TrashModal,
  FinderModal,
  TerminalModal,
  SafariModal,
  SystemInfoModal
} from './macDockModals';
import { playMacClick, playTrashSound } from '../utils/macAudioEngine';

export default function MacDock({ 
  openApps = {},
  onLaunchApp,
  onOpenPath,
  onCloseApp,
  activeProject,
  onSelectProject,
  isMuted,
  onToggleMute,
  wallpaper,
  onChangeWallpaper,
  lockWallpaper,
  onChangeLockWallpaper,
  isDarkMode,
  onToggleDarkMode,
  volume,
  onChangeVolume,
  systemPassword,
  onUpdatePassword,
  customUploadDesktop,
  onUploadDesktopWallpaper,
  customUploadLock,
  onUploadLockWallpaper,
  settingsInitialTab = "wallpaper"
}) {
  const [mouseX, setMouseX] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [bouncingId, setBouncingId] = useState(null);
  const [itemsInTrash, setItemsInTrash] = useState(2);
  const dockRef = useRef(null);

  const dockApps = [
    {
      id: "finder",
      name: "Finder Workspace",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Finder.png" alt="Finder" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "terminal",
      name: "Terminal Shell",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Terminal.png" alt="Terminal" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "safari",
      name: "Safari Browser",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Safari.png" alt="Safari" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "notes",
      name: "Notes Workspace",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Notes.png" alt="Notes" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "settings",
      name: "System Settings",
      type: "app",
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-[22%] flex items-center justify-center p-2 shadow-md border border-slate-600">
          <Sliders className="w-6 h-6 text-slate-100" />
        </div>
      )
    },
    {
      id: "ipod",
      name: "iPod Classic Music",
      type: "app",
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 flex flex-col items-center justify-between p-1 relative rounded-[22%] shadow-md border border-slate-300">
          <div className="w-full h-4 bg-slate-900 rounded-[3px] border border-slate-700 flex items-center justify-between px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-[7px] font-mono text-emerald-400 font-bold tracking-tighter">iPod</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 shadow-inner flex items-center justify-center relative my-0.5">
            <div className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400"></div>
          </div>
        </div>
      )
    },
    { id: "divider-1", type: "divider" },
    {
      id: "photos",
      name: "Photos",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Photos.png" alt="Photos" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "instagram",
      name: "Instagram",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Instagram.png" alt="Instagram" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "mail",
      name: "Mail Contact",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Mail.png" alt="Mail" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    },
    {
      id: "trash",
      name: "Trash Bin",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Bin.png" alt="Trash" className="w-full h-full object-contain drop-shadow-md select-none" />
      )
    }
  ];

  const handleMouseMove = (e) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setHoveredId(null);
  };

  const getIconScale = (index) => {
    if (mouseX === null || !dockRef.current) return 1;
    const iconWidth = 48; 
    const iconCenter = index * (iconWidth + 6) + iconWidth / 2 + 16;
    const distance = Math.abs(mouseX - iconCenter);
    const maxScale = 1.5;
    const baseScale = 1;
    const stdDev = 60;
    const scale = baseScale + (maxScale - baseScale) * Math.exp(-(distance * distance) / (2 * stdDev * stdDev));
    return Math.max(1, scale);
  };

  const handleAppClick = (appId) => {
    playMacClick(isMuted);
    setBouncingId(appId);
    setTimeout(() => setBouncingId(null), 750);
    onLaunchApp(appId);
  };

  const handleEmptyTrash = () => {
    playTrashSound(isMuted);
    setItemsInTrash(0);
  };

  return (
    <>
      <div 
        ref={dockRef}
        className="mac-dock-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {dockApps.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={item.id} className="mac-dock-divider" />;
          }

          const scale = getIconScale(index);
          const iconSize = 44 * scale;
          const isHovered = hoveredId === item.id;
          const isBouncing = bouncingId === item.id;
          const isOpen = openApps[item.id];

          return (
            <div
              key={item.id}
              className={`mac-dock-item-wrapper ${isBouncing ? 'mac-dock-bounce' : ''}`}
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                transition: mouseX === null ? 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onClick={() => handleAppClick(item.id)}
            >
              {isHovered && mouseX !== null && (
                <div className="mac-dock-tooltip">
                  {item.name}
                </div>
              )}

              <div className="mac-dock-icon">
                {item.renderIcon()}
              </div>

              {isOpen && <div className="mac-dock-dot" />}
            </div>
          );
        })}
      </div>

      {/* Render Active Window Modals */}
      {openApps.finder && (
        <FinderModal 
          onSelectProject={onSelectProject} 
          onLaunchApp={onLaunchApp}
          onClose={() => onCloseApp('finder')} 
        />
      )}
      {openApps.terminal && (
        <TerminalModal 
          onClose={() => onCloseApp('terminal')} 
          onOpenPath={onOpenPath}
        />
      )}
      {openApps.safari && (
        <SafariModal 
          onClose={() => onCloseApp('safari')} 
        />
      )}
      {openApps['system-info'] && (
        <SystemInfoModal 
          onClose={() => onCloseApp('system-info')} 
        />
      )}
      {openApps.creative && (
        <CreativeStudioModal 
          activeApp={openApps.creativeApp || 'ae'} 
          onClose={() => onCloseApp('creative')} 
        />
      )}
      {openApps.warning && (
        <DiagnosticsModal onClose={() => onCloseApp('warning')} />
      )}
      {(openApps.notes || openApps.resume) && (
        <QuickNotesModal onClose={() => onCloseApp('notes')} />
      )}
      {openApps.photos && (
        <PhotosModal onClose={() => onCloseApp('photos')} />
      )}
      {openApps.instagram && (
        <InstagramModal onClose={() => onCloseApp('instagram')} />
      )}
      {openApps.mail && (
        <MailModal onClose={() => onCloseApp('mail')} />
      )}
      {openApps.settings && (
        <SystemSettingsModal 
          onClose={() => onCloseApp('settings')}
          wallpaper={wallpaper}
          onChangeWallpaper={onChangeWallpaper}
          lockWallpaper={lockWallpaper}
          onChangeLockWallpaper={onChangeLockWallpaper}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          volume={volume}
          onChangeVolume={onChangeVolume}
          systemPassword={systemPassword}
          onUpdatePassword={onUpdatePassword}
          customUploadDesktop={customUploadDesktop}
          onUploadDesktopWallpaper={onUploadDesktopWallpaper}
          customUploadLock={customUploadLock}
          onUploadLockWallpaper={onUploadLockWallpaper}
          initialTab={settingsInitialTab}
        />
      )}
      {openApps.trash && (
        <TrashModal 
          itemsInTrash={itemsInTrash} 
          onEmptyTrash={handleEmptyTrash} 
          onClose={() => onCloseApp('trash')} 
        />
      )}
    </>
  );
}
