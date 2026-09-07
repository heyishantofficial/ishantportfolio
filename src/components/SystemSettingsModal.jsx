import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Sliders, Image, Lock, Sun, Moon, Volume2, VolumeX, ShieldCheck, Check, Sparkles, Monitor, Key, Upload, ArrowRight, Globe, Loader2, Share2, ExternalLink, LayoutGrid, User, RotateCcw, CheckCircle2, Folder, Search, AlertCircle,
  RefreshCw, Cloud, Download, UploadCloud, Database, CheckCheck, Server
} from "lucide-react";
import confetti from "canvas-confetti";
import { MacWindow } from "./macDockModals";
import { playMacClick } from "../utils/macAudioEngine";
import { verifyAdminPassword, saveSiteSettings, saveFolderIcons, changeAdminPassword, isPublishable, checkServerHealth, getAllFolderIcons, setLocalFolderIcons } from "../lib/siteSettings";
import { 
  runMasterSync, fetchMasterSnapshot, applyMasterSnapshotToWindow, exportMasterSnapshotJson, importMasterSnapshotJson, getCurrentWebsiteSnapshot 
} from "../lib/masterSync";
import { 
  FOLDER_COLOR_PRESETS, FOLDER_BADGE_PRESETS, FOLDER_SYSTEM_APP_PRESETS, FolderArtwork 
} from "../data/folderIconsCatalog";
import { processIconFile, fileToBase64 } from "../utils/icnsParser";
import { allNodes } from "../data/ishantOS";
import { getAdminPassword, setAdminStatus } from "../utils/useAdminAuth";

