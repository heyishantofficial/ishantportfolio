import React, { useState, useRef, useEffect } from "react";
import { 
  Sliders, Image, Lock, Sun, Moon, Volume2, VolumeX, ShieldCheck, Check, Sparkles, Monitor, Key, Upload, ArrowRight, Globe, Loader2, Share2, Link, ExternalLink, LayoutGrid, User, RotateCcw, CheckCircle2
} from "lucide-react";
import { MacWindow } from "./macDockModals";
import { playMacClick } from "../utils/macAudioEngine";
import { verifyAdminPassword, saveSiteSettings, changeAdminPassword, isPublishable } from "../lib/siteSettings";

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
  onUpdateDashboardConfig
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Password Auth Gate for System Settings
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPasswordInput, setSettingsPasswordInput] = useState("");
  const [settingsAuthError, setSettingsAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Social Links & Dashboard Config State
  const [localSocials, setLocalSocials] = useState(socialLinks || {
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    github: 'https://github.com'
  });

  const [localDashboard, setLocalDashboard] = useState(dashboardConfig || {
    openLinksInNewTab: false,
    dockMagnification: true,
    soundEffects: true,
    statusMessage: '● Vibecoding live & open for collaborations',
    contactEmail: 'ishant.vibecode@gmail.com'
  });

  const [socialsSavedNotice, setSocialsSavedNotice] = useState(false);
  const [dockSavedNotice, setDockSavedNotice] = useState(false);

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
      localStorage.removeItem('ishantos.desktop.positions');
      setDockSavedNotice(true);
      setTimeout(() => setDockSavedNotice(false), 2000);
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

  // The password is checked on the server, so it is never present in the
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

  const handlePublishDefaults = async () => {
    setPublishState("saving");
    setPublishError("");
    try {
      await saveSiteSettings({
        password: adminPassword.current,
        wallpaper,
        lockWallpaper,
        socialLinks: localSocials,
        dashboardConfig: localDashboard
      });
      if (onUpdateSocialLinks) onUpdateSocialLinks(localSocials);
      if (onUpdateDashboardConfig) onUpdateDashboardConfig(localDashboard);
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
                    { id: "socials", label: "Social & Links Hub", icon: Share2, badge: "Live" },
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

              <div className="pt-3 border-t border-slate-300/40 dark:border-slate-700/40 flex items-center justify-between px-2 text-[10px] text-slate-500">
                <span>macOS Sequoia v15.0</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">M3 Max</span>
              </div>
            </div>

            {/* Settings Right Main Content Area */}
            <div className="flex-1 bg-white/15 dark:bg-slate-950/30 backdrop-blur-2xl overflow-y-auto p-5 space-y-6">
              
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
                  ? "Saved — all future visitors will now load these wallpapers, social links, and dashboard settings."
                  : !canPublish
                  ? "Uploaded wallpapers live only in your browser and can't be published. Pick a built-in one."
                  : "Saves current wallpapers, social links, and dashboard preferences for all future visitors."}
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
