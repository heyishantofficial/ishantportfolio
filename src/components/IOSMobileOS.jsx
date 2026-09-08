import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Battery, Sliders, Volume2, VolumeX, Moon, Sun, 
  Lock, ChevronRight,
  ExternalLink, ArrowRight, Flashlight, Download,
  ArrowLeft,
  User, Rocket, Briefcase, Code, Heart, Coffee, FileText, Folder as FolderIcon, Sparkles
} from 'lucide-react';
import { PROJECTS_DATA } from '../data/projectsData';
import { findNode, itemCountLabel } from '../data/ishantOS';
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
import IOSMediaViewer from './IOSMediaViewer';
import { getYouTubeEmbedUrl } from '../utils/mediaHelpers';
import { findPresetById, BADGE_ICONS } from '../data/folderIconsCatalog';
import { getFolderIcon } from '../lib/siteSettings';

const SafariBrowser = React.lazy(() => import('./SafariBrowser'));
const SystemSettingsModal = React.lazy(() => import('./SystemSettingsModal'));
const RetroArcadeApp = React.lazy(() => import('./RetroArcade/RetroArcadeApp'));
const IOSMusicApp = React.lazy(() => import('./IOSMusicApp'));

/**
 * Authentic iOS Squircle Smartphone Icon
 * Renders continuous curvature (rounded-[22.5%]), Apple gloss specular sheen,
 * dynamic sizing clamp(54px, 14.8vw, 64px), and native category identities.
 */
