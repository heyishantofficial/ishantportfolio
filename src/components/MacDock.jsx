import React, { useState, useRef, useEffect, useCallback } from 'react';
import './macDock.css';
import { 
  CreativeStudioModal, 
  DiagnosticsModal, 
  QuickNotesModal, 
  PhotosModal, 
  InstagramModal, 
  MailModal, 
  TrashModal 
} from './macDockModals';

// Web Audio API Sound Generators
const playClickSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
};

const playTrashSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    noise.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

export default function MacDock() {
  const [hoveredId, setHoveredId] = useState(null);
  const [bouncingId, setBouncingId] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [openApps, setOpenApps] = useState({ notes: true });
  const [itemsInTrash, setItemsInTrash] = useState(2);
  const [creativeTab, setCreativeTab] = useState('ae');

  // Smooth RAF Mouse position tracking (prevents feedback loop shaking)
  const [scales, setScales] = useState({});
  const [isHovering, setIsHovering] = useState(false);
  
  const dockRef = useRef(null);
  const targetMouseX = useRef(null);
  const currentMouseX = useRef(null);
  const rafId = useRef(null);
  const dockCenterXRef = useRef(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);

  // App Icon Definition Data matching user screenshot
  const dockApps = [
    {
      id: 'ae',
      name: 'Adobe After Effects',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-[#00003b] flex items-center justify-center relative rounded-[22%] shadow-inner border border-indigo-400/20">
          <span className="font-extrabold text-[22px] tracking-tight text-[#9999ff] select-none font-sans drop-shadow-[0_2px_4px_rgba(153,153,255,0.4)]">
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
          <span className="font-extrabold text-[22px] tracking-tight text-[#31a8ff] select-none font-sans drop-shadow-[0_2px_4px_rgba(49,168,255,0.4)]">
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
          <span className="font-extrabold text-[22px] tracking-tight text-[#ff9a00] select-none font-sans drop-shadow-[0_2px_4px_rgba(255,154,0,0.4)]">
            Ai
          </span>
        </div>
      )
    },
    {
      id: 'warning',
      name: 'System Alerts',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-b from-amber-400 to-amber-500 flex items-center justify-center relative rounded-[22%] p-1 shadow-md">
          <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none">
            <path 
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" 
              fill="#F59E0B" 
              stroke="#FFFFFF" 
              strokeWidth="2" 
              strokeLinejoin="round"
            />
            <path d="M12 9v4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.25" fill="#FFFFFF" />
          </svg>
        </div>
      )
    },
    { id: 'divider-1', type: 'divider' },
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
      id: 'photos',
      name: 'Photos',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-white flex items-center justify-center relative rounded-[22%] shadow-md border border-slate-100 p-1">
          <svg className="w-8 h-8" viewBox="0 0 100 100">
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
    { id: 'divider-2', type: 'divider' },
    {
      id: 'instagram',
      name: 'Instagram',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center relative rounded-[22%] shadow-md p-1.5">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
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
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
      )
    },
    { id: 'divider-3', type: 'divider' },
    {
      id: 'trash',
      name: 'Trash',
      type: 'app',
      renderIcon: () => (
        <div className="w-full h-full flex items-center justify-center relative rounded-[22%] p-0.5">
          <svg className="w-9 h-9 drop-shadow-md" viewBox="0 0 64 64" fill="none">
            <path d="M16 20L20 56C20.2 58.2 22 60 24.2 60H39.8C42 60 43.8 58.2 44 56L48 20" fill="url(#trashMetal)" opacity="0.85" />
            <path d="M16 20L20 56C20.2 58.2 22 60 24.2 60H39.8C42 60 43.8 58.2 44 56L48 20" stroke="#94A3B8" strokeWidth="2" />
            
            {itemsInTrash > 0 && (
              <g className="animate-pulse">
                <circle cx="26" cy="24" r="5.5" fill="#EF4444" opacity="0.9" />
                <circle cx="38" cy="25" r="5" fill="#3B82F6" opacity="0.9" />
                <circle cx="32" cy="21" r="6" fill="#F59E0B" opacity="0.9" />
                <circle cx="31" cy="27" r="4.5" fill="#10B981" opacity="0.9" />
                <circle cx="37" cy="30" r="4" fill="#A855F7" opacity="0.9" />
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

  // Precompute unmagnified baseline item slot offsets relative to dock center
  const itemSlotsRef = useRef(null);
  if (!itemSlotsRef.current) {
    const slots = dockApps.map((item) => ({
      id: item.id,
      type: item.type,
      slotWidth: item.type === 'app' ? 54.4 : 15.4
    }));
    const totalWidth = slots.reduce((sum, s) => sum + s.slotWidth, 0);
    let curr = 0;
    itemSlotsRef.current = slots.map((s) => {
      const centerOffset = curr + s.slotWidth / 2 - totalWidth / 2;
      curr += s.slotWidth;
      return { id: s.id, type: s.type, centerOffset };
    });
  }

  // Animation Loop via requestAnimationFrame
  const updatePhysics = useCallback(() => {
    if (targetMouseX.current === null) {
      setScales({});
      rafId.current = null;
      return;
    }

    if (currentMouseX.current === null) {
      currentMouseX.current = targetMouseX.current;
    } else {
      // Smooth lerp easing (0.2 factor) for fluid Apple momentum motion
      currentMouseX.current += (targetMouseX.current - currentMouseX.current) * 0.22;
    }

    const mouseX = currentMouseX.current;
    const dockCenterScreenX = dockCenterXRef.current;
    const stdDev = 68; // Spread of magnification
    const maxScale = 1.55;

    const newScales = {};
    itemSlotsRef.current.forEach((slot) => {
      if (slot.type === 'divider') return;
      
      // Calculate item screen X center (INVARIANT to dock container resizing)
      const itemScreenX = dockCenterScreenX + slot.centerOffset;
      const dist = Math.abs(mouseX - itemScreenX);
      const scale = 1 + (maxScale - 1) * Math.exp(-(dist * dist) / (2 * stdDev * stdDev));
      newScales[slot.id] = Math.max(1, scale);
    });

    setScales(newScales);
    rafId.current = requestAnimationFrame(updatePhysics);
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      dockCenterXRef.current = rect.left + rect.width / 2;
    } else {
      dockCenterXRef.current = window.innerWidth / 2;
    }
  };

  const handleMouseMove = (e) => {
    targetMouseX.current = e.clientX;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updatePhysics);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    targetMouseX.current = null;
    currentMouseX.current = null;
    setHoveredId(null);
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setScales({});
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleAppClick = (appId) => {
    playClickSound();
    
    setBouncingId(appId);
    setTimeout(() => setBouncingId(null), 750);

    setOpenApps((prev) => ({ ...prev, [appId]: true }));

    if (appId === 'ae' || appId === 'ps' || appId === 'ai') {
      setCreativeTab(appId);
      setActiveModal('creative');
    } else {
      setActiveModal(appId);
    }
  };

  const handleEmptyTrash = () => {
    playTrashSound();
    setItemsInTrash(0);
  };

  return (
    <>
      <div 
        ref={dockRef}
        className="mac-dock-container"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {dockApps.map((item) => {
          if (item.type === 'divider') {
            return <div key={item.id} className="mac-dock-divider" />;
          }

          const scale = scales[item.id] || 1;
          const iconSize = 48 * scale;
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
                transition: isHovering ? 'none' : 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onClick={() => handleAppClick(item.id)}
            >
              {/* Tooltip on hover */}
              {isHovered && isHovering && (
                <div className="mac-dock-tooltip">
                  {item.name}
                </div>
              )}

              {/* Render Icon */}
              <div className="mac-dock-icon">
                {item.renderIcon()}
              </div>

              {/* Active Indicator Dot */}
              {isOpen && <div className="mac-dock-dot" />}
            </div>
          );
        })}
      </div>

      {/* Render Active Modals */}
      {activeModal === 'creative' && (
        <CreativeStudioModal 
          activeApp={creativeTab} 
          onClose={() => setActiveModal(null)} 
        />
      )}
      {activeModal === 'warning' && (
        <DiagnosticsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'notes' && (
        <QuickNotesModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'photos' && (
        <PhotosModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'instagram' && (
        <InstagramModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'mail' && (
        <MailModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'trash' && (
        <TrashModal 
          itemsInTrash={itemsInTrash} 
          onEmptyTrash={handleEmptyTrash} 
          onClose={() => setActiveModal(null)} 
        />
      )}
    </>
  );
}
