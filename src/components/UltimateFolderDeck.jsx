import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, ExternalLink, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';
import manilaFolderImg from '../assets/manila-folder.png';

const CATEGORIES = [
  { id: 'vibecoded-apps', number: '01', title: 'VIBECODED APPS', accentColor: '#0284c7', badge: '6 APPS BUILT' },
  { id: 'content-systems', number: '02', title: 'CONTENT SYSTEMS', accentColor: '#d97706', badge: 'MEDIA PIPELINE' },
  { id: 'brand-storytelling', number: '03', title: 'BRAND STORYTELLING', accentColor: '#e11d48', badge: 'HOOK ENGINE' },
  { id: 'the-stack', number: '04', title: 'THE STACK', accentColor: '#7c3aed', badge: 'AI & DEV TOOLS' },
  { id: 'about-contact', number: '05', title: 'ABOUT & CONTACT', accentColor: '#059669', badge: 'GET IN TOUCH' }
];

export default function UltimateFolderDeck({ onSelectProject }) {
  const [activeTabId, setActiveTabId] = useState('vibecoded-apps');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const activeCategory = CATEGORIES.find(c => c.id === activeTabId) || CATEGORIES[0];
  const activeFolderData = FOLDERS_DATA.find(f => f.id === activeTabId) || FOLDERS_DATA[0];

  return (
    <div className="min-h-screen bg-[#DDECF8] text-[#1a1a1a] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Watercolor Paper Texture */}
      <div className="paper-texture" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-serif-title italic text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ishant chauhan
          </span>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 font-bold uppercase tracking-wider text-slate-700">
            BUILDER & STRATEGIST
          </span>
        </div>

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

      {/* Hero Editorial Header */}
      <div className="w-full max-w-4xl text-center my-4 select-none relative z-10">
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-2">
          the full offering
        </h1>
        <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333]">
          CURATED BY {PROFILE_INFO.handle.toUpperCase()}
        </p>
      </div>

      {/* ==========================================================================
          ULTRA-CLEAN 3D PHYSICAL MANILA FOLDER BINDER DECK STAGE
          ========================================================================== */}
      <div className="w-full max-w-4xl my-auto relative z-10 flex flex-col items-center py-4">
        
        {/* OVERLAPPING TOP FOLDER TABS BAR */}
        <div className="w-full max-w-3xl flex flex-wrap items-end justify-start gap-1 sm:gap-2 mb-[-6px] relative z-30 pl-2 sm:pl-6">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeTabId;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTabId(cat.id)}
                className={`group relative px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-t-2xl font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[#d97706] text-white -mb-1 z-40 scale-105 shadow-xl border-t border-x border-white/30'
                    : 'bg-[#0f172a]/90 text-slate-200 hover:bg-[#0f172a] hover:-translate-y-1 z-20 shadow-md'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-70">{cat.number}</span>
                  <span>{cat.title}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN MANILA FILE FOLDER CONTAINER GRAPHIC */}
        <div className="relative w-full max-w-3xl shadow-2xl rounded-2xl overflow-hidden transition-all duration-500">
          
          {/* Real 3D Manila Folder Background Graphic */}
          <img
            src={manilaFolderImg}
            alt="Manila File Folder"
            className="w-full h-auto object-contain block pointer-events-none"
          />

          {/* Paperclip Cream Tag (Top Left) */}
          <div className="absolute top-[3.2%] left-[16.5%] w-[34%] sm:w-[38%] h-[7%] flex items-center justify-between px-2 pointer-events-none">
            <span className="font-mono text-[9px] sm:text-xs font-bold text-amber-950 truncate uppercase tracking-wider">
              {activeCategory.number} // {activeCategory.title}
            </span>
            <span className="hidden sm:inline-block font-mono text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-900/10 text-amber-900">
              {activeCategory.badge}
            </span>
          </div>

          {/* Right Side Category Color Pill Indicator */}
          <div className="absolute top-[18%] right-[1%] w-[12%] sm:w-[13%] h-[14%] flex items-center justify-center pointer-events-none z-20">
            <div 
              style={{ backgroundColor: activeCategory.accentColor }}
              className="w-full py-2 px-1 rounded-r-xl font-mono text-[9px] sm:text-[11px] font-extrabold uppercase tracking-tight text-center text-white shadow-md border-y border-r border-white/30 truncate"
            >
              {activeCategory.title.split(' ')[0]}
            </div>
          </div>

          {/* INNER FOLDER CONTENT STAGE */}
          <div className="absolute top-[14%] left-[13%] right-[16%] bottom-[6%] overflow-y-auto p-4 sm:p-7 flex flex-col justify-between custom-scrollbar animate-fadeIn">
            
            <div>
              {/* Active Folder Header */}
              <div className="border-b border-amber-900/20 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif-title italic text-3xl sm:text-5xl text-amber-950 font-bold tracking-tight">
                    {activeFolderData.title.toLowerCase()}
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-amber-900/90 font-medium mt-0.5">
                    {activeFolderData.tagline}
                  </p>
                </div>

                <span 
                  style={{ color: activeCategory.accentColor }}
                  className="font-mono text-xs font-extrabold uppercase tracking-widest hidden sm:block"
                >
                  ● {activeCategory.badge}
                </span>
              </div>

              {/* Curated Projects & Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeFolderData.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProject(item)}
                    className="group p-4 rounded-xl bg-amber-100/75 hover:bg-amber-100/95 border border-amber-900/15 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h3 className="font-sans font-extrabold text-sm sm:text-base text-amber-950 tracking-tight">
                          {item.title}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-amber-900 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                      </div>
                      <p className="font-mono text-[10px] sm:text-[11px] text-amber-900/80 mb-3 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-900/10 font-mono text-[10px]">
                      <span className="font-bold text-amber-950 truncate">
                        ⚡ {item.metrics.split('•')[0]}
                      </span>
                      <span className="font-extrabold text-amber-900 group-hover:text-amber-950 underline uppercase shrink-0">
                        ► {item.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder Footer Bar */}
            <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between font-mono text-[10px] text-amber-900/70">
              <span>MANILA FILE NO: {activeCategory.number} // {activeFolderData.id.toUpperCase()}</span>
              <span>CURATED BY ISHANT CHAUHAN</span>
            </div>

          </div>

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
