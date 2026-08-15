import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

const FOLDER_THEMES = [
  { 
    id: 'vibecoded-apps', 
    title: 'VIBECODED APPS', 
    tabLabel: 'vibecoded', 
    tabPosition: 'left-8', 
    bgColor: '#7A8B36', 
    textColor: '#FFFFFF',
    tagColor: '#ffffff'
  },
  { 
    id: 'content-systems', 
    title: 'CONTENT SYSTEMS', 
    tabLabel: 'systems', 
    tabPosition: 'left-48', 
    bgColor: '#F5F3EC', 
    textColor: '#1c1c1c',
    tagColor: '#d97706'
  },
  { 
    id: 'brand-storytelling', 
    title: 'BRAND STORYTELLING', 
    tabLabel: 'storytelling', 
    tabPosition: 'right-28', 
    bgColor: '#1F1F1F', 
    textColor: '#FFFFFF',
    tagColor: '#f43f5e'
  },
  { 
    id: 'the-stack', 
    title: 'THE VIBECODE STACK', 
    tabLabel: 'the stack', 
    tabPosition: 'left-16', 
    bgColor: '#F48AA7', 
    textColor: '#FFFFFF',
    tagColor: '#ffffff'
  },
  { 
    id: 'about-contact', 
    title: 'ABOUT & CONTACT', 
    tabLabel: 'contact', 
    tabPosition: 'right-48', 
    bgColor: '#2563EB', 
    textColor: '#FFFFFF',
    tagColor: '#ffffff'
  }
];

export default function LabzFolderStack({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState('the-stack');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const activeIndex = FOLDER_THEMES.findIndex(t => t.id === activeFolderId);
  const activeFolder = FOLDERS_DATA.find(f => f.id === activeFolderId) || FOLDERS_DATA[0];

  return (
    <div className="min-h-screen bg-[#F7EFE0] text-[#1c1c1c] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Watercolor Paper Texture Overlay */}
      <div className="paper-texture" />

      {/* Top Header Row (Matching labz.design aesthetic 1:1) */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 relative z-10 font-sans text-xs">
        <span className="font-serif-title italic text-2xl font-bold text-slate-800 tracking-tight">
          ishant chauhan
        </span>

        <span className="font-mono text-xs font-semibold text-slate-500 lowercase">
          ishant.design
        </span>
      </header>

      {/* Main Stage Title */}
      <div className="w-full max-w-3xl text-center my-3 select-none relative z-10">
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-1">
          the full offering
        </h1>
        <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333]">
          CURATED BY {PROFILE_INFO.handle.toUpperCase()} • CLICK A TAB TO PULL FRONT
        </p>
      </div>

      {/* ==========================================================================
          PERFECT VERTICAL STAGGERED FOLDER DECK (PEEKING TABS MATCHING PHOTO 1:1)
          ========================================================================== */}
      <div className="w-full max-w-4xl my-auto relative z-10 flex flex-col items-center py-4">
        
        {/* Main Deck Container */}
        <div className="relative w-full max-w-2xl h-[560px] sm:h-[620px]">
          
          {FOLDER_THEMES.map((theme, index) => {
            const isActive = theme.id === activeFolderId;
            const folderData = FOLDERS_DATA.find(f => f.id === theme.id) || FOLDERS_DATA[0];

            // 1. Z-Index logic: Active folder is ALWAYS on top (z-50). Inactive folders ordered logically
            const zIndex = isActive ? 50 : 10 + (FOLDER_THEMES.length - index);

            // 2. Vertical stair-step offset: Each folder is offset by 48px from the top so ALL tabs peek out!
            const baseTop = index * 48; // 0px, 48px, 96px, 144px, 192px

            return (
              <div
                key={theme.id}
                onClick={() => setActiveFolderId(theme.id)}
                style={{
                  top: `${baseTop}px`,
                  zIndex: zIndex,
                  transform: isActive 
                    ? 'translateY(-8px) scale(1.01)' 
                    : 'translateY(0px) scale(1)'
                }}
                className={`absolute inset-x-0 transition-all duration-500 ease-out cursor-pointer drop-shadow-2xl ${
                  isActive ? 'shadow-2xl' : 'hover:-translate-y-2 opacity-95 hover:opacity-100'
                }`}
              >
                {/* Physical Folder Body */}
                <div 
                  style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                  className="relative w-full rounded-[2.2rem] p-6 sm:p-8 border border-black/10 transition-all duration-300 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between overflow-hidden shadow-xl"
                >
                  <div className="paper-texture" />

                  {/* Top Curved Folder Tab (Matching Image 1:1) */}
                  <div 
                    style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                    className={`absolute -top-7 ${theme.tabPosition} px-7 py-2.5 rounded-t-2xl border-t border-x border-black/10 font-sans text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-2 z-20 shadow-md`}
                  >
                    <span>{theme.tabLabel}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                  </div>

                  {/* Folder Content Stage */}
                  <div>
                    {/* Folder Header Row */}
                    <div className="flex items-center justify-between border-b border-current/15 pb-3 mb-6">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-80">
                        0{index + 1} // {theme.title}
                      </span>
                      <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 rounded bg-black/10 uppercase">
                        {isActive ? '● IN FRONT' : 'CLICK TO VIEW'}
                      </span>
                    </div>

                    {/* Active Folder Projects & Case Studies */}
                    {isActive ? (
                      <div className="animate-fadeIn">
                        <p className="font-sans text-xs sm:text-sm opacity-90 mb-4 max-w-md">
                          {folderData.tagline}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {folderData.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProject(item);
                              }}
                              className="group p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-current/15 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                  <h3 className="font-sans font-extrabold text-xs sm:text-sm">
                                    {item.title}
                                  </h3>
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                                <p className="font-mono text-[10px] opacity-80 mb-2 line-clamp-2 leading-tight">
                                  {item.summary}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 border-t border-current/10 font-mono text-[9px]">
                                <span className="font-bold opacity-90 truncate">
                                  ⚡ {item.metrics.split('•')[0]}
                                </span>
                                <span className="font-extrabold underline uppercase shrink-0">
                                  ► {item.actionType}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Inactive Folder Cover Preview Title */
                      <div className="py-6 select-none">
                        <h2 className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight leading-none mb-1 opacity-90">
                          {theme.title.split(' ')[0].toLowerCase()}
                        </h2>
                        <p className="font-serif-title italic text-xl sm:text-2xl opacity-75 font-normal">
                          for marketplaces & builders
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Folder Bottom Stamp */}
                  <div className="pt-3 border-t border-current/15 flex items-center justify-between font-mono text-[9px] opacity-75">
                    <span>CURATED BY ISHANT CHAUHAN</span>
                    <span>FILE NO: 0{index + 1}</span>
                  </div>

                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-4xl pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600 relative z-10">
        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-[11px] font-bold transition-all hover:bg-slate-800 active:scale-95"
        >
          {copied ? (
            <span className="text-emerald-400">COPIED EMAIL!</span>
          ) : (
            <span>MAIL: {PROFILE_INFO.email}</span>
          )}
        </button>

        <div className="flex items-center gap-6 font-bold text-slate-800 uppercase tracking-wider">
          <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-slate-900">TWITTER</a>
          <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-slate-900">LINKEDIN</a>
          <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-slate-900">GITHUB</a>
        </div>
      </footer>

    </div>
  );
}
