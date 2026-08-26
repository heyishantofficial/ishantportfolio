import React, { useState, useRef } from 'react';
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
  openApps = { finder: true, notes: true },
  onLaunchApp,
  onCloseApp,
  activeProject,
  onSelectProject,
  isMuted
}) {
  const [mouseX, setMouseX] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [bouncingId, setBouncingId] = useState(null);
  const [itemsInTrash, setItemsInTrash] = useState(2);
  const dockRef = useRef(null);

  const dockApps = [
    {
      id: 'finder',
      name: 'Finder Workspace',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500 flex items-center justify-center relative rounded-[22%] shadow-md border border-white/30">
          {/* Finder Two-Tone Smile Face */}
          <svg className="w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10v0a10 10 0 0 1-10 10v0A10 10 0 0 1 2 12v0A10 10 0 0 1 12 2z" fill="#0284c7" opacity="0.3" />
            <path d="M12 2v20" />
            <path d="M8 9h.01M16 9h.01" strokeWidth="3" />
            <path d="M8 15c1 1 3 1.5 4 1.5s3-.5 4-1.5" />
          </svg>
        </div>
      )
    },
    {
      id: 'terminal',
      name: 'Terminal Shell',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-slate-950 flex flex-col justify-between p-1.5 relative rounded-[22%] shadow-md border border-slate-700">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="font-mono text-[10px] font-bold text-emerald-400 pl-1 pb-1">
            &gt;_ zsh
          </div>
        </div>
      )
    },
    {
      id: 'safari',
      name: 'Safari Browser',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-white flex items-center justify-center relative rounded-[22%] shadow-md border border-slate-200 p-1">
          {/* Compass Icon */}
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center relative shadow-inner">
            <svg className="w-6 h-6 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#ef4444" opacity="0.9" />
            </svg>
          </div>
        </div>
      )
    },
    {
      id: 'notes',
      name: 'Notes',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-white flex flex-col relative rounded-[22%] overflow-hidden shadow-md border border-slate-200">
          <div className="h-[28%] bg-gradient-to-b from-amber-300 to-amber-400 w-full border-b border-amber-500/30 flex items-center justify-center">
            <div className="w-full border-b border-dashed border-amber-600/40"></div>
          </div>
          <div className="flex-1 p-1 flex flex-col justify-evenly bg-[#fffdf0]">
            <div className="h-[1.5px] bg-sky-200/80 w-full"></div>
            <div className="h-[1.5px] bg-sky-200/80 w-full"></div>
            <div className="h-[1.5px] bg-sky-200/80 w-full"></div>
          </div>
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
    { id: 'divider-1', type: 'divider' },
    {
      id: 'ae',
      name: 'Adobe After Effects',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-[#00003b] flex items-center justify-center relative rounded-[22%] shadow-inner border border-indigo-400/20">
          <span className="font-extrabold text-[20px] tracking-tight text-[#9999ff] select-none font-sans drop-shadow-[0_2px_4px_rgba(153,153,255,0.4)]">
            Ae
          </span>
        </div>
      )
    },
    {
      id: 'ps',
      name: 'Adobe Photoshop',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-[#001e36] flex items-center justify-center relative rounded-[22%] shadow-inner border border-sky-400/20">
          <span className="font-extrabold text-[20px] tracking-tight text-[#31a8ff] select-none font-sans drop-shadow-[0_2px_4px_rgba(49,168,255,0.4)]">
            Ps
          </span>
        </div>
      )
    },
    {
      id: 'ai',
      name: 'Adobe Illustrator',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-[#330000] flex items-center justify-center relative rounded-[22%] shadow-inner border border-amber-400/20">
          <span className="font-extrabold text-[20px] tracking-tight text-[#ff9a00] select-none font-sans drop-shadow-[0_2px_4px_rgba(255,154,0,0.4)]">
            Ai
          </span>
        </div>
      )
    },
    { id: 'divider-2', type: 'divider' },
    {
      id: 'photos',
      name: 'Photos',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-white flex items-center justify-center relative rounded-[22%] shadow-md border border-slate-100 p-1">
          <svg className="w-7 h-7" viewBox="0 0 100 100">
            <ellipse cx="50" cy="28" rx="11" ry="18" fill="#EC4899" opacity="0.85" />
            <ellipse cx="50" cy="72" rx="11" ry="18" fill="#06B6D4" opacity="0.85" />
            <ellipse cx="28" cy="50" rx="18" ry="11" fill="#8B5CF6" opacity="0.85" />
            <ellipse cx="72" cy="50" rx="18" ry="11" fill="#F59E0B" opacity="0.85" />
            <g transform="rotate(45 50 50)">
              <ellipse cx="50" cy="28" rx="11" ry="18" fill="#EF4444" opacity="0.85" />
              <ellipse cx="50" cy="72" rx="11" ry="18" fill="#3B82F6" opacity="0.85" />
              <ellipse cx="28" cy="50" rx="18" ry="11" fill="#A855F7" opacity="0.85" />
              <ellipse cx="72" cy="50" rx="18" ry="11" fill="#10B981" opacity="0.85" />
            </g>
          </svg>
        </div>
      )
    },
    {
      id: 'mail',
      name: 'Mail',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-[#00b4db] to-[#0083b0] flex items-center justify-center relative rounded-[22%] shadow-md p-1.5 border border-sky-300/30">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
      )
    },
    {
      id: 'trash',
      name: 'Trash',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full flex items-center justify-center relative rounded-[22%] p-0.5">
          <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 64 64" fill="none">
            <path d="M16 20L20 56C20.2 58.2 22 60 24.2 60H39.8C42 60 43.8 58.2 44 56L48 20" fill="url(#trashMetal)" opacity="0.85" />
            <path d="M16 20L20 56C20.2 58.2 22 60 24.2 60H39.8C42 60 43.8 58.2 44 56L48 20" stroke="#94A3B8" strokeWidth="2" />
            {itemsInTrash > 0 && (
              <g className="animate-pulse">
                <circle cx="26" cy="24" r="5" fill="#EF4444" opacity="0.9" />
                <circle cx="38" cy="25" r="4.5" fill="#3B82F6" opacity="0.9" />
                <circle cx="32" cy="21" r="5.5" fill="#F59E0B" opacity="0.9" />
              </g>
            )}
            <ellipse cx="32" cy="20" rx="17" ry="4" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
            <defs>
              <linearGradient id="trashMetal" x1="16" y1="20" x2="48" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E2E8F0" stopOpacity="0.95" />
                <stop offset="0.5" stopColor="#94A3B8" stopOpacity="0.75" />
                <stop offset="1" stopColor="#64748B" stopOpacity="0.85" />
              </linearGradient>
            </defs>
          </svg>
        </div>
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
          const isOpen = openApps[item.id] || (item.id === 'ae' || item.id === 'ps' || item.id === 'ai' ? openApps['creative'] : false);

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
          onClose={() => onCloseApp('finder')} 
        />
      )}
      {openApps.terminal && (
        <TerminalModal 
          onClose={() => onCloseApp('terminal')} 
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
      {openApps.notes && (
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
