import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  AlertTriangle, FileText, Image as ImageIcon, Download, 
  Mail, Trash2, Layers, CheckCircle2, Send, RefreshCw, Sparkles, ExternalLink,
  Globe, Cpu, Search, Check, X, Maximize2,
  Save, Lock, ShieldCheck
} from 'lucide-react';
import { PROJECTS_DATA, PROFILE_INFO } from '../data/projectsData';
import SafariBrowser from './SafariBrowser';
import { useAdminAuth } from '../utils/useAdminAuth';
import AdminAuthModal from './AdminAuthModal';

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YouTubeIcon = (props) => (
  <img src="/icons/YouTube.png" alt="YouTube" className="w-3.5 h-3.5 object-contain" {...props} />
);

const LinkedInIcon = (props) => (
  <img src="/icons/LinkedIn.png" alt="LinkedIn" className="w-3.5 h-3.5 object-contain" {...props} />
);

// Draggable & Resizable macOS Window Container Component with Ultra-Frosted Sequoia Material
export function MacWindow({ title, icon: IconComponent, onClose, onMinimize, children, width = "max-w-4xl", isDark = false }) {
  return (
    <div className="mac-window-overlay" onClick={onClose}>
      <div className={`mac-window ${width} ${isDark ? "mac-window-glass-dark text-slate-100" : "mac-window-glass text-slate-900"}`} onClick={(e) => e.stopPropagation()}>
        {/* Continuous Glass Titlebar */}
        <div className="h-10 px-4 flex items-center justify-between select-none relative z-20">
          <div className="flex items-center gap-2">
            <button className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-80 transition-opacity" onClick={onClose} title="Close" />
            <button className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-80 transition-opacity" onClick={onMinimize || onClose} title="Minimize" />
            <button className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-80 transition-opacity" onClick={onClose} title="Maximize" />
          </div>
          <div className="text-xs font-semibold flex items-center gap-1.5 opacity-80">
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
            <span>{title}</span>
          </div>
          <div className="w-14" />
        </div>
        <div className="p-4 sm:p-5 pt-0 max-h-[82vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// 3D macOS Sequoia Sky Blue Folder Icon matching Image 2
export function Mac3DFolderIcon({ title, itemsCount, onClick, isSelected }) {
  return (
    <div 
      onClick={onClick}
      className={`group p-3 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
        isSelected 
          ? "bg-white/50 dark:bg-white/20 border border-white/80 dark:border-white/30 shadow-md backdrop-blur-xl scale-[1.02]" 
          : "hover:bg-white/30 dark:hover:bg-white/10 border border-transparent"
      }`}
    >
      {/* macOS Folder Icon */}
      <div className="w-16 h-16 mb-1 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
        <img src="/icons/Folder.png" alt="" className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none" draggable={false} />
      </div>

      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[110px] tracking-tight">
        {title}
      </div>
      <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
        {itemsCount}
      </div>
    </div>
  );
}


// 1. Finder App Modal (Exact 1:1 Replica of Image 2)
export function FinderModal({ onSelectProject, onLaunchApp, onClose }) {
  const [activeSidebar, setActiveSidebar] = useState("downloads");
  const [selectedFolder, setSelectedFolder] = useState("geist-font");
  const [searchQuery, setSearchQuery] = useState("");

  const todayFolders = [
    { id: "geist-font", title: "geist-font", items: "6 Items", projId: "brainjot" },
    { id: "PulseBoard", title: "PulseBoard", items: "12 Items", projId: "instacollect" },
    { id: "Atlas", title: "Atlas", items: "8 Items", projId: "notch-finder" }
  ];

  const yesterdayFolders = [
    { id: "AEUX_0.8.2", title: "AEUX_0.8.2", items: "4 Items", projId: "databeauty" },
    { id: "Invoices", title: "Invoices", items: "48 Items", projId: "talkntype" },
    { id: "Liquid", title: "Liquid", items: "2 Items", projId: "office-couture" }
  ];

  const prevDaysFolders = [
    { id: "Vibecoded", title: "Vibecoded Apps", items: "6 Items", projId: "brainjot" },
    { id: "Cyberdeck", title: "Cyberdeck Player", items: "10 Items", projId: "instacollect" },
    { id: "ResumeDoc", title: "Ishant Resume", items: "1 Item", projId: "resume" }
  ];

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder.id);
    if (folder.projId === "resume") {
      if (onLaunchApp) {
        onLaunchApp("notes");
      }
      return;
    }
    const targetProject = PROJECTS_DATA.find(p => p.id === folder.projId) || PROJECTS_DATA[0];
    if (onSelectProject) {
      onSelectProject(targetProject);
    }
  };

  return (
    <div className="mac-window-overlay" onClick={onClose}>
      <div 
        className="w-full max-w-5xl h-[560px] max-h-[82vh] bg-white/45 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/70 dark:border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden flex select-none font-sans text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Translucent Frosted Sidebar with embedded Traffic Lights */}
        <div className="w-56 bg-white/40 dark:bg-white/10 backdrop-blur-3xl border-r border-white/50 dark:border-white/15 p-4 flex flex-col justify-between shrink-0 text-xs">
          <div className="space-y-5">
            
            {/* Top Left Window Controls (Red, Yellow, Green Dots) */}
            <div className="flex items-center gap-2 pt-1 pb-2 px-1">
              <button className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-80 transition-opacity cursor-pointer" onClick={onClose} title="Close" />
              <button className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-80 transition-opacity cursor-pointer" onClick={onClose} title="Minimize" />
              <button className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-80 transition-opacity cursor-pointer" onClick={onClose} title="Maximize" />
            </div>

            {/* Favourites Section */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-2.5 px-2">
                Favourites
              </div>
              <div className="space-y-1">
                {[
                  { id: "downloads", label: "Downloads", icon: Download },
                  { id: "documents", label: "Documents", icon: FileText },
                  { id: "desktop", label: "Desktop", icon: Cpu },
                  { id: "applications", label: "Applications", icon: Sparkles }
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeSidebar === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSidebar(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl font-semibold transition-all ${
                        isActive 
                          ? "bg-white/80 dark:bg-white/25 text-slate-900 dark:text-white font-bold shadow-sm backdrop-blur-xl border border-white/90 dark:border-white/30" 
                          : "hover:bg-white/40 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locations Section */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-2.5 px-2">
                Locations
              </div>
              <div className="space-y-1">
                {[
                  { id: "icloud", label: "iCloud Drive", icon: Globe },
                  { id: "byjwxn", label: "byJWXN", icon: Cpu },
                  { id: "airdrop", label: "AirDrop", icon: Sparkles },
                  { id: "network", label: "Network", icon: Globe }
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSidebar(item.id)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 font-semibold transition-all"
                    >
                      <IconComp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="pt-3 border-t border-slate-300/40 dark:border-slate-700/40 flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shadow">
              IC
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">{PROFILE_INFO.name}</div>
              <div className="text-[9px] text-slate-500 truncate">MacBook Pro M3</div>
            </div>
          </div>
        </div>

        {/* Right Main Grid View Matching Image 2 */}
        <div className="flex-1 flex flex-col bg-white/20 dark:bg-slate-950/20 backdrop-blur-2xl overflow-hidden">
          {/* Header Bar with < | > navigation controls and Downloads Title */}
          <div className="h-14 px-6 flex items-center justify-between border-b border-white/30 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              {/* Frosted Navigation Pill Buttons */}
              <div className="flex items-center bg-white/50 dark:bg-white/15 px-2.5 py-1 rounded-full border border-white/70 dark:border-white/20 shadow-xs gap-1.5">
                <button className="text-slate-700 dark:text-slate-200 hover:text-black transition-colors text-xs font-extrabold">
                  ‹
                </button>
                <div className="w-[1px] h-3 bg-slate-400/50 dark:bg-slate-600" />
                <button className="text-slate-700 dark:text-slate-200 hover:text-black transition-colors text-xs font-extrabold">
                  ›
                </button>
              </div>
              <h1 className="font-sans font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                {activeSidebar === "downloads" ? "Downloads" : activeSidebar.toUpperCase()}
              </h1>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white/50 dark:bg-white/15 border border-white/70 dark:border-white/20 rounded-full text-xs w-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Grouped Folders Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Section 1: Today */}
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                Today
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {todayFolders.map((folder) => (
                  <Mac3DFolderIcon
                    key={folder.id}
                    title={folder.title}
                    itemsCount={folder.items}
                    isSelected={selectedFolder === folder.id}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            </div>

            {/* Section 2: Yesterday */}
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                Yesterday
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {yesterdayFolders.map((folder) => (
                  <Mac3DFolderIcon
                    key={folder.id}
                    title={folder.title}
                    itemsCount={folder.items}
                    isSelected={selectedFolder === folder.id}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            </div>

            {/* Section 3: Previous 7 Days */}
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                Previous 7 Days
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {prevDaysFolders.map((folder) => (
                  <Mac3DFolderIcon
                    key={folder.id}
                    title={folder.title}
                    itemsCount={folder.items}
                    isSelected={selectedFolder === folder.id}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Safari Browser Modal (Powered by macOS Sequoia Safari Engine)
export function SafariModal({ onClose, onMinimize, socialLinks, dashboardConfig }) {
  return <SafariBrowser onClose={onClose} onMinimize={onMinimize} socialLinks={socialLinks} dashboardConfig={dashboardConfig} />;
}


// 4. System Settings / About This Mac Modal
export function SystemInfoModal({ onClose }) {
  return (
    <MacWindow title="About This Mac" icon={Cpu} onClose={onClose} width="max-w-md">
      <div className="text-center space-y-4 py-2 font-sans">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-600 p-1 mx-auto shadow-lg flex items-center justify-center text-3xl">
          💻
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">MacBook Pro</h2>
          <p className="text-xs text-slate-500 font-mono">16-inch, 2026 Edition</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Chip:</span>
            <span className="font-semibold text-slate-800">Apple M3 Max (16-core)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Memory:</span>
            <span className="font-semibold text-slate-800">64 GB Unified Memory</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Developer:</span>
            <span className="font-semibold text-blue-600">{PROFILE_INFO.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">System OS:</span>
            <span className="font-semibold text-slate-800">macOS Sequoia v15.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-semibold text-emerald-600">⚡ High Performance Active</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
        >
          System Info Verified
        </button>
      </div>
    </MacWindow>
  );
}

// 5. Creative Studio Modal (Ae, Ps, Ai)
export function CreativeStudioModal({ activeApp, onClose }) {
  const [activeTab, setActiveTab] = useState(activeApp || 'ae');

  const contentMap = {
    ae: {
      name: 'Adobe After Effects',
      tag: 'Motion & Visual FX',
      projects: [
        { title: 'Cyberpunk UI HUD Motion', time: '0:15 Loop', desc: 'Complex 3D camera tracker with node-based glow shaders.' },
        { title: '3D Kinetic Typography Showcase', time: '0:30 Reel', desc: 'Custom motion curves & expression-driven text animations.' }
      ]
    },
    ps: {
      name: 'Adobe Photoshop',
      tag: 'Digital Compositing & Retouching',
      projects: [
        { title: 'Surrealist Key Art Poster', time: '300 DPI', desc: 'Multi-layer composite with atmospheric color grading.' },
        { title: 'Tactile UI Mockup Assets', time: 'Vector Mask', desc: 'High-precision neumorphic and skeuomorphic texture maps.' }
      ]
    },
    ai: {
      name: 'Adobe Illustrator',
      tag: 'Vector Graphics & Branding',
      projects: [
        { title: 'Vibecode Brand Identity Suite', time: 'SVG Export', desc: 'Modular geometric logo system with dark/light variants.' },
        { title: 'Custom App Iconset Pack', time: 'Grid Aligned', desc: 'Precision pixel-grid app icons crafted for macOS Sequoia.' }
      ]
    }
  };

  const current = contentMap[activeTab] || contentMap.ae;

  return (
    <MacWindow title={`${current.name} Showcase`} icon={Layers} onClose={onClose}>
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-lg mb-4 border border-slate-200">
        <button 
          onClick={() => setActiveTab('ae')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ae' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          After Effects (Ae)
        </button>
        <button 
          onClick={() => setActiveTab('ps')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ps' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Photoshop (Ps)
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ai' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Illustrator (Ai)
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-800">{current.name}</h3>
            <p className="text-xs text-slate-500">{current.tag}</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Creative Cloud 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {current.projects.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex justify-between items-start mb-1.5">
                <h4 className="font-semibold text-xs text-slate-900">{item.title}</h4>
                <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {item.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MacWindow>
  );
}

// 6. Diagnostics Modal
export function DiagnosticsModal({ onClose }) {
  const [cleared, setCleared] = useState(false);

  return (
    <MacWindow title="System Health & Diagnostics" icon={AlertTriangle} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-xs">System Status Check</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {cleared 
                ? 'All diagnostic alerts resolved. Operating smoothly at 60 FPS.' 
                : '1 non-critical memory advisory in cache pool. GPU acceleration active.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">FPS Rate</div>
            <div className="text-base font-bold text-emerald-600 mt-0.5">60.0 FPS</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">Memory Pool</div>
            <div className="text-base font-bold text-blue-600 mt-0.5">1.2 / 8 GB</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">Glass Blur</div>
            <div className="text-base font-bold text-purple-600 mt-0.5">Active</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {!cleared ? (
            <button 
              onClick={() => setCleared(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Diagnostics
            </button>
          ) : (
            <button 
              onClick={() => setCleared(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-run Scan
            </button>
          )}
        </div>
      </div>
    </MacWindow>
  );
}

const DEFAULT_QUICK_NOTES = {
  career: "I am starting a new internship soon, I wonder if I have what it takes or if I just got really lucky? Leadership and 10 things failure taught me.",
  ai: "I wonder if there is a future of AI identities - login with openai lol... wait this is gonna be real and then all the context and personalization...",
  tech: "Nintendo design philosophy teaches us that fun, playful design in itself is another strength. In an age where everything is minimal, there will be a resurgence of tech..."
};

// 7. Quick Notes & Glass Workspace Modal (Exact 1:1 Match to Photo 2)
export function QuickNotesModal({ onClose }) {
  const { isAdmin } = useAdminAuth();
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState("resume"); // "resume" by default so resume shows directly!
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('quick_notes_store');
      if (saved) return { ...DEFAULT_QUICK_NOTES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_QUICK_NOTES;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handleDownloadResume = () => {
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "Ishant_Chauhan_Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNoteChange = (text) => {
    setNotes((prev) => ({ ...prev, [activeTab]: text }));
  };

  const handleSaveNote = () => {
    if (!isAdmin) {
      setShowAuthModal(true);
      return;
    }
    try {
      localStorage.setItem('quick_notes_store', JSON.stringify(notes));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <MacWindow title="Notes Workspace — Official Resume Document" icon={FileText} onClose={onClose} width="max-w-6xl" isDark={true}>
        <div className="flex flex-col h-[560px] max-h-[80vh] select-none overflow-hidden text-slate-100 p-2 sm:p-4">
          
          {/* Top Header Bar */}
          <div className="flex items-center justify-between mb-3 px-2 shrink-0 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-lg sm:text-xl text-slate-100 tracking-tight">
                  {greeting}, Ishant
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Official Portfolio Resume & Thought Architecture Document (2027)
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadResume}
                className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setIsZoomed(true)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Full Lightbox</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
            
            {/* Left Sidebar List (Notes & Document Switcher) */}
            <div className="md:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1">
              
              {/* Primary Active Document Item: Resume */}
              <div 
                onClick={() => setActiveTab("resume")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === "resume"
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 shadow-lg ring-1 ring-amber-400/40"
                    : "bg-white/5 hover:bg-white/10 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Official Resume Document</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    2027
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-2">
                  Full-Stack AI Builder & Portfolio Re-issue Document. High-resolution scan.
                </p>
              </div>

              {/* Drafts Section */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Drafts & Notes
                </div>
                {[
                  { id: "career", title: "Design Career", desc: "10 things failure taught me", badge: "125" },
                  { id: "ai", title: "AI Thinking", desc: "Anthropic vs OpenAI vs Gemini", badge: "167" },
                  { id: "tech", title: "Fun Tech", desc: "Developer Platforms for OpenAI", badge: "67" }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                      activeTab === item.id 
                        ? "bg-white/20 border-white/30 text-white font-bold" 
                        : "bg-white/5 hover:bg-white/10 border-transparent text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold">{item.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{item.badge}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">{item.desc}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Main Viewer (Displays Resume Directly inside this window!) */}
            <div className="md:col-span-8 bg-slate-950/60 rounded-2xl border border-white/10 overflow-hidden flex flex-col relative shadow-inner">
              
              {activeTab === "resume" ? (
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col items-center justify-start scrollbar-thin">
                  <div className="relative group max-w-full">
                    {/* The Actual Main Resume Image Rendered Directly in Window */}
                    <img
                      src="/resume.jpg"
                      alt="Ishant Chauhan Official Resume Document"
                      className="max-w-full h-auto rounded-xl shadow-2xl border border-white/20 object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => setIsZoomed(true)}
                    />
                    
                    {/* Hover Overlay Badge */}
                    <div 
                      onClick={() => setIsZoomed(true)}
                      className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/30 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xl flex items-center gap-1.5"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Click for Full Screen</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between text-slate-200">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                      <div>
                        <h2 className="font-sans font-extrabold text-lg sm:text-xl text-white">
                          {activeTab === "career" ? "Design Career Notes" : activeTab === "ai" ? "AI Thinking & Identity" : "Fun Tech Philosophy"}
                        </h2>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isAdmin ? "Admin Editing Active • Changes save locally" : "Thought Archive"}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                          <button
                            onClick={handleSaveNote}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                              isSaved
                                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                                : "bg-[#007aff] hover:bg-[#0069dc] text-white shadow-blue-500/30 active:scale-95"
                            }`}
                          >
                            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            <span>{isSaved ? "Saved" : "Save Note"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isAdmin ? (
                      <textarea
                        value={notes[activeTab] || ""}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        placeholder="Write your note here..."
                        className="flex-1 min-h-[220px] w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm font-mono leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] resize-none"
                      />
                    ) : (
                      <div
                        onClick={() => setShowAuthModal(true)}
                        className="flex-1 p-3.5 rounded-xl bg-black/20 border border-white/5 cursor-pointer text-xs sm:text-sm leading-relaxed text-slate-300 font-sans"
                        title="Click to unlock Admin Mode to edit"
                      >
                        <p className="whitespace-pre-wrap">{notes[activeTab]}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab("resume")}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all w-fit cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Back to Official Resume</span>
                    </button>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {(notes[activeTab] || "").length} characters
                    </span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </MacWindow>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        initialPrompt="Enter administrator password to edit and save workspace notes."
      />

      {/* Lightbox / Zoom Modal for High-Res Fullscreen View */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[20000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <button
                onClick={handleDownloadResume}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Resume
              </button>
              <button 
                onClick={() => setIsZoomed(false)}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <img 
              src="/resume.jpg" 
              alt="Ishant Chauhan Resume High Res" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function PhotosModal({ onClose }) {
  const samplePhotos = [
    { title: 'Vibecoded App Canvas', category: 'UI Design', color: 'from-blue-500 to-indigo-600' },
    { title: '3D Cyberdeck Player', category: 'Audio UI', color: 'from-purple-500 to-pink-600' },
    { title: 'Content Engine Matrix', category: 'Strategy', color: 'from-cyan-500 to-emerald-600' },
    { title: 'macOS Sequoia Dock', category: 'Interface', color: 'from-amber-500 to-rose-600' }
  ];

  return (
    <MacWindow title="Photos — Portfolio Shots" icon={ImageIcon} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Recent Visual Renders</h3>
          <span className="text-xs text-slate-500">{samplePhotos.length} Items</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {samplePhotos.map((photo, i) => (
            <div 
              key={i} 
              className={`h-32 rounded-xl bg-gradient-to-br ${photo.color} p-3 flex flex-col justify-end text-white shadow hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative z-10">
                <span className="text-[9px] font-semibold tracking-wider uppercase opacity-80">{photo.category}</span>
                <h4 className="font-bold text-xs">{photo.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MacWindow>
  );
}

// 9. Instagram Modal
export function InstagramModal({ onClose, instagramUrl, onOpenSettings }) {
  const targetUrl = instagramUrl || PROFILE_INFO.socials.instagram || 'https://instagram.com/heyishant';
  let handle = '@ishantvibecode';
  try {
    const urlObj = new URL(targetUrl);
    const pathPart = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    if (pathPart) handle = `@${pathPart}`;
  } catch {}

  return (
    <MacWindow title="Instagram Profile" icon={InstagramIcon} onClose={onClose} width="max-w-md">
      <div className="text-center space-y-4 py-3 font-sans">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-1 shadow-lg">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-black text-xl tracking-wider">
            IC
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{handle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{PROFILE_INFO.name} • {PROFILE_INFO.roleTitle}</p>
        </div>
        <div className="flex justify-center gap-8 py-2.5 border-y border-slate-200/60 dark:border-slate-800 text-xs">
          <div><span className="font-bold text-slate-900 dark:text-white">142</span> <span className="text-slate-500 block text-[10px]">Posts</span></div>
          <div><span className="font-bold text-slate-900 dark:text-white">4.8k</span> <span className="text-slate-500 block text-[10px]">Followers</span></div>
          <div><span className="font-bold text-slate-900 dark:text-white">320</span> <span className="text-slate-500 block text-[10px]">Following</span></div>
        </div>
        <div className="flex flex-col gap-2 pt-1 max-w-xs mx-auto">
          <a 
            href={targetUrl}
            target="_blank" 
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Visit Instagram Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-500 underline transition-colors cursor-pointer"
            >
              Configure in System Settings
            </button>
          )}
        </div>
      </div>
    </MacWindow>
  );
}

// 9b. YouTube Modal with Live Channel Metrics
export function YouTubeModal({ onClose, youtubeUrl, onOpenSettings }) {
  const targetUrl = youtubeUrl || 'https://youtube.com/@heyishant';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/youtube-stats?url=${encodeURIComponent(targetUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.ok) {
          setStats(data);
        } else {
          setStats(null);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch YouTube stats:', err);
        if (isMounted) setStats(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  return (
    <MacWindow title="YouTube Channel" icon={YouTubeIcon} onClose={onClose} width="max-w-md">
      <div className="text-center space-y-4 py-3 font-sans">
        {/* Avatar or Icon Container */}
        <div className="relative w-20 h-20 mx-auto">
          {loading ? (
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center border border-white/50 dark:border-white/10 shadow-lg">
              <img src="/icons/YouTube.png" alt="YouTube" className="w-10 h-10 object-contain opacity-50" />
            </div>
          ) : stats?.avatar ? (
            <div className="relative group">
              <img 
                src={stats.avatar} 
                alt={stats.title || "YouTube Channel"} 
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white/80 dark:border-white/20 bg-slate-900" 
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-600 border-2 border-white dark:border-slate-900 shadow flex items-center justify-center">
                <img src="/icons/YouTube.png" alt="YouTube" className="w-3.5 h-3.5 object-contain" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 p-2 shadow-lg flex items-center justify-center">
              <img src="/icons/YouTube.png" alt="YouTube" className="w-14 h-14 object-contain drop-shadow-md" />
            </div>
          )}
        </div>

        {/* Channel Details */}
        <div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-36 mx-auto bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
              <div className="h-3 w-48 mx-auto bg-slate-200/80 dark:bg-slate-700/40 rounded-md animate-pulse" />
            </div>
          ) : (
            <>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                {stats?.title || "Ishant Chauhan"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stats?.handle && <span className="font-semibold text-red-600 dark:text-red-400 mr-1.5">{stats.handle}</span>}
                Video Strategy • Vibecoding Builds • Creative Tech
              </p>
            </>
          )}
        </div>

        {/* Live Metrics Grid */}
        <div className="flex justify-center gap-8 py-2.5 border-y border-slate-200/60 dark:border-slate-800 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {loading ? "..." : (stats?.subscribers || "Active")}
            </span>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mt-0.5">
              Subscribers
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {loading ? "..." : (stats?.videos || "HD")}
            </span>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mt-0.5">
              Videos
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {stats?.ok ? "Official" : "Active"}
            </span>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mt-0.5">
              Channel
            </span>
          </div>
        </div>

        {/* Action Button & Settings Link */}
        <div className="flex flex-col gap-2 pt-1 max-w-xs mx-auto">
          <a 
            href={targetUrl}
            target="_blank" 
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer hover:shadow-red-500/25 active:scale-[0.98]"
          >
            <span>Open YouTube Channel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-500 underline transition-colors cursor-pointer"
            >
              Configure in System Settings
            </button>
          )}
        </div>
      </div>
    </MacWindow>
  );
}

// 9c. LinkedIn Modal
export function LinkedInModal({ onClose, linkedinUrl, onOpenSettings }) {
  const targetUrl = linkedinUrl || 'https://linkedin.com';

  return (
    <MacWindow title="LinkedIn Profile" icon={LinkedInIcon} onClose={onClose} width="max-w-md">
      <div className="text-center space-y-4 py-3 font-sans">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0a66c2]/15 border border-[#0a66c2]/30 p-2 shadow-lg flex items-center justify-center">
          <img src="/icons/LinkedIn.png" alt="LinkedIn" className="w-14 h-14 object-contain drop-shadow-md" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Ishant Chauhan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Content Producer • Strategist • Vibecoding Builder</p>
        </div>
        <div className="flex justify-center gap-8 py-2.5 border-y border-slate-200/60 dark:border-slate-800 text-xs">
          <div><span className="font-bold text-slate-900 dark:text-white">500+</span> <span className="text-slate-500 block text-[10px]">Connections</span></div>
          <div><span className="font-bold text-slate-900 dark:text-white">Creator</span> <span className="text-slate-500 block text-[10px]">Mode</span></div>
          <div><span className="font-bold text-slate-900 dark:text-white">Open</span> <span className="text-slate-500 block text-[10px]">To Collaborate</span></div>
        </div>
        <div className="flex flex-col gap-2 pt-1 max-w-xs mx-auto">
          <a 
            href={targetUrl}
            target="_blank" 
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0077b5] to-[#00a0dc] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Connect on LinkedIn</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-500 underline transition-colors cursor-pointer"
            >
              Configure in System Settings
            </button>
          )}
        </div>
      </div>
    </MacWindow>
  );
}

// 10. Mail Modal
export function MailModal({ onClose, contactEmail }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const recipient = contactEmail || PROFILE_INFO.email;

  return (
    <MacWindow title="New Message — macOS Mail" icon={Mail} onClose={onClose}>
      {submitted ? (
        <div className="py-6 text-center space-y-3 font-sans">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Message Sent Successfully!</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Thank you for reaching out. Your message has been dispatched via Apple Mail.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="mt-1 px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-sans">
          <div>
            <label className="block text-slate-500 font-medium mb-1">To:</label>
            <input 
              type="text" 
              readOnly 
              value={recipient} 
              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Subject:</label>
            <input 
              type="text" 
              required
              placeholder="Collaboration Inquiry / Project Discussion"
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Message:</label>
            <textarea 
              rows={4}
              required
              placeholder="Hi Ishant, I checked out your MacBook OS portfolio..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button 
              type="submit" 
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </div>
        </form>
      )}
    </MacWindow>
  );
}

// 11. Trash Modal
export function TrashModal({ itemsInTrash, onEmptyTrash, onClose }) {
  const handleEmpty = () => {
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    onEmptyTrash();
  };

  return (
    <MacWindow title="Trash — Discarded Items" icon={Trash2} onClose={onClose}>
      <div className="space-y-4 font-sans">
        {itemsInTrash > 0 ? (
          <>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{itemsInTrash} Items in Trash</h4>
                <p className="text-[11px] text-slate-500">Crumpled draft files & temporary visual renders.</p>
              </div>
              <button 
                onClick={handleEmpty}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Empty Trash
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-100/60 rounded-lg border border-slate-200 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate text-slate-700 font-mono">old_dock_draft_v1.js</span>
              </div>
              <div className="p-2.5 bg-slate-100/60 rounded-lg border border-slate-200 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate text-slate-700 font-mono">discarded_icon_render.png</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-2">
            <Trash2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-xs">Trash is Empty</h3>
            <p className="text-[11px] text-slate-400">No discarded items currently in bin.</p>
          </div>
        )}
      </div>
    </MacWindow>
  );
}
