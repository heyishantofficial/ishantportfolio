import React, { useState, useEffect, useRef } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

const FOLDER_THEMES = [
  { 
    id: 'vibecoded-apps', 
    title: 'VIBECODED APPS', 
    tabLabel: '01 // vibecoded', 
    tabPosition: 'left-8', 
    bgColor: '#7A8B36', 
    textColor: '#FFFFFF'
  },
  { 
    id: 'content-systems', 
    title: 'CONTENT SYSTEMS', 
    tabLabel: '02 // systems', 
    tabPosition: 'left-48', 
    bgColor: '#F5F3EC', 
    textColor: '#1c1c1c'
  },
  { 
    id: 'brand-storytelling', 
    title: 'BRAND STORYTELLING', 
    tabLabel: '03 // storytelling', 
    tabPosition: 'right-28', 
    bgColor: '#1F1F1F', 
    textColor: '#FFFFFF'
  },
  { 
    id: 'the-stack', 
    title: 'THE VIBECODE STACK', 
    tabLabel: '04 // the stack', 
    tabPosition: 'left-16', 
    bgColor: '#F48AA7', 
    textColor: '#FFFFFF'
  },
  { 
    id: 'about-contact', 
    title: 'ABOUT & CONTACT', 
    tabLabel: '05 // contact', 
    tabPosition: 'right-48', 
    bgColor: '#2563EB', 
    textColor: '#FFFFFF'
  }
];

export default function ScrollCardDeck({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState('vibecoded-apps');
  const [copied, setCopied] = useState(false);
  const cardRefs = useRef({});

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const scrollToFolder = (id) => {
    setActiveFolderId(id);
    const element = cardRefs.current[id];
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7EFE0] text-[#1c1c1c] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Watercolor Paper Texture Overlay */}
      <div className="paper-texture" />

      {/* Fixed Sticky Navigation Header Bar */}
      <header className="sticky top-0 w-full max-w-4xl flex items-center justify-between py-4 bg-[#F7EFE0]/90 backdrop-blur-md z-50 border-b border-slate-900/10 mb-6">
        <span className="font-serif-title italic text-2xl font-bold text-slate-800 tracking-tight">
          ishant chauhan
        </span>

        {/* Quick Nav Tabs */}
        <div className="hidden md:flex items-center gap-1">
          {FOLDER_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => scrollToFolder(theme.id)}
              className={`px-3 py-1 rounded-full font-mono text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                activeFolderId === theme.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-black/5 text-slate-700 hover:bg-black/10'
              }`}
            >
              {theme.tabLabel.split('//')[1].trim()}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-sm"
        >
          {copied ? (
            <span className="text-emerald-400">COPIED!</span>
          ) : (
            <span>MAIL ME</span>
          )}
        </button>
      </header>

      {/* Main Title Section */}
      <div className="w-full max-w-3xl text-center my-6 select-none relative z-10">
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-2">
          the full offering
        </h1>
        <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333] flex items-center justify-center gap-2">
          <span>CURATED BY {PROFILE_INFO.handle.toUpperCase()}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span>SCROLL DOWN TO UNSTACK DECK</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </span>
        </p>
      </div>

      {/* ==========================================================================
          SCROLL-DRIVEN STACKED CARDS DECK (STICKY PHYSICAL FOLDER CARDS)
          ========================================================================== */}
      <div className="w-full max-w-3xl my-8 relative z-10 pb-48">
        
        <div className="relative w-full flex flex-col gap-24 sm:gap-32">
          {FOLDER_THEMES.map((theme, index) => {
            const folderData = FOLDERS_DATA.find(f => f.id === theme.id) || FOLDERS_DATA[0];

            return (
              <div
                key={theme.id}
                ref={(el) => (cardRefs.current[theme.id] = el)}
                style={{
                  top: `${90 + index * 24}px`,
                  zIndex: 10 + index
                }}
                className="sticky transition-transform duration-300 drop-shadow-2xl"
              >
                {/* Physical Curved Folder Container */}
                <div 
                  style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                  className="relative w-full rounded-[2.5rem] p-6 sm:p-10 border border-black/10 transition-all duration-300 min-h-[460px] sm:min-h-[500px] flex flex-col justify-between overflow-hidden shadow-2xl"
                >
                  <div className="paper-texture" />

                  {/* Top Curved Folder Tab (Matching Image 1:1) */}
                  <div 
                    style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                    className={`absolute -top-7 ${theme.tabPosition} px-7 py-2.5 rounded-t-2xl border-t border-x border-black/10 font-sans text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-2 z-20 shadow-md`}
                  >
                    <span>{theme.tabLabel}</span>
                  </div>

                  {/* Folder Content Stage */}
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-current/15 pb-4 mb-6">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-80">
                        {theme.tabLabel}
                      </span>
                      <span className="font-mono text-[10px] font-extrabold px-3 py-1 rounded-full bg-black/10 uppercase">
                        {folderData.subtitle}
                      </span>
                    </div>

                    <h2 className="font-serif-title italic text-4xl sm:text-6xl font-bold tracking-tight mb-2">
                      {folderData.title.toLowerCase()}
                    </h2>
                    <p className="font-sans text-xs sm:text-sm opacity-90 mb-6 max-w-md">
                      {folderData.tagline}
                    </p>

                    {/* Inner Projects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {folderData.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(item);
                          }}
                          className="group p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-current/15 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1.5 mb-1">
                              <h3 className="font-sans font-extrabold text-sm sm:text-base">
                                {item.title}
                              </h3>
                              <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <p className="font-mono text-[10px] sm:text-[11px] opacity-80 mb-3 line-clamp-2">
                              {item.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-current/10 font-mono text-[10px]">
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

                  {/* Folder Bottom Stamp */}
                  <div className="pt-4 border-t border-current/15 flex items-center justify-between font-mono text-[10px] opacity-75">
                    <span>CURATED BY ISHANT CHAUHAN</span>
                    <span>FILE 0{index + 1} OF 05</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600 relative z-10 border-t border-slate-900/10">
        <span>© 2026 ISHANT CHAUHAN</span>
        <div className="flex items-center gap-6 font-bold text-slate-800 uppercase tracking-wider">
          <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-slate-900">TWITTER</a>
          <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-slate-900">LINKEDIN</a>
          <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-slate-900">GITHUB</a>
        </div>
      </footer>

    </div>
  );
}
