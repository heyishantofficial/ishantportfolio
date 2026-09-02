import React, { useState, useRef } from "react";
import { 
  Sliders, Image, Lock, Sun, Moon, Volume2, VolumeX, ShieldCheck, Check, Sparkles, Monitor, Key, Upload, ArrowRight, Globe, Loader2
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
  initialTab = "wallpaper"
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Password Auth Gate for System Settings
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPasswordInput, setSettingsPasswordInput] = useState("");
  const [settingsAuthError, setSettingsAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

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
        lockWallpaper
      });
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
                    { id: "wallpaper", label: "Desktop Wallpaper", icon: Image },
                    { id: "lockscreen", label: "Lock Screen Wallpaper", icon: Lock },
                    { id: "password", label: "Password & Security", icon: Key },
                    { id: "appearance", label: "Appearance & Theme", icon: isDarkMode ? Moon : Sun },
                    { id: "sound", label: "Sound & Audio", icon: isMuted ? VolumeX : Volume2 },
                    { id: "about", label: "System Info", icon: Monitor }
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { playMacClick(isMuted); setActiveTab(item.id); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                          isActive 
                            ? "bg-white/90 dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-md backdrop-blur-xl border border-white/80 dark:border-white/30" 
                            : "hover:bg-white/40 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
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
                Set as the default for everyone
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                {publishState === "error"
                  ? publishError
                  : publishState === "saved"
                  ? "Saved — every new visitor now loads this wallpaper."
                  : !canPublish
                  ? "Uploaded wallpapers live only in your browser and can't be published. Pick a built-in one."
                  : "Saves the current desktop + lock screen wallpaper for all future visitors."}
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