export default function SystemSettingsModal({ 
  onClose,
  wallpaper,
  onChangeWallpaper,
  lockWallpaper,
  onChangeLockWallpaper,
  isDarkMode,
  onToggleDarkMode,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
  onUpdatePassword,
  customUploadDesktop,
  onUploadDesktopWallpaper,
  customUploadLock,
  onUploadLockWallpaper,
  initialTab = "socials",
  socialLinks,
  onUpdateSocialLinks,
  dashboardConfig,
  onUpdateDashboardConfig,
  folderIcons,
  onUpdateFolderIcons
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Password Auth Gate for System Settings
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPasswordInput, setSettingsPasswordInput] = useState("");
  const [settingsAuthError, setSettingsAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Folder Icons Customization State
  const [localFolderIcons, setLocalFolderIconsState] = useState(() => folderIcons || getAllFolderIcons() || {});
  const [folderIconsSavedNotice, setFolderIconsSavedNotice] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('work');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [folderTabCategory, setFolderTabCategory] = useState('colors'); // 'colors' | 'badges' | 'apps' | 'upload'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (folderIcons) {
      setLocalFolderIconsState(folderIcons);
    }
  }, [folderIcons]);

  // Social Links & Dashboard Config State
  const [localSocials, setLocalSocials] = useState(socialLinks || {
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com/heyishant',
    twitter: 'https://twitter.com',
    github: 'https://github.com/heyishantofficial'
  });

  const [localDashboard, setLocalDashboard] = useState(dashboardConfig || {
    openLinksInNewTab: false,
    dockMagnification: true,
    soundEffects: true,
    statusMessage: '',
    contactEmail: 'ishant.vibecode@gmail.com'
  });

  const [socialsSavedNotice, setSocialsSavedNotice] = useState(false);
  const [dockSavedNotice, setDockSavedNotice] = useState(false);

  // YouTube live status preview in settings
  const [ytPreview, setYtPreview] = useState(null);
  const [ytLoading, setYtLoading] = useState(false);

  useEffect(() => {
    const url = localSocials.youtube;
    if (!url || (!url.includes('@') && !url.includes('/channel/') && !url.includes('/c/'))) {
      setYtPreview(null);
      return;
    }

    const timer = setTimeout(() => {
      setYtLoading(true);
      fetch(`/api/youtube-stats?url=${encodeURIComponent(url)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.ok) {
            setYtPreview(data);
          } else {
            setYtPreview(null);
          }
        })
        .catch(() => setYtPreview(null))
        .finally(() => setYtLoading(false));
    }, 600);

    return () => clearTimeout(timer);
  }, [localSocials.youtube]);

  useEffect(() => {
    if (socialLinks) setLocalSocials(socialLinks);
  }, [socialLinks]);

  useEffect(() => {
    if (dashboardConfig) setLocalDashboard(dashboardConfig);
  }, [dashboardConfig]);

  const handleSocialChange = (key, val) => {
    const next = { ...localSocials, [key]: val };
    setLocalSocials(next);
    if (onUpdateSocialLinks) onUpdateSocialLinks(next);
  };

  const handleDashboardChange = (key, val) => {
    const next = { ...localDashboard, [key]: val };
    setLocalDashboard(next);
    if (onUpdateDashboardConfig) onUpdateDashboardConfig(next);
  };

  const handleSaveSocials = () => {
    if (onUpdateSocialLinks) onUpdateSocialLinks(localSocials);
    try {
      localStorage.setItem('site_socialLinks', JSON.stringify(localSocials));
      setSocialsSavedNotice(true);
      setTimeout(() => setSocialsSavedNotice(false), 2000);
    } catch {}
  };

  const handleSaveDashboard = () => {
    if (onUpdateDashboardConfig) onUpdateDashboardConfig(localDashboard);
    try {
      localStorage.setItem('site_dashboardConfig', JSON.stringify(localDashboard));
      setDockSavedNotice(true);
      setTimeout(() => setDockSavedNotice(false), 2000);
    } catch {}
  };

  const handleResetDesktopPositions = () => {
    try {
      localStorage.removeItem('ishantos.desktop.positions_v3');
      localStorage.removeItem('ishantos.desktop.positions');
      setDockSavedNotice(true);
      setTimeout(() => setDockSavedNotice(false), 2000);
      window.dispatchEvent(new CustomEvent('ishantos:reset-folders'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  // Password Management State (Inside Settings)
  const [currentInput, setCurrentInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatusMsg, setPasswordStatusMsg] = useState(null);

  // The verified password, replayed to authorize publishing and password changes.
  const adminPassword = useRef("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [publishState, setPublishState] = useState("idle"); // idle | saving | saved | error
  const [publishError, setPublishError] = useState("");
  const [serverHealth, setServerHealth] = useState({ checked: false, online: false });

  useEffect(() => {
    if (isSettingsUnlocked) {
      checkServerHealth().then((res) => {
        setServerHealth({ checked: true, ...res });
      });
    }
  }, [isSettingsUnlocked]);

  const desktopWallpaperOptions = [
    { id: "video", name: "Dynamic Live Video", type: "video", preview: "/bg-video.mp4" },
    { id: "custom", name: "Ishant Custom Photo", type: "image", preview: "/bg-poc.jpg" },
    ...(customUploadDesktop ? [{ id: "uploaded_desktop", name: "My Uploaded Photo", type: "image", preview: customUploadDesktop }] : []),
    { id: "sequoia", name: "macOS Sequoia Dusk", type: "gradient", bgClass: "bg-gradient-to-br from-indigo-900 via-sky-800 to-slate-900" },
    { id: "sonoma", name: "macOS Sonoma Sunrise", type: "gradient", bgClass: "bg-gradient-to-br from-amber-600 via-rose-700 to-purple-900" },
    { id: "neon", name: "Cyberpunk Neon Glow", type: "gradient", bgClass: "bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950" },
    { id: "aurora", name: "Dark Aurora Borealis", type: "gradient", bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950" }
  ];

  const lockWallpaperOptions = [
    { id: "custom", name: "Ishant Custom Photo", type: "image", preview: "/bg-poc.jpg" },
    { id: "video", name: "Dynamic Lock Video", type: "video", preview: "/lock-video.mp4" },
    ...(customUploadLock ? [{ id: "uploaded_lock", name: "My Uploaded Lock Photo", type: "image", preview: customUploadLock }] : []),
    { id: "sequoia", name: "macOS Sequoia Dusk", type: "gradient", bgClass: "bg-gradient-to-br from-indigo-900 via-sky-800 to-slate-900" },
    { id: "sonoma", name: "macOS Sonoma Sunrise", type: "gradient", bgClass: "bg-gradient-to-br from-amber-600 via-rose-700 to-purple-900" },
    { id: "neon", name: "Cyberpunk Neon Glow", type: "gradient", bgClass: "bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950" },
    { id: "aurora", name: "Dark Aurora Borealis", type: "gradient", bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950" }
  ];

  // Unlock the panel. We verify with the server so the password isn't in the
  // browser bundle for a visitor to read out of DevTools.
  const handleUnlockSettings = async (e) => {
    e.preventDefault();
    if (isVerifying) return;
    const attempt = settingsPasswordInput.trim();
    if (!attempt) return;

    setIsVerifying(true);
    setSettingsAuthError("");
    try {
      await verifyAdminPassword(attempt);
      adminPassword.current = attempt;
      setAdminStatus(true, attempt);
      setIsSettingsUnlocked(true);
      setSettingsPasswordInput("");
    } catch (err) {
      setSettingsAuthError(err.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  // Master Sync State
  const [masterSyncState, setMasterSyncState] = useState("idle"); // idle | syncing | synced | error
  const [masterSyncMsg, setMasterSyncMsg] = useState("");
  const [masterSyncError, setMasterSyncError] = useState("");
  const [liveMasterSnapshot, setLiveMasterSnapshot] = useState(null);
  const [isPullingMaster, setIsPullingMaster] = useState(false);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const snapshotFileInputRef = useRef(null);

  // Auto-sync admin password if already unlocked in another component
  useEffect(() => {
    const existingPwd = getAdminPassword();
    if (existingPwd && !isSettingsUnlocked) {
      adminPassword.current = existingPwd;
      setIsSettingsUnlocked(true);
    }
  }, [isSettingsUnlocked]);

  // Load live master snapshot from server
  useEffect(() => {
    if (isSettingsUnlocked) {
      fetchMasterSnapshot().then((snapshot) => {
        if (snapshot) setLiveMasterSnapshot(snapshot);
      });
    }
  }, [isSettingsUnlocked, activeTab]);

  // Read current window snapshot
  const windowSnapshot = useMemo(() => {
    return getCurrentWebsiteSnapshot({
      wallpaper,
      lockWallpaper,
      socialLinks: localSocials,
      dashboardConfig: localDashboard,
      folderIcons: localFolderIcons
    });
  }, [wallpaper, lockWallpaper, localSocials, localDashboard, localFolderIcons]);

  const handleExecuteMasterSync = async () => {
    setMasterSyncState("syncing");
    setMasterSyncError("");
    setMasterSyncMsg("Packaging window snapshot and syncing to cloud...");

    try {
      const pwd = adminPassword.current || getAdminPassword();
      if (!pwd) {
        throw new Error("Admin password required. Please unlock with your password first.");
      }

      const res = await runMasterSync(pwd, {
        wallpaper,
        lockWallpaper,
        socialLinks: localSocials,
        dashboardConfig: localDashboard,
        folderIcons: localFolderIcons
      });

      setLiveMasterSnapshot(res.snapshot);
      setMasterSyncState("synced");
      setMasterSyncMsg("🎉 Master website updated! All visitors and browsers will now see this final version.");
      playMacClick(isMuted);
      try {
        confetti({ particleCount: 80, spread: 75, origin: { y: 0.55 } });
      } catch {}

      setTimeout(() => {
        setMasterSyncState("idle");
      }, 4500);
    } catch (err) {
      console.error("[MasterSync Error]:", err);
      setMasterSyncState("error");
      setMasterSyncError(err.message || "Failed to publish master website.");
    }
  };

  const handlePullMasterSnapshot = async () => {
    setIsPullingMaster(true);
    setMasterSyncError("");
    try {
      const snapshot = await fetchMasterSnapshot();
      if (!snapshot) {
        throw new Error("No master snapshot found on the server.");
      }
      await applyMasterSnapshotToWindow(snapshot, {
        onChangeWallpaper,
        onChangeLockWallpaper,
        onUpdateSocialLinks,
        onUpdateDashboardConfig,
        onUpdateFolderIcons
      });
      setLiveMasterSnapshot(snapshot);
      playMacClick(isMuted);
      setMasterSyncState("synced");
      setMasterSyncMsg("Pulled and applied the live master version successfully!");
      setTimeout(() => setMasterSyncState("idle"), 3500);
    } catch (err) {
      setMasterSyncState("error");
      setMasterSyncError(err.message);
    } finally {
      setIsPullingMaster(false);
    }
  };

  const handleExportSnapshot = () => {
    exportMasterSnapshotJson(windowSnapshot);
    playMacClick(isMuted);
  };

  const handleImportSnapshotFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsRestoringSnapshot(true);
    setMasterSyncError("");
    try {
      const imported = await importMasterSnapshotJson(file);
      await applyMasterSnapshotToWindow(imported, {
        onChangeWallpaper,
        onChangeLockWallpaper,
        onUpdateSocialLinks,
        onUpdateDashboardConfig,
        onUpdateFolderIcons
      });
      playMacClick(isMuted);
      setMasterSyncState("synced");
      setMasterSyncMsg("Imported backup snapshot applied to this window! Run Master Sync to publish it globally.");
      setTimeout(() => setMasterSyncState("idle"), 4500);
    } catch (err) {
      setMasterSyncState("error");
      setMasterSyncError(err.message);
    } finally {
      setIsRestoringSnapshot(false);
      if (snapshotFileInputRef.current) snapshotFileInputRef.current.value = "";
    }
  };

  const availableFolders = useMemo(() => {
    try {
      const nodes = allNodes ? allNodes() : [];
      const folders = nodes.filter((n) => n && n.kind === 'folder' && n.id !== 'home');
      const desktopPriority = ['about-me', 'experience', 'work', 'ai-lab', 'random', 'contact'];
      return folders.sort((a, b) => {
        const aIdx = desktopPriority.indexOf(a.id);
        const bIdx = desktopPriority.indexOf(b.id);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    } catch {
      return [];
    }
  }, []);

  const filteredFolders = useMemo(() => {
    if (!folderSearchQuery.trim()) return availableFolders;
    const q = folderSearchQuery.toLowerCase();
    return availableFolders.filter(
      (f) => f.name?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
    );
  }, [availableFolders, folderSearchQuery]);

  const activeFolder = useMemo(() => {
    return availableFolders.find((f) => f.id === selectedFolderId) || availableFolders[0] || null;
  }, [availableFolders, selectedFolderId]);

  const handleAssignIcon = (folderId, iconKey) => {
    const next = { ...localFolderIcons };
    if (!iconKey || iconKey === 'default') {
      delete next[folderId];
    } else {
      next[folderId] = iconKey;
    }
    setLocalFolderIconsState(next);
    setLocalFolderIcons(next);
    if (onUpdateFolderIcons) onUpdateFolderIcons(next);
  };

  const handleSaveFolderIcons = async () => {
    try {
      await saveFolderIcons({
        password: adminPassword.current,
        folderIcons: localFolderIcons
      });
      if (onUpdateFolderIcons) onUpdateFolderIcons(localFolderIcons);
      setFolderIconsSavedNotice(true);
      setTimeout(() => setFolderIconsSavedNotice(false), 2200);
    } catch (err) {
      console.error('Failed to save folder icons:', err);
    }
  };

  const handleResetAllFolderIcons = () => {
    if (window.confirm('Reset all customized folder icons back to macOS defaults?')) {
      setLocalFolderIconsState({});
      setLocalFolderIcons({});
      if (onUpdateFolderIcons) onUpdateFolderIcons({});
    }
  };

  const handleIconFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !activeFolder) return;
    setIsUploadingIcon(true);
    setUploadError('');

    try {
      const processedFile = await processIconFile(file);
      const base64 = await fileToBase64(processedFile);

      // Upload to server /api/upload
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword.current,
          filename: processedFile.name,
          dataBase64: base64,
          mimeType: processedFile.type || 'image/png'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        handleAssignIcon(activeFolder.id, data.url);
      } else {
        handleAssignIcon(activeFolder.id, base64);
      }
    } catch (err) {
      console.error('Icon upload failed:', err);
      setUploadError(err.message || 'Failed to process icon file');
    } finally {
      setIsUploadingIcon(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrlInput.trim() || !activeFolder) return;
    handleAssignIcon(activeFolder.id, customUrlInput.trim());
    setCustomUrlInput('');
  };

  const handlePublishDefaults = async () => {
    setPublishState("saving");
    setPublishError("");
    try {
      const pwd = adminPassword.current || getAdminPassword();
      const res = await saveSiteSettings({
        password: pwd,
        wallpaper,
        lockWallpaper,
        socialLinks: localSocials,
        dashboardConfig: localDashboard,
        folderIcons: localFolderIcons
      });
      if (onUpdateSocialLinks) onUpdateSocialLinks(localSocials);
      if (onUpdateDashboardConfig) onUpdateDashboardConfig(localDashboard);
      if (onUpdateFolderIcons) onUpdateFolderIcons(localFolderIcons);

      // Also trigger master sync to save full folders and filesystem globally
      try {
        await runMasterSync(pwd, {
          wallpaper,
          lockWallpaper,
          socialLinks: localSocials,
          dashboardConfig: localDashboard,
          folderIcons: localFolderIcons
        });
      } catch (masterErr) {
        console.warn('Master sync background update note:', masterErr.message);
      }

      if (res?.fallback) {
        setPublishError("⚠️ Saved in this browser only: Backend /api/settings is unreachable. Ensure Dokploy Publish Directory is empty and Port is 3000.");
        setPublishState("error");
        return;
      }
      setPublishState("saved");
      setTimeout(() => setPublishState("idle"), 2500);
    } catch (err) {
      setPublishError(err.message);
      setPublishState("error");
    }
  };

  const handleDesktopFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (onUploadDesktopWallpaper) {
        onUploadDesktopWallpaper(imageUrl);
      }
      onChangeWallpaper("uploaded_desktop");
    }
  };

  const handleLockFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (onUploadLockWallpaper) {
        onUploadLockWallpaper(imageUrl);
      }
      onChangeLockWallpaper("uploaded_lock");
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (currentInput !== adminPassword.current) {
      setPasswordStatusMsg({ type: "error", text: "Current password does not match!" });
      return;
    }
    if (!newPassword || newPassword.trim().length === 0) {
      setPasswordStatusMsg({ type: "error", text: "New password cannot be empty!" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ type: "error", text: "New passwords do not match!" });
      return;
    }
    // Persist on the server so the change survives a reload and a redeploy.
    try {
      await changeAdminPassword({
        password: adminPassword.current,
        newPassword: newPassword.trim()
      });
    } catch (err) {
      setPasswordStatusMsg({ type: "error", text: err.message });
      return;
    }

    adminPassword.current = newPassword.trim();
    if (onUpdatePassword) {
      onUpdatePassword(newPassword.trim());
    }
    setPasswordStatusMsg({ type: "success", text: "Password updated successfully!" });
    setCurrentInput("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Uploaded wallpapers are blob: URLs local to this browser — they cannot become a global default.
  const canPublish = isPublishable(wallpaper) && isPublishable(lockWallpaper);

  return (
    <MacWindow title="System Settings — macOS Sequoia" icon={Sliders} onClose={onClose} width="max-w-4xl">
      <div className="flex flex-col md:flex-row h-[520px] max-h-[78vh] select-none overflow-hidden -m-4 sm:-m-5 rounded-b-[1.4rem]">
        
        {/* Photorealistic Liquid Glass Password Security Gate */}
        {!isSettingsUnlocked ? (
          <div className="w-full h-full bg-gradient-to-b from-slate-900/80 via-slate-950/85 to-slate-950/90 backdrop-blur-3xl p-8 flex flex-col items-center justify-center text-center text-white space-y-5 select-none relative overflow-hidden">
            {/* Ambient Glass Glow Effects */}
            <div className="absolute w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
            <div className="absolute w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

            {/* 3D Liquid Glass Lock Disc Icon */}
            <div className="w-20 h-20 rounded-full mac-liquid-glass-btn flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-white/40 ring-4 ring-white/10 relative z-10">
              <Lock className="w-9 h-9 text-white drop-shadow-md" />
            </div>

            <div className="relative z-10 space-y-1 max-w-sm">
              <h3 className="text-lg font-extrabold tracking-tight text-white drop-shadow-md">
                System Settings is Locked
              </h3>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                Enter your admin password to unlock System Settings, wallpaper controls, and preferences.
              </p>
            </div>

            {/* Liquid Glass Input Form */}
            <form onSubmit={handleUnlockSettings} className="w-full max-w-xs space-y-3 pt-2 relative z-10">
              <div className={`relative flex items-center ${isShaking ? "animate-shake" : ""}`}>
                <input
                  type="password"
                  placeholder="Enter Password..."
                  value={settingsPasswordInput}
                  onChange={(e) => {
                    setSettingsPasswordInput(e.target.value);
                    if (settingsAuthError) setSettingsAuthError("");
                  }}
                  autoFocus
                  className={`w-full py-2.5 pl-4 pr-10 rounded-2xl mac-liquid-glass-input text-xs text-white placeholder-white/50 font-mono shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 transition-all border border-white/30 ${
                    settingsAuthError ? "border-rose-400 ring-2 ring-rose-400/80" : "focus:ring-amber-300/80"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isVerifying || !settingsPasswordInput.trim()}
                  className="absolute right-1.5 w-7 h-7 rounded-xl bg-white/20 hover:bg-white/35 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer border border-white/30 shadow-sm"
                  title="Unlock Settings"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {settingsAuthError && (
                <div className="text-[11px] font-mono text-rose-300 bg-rose-950/70 px-3 py-1.5 rounded-xl border border-rose-500/40 shadow-sm animate-fadeIn">
                  {settingsAuthError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl mac-liquid-glass-btn hover:bg-white/30 active:scale-95 text-white text-xs font-bold shadow-lg transition-all border border-white/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Unlock System Settings</span>
                <Key className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Settings Left Sidebar */}
            <div className="w-full md:w-56 bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border-r border-white/40 dark:border-white/10 p-3.5 flex flex-col justify-between shrink-0 font-sans text-xs">
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                  System Settings
                </div>

                <div className="space-y-1">
                  {[
                    { id: "master-sync", label: "Master Sync", icon: RefreshCw, badge: "Master" },
                    { id: "socials", label: "Social & Links Hub", icon: Share2, badge: "Live" },
                    { id: "folder-icons", label: "Folder Icons", icon: Folder, badge: "Custom" },
                    { id: "dock", label: "Dock & Desktop", icon: LayoutGrid },
                    { id: "profile", label: "Identity & Status", icon: User },
                    { id: "wallpaper", label: "Desktop Wallpaper", icon: Image },
                    { id: "lockscreen", label: "Lock Screen Wallpaper", icon: Lock },
                    { id: "appearance", label: "Appearance & Theme", icon: isDarkMode ? Moon : Sun },
                    { id: "sound", label: "Sound & Audio", icon: isMuted ? VolumeX : Volume2 },
                    { id: "password", label: "Password & Security", icon: Key },
                    { id: "about", label: "System Info", icon: Monitor }
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { playMacClick(isMuted); setActiveTab(item.id); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                          isActive 
                            ? "bg-white/90 dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-md backdrop-blur-xl border border-white/80 dark:border-white/30" 
                            : "hover:bg-white/40 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Backend / Cloud Status Card */}
              <div className="space-y-2 pt-2">
                <div className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1 backdrop-blur-md transition-all ${
                  serverHealth.online
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${serverHealth.online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <span>{serverHealth.online ? "Backend Online" : "Static Cache"}</span>
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
                      {serverHealth.online ? "Port 3000" : "Local Only"}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-80 leading-tight">
                    {serverHealth.online
                      ? "Live control panel active. Changes publish to all visitors."
                      : "Server offline. Deploy Dockerfile to enable global CMS."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-300/40 dark:border-slate-700/40 flex items-center justify-between px-2 text-[10px] text-slate-500">
                  <span>macOS Sequoia v15.0</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">M3 Max</span>
                </div>
              </div>
            </div>

            {/* Settings Right Main Content Area */}
            <div className="flex-1 bg-white/15 dark:bg-slate-950/30 backdrop-blur-2xl overflow-y-auto p-5 space-y-6">
              
              {/* TAB: Master Sync */}
              {activeTab === "master-sync" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        </div>
                        <span>Master Sync & Global Website Publisher</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Save and lock the final state of this window as the permanent version for every visitor, browser, and device.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleExportSnapshot}
                        className="px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Download JSON Snapshot Backup"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        <span>Backup (.json)</span>
                      </button>

                      <input
                        type="file"
                        ref={snapshotFileInputRef}
                        onChange={handleImportSnapshotFile}
                        accept=".json,application/json"
                        className="hidden"
                      />
                      <button
                        onClick={() => snapshotFileInputRef.current?.click()}
                        disabled={isRestoringSnapshot}
                        className="px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                        title="Import Snapshot JSON"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Restore (.json)</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {masterSyncMsg && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium">{masterSyncMsg}</span>
                    </div>
                  )}

                  {masterSyncError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-medium">{masterSyncError}</span>
                    </div>
                  )}

                  {/* Master Sync Action Hero Card */}
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-purple-500/20 border border-blue-500/30 dark:border-blue-500/40 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-md">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold tracking-wide uppercase">
                          <Sparkles className="w-3 h-3" /> One-Click Final Sync
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          Publish This Window as Global Master
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Synchronizes all folders (including custom episodes), renames, deleted items, notes, icons, and wallpapers to the server backend. Any browser visiting <strong>heyishant.com</strong> will immediately load this version.
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col sm:items-end gap-2">
                        <button
                          onClick={handleExecuteMasterSync}
                          disabled={masterSyncState === "syncing"}
                          className={`px-5 py-3 rounded-2xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            masterSyncState === "synced"
                              ? "bg-emerald-600 text-white"
                              : masterSyncState === "error"
                              ? "bg-rose-600 hover:bg-rose-500 text-white"
                              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/25 active:scale-95"
                          }`}
                        >
                          {masterSyncState === "syncing" && <Loader2 className="w-4 h-4 animate-spin" />}
                          {masterSyncState === "synced" && <CheckCheck className="w-4 h-4 stroke-[2.5]" />}
                          {masterSyncState === "idle" && <Cloud className="w-4 h-4" />}
                          <span className="tracking-tight text-sm">
                            {masterSyncState === "syncing"
                              ? "Saving Final Master..."
                              : masterSyncState === "synced"
                              ? "Published to Cloud!"
                              : masterSyncState === "error"
                              ? "Retry Master Sync"
                              : "🚀 Set as Final Master Website"}
                          </span>
                        </button>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Requires Admin Authorization
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two Cards: Live Cloud Version vs Current Window */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Live Server State */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-black/10 dark:border-white/10 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Live Master in Cloud
                          </h4>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          serverHealth.online
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                        }`}>
                          {serverHealth.online ? "🟢 Connected" : "🟡 Local Mode"}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Master Version ID</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                            {liveMasterSnapshot?.masterVersionId || "Base Default"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Last Synced</span>
                          <span className="font-medium">
                            {liveMasterSnapshot?.updatedAt
                              ? new Date(liveMasterSnapshot.updatedAt).toLocaleString()
                              : "Not yet synchronized"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Custom Items</span>
                          <span className="font-semibold">
                            {(liveMasterSnapshot?.filesystem?.customNodes || []).length} folders/files
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Renamed Items</span>
                          <span className="font-semibold">
                            {Object.keys(liveMasterSnapshot?.filesystem?.renames || {}).length} names
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handlePullMasterSnapshot}
                        disabled={isPullingMaster}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isPullingMaster ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-500" />}
                        <span>Pull Cloud Master into this Window</span>
                      </button>
                    </div>

                    {/* Current Window State */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-blue-500/20 dark:border-blue-500/30 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-blue-500" />
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            This Window (Ready to Save)
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                          Active State
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Custom Folders/Files</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {windowSnapshot.meta.customNodesCount} item{windowSnapshot.meta.customNodesCount === 1 ? '' : 's'} staged
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Folder Renames</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {windowSnapshot.meta.renamesCount} renamed
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Custom Folder Icons</span>
                          <span className="font-semibold">
                            {windowSnapshot.meta.folderIconsCount} custom icons
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Active Wallpapers</span>
                          <span className="font-medium truncate max-w-[140px]">
                            {wallpaper} / {lockWallpaper}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {windowSnapshot.meta.customNodesCount > 0 || windowSnapshot.meta.renamesCount > 0 ? (
                          <span>✨ Contains modifications ready to be saved as the permanent final website.</span>
                        ) : (
                          <span>Standard layout active. Click Master Sync to ensure server matches this window.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dokploy & Volume Persistence Tips */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <Database className="w-4 h-4 text-amber-500" />
                      <span>Production Deployment Advice (Dokploy / Docker)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Whenever you run <strong>Master Sync</strong>, the server writes directly to <code>/app/data/master-snapshot.json</code> and <code>filesystem.json</code>. To ensure your custom folders survive container rebuilds on Dokploy, mount a persistent volume at <code>/app/data</code>, or click <strong>Backup (.json)</strong> above to save a copy directly to your Mac.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: Social & Links Hub */}
              {activeTab === "socials" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-500" />
                        <span>Social Accounts & External Links</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Connect your channels and profiles. These directly link to macOS Dock icons and system shortcuts.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSocials}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {socialsSavedNotice ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{socialsSavedNotice ? "Saved!" : "Quick Save"}</span>
                    </button>
                  </div>

                  {/* Dock Click Action Preference */}
                  <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2.5 shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Dock Click Action</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Choose what happens when visitors click YouTube, LinkedIn, or Instagram in the Dock:</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDashboardChange("openLinksInNewTab", false)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          !localDashboard.openLinksInNewTab
                            ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                            : "border-slate-300/40 dark:border-slate-700/40 hover:bg-white/30 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Interactive macOS Window</span>
                          {!localDashboard.openLinksInNewTab && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5">Authentic macOS modal card with preview, details, and launch button</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDashboardChange("openLinksInNewTab", true)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          localDashboard.openLinksInNewTab
                            ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                            : "border-slate-300/40 dark:border-slate-700/40 hover:bg-white/30 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Direct New Browser Tab</span>
                          {localDashboard.openLinksInNewTab && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5">Launches external URL immediately in a new browser tab</div>
                      </button>
                    </div>
                  </div>

                  {/* Social Links Form */}
                  <div className="space-y-3">
                    {/* YouTube */}
                    <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="/icons/YouTube.png" alt="YouTube" className="w-5 h-5 object-contain" />
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">YouTube Channel URL</label>
                        </div>
                        {localSocials.youtube && (
                          <a
                            href={localSocials.youtube}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://youtube.com/@yourchannel or video link..."
                        value={localSocials.youtube || ''}
                        onChange={(e) => handleSocialChange('youtube', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                      {ytLoading && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 animate-pulse pt-0.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          <span>Scanning live YouTube channel metadata...</span>
                        </div>
                      )}
                      {!ytLoading && ytPreview && ytPreview.ok && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">
                            Channel synced: <strong className="font-semibold">{ytPreview.title}</strong> ({ytPreview.subscribers} subscribers • {ytPreview.videos} videos)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* LinkedIn */}
                    <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="/icons/LinkedIn.png" alt="LinkedIn" className="w-5 h-5 object-contain" />
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">LinkedIn Profile URL</label>
                        </div>
                        {localSocials.linkedin && (
                          <a
                            href={localSocials.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile..."
                        value={localSocials.linkedin || ''}
                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="/icons/Instagram.png" alt="Instagram" className="w-5 h-5 object-contain" />
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">Instagram Profile URL</label>
                        </div>
                        {localSocials.instagram && (
                          <a
                            href={localSocials.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://instagram.com/yourhandle..."
                        value={localSocials.instagram || ''}
                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Twitter / X */}
                    <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">𝕏</span>
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">Twitter / X URL</label>
                        </div>
                        {localSocials.twitter && (
                          <a
                            href={localSocials.twitter}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://x.com/yourhandle..."
                        value={localSocials.twitter || ''}
                        onChange={(e) => handleSocialChange('twitter', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* GitHub */}
                    <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">⌘</span>
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">GitHub Profile URL</label>
                        </div>
                        {localSocials.github && (
                          <a
                            href={localSocials.github}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://github.com/yourusername..."
                        value={localSocials.github || ''}
                        onChange={(e) => handleSocialChange('github', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Folder Icons Customization */}
              {activeTab === "folder-icons" && (
                <div className="space-y-4">
                  {/* Tab Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-0.5 flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-500" />
                        <span>Folder Icons & Customization</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Change individual folder icons one by one. Presets and uploaded .icns images sync to cloud for all visitors.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetAllFolderIcons}
                        className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Reset all customized folders to macOS default"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset All</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveFolderIcons}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {folderIconsSavedNotice ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{folderIconsSavedNotice ? "Saved!" : "Quick Save"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Two-Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                    
                    {/* Left Column: Folders Picker List */}
                    <div className="md:col-span-5 p-3 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          Folders ({filteredFolders.length})
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {Object.keys(localFolderIcons).length} Custom
                        </span>
                      </div>

                      {/* Search Filter */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter folders..."
                          value={folderSearchQuery}
                          onChange={(e) => setFolderSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        />
                      </div>

                      {/* Scrollable Folder Item List */}
                      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredFolders.map((folder) => {
                          const isSelected = selectedFolderId === folder.id;
                          const currentIcon = localFolderIcons[folder.id];
                          const hasCustom = Boolean(currentIcon);

                          return (
                            <button
                              key={folder.id}
                              type="button"
                              onClick={() => {
                                playMacClick(isMuted);
                                setSelectedFolderId(folder.id);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white font-bold shadow-md"
                                  : "hover:bg-white/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                                  <FolderArtwork iconKey={currentIcon} size={22} alt={folder.name} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs truncate font-medium">
                                    {folder.name}
                                  </div>
                                  <div className={`text-[9px] truncate ${isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                                    {folder.id}
                                  </div>
                                </div>
                              </div>

                              {hasCustom && (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-amber-300" : "bg-blue-500"}`} title="Has custom icon" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Active Folder Icon Inspector & Editor */}
                    <div className="md:col-span-7 space-y-3">
                      {activeFolder ? (
                        <>
                          {/* Folder Card Showcase */}
                          <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/10 backdrop-blur-2xl border border-white/60 dark:border-white/20 shadow-sm flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 shrink-0 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center p-1 shadow-inner">
                                <FolderArtwork iconKey={localFolderIcons[activeFolder.id]} size={40} alt={activeFolder.name} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                  <span>{activeFolder.name}</span>
                                  {localFolderIcons[activeFolder.id] && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] font-bold border border-blue-500/20">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {activeFolder.description || activeFolder.id}
                                </div>
                              </div>
                            </div>

                            {localFolderIcons[activeFolder.id] && (
                              <button
                                type="button"
                                onClick={() => handleAssignIcon(activeFolder.id, null)}
                                className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/15 hover:border-rose-500 hover:text-rose-600 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-all cursor-pointer shrink-0"
                              >
                                Revert Default
                              </button>
                            )}
                          </div>

                          {/* Category Selector Tabs */}
                          <div className="p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 flex items-center gap-1 text-[11px] font-semibold">
                            {[
                              { id: 'colors', label: 'Colors' },
                              { id: 'badges', label: 'Badges' },
                              { id: 'apps', label: 'Apps' },
                              { id: 'upload', label: 'Upload .icns' }
                            ].map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  playMacClick(isMuted);
                                  setFolderTabCategory(cat.id);
                                }}
                                className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                                  folderTabCategory === cat.id
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>

                          {/* Category 1: Colors Grid */}
                          {folderTabCategory === 'colors' && (
                            <div className="p-2.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2">
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                Tinted macOS Colors
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {FOLDER_COLOR_PRESETS.map((preset) => {
                                  const current = localFolderIcons[activeFolder.id];
                                  const isSelected = (preset.id === 'default' && !current) || current === preset.id;

                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => {
                                        playMacClick(isMuted);
                                        handleAssignIcon(activeFolder.id, preset.id);
                                      }}
                                      className={`p-1.5 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer relative ${
                                        isSelected
                                          ? "bg-blue-500/15 border-blue-500 shadow-sm ring-2 ring-blue-500/40"
                                          : "border-slate-200/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5"
                                      }`}
                                    >
                                      <div className="w-8 h-8 flex items-center justify-center">
                                        <FolderArtwork iconKey={preset.id} size={30} alt={preset.name} />
                                      </div>
                                      <span className="text-[9px] font-medium text-slate-700 dark:text-slate-200 text-center truncate w-full">
                                        {preset.name}
                                      </span>
                                      {isSelected && (
                                        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px] font-bold">
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Category 2: Badged Folders Grid */}
                          {folderTabCategory === 'badges' && (
                            <div className="p-2.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2">
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                Embossed macOS Badged Folders
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {FOLDER_BADGE_PRESETS.map((preset) => {
                                  const current = localFolderIcons[activeFolder.id];
                                  const isSelected = current === preset.id;

                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => {
                                        playMacClick(isMuted);
                                        handleAssignIcon(activeFolder.id, preset.id);
                                      }}
                                      className={`p-1.5 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer relative ${
                                        isSelected
                                          ? "bg-blue-500/15 border-blue-500 shadow-sm ring-2 ring-blue-500/40"
                                          : "border-slate-200/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5"
                                      }`}
                                    >
                                      <div className="w-8 h-8 flex items-center justify-center">
                                        <FolderArtwork iconKey={preset.id} size={30} alt={preset.name} />
                                      </div>
                                      <div className="text-center w-full min-w-0">
                                        <div className="text-[9px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                          {preset.name}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px] font-bold">
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Category 3: System Apps Grid */}
                          {folderTabCategory === 'apps' && (
                            <div className="p-2.5 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2">
                              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                Apple System App Icons
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {FOLDER_SYSTEM_APP_PRESETS.map((preset) => {
                                  const current = localFolderIcons[activeFolder.id];
                                  const isSelected = current === preset.id;

                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => {
                                        playMacClick(isMuted);
                                        handleAssignIcon(activeFolder.id, preset.id);
                                      }}
                                      className={`p-1.5 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer relative ${
                                        isSelected
                                          ? "bg-blue-500/15 border-blue-500 shadow-sm ring-2 ring-blue-500/40"
                                          : "border-slate-200/50 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5"
                                      }`}
                                    >
                                      <div className="w-8 h-8 flex items-center justify-center">
                                        <img src={preset.src} alt={preset.name} className="w-7 h-7 object-contain drop-shadow-sm" />
                                      </div>
                                      <span className="text-[9px] font-medium text-slate-700 dark:text-slate-200 text-center truncate w-full">
                                        {preset.name}
                                      </span>
                                      {isSelected && (
                                        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px] font-bold">
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Category 4: Upload .icns / Custom URL */}
                          {folderTabCategory === 'upload' && (
                            <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-3">
                              {/* Drag & Drop / File Input Box */}
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-blue-500/40 hover:border-blue-500/80 rounded-2xl p-3.5 text-center cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center gap-1.5 group"
                              >
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleIconFileUpload}
                                  accept=".icns,.png,.jpg,.jpeg,.svg,.webp,.ico"
                                  className="hidden"
                                />

                                <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                  {isUploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </div>

                                <div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {isUploadingIcon ? "Parsing .icns & Uploading to Cloud..." : "Upload an Apple .icns or PNG file"}
                                  </div>
                                  <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                                    Native .icns parser extracts 1024px retina PNG and hosts it permanently on server for all visitors.
                                  </div>
                                </div>
                              </div>

                              {uploadError && (
                                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[10px] flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{uploadError}</span>
                                </div>
                              )}

                              {/* Custom URL Option */}
                              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                                  Or paste direct image URL:
                                </label>
                                <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
                                  <input
                                    type="url"
                                    placeholder="https://example.com/icon.png"
                                    value={customUrlInput}
                                    onChange={(e) => setCustomUrlInput(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!customUrlInput.trim()}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Apply
                                  </button>
                                </form>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No folder selected. Pick a folder on the left to customize its icon.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB: Dock & Desktop Controls */}
              {activeTab === "dock" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-blue-500" />
                        <span>Dock & Desktop Controls</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Fine-tune the macOS Dock animation, audio behavior, and desktop folder layout.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveDashboard}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {dockSavedNotice ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{dockSavedNotice ? "Saved!" : "Quick Save"}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-4 shadow-sm">
                    {/* Dock Magnification */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Dock Magnification (Hover Zoom)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Smooth parabolic magnification when hovering over dock icons</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDashboardChange("dockMagnification", !localDashboard.dockMagnification)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${localDashboard.dockMagnification !== false ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${localDashboard.dockMagnification !== false ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="border-t border-slate-200/50 dark:border-slate-800 pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Mac Click Sound Effects</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Play responsive audio feedback on clicks, trash empty, and app launches</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDashboardChange("soundEffects", !localDashboard.soundEffects)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${localDashboard.soundEffects !== false ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${localDashboard.soundEffects !== false ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Reset Desktop Item Positions */}
                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-3 shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Reset Desktop Icons Grid</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Realign all custom draggable desktop folders back to their default macOS arrangement.</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDesktopPositions}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Snap Folders to Default Grid</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: Identity & Status */}
              {activeTab === "profile" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>Identity & Status Dashboard</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Control your live availability status, contact email, and public creator badge.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveDashboard}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {dockSavedNotice ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{dockSavedNotice ? "Saved!" : "Quick Save"}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-4 shadow-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-100">Live Status Message</label>
                      <input
                        type="text"
                        value={localDashboard.statusMessage || ''}
                        onChange={(e) => handleDashboardChange('statusMessage', e.target.value)}
                        placeholder="e.g. ● Vibecoding live & open for collaborations"
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-slate-800 dark:text-slate-100"
                      />
                      <p className="text-[10px] text-slate-500">Displays across Spotlight, About, and Menu Bar system summaries.</p>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-200/50 dark:border-slate-800 pt-3">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-100">Primary Contact Email</label>
                      <input
                        type="email"
                        value={localDashboard.contactEmail || ''}
                        onChange={(e) => handleDashboardChange('contactEmail', e.target.value)}
                        placeholder="ishant.vibecode@gmail.com"
                        className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                      />
                      <p className="text-[10px] text-slate-500">Destination for macOS Mail app composer and contact inquiries.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: Main Desktop Wallpaper */}
              {activeTab === "wallpaper" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                        Main Desktop Wallpaper
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select or upload your active wallpaper background for the primary macOS desktop canvas.
                      </p>
                    </div>

                    {/* Upload Wallpaper Button */}
                    <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0 border border-white/30">
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleDesktopFileUpload} 
                      />
                    </label>
                  </div>

                  {/* Wallpaper Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {desktopWallpaperOptions.map((item) => {
                      const isSelected = wallpaper === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { playMacClick(isMuted); onChangeWallpaper(item.id); }}
                          className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-1 ${
                            isSelected 
                              ? "border-blue-500 ring-2 ring-blue-400/50 shadow-lg scale-[1.02]" 
                              : "border-white/50 dark:border-white/10 hover:border-blue-300"
                          }`}
                        >
                          <div className="h-24 rounded-xl overflow-hidden relative shadow-inner bg-slate-900 flex items-center justify-center">
                            {item.type === "image" && (
                              <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                            )}
                            {item.type === "video" && (
                              <video src={item.preview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            )}
                            {item.type === "gradient" && (
                              <div className={`w-full h-full ${item.bgClass}`} />
                            )}

                            {/* Selected Checkmark Badge */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="py-2 px-1 text-center">
                            <span className={`text-xs font-semibold block truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                              {item.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Lock Screen Wallpaper */}
              {activeTab === "lockscreen" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                        Lock Screen Wallpaper
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select or upload your active wallpaper background for the macOS unlock login screen.
                      </p>
                    </div>

                    {/* Upload Lock Wallpaper Button */}
                    <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0 border border-white/30">
                      <Upload className="w-4 h-4" />
                      <span>Upload Lock Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLockFileUpload} 
                      />
                    </label>
                  </div>

                  {/* Lock Wallpaper Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {lockWallpaperOptions.map((item) => {
                      const isSelected = lockWallpaper === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => { playMacClick(isMuted); onChangeLockWallpaper(item.id); }}
                          className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-1 ${
                            isSelected 
                              ? "border-blue-500 ring-2 ring-blue-400/50 shadow-lg scale-[1.02]" 
                              : "border-white/50 dark:border-white/10 hover:border-blue-300"
                          }`}
                        >
                          <div className="h-24 rounded-xl overflow-hidden relative shadow-inner bg-slate-900 flex items-center justify-center">
                            {item.type === "image" && (
                              <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                            )}
                            {item.type === "video" && (
                              <video src={item.preview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            )}
                            {item.type === "gradient" && (
                              <div className={`w-full h-full ${item.bgClass}`} />
                            )}

                            {/* Selected Checkmark Badge */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="py-2 px-1 text-center">
                            <span className={`text-xs font-semibold block truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                              {item.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: Password & Security */}
              {activeTab === "password" && (
                <div className="space-y-5 max-w-lg">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Password & Settings Security</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage your password required for unlocking System Settings.
                    </p>
                  </div>

                  {/* Password Status Card */}
                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">System Settings Password</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Protected</span></div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Password: <code className="text-blue-600 dark:text-blue-400 font-bold font-mono">••••••••••••</code>
                      </span>
                    </div>
                  </div>

                  {/* Update Password Form */}
                  <form onSubmit={handleSavePassword} className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-3.5 shadow-sm">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Change Workstation Password</div>

                    {passwordStatusMsg && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        passwordStatusMsg.type === "success" 
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" 
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      }`}>
                        <span>{passwordStatusMsg.text}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password..."
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">New Password</label>
                        <input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: Appearance */}
              {activeTab === "appearance" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                      Appearance & Theme
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Switch between Light and Dark translucent glass appearance modes.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div 
                      onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                        !isDarkMode ? "border-blue-500 bg-white/80 shadow-md" : "border-slate-300/40 bg-white/40"
                      }`}
                    >
                      <Sun className="w-8 h-8 text-amber-500" />
                      <span className="font-bold text-xs text-slate-800">Light Mode</span>
                    </div>

                    <div 
                      onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                        isDarkMode ? "border-blue-500 bg-slate-900/80 shadow-md" : "border-slate-700/40 bg-slate-900/40"
                      }`}
                    >
                      <Moon className="w-8 h-8 text-indigo-400" />
                      <span className="font-bold text-xs text-slate-100">Dark Mode</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Sound */}
              {activeTab === "sound" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                      Sound & Audio Controls
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adjust master system volume and audio mute settings.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-4 max-w-md shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mute Audio</span>
                      <button 
                        onClick={onToggleMute}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${isMuted ? "bg-red-500" : "bg-emerald-500"}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isMuted ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <span>Master Volume</span>
                        <span>{volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onChangeVolume(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: About */}
              {activeTab === "about" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                      About Ishant Portfolio Workstation
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      System specifications & build environment details.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/50 dark:border-white/15 space-y-2 text-xs font-sans text-slate-800 dark:text-slate-200 max-w-md shadow-sm">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="font-semibold text-slate-500">Chip</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">Apple M3 Max</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="font-semibold text-slate-500">Memory</span>
                      <span className="font-mono">32 GB Unified Memory</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="font-semibold text-slate-500">macOS Version</span>
                      <span className="font-mono font-bold">Sequoia v15.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="font-semibold text-slate-500">System Settings</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Password Protected</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-slate-500">Creator</span>
                      <span className="font-bold">Ishant Chauhan</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>

      {/* Publish bar — sends the current wallpaper out as the default every visitor loads. */}
      {isSettingsUnlocked && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 bg-white/60 dark:bg-slate-900/70 backdrop-blur-2xl border-t border-white/60 dark:border-white/10 rounded-b-[1.4rem] font-sans select-none">
          <div className="flex items-start gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Publish settings globally for all visitors
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                {publishState === "error"
                  ? publishError
                  : publishState === "saved"
                  ? "Saved — all future visitors will now load these wallpapers, custom folder icons, social links, and dashboard settings."
                  : !canPublish
                  ? "Uploaded wallpapers live only in your browser and can't be published. Pick a built-in one."
                  : "Saves current wallpapers, custom folder icons, social links, and dashboard preferences for all future visitors."}
              </p>
            </div>
          </div>

          <button
            onClick={handlePublishDefaults}
            disabled={publishState === "saving" || !canPublish}
            className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-semibold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              publishState === "saved"
                ? "bg-emerald-600 text-white"
                : publishState === "error"
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {publishState === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {publishState === "saved" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            {publishState === "saving"
              ? "Publishing..."
              : publishState === "saved"
              ? "Published"
              : publishState === "error"
              ? "Retry"
              : "Publish to all visitors"}
          </button>
        </div>
      )}
    </MacWindow>
  );
}
