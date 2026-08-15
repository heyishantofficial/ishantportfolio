import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, Globe, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';
import manilaFolderImg from '../assets/manila-folder.png';

const TABS = [
  { id: 'vibecoded-apps', label: 'VIBECODED APPS', color: '#00f0ff' },
  { id: 'content-systems', label: 'CONTENT SYSTEMS', color: '#facc15' },
  { id: 'brand-storytelling', label: 'BRAND STORYTELLING', color: '#ff007a' },
  { id: 'the-stack', label: 'THE VIBECODE STACK', color: '#a855f7' },
  { id: 'about-contact', label: 'ABOUT & CONTACT', color: '#10b981' }
];

export default function ManilaFolderPortfolio({ onSelectProject }) {
  const [activeTabId, setActiveTabId] = useState('vibecoded-apps');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const activeFolder = FOLDERS_DATA.find(f => f.id === activeTabId) || FOLDERS_DATA[0];

  return (
    <div className="min-h-screen bg-[#DDECF8] text-[#1a1a1a] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Paper Texture */}
      <div className="paper-texture" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 relative z-10">
        <span className="font-serif-title italic text-2xl sm:text-3xl font-bold text-slate-900">
          ishant chauhan
        </span>

        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-md"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">COPIED EMAIL!</span>
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5 text-slate-300" />
              <span>{PROFILE_INFO.email}</span>
            </>
          )}
        </button>
      </header>

      {/* Main Stage: Using the EXACT Manila Folder Image Asset */}
      <div className="w-full max-w-4xl my-auto relative z-10 flex flex-col items-center py-6">
        
        {/* Main Manila Folder Container Graphic */}
        <div className="relative w-full max-w-3xl drop-shadow-2xl">
          
          {/* Exact Manila Folder Image Background */}
          <img
            src={manilaFolderImg}
            alt="Manila File Folder"
            className="w-full h-auto object-contain block pointer-events-none"
          />

          {/* Overlaid Interactive Tag on Top Left (Held by Paperclip) */}
          <div className="absolute top-[3%] left-[16%] w-[25%] sm:w-[28%] h-[6%] flex items-center justify-center px-2 pointer-events-none">
            <span className="font-mono text-[9px] sm:text-xs font-bold text-slate-800 tracking-wider truncate uppercase">
              {PROFILE_INFO.handle}
            </span>
          </div>

          {/* Overlaid Interactive Tab Switcher Bar (Right Side Green Tab Area) */}
          <div className="absolute top-[18%] right-[1%] w-[12%] sm:w-[14%] flex flex-col gap-2 z-30">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  style={{
                    backgroundColor: isActive ? '#0e7490' : '#1e293b',
                  }}
                  className={`w-full py-2 sm:py-3 px-1.5 rounded-r-xl font-mono text-[9px] sm:text-[11px] font-extrabold text-white text-center tracking-tight shadow-md border-y border-r border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase ${
                    isActive ? 'scale-105 ring-2 ring-white/50 shadow-xl' : 'opacity-85 hover:opacity-100'
                  }`}
                  title={tab.label}
                >
                  <span className="block truncate">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Overlaid Folder Inner Body Content */}
          <div className="absolute top-[14%] left-[13%] right-[16%] bottom-[5%] overflow-y-auto p-4 sm:p-8 flex flex-col justify-between custom-scrollbar">
            
            <div>
              {/* Folder Inner Header */}
              <div className="border-b border-amber-900/20 pb-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h1 className="font-serif-title italic text-3xl sm:text-5xl text-amber-950 font-bold tracking-tight">
                    the full offering
                  </h1>
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-amber-900/80 uppercase tracking-widest">
                    // {activeFolder.title}
                  </span>
                </div>
                <p className="font-sans text-xs sm:text-sm text-amber-900/90 font-medium mt-1 leading-relaxed">
                  {activeFolder.tagline}
                </p>
              </div>

              {/* Folder Item Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeFolder.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProject(item)}
                    className="group p-4 rounded-xl bg-amber-100/60 hover:bg-amber-100/90 border border-amber-900/15 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-sans font-extrabold text-sm sm:text-base text-amber-950 tracking-tight">
                          {item.title}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-amber-900 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="font-mono text-[10px] sm:text-[11px] text-amber-900/80 mb-3 line-clamp-2 leading-snug">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-900/10 font-mono text-[10px]">
                      <span className="font-bold text-amber-950">
                        ⚡ {item.metrics.split('•')[0]}
                      </span>
                      <span className="font-extrabold text-amber-900 group-hover:text-amber-950 underline uppercase">
                        ► {item.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder Bottom Stamp */}
            <div className="pt-4 border-t border-amber-900/20 flex items-center justify-between font-mono text-[10px] text-amber-900/70">
              <span>MANILA FILE ID: {activeFolder.id.toUpperCase()}</span>
              <span>CURATED BY ISHANT CHAUHAN</span>
            </div>

          </div>

        </div>

        {/* Tab Switcher Pills below folder on smaller mobile screens */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 z-20">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all ${
                activeTabId === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-900/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600 relative z-10">
        <span>© 2026 ISHANT CHAUHAN</span>
        <div className="flex items-center gap-6 font-bold text-slate-800">
          <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-slate-900">TWITTER</a>
          <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-slate-900">LINKEDIN</a>
          <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-slate-900">GITHUB</a>
        </div>
      </footer>

    </div>
  );
}
