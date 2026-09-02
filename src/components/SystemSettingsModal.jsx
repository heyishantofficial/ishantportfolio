import React, { useState, useRef } from "react";
import { 
  Sliders, Image, Lock, Sun, Moon, Volume2, VolumeX, ShieldCheck, Check, Sparkles, Monitor, Globe, Loader2
} from "lucide-react";
import { MacWindow } from "./macDockModals";
import { playMacClick } from "../utils/macAudioEngine";
import { verifyAdminPassword, saveSiteSettings } from "../lib/siteSettings";

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
  onChangeVolume
}) {
  const [activeTab, setActiveTab] = useState("wallpaper");

  // System Settings is the admin panel: it stays locked until the password checks out.
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Kept so the admin's password can be replayed when publishing, without storing it in state we render.
  const adminPassword = useRef("");
  const [publishState, setPublishState] = useState("idle"); // idle | saving | saved | error
  const [publishError, setPublishError] = useState("");

  const handleAdminUnlock = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim() || isVerifying) return;
    setIsVerifying(true);
    setAuthError("");
    try {
      await verifyAdminPassword(passwordInput);
      adminPassword.current = passwordInput;
      setIsAdmin(true);
      setPasswordInput("");
      playMacClick(isMuted);
    } catch (err) {
      setAuthError(err.message);
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

  const desktopWallpaperOptions = [
    { id: "video", name: "Dynamic Live Video", type: "video", preview: "/bg-video.mp4" },
    { id: "custom", name: "Ishant Custom Photo", type: "image", preview: "/bg-poc.jpg" },
    { id: "sequoia", name: "macOS Sequoia Dusk", type: "gradient", bgClass: "bg-gradient-to-br from-indigo-900 via-sky-800 to-slate-900" },
    { id: "sonoma", name: "macOS Sonoma Sunrise", type: "gradient", bgClass: "bg-gradient-to-br from-amber-600 via-rose-700 to-purple-900" },
    { id: "neon", name: "Cyberpunk Neon Glow", type: "gradient", bgClass: "bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950" },
    { id: "aurora", name: "Dark Aurora Borealis", type: "gradient", bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950" }
  ];

  const lockWallpaperOptions = [
    { id: "custom", name: "Ishant Custom Photo", type: "image", preview: "/bg-poc.jpg" },
    { id: "video", name: "Dynamic Lock Video", type: "video", preview: "/lock-video.mp4" },
    { id: "sequoia", name: "macOS Sequoia Dusk", type: "gradient", bgClass: "bg-gradient-to-br from-indigo-900 via-sky-800 to-slate-900" },
    { id: "sonoma", name: "macOS Sonoma Sunrise", type: "gradient", bgClass: "bg-gradient-to-br from-amber-600 via-rose-700 to-purple-900" },
    { id: "neon", name: "Cyberpunk Neon Glow", type: "gradient", bgClass: "bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950" },
    { id: "aurora", name: "Dark Aurora Borealis", type: "gradient", bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950" }
  ];

  // Locked view — shown to every visitor who is not the admin.
  if (!isAdmin) {
    return (
      <MacWindow title="System Settings — macOS Sequoia" icon={Sliders} onClose={onClose} width="max-w-md">
        <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 select-none font-sans text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center shadow-lg border border-slate-600">
            <Lock className="w-7 h-7 text-slate-100" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              System Settings is locked
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              These settings control the wallpaper every visitor sees. Enter the administrator password to continue.
            </p>
          </div>

          <form onSubmit={handleAdminUnlock} className="w-full max-w-xs flex flex-col items-center gap-3 mt-1">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(""); }}
              placeholder="Administrator password"
              autoFocus
              className="w-full px-4 py-2 bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-full text-xs text-center font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {authError && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{authError}</p>
            )}

            <button
              type="submit"
              disabled={!passwordInput.trim() || isVerifying}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-xs font-semibold shadow-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isVerifying ? "Verifying..." : "Unlock Settings"}
            </button>
          </form>
        </div>
      </MacWindow>
    );
  }

  return (
    <MacWindow title="System Settings — macOS Sequoia" icon={Sliders} onClose={onClose} width="max-w-4xl">
      <div className="flex flex-col md:flex-row h-[500px] max-h-[75vh] select-none overflow-hidden -m-4 sm:-m-5 rounded-b-[1.4rem]">
        
        {/* Settings Left Sidebar */}
        <div className="w-full md:w-56 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-r border-white/50 dark:border-white/10 p-3.5 flex flex-col justify-between shrink-0 font-sans text-xs">
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
              System Settings
            </div>

            <div className="space-y-1">
              {[
                { id: "wallpaper", label: "Desktop Wallpaper", icon: Image },
                { id: "lockscreen", label: "Lock Screen Wallpaper", icon: Lock },
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
                        ? "bg-white/90 dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-sm backdrop-blur-xl border border-white/90" 
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
            <span className="font-mono text-emerald-600 font-bold">M3 Max</span>
          </div>
        </div>

        {/* Settings Right Main Content Area */}
        <div className="flex-1 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl overflow-y-auto p-5 space-y-6">
          
          {/* TAB 1: Main Desktop Wallpaper */}
          {activeTab === "wallpaper" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                  Main Desktop Wallpaper
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your active wallpaper background for the primary macOS desktop canvas.
                </p>
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
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                  Lock Screen Wallpaper
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your active wallpaper background for the macOS unlock login screen.
                </p>
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

              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/10 border border-white/60 space-y-4 max-w-md">
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

              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/10 border border-white/60 space-y-2 text-xs font-sans text-slate-800 dark:text-slate-200 max-w-md">
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
                  <span className="font-mono">Sequoia v15.0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-slate-500">Creator</span>
                  <span className="font-bold">Ishant Chauhan</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </MacWindow>
  );
}