function SmartphoneAppSquircle({ item }) {
  // 1. Explicit customRender (e.g. Cyberdeck, Settings on Page 2)
  if (item.customRender) {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/20 select-none">
        {item.customRender()}
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // 2. Direct icon image (e.g. Files/Finder, Safari, Notes, Arcade, Photos, YouTube, etc.)
  if (item.icon) {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/20 select-none bg-black/20">
        <img 
          src={item.icon} 
          alt={item.name} 
          className="w-full h-full object-cover select-none pointer-events-none rounded-[22.5%]" 
        />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // 3. Filesystem node or custom folder
  const nodeId = item.id;
  const customKey = getFolderIcon(nodeId);
  const preset = customKey ? findPresetById(customKey) : null;

  // If user selected an app icon preset (like app-safari)
  if (preset && preset.src) {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/20 select-none bg-black/20">
        <img src={preset.src} alt={item.name} className="w-full h-full object-cover select-none pointer-events-none rounded-[22.5%]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // If user uploaded a custom image URL
  if (typeof customKey === 'string' && (customKey.startsWith('/') || customKey.startsWith('http') || customKey.startsWith('data:'))) {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/20 select-none bg-black/20">
        <img src={customKey} alt={item.name} className="w-full h-full object-cover select-none pointer-events-none rounded-[22.5%]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // If user picked a custom badge preset in System Settings
  if (preset && preset.iconName) {
    const Glyph = BADGE_ICONS[preset.iconName] || Sparkles;
    return (
      <div 
        className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white"
        style={preset.filter ? { filter: preset.filter } : undefined}
      >
        <Glyph className="w-[50%] h-[50%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // If user picked a custom color preset in System Settings
  if (preset && preset.swatch) {
    return (
      <div 
        className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none flex items-center justify-center text-white"
        style={{ backgroundColor: preset.swatch }}
      >
        <FolderIcon className="w-[50%] h-[50%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // Default authentic portfolio folder identities matching real smartphone aesthetics
  if (nodeId === 'about-me') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#0055D4] via-[#007AFF] to-[#40A9FF] flex items-center justify-center text-white">
        <User className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'resume' || item.type === 'pdf') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/40 select-none bg-gradient-to-b from-white via-slate-50 to-slate-200 flex flex-col items-center justify-center">
        <FileText className="w-[44%] h-[44%] text-[#E11D48] drop-shadow-sm stroke-[2.2]" />
        <span className="text-[9px] font-black tracking-wider text-white bg-[#E11D48] px-1 py-0.2 rounded-[3px] mt-0.5 shadow-sm">
          PDF
        </span>
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'experience') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#C026D3] via-[#E11D48] to-[#F43F5E] flex items-center justify-center text-white">
        <Rocket className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'work') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] flex items-center justify-center text-white">
        <Briefcase className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'ai-lab') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#4F46E5] via-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white">
        <Code className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.4]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'random') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#BE123C] via-[#E11D48] to-[#FB7185] flex items-center justify-center text-white">
        <Heart className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.2] fill-white/20" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  if (nodeId === 'contact') {
    return (
      <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-tr from-[#C2410C] via-[#EA580C] to-[#FB923C] flex items-center justify-center text-white">
        <Coffee className="w-[52%] h-[52%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] stroke-[2.2]" />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
      </div>
    );
  }

  // Fallback for custom nodes or other items
  return (
    <div className="w-[clamp(54px,14.8vw,64px)] h-[clamp(54px,14.8vw,64px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.32)] border border-white/25 select-none bg-gradient-to-b from-white/35 to-white/15 backdrop-blur-xl flex items-center justify-center text-white">
      <FolderIcon className="w-[52%] h-[52%] text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] stroke-[2.2]" />
      <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[22.5%]" />
    </div>
  );
}

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
  onUploadLockWallpaper,
  bgVideoSound = true,
  onToggleBgVideoSound,
  bgVideoVolume = 5,
  onChangeBgVideoVolume,
  isIpodPlaying = false
}) {
  const { version } = useFileSystem();

  // Mobile navigation & active sheet state
  const [activeSheet, setActiveSheet] = useState(null); 
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeFolderStack, setActiveFolderStack] = useState([]);
  const [activeFilePreview, setActiveFilePreview] = useState(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('9:41');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [homeScreenPage, setHomeScreenPage] = useState(0);
  const isDraggingRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchDeltaRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const nameInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    touchDeltaRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e) => {
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchDeltaRef.current = { x: dx, y: dy };
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    const dx = touchDeltaRef.current.x;
    const dt = Math.max(1, Date.now() - touchStartRef.current.time);
    const velocity = dx / dt; // px per ms

    // Left swipe -> Next page (Page 1)
    if (dx < -30 || velocity < -0.22) {
      setHomeScreenPage(1);
    } 
    // Right swipe -> Prev page (Page 0)
    else if (dx > 30 || velocity > 0.22) {
      setHomeScreenPage(0);
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const handleMouseDown = (e) => {
    isPointerDownRef.current = true;
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    touchDeltaRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    touchDeltaRef.current = { x: dx, y: dy };
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      isDraggingRef.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    handleTouchEnd();
  };

  // Target volume calculation for the ambient background video on mobile
  const getTargetVideoVolume = useCallback(() => {
    if (isMuted || !bgVideoSound || isIpodPlaying || volume === 0 || bgVideoVolume === 0 || activeSheet === 'music') {
      return 0;
    }
    const masterFactor = Math.pow(Math.max(0, Math.min(100, volume)) / 100, 0.55);
    const videoFactor = Math.pow(Math.max(0, Math.min(100, bgVideoVolume)) / 100, 0.75);
    return Math.max(0, Math.min(1, masterFactor * videoFactor));
  }, [isMuted, bgVideoSound, isIpodPlaying, volume, bgVideoVolume, activeSheet]);

  // Safe audio unlock on user gestures (touch / click / pointer)
  useEffect(() => {
    const handleUserGesture = () => {
      if (videoRef.current) {
        const targetVol = getTargetVideoVolume();
        videoRef.current.muted = targetVol === 0;
        videoRef.current.volume = targetVol;
        if (videoRef.current.paused && (!activeSheet || activeSheet === 'settings')) {
          videoRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('pointerdown', handleUserGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('pointerdown', handleUserGesture);
    };
  }, [getTargetVideoVolume, activeSheet]);

  // Sync background video volume in real-time when volume / bgVideoVolume / mute changes
  useEffect(() => {
    if (!videoRef.current) return;
    const targetVol = getTargetVideoVolume();
    videoRef.current.muted = targetVol === 0;
    videoRef.current.volume = targetVol;
    if (targetVol > 0 && videoRef.current.paused && (!activeSheet || activeSheet === 'settings')) {
      videoRef.current.play().catch(() => {});
    }
  }, [getTargetVideoVolume, activeSheet, wallpaper]);

  // Pause heavy background video only when a heavy non-settings sheet is open
  // (Keep running during settings so user hears volume changes live!)
  useEffect(() => {
    if (!videoRef.current) return;
    if (activeSheet && activeSheet !== 'settings') {
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
    setActiveFilePreview(null);
    setActiveSheet('folder');
  }, [isMuted]);

  const handleFolderDrillDown = (childNode) => {
    playMacClick(isMuted);
    if (!childNode) return;

    if (childNode.kind === 'folder' || (childNode.children && childNode.children.length > 0)) {
      setActiveFolderStack((prev) => [...prev, childNode.id]);
      setActiveFilePreview(null);
      return;
    }

    if (childNode.kind === 'project') {
      const rawId = childNode.id.replace(/^lab-app-|^proj-|^lab-/, '');
      const pMatch = PROJECTS_DATA.find((p) => p.id === childNode.id || p.id === rawId);
      const proj = {
        ...(pMatch || {}),
        ...(childNode.project || {}),
        ...childNode,
        videoUrl: childNode.project?.videoUrl || pMatch?.videoUrl || childNode.videoUrl || ''
      };
      setSelectedProject(proj);
      setActiveSheet('project-detail');
      return;
    }

    if (childNode.id === 'resume') {
      window.open(childNode.href || '/resume.pdf', '_blank');
      return;
    }

    if (childNode.kind === 'mail') {
      setActiveSheet('mail');
      return;
    }

    // For any media (video, image, audio, text, pdf, uploaded file, link):
    setActiveFilePreview(childNode);
  };

  const handleFolderBack = () => {
    playMacClick(isMuted);
    if (activeFilePreview) {
      setActiveFilePreview(null);
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
    setActiveFilePreview(null);
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
        } else if (node.kind === 'mail') {
          setActiveSheet('mail');
        } else {
          setActiveFolderStack([]);
          setActiveFilePreview(node);
          setActiveSheet('folder');
        }
      }
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

  // Page 2: System Apps, Media, Arcade & Socials
  const page2Items = useMemo(() => [
    {
      id: 'music',
      name: 'Music',
      type: 'app',
      icon: '/icons/iTunes.png',
      action: () => handleAppLaunch('music')
    },
    {
      id: 'safari',
      name: 'Safari',
      type: 'app',
      icon: '/icons/Chrome.png',
      action: () => handleAppLaunch('safari')
    },
    {
      id: 'photos',
      name: 'Photos',
      type: 'app',
      icon: '/icons/Photos.png',
      action: () => handleAppLaunch('photos')
    },
    {
      id: 'arcade',
      name: 'Arcade',
      type: 'app',
      icon: '/icons/Games.png',
      action: () => handleAppLaunch('arcade')
    },
    {
      id: 'notes',
      name: 'Notes',
      type: 'app',
      icon: '/icons/Notes.png',
      action: () => handleAppLaunch('notes')
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
      id: 'instagram',
      name: 'Instagram',
      type: 'app',
      icon: '/icons/Instagram.png',
      action: () => handleAppLaunch('instagram')
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'app',
      icon: '/icons/LinkedIn.png',
      action: () => handleAppLaunch('linkedin')
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
            muted={isMuted || !bgVideoSound || bgVideoVolume === 0}
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
        <div className="w-full pt-1 pb-1 flex items-center justify-between text-white drop-shadow-md select-none shrink-0">
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

        {/* Top Flexible Spacer: Anchors the folder grid to the bottom like a real iPhone */}
        <div className="flex-1 min-h-[16px] pointer-events-none" />

        {/* Horizontal Swipeable 2-Page iOS Home Screens */}
        <div 
          className="w-full overflow-hidden mb-1 shrink-0 select-none touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <motion.div
            className="flex w-full select-none cursor-grab active:cursor-grabbing"
            animate={{ x: homeScreenPage === 0 ? '0%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
          >
            {/* Screen 1: Primary Authentic Smartphone Squircles (Strictly 100% viewport width) */}
            <div className="w-full min-w-full shrink-0 flex-shrink-0 px-2 py-2 box-border">
              <div className="grid grid-cols-4 gap-y-[clamp(14px,2.8vh,24px)] gap-x-[clamp(8px,3vw,20px)] justify-items-center w-full max-w-[390px] sm:max-w-[420px] mx-auto">
                {page1Items.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      app.action();
                    }}
                    className="flex flex-col items-center cursor-pointer group active:scale-90 transition-transform select-none"
                  >
                    <SmartphoneAppSquircle item={app} />
                    <span className="text-[clamp(10.5px,2.8vw,12px)] font-medium text-white tracking-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] truncate max-w-[clamp(64px,18vw,78px)] text-center mt-1.5">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screen 2: System Apps, Entertainment & Socials (Strictly 100% viewport width) */}
            <div className="w-full min-w-full shrink-0 flex-shrink-0 px-2 py-2 box-border">
              <div className="grid grid-cols-4 gap-y-[clamp(14px,2.8vh,24px)] gap-x-[clamp(8px,3vw,20px)] justify-items-center w-full max-w-[390px] sm:max-w-[420px] mx-auto">
                {page2Items.slice(0, 8).map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      app.action();
                    }}
                    className="flex flex-col items-center cursor-pointer group active:scale-90 transition-transform select-none"
                  >
                    <SmartphoneAppSquircle item={app} />
                    <span className="text-[clamp(10.5px,2.8vw,12px)] font-medium text-white tracking-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] truncate max-w-[clamp(64px,18vw,78px)] text-center mt-1.5">
                      {app.name}
                    </span>
                  </div>
                ))}

                {/* Row 3: Neatly Centered 2 Extra Apps (Instagram & Mail) */}
                {page2Items.length > 8 && (
                  <div className="col-span-4 flex items-center justify-center gap-[clamp(24px,7vw,40px)] pt-1">
                    {page2Items.slice(8).map((app) => (
                      <div 
                        key={app.id}
                        onClick={() => {
                          if (isDraggingRef.current) return;
                          app.action();
                        }}
                        className="flex flex-col items-center cursor-pointer group active:scale-90 transition-transform select-none"
                      >
                        <SmartphoneAppSquircle item={app} />
                        <span className="text-[clamp(10.5px,2.8vw,12px)] font-medium text-white tracking-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] truncate max-w-[clamp(64px,18vw,78px)] text-center mt-1.5">
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
        <div className="flex items-center justify-center gap-2.5 py-2 pb-2.5 select-none z-10 shrink-0">
          <button
            type="button"
            onClick={() => setHomeScreenPage(0)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              homeScreenPage === 0 
                ? 'w-2.5 h-2.5 bg-white shadow scale-110' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Home Screen 1"
          />
          <button
            type="button"
            onClick={() => setHomeScreenPage(1)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              homeScreenPage === 1 
                ? 'w-2.5 h-2.5 bg-white shadow scale-110' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Home Screen 2"
          />
        </div>

        {/* Bottom Floating iOS Frosted Dock (4 Apps) */}
        <div className="w-full mb-1 shrink-0">
          <div className="p-[clamp(8px,2.2vw,12px)] rounded-[28px] ios-glass-dock flex items-center justify-around w-full max-w-[clamp(290px,88vw,360px)] mx-auto shadow-2xl">
            {dockApps.map((dock) => (
              <div 
                key={`dock-${dock.id}`}
                onClick={dock.action}
                className="w-[clamp(48px,13.2vw,58px)] h-[clamp(48px,13.2vw,58px)] rounded-[22.5%] overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/20 select-none active:scale-90 transition-transform cursor-pointer bg-black/20"
              >
                <img 
                  src={dock.icon} 
                  alt={dock.name} 
                  className="w-full h-full object-cover select-none pointer-events-none rounded-[22.5%]" 
                />
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[22.5%]" />
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
        {activeSheet && activeSheet !== 'music' && (
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
              {/* Sheet Grab Bar & Header (Hidden for Files, Notes & Music, since they render native iOS headers) */}
              {activeSheet !== 'finder' && activeSheet !== 'notes' && activeSheet !== 'music' ? (
                <div className="w-full pt-3 pb-2 px-5 flex items-center justify-between border-b border-black/10 dark:border-white/10 shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    {activeSheet === 'folder' && (activeFolderStack.length > 1 || activeFilePreview) ? (
                      <button
                        onClick={handleFolderBack}
                        className="p-1 rounded-full bg-slate-200/80 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 px-2"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    ) : null}
                    <span className="font-bold text-sm tracking-tight capitalize truncate max-w-[200px]">
                      {activeSheet === 'folder' ? (activeFilePreview?.name || currentFolder?.name || 'Folder') :
                       activeSheet === 'work' ? 'Featured Work' :
                       activeSheet === 'arcade' ? 'Retro Arcade' :
                       activeSheet === 'photos' ? 'Photos Library' :
                       activeSheet === 'settings' ? 'System Settings' :
                       activeSheet === 'music' ? 'Music' :
                       activeSheet === 'mail' ? 'Contact Ishant' :
                       activeSheet === 'project-detail' ? selectedProject?.title || 'Case Study' :
                       activeSheet}
                    </span>
                    {activeSheet === 'folder' && currentFolder && !activeFilePreview && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        {itemCountLabel(currentFolder)}
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
                    {activeFilePreview ? (
                      /* Rich iOS Media Viewer (Video, Image, Audio, Document, File) */
                      <IOSMediaViewer
                        node={activeFilePreview}
                        onBack={handleFolderBack}
                        onClose={handleCloseSheet}
                        isDarkMode={isDarkMode}
                        isMuted={isMuted}
                      />
                    ) : (
                      /* Folder Children Grid / List View */
                      <div className="space-y-3">
                        {currentFolder?.description && currentFolder.description !== 'Folder' && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
                            {currentFolder.description}
                          </p>
                        )}

                        {(!currentFolder?.children || currentFolder.children.length === 0) ? (
                          <div className="py-14 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                            <FolderIcon className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
                            <p className="text-xs font-semibold">Folder is empty</p>
                            <p className="text-[10px] opacity-70 mt-0.5">0 items</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2.5">
                            {currentFolder.children.map((child) => {
                              const isChildFolder = child.kind === 'folder' || Array.isArray(child.children);
                              const subtitle = isChildFolder
                                ? itemCountLabel(child)
                                : (child.client || child.role || child.category || (child.description && child.description !== 'Folder' && child.description !== 'Uploaded file' ? child.description : (child.kind === 'text' ? 'Text Document' : child.kind === 'pdf' ? 'PDF Document' : child.kind === 'video' ? 'Video' : child.kind === 'image' ? 'Image' : child.kind === 'audio' ? 'Audio' : child.kind || 'File')));

                              return (
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
                                        {subtitle}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                      bgVideoSound={bgVideoSound}
                      onToggleBgVideoSound={onToggleBgVideoSound}
                      bgVideoVolume={bgVideoVolume}
                      onChangeBgVideoVolume={onChangeBgVideoVolume}
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

                {/* 10. Individual Project Detail Sheet */}
                {activeSheet === 'project-detail' && selectedProject && (
                  <div className="p-4 space-y-4 text-slate-800 dark:text-slate-100 pb-10">
                    <div className="border-b border-black/10 dark:border-white/10 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {selectedProject.category || 'Project'} · {selectedProject.year || '2026'}
                        </span>
                        {selectedProject.status && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider">
                            {selectedProject.status}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black mt-1 text-slate-900 dark:text-white">{selectedProject.title}</h2>
                      {(selectedProject.description || selectedProject.tagline || selectedProject.summary) && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {selectedProject.description || selectedProject.tagline || selectedProject.summary}
                        </p>
                      )}
                    </div>

                    {/* Role & Client Meta Pills */}
                    {(selectedProject.role || selectedProject.client) && (
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs">
                        {selectedProject.role && (
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Role</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">{selectedProject.role}</span>
                          </div>
                        )}
                        {selectedProject.client && (
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Client</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">{selectedProject.client}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Project Video Showcase if available */}
                    {selectedProject.videoUrl && (
                      <div className="rounded-2xl overflow-hidden shadow-lg border border-black/10 dark:border-white/10 bg-black aspect-video mt-2">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedProject.videoUrl) || selectedProject.videoUrl}
                          title={selectedProject.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {/* The Problem */}
                    {selectedProject.problem && (
                      <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                          The Problem
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedProject.problem}
                        </p>
                      </div>
                    )}

                    {/* The Idea */}
                    {selectedProject.idea && (
                      <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                          The Idea
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedProject.idea}
                        </p>
                      </div>
                    )}

                    {/* Execution / Highlights */}
                    {((Array.isArray(selectedProject.execution) && selectedProject.execution.length > 0) ||
                      (Array.isArray(selectedProject.highlights) && selectedProject.highlights.length > 0)) && (
                      <div className="space-y-2 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Execution &amp; Highlights
                        </span>
                        <ul className="space-y-1.5">
                          {(selectedProject.execution || selectedProject.highlights).map((item, i) => (
                            <li key={i} className="text-xs flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <span className="text-blue-500 font-bold">•</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Result / Metrics */}
                    {(selectedProject.result || selectedProject.metrics) && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                          Result &amp; Impact
                        </span>
                        <p className="text-slate-800 dark:text-emerald-100 font-medium leading-relaxed">
                          {selectedProject.result || selectedProject.metrics}
                        </p>
                      </div>
                    )}

                    {/* Built With / Tech Stack */}
                    {((Array.isArray(selectedProject.stack) && selectedProject.stack.length > 0) ||
                      (Array.isArray(selectedProject.techStack) && selectedProject.techStack.length > 0) ||
                      (Array.isArray(selectedProject.tags) && selectedProject.tags.length > 0)) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Built With
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[...(selectedProject.stack || selectedProject.techStack || []), ...(selectedProject.tags || [])]
                            .filter((val, idx, arr) => arr.indexOf(val) === idx)
                            .map((tech, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                {tech}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Action Links */}
                    {Array.isArray(selectedProject.links) && selectedProject.links.length > 0 ? (
                      <div className="pt-2 space-y-2">
                        {selectedProject.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                          >
                            <ExternalLink className="w-4 h-4" /> {link.label || 'Visit Link'}
                          </a>
                        ))}
                      </div>
                    ) : selectedProject.demoUrl && selectedProject.demoUrl !== '#' ? (
                      <div className="pt-2">
                        <a
                          href={selectedProject.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                          <ExternalLink className="w-4 h-4" /> Visit Live Production App
                        </a>
                      </div>
                    ) : null}
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

      {/* ========================================================================= */}
      {/* 4. DEDICATED RETRO IPOD CLASSIC (ZERO BLACK NEGATIVE SPACE)               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSheet === 'music' && (
          <div 
            className="fixed inset-0 z-[9995] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn select-none"
            onClick={handleCloseSheet}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center"
            >
              <Suspense fallback={null}>
                <IOSMusicApp
                  onClose={handleCloseSheet}
                  masterVolume={volume}
                  isMuted={isMuted}
                />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
