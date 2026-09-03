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
  YouTubeModal,
  LinkedInModal,
  MailModal, 
  TrashModal,
  FinderModal,
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
  settingsInitialTab = "wallpaper",
  socialLinks,
  onUpdateSocialLinks,
  dashboardConfig,
  onUpdateDashboardConfig
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
      id: "safari",
      name: "Chrome Browser",
      type: "app",
      renderIcon: () => (
        <img src="/icons/Chrome.png" alt="Browser" className="w-full h-full object-contain drop-shadow-md select-none" />
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
      id: "itunes",
      name: "iTunes Music",
      type: "app",
      renderIcon: () => (
        <img src="/icons/iTunes.png" alt="iTunes" className="w-full h-full object-contain drop-shadow-md select-none" />
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
      id: "youtube",
      name: "YouTube",
      type: "app",
      renderIcon: () => (
        <img src="/icons/YouTube.png" alt="YouTube" className="w-full h-full object-contain drop-shadow-md select-none" />
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
      id: "linkedin",
      name: "LinkedIn",
      type: "app",
      renderIcon: () => (
        <img src="/icons/LinkedIn.png" alt="LinkedIn" className="w-full h-full object-contain drop-shadow-md select-none" />
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
    if (dashboardConfig?.dockMagnification === false) return 1;
    if (mouseX === null || !dockRef.current) return 1;
    const iconWidth = 48; 
    const iconCenter = index * (iconWidth + 6) + iconWidth / 2 + 16;
    const distance = Math.abs(mouseX - iconCenter);
    const maxScale = 1.45;
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
          const isOpen = item.id === 'itunes' ? (openApps.itunes || openApps.ipod) : openApps[item.id];

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
      {openApps.safari && (
        <SafariModal 
          onClose={() => onCloseApp('safari')} 
          socialLinks={socialLinks}
          dashboardConfig={dashboardConfig}
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
      {openApps.youtube && (
        <YouTubeModal 
          youtubeUrl={socialLinks?.youtube}
          onOpenSettings={() => { onCloseApp('youtube'); onLaunchApp('settings'); }}
          onClose={() => onCloseApp('youtube')} 
        />
      )}
      {openApps.instagram && (
        <InstagramModal 
          instagramUrl={socialLinks?.instagram}
          onOpenSettings={() => { onCloseApp('instagram'); onLaunchApp('settings'); }}
          onClose={() => onCloseApp('instagram')} 
        />
      )}
      {openApps.linkedin && (
        <LinkedInModal 
          linkedinUrl={socialLinks?.linkedin}
          onOpenSettings={() => { onCloseApp('linkedin'); onLaunchApp('settings'); }}
          onClose={() => onCloseApp('linkedin')} 
        />
      )}
      {openApps.mail && (
        <MailModal 
          onClose={() => onCloseApp('mail')} 
          contactEmail={dashboardConfig?.contactEmail}
        />
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
          socialLinks={socialLinks}
          onUpdateSocialLinks={onUpdateSocialLinks}
          dashboardConfig={dashboardConfig}
          onUpdateDashboardConfig={onUpdateDashboardConfig}
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
