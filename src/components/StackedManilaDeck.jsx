import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import manilaFolderImg from '../assets/manila-folder.png';

export default function StackedManilaDeck({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState('vibecoded-apps');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const activeIndex = FOLDERS_DATA.findIndex(f => f.id === activeFolderId);

  return (
    <div className="min-h-screen bg-[#DDECF8] text-[#1a1a1a] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Watercolor Paper Texture */}
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

      {/* Editorial Title */}
      <div className="w-full max-w-3xl text-center my-2 select-none relative z-10">
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-1">
          the full offering
        </h1>
        <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333]">
          CURATED BY {PROFILE_INFO.handle.toUpperCase()}
        </p>
      </div>

      {/* ==========================================================================
          PHYSICAL 3D MANILA FOLDERS STACKED FROM ABOVE (TOP PEEKING DECK)
          ========================================================================== */}
      <div className="w-full max-w-4xl my-auto relative z-10 flex flex-col items-center py-4">
        
        {/* Top Tab Bar (Tabs Peeking Above the Folder Deck) */}
        <div className="w-full max-w-3xl flex flex-wrap items-end justify-start gap-1 sm:gap-2 mb-[-12px] relative z-30 pl-4 sm:pl-12">
          {FOLDERS_DATA.map((folder, index) => {
            const isActive = folder.id === activeFolderId;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-2xl font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-300 shadow-md border-t border-x border-amber-900/20 cursor-pointer ${
                  isActive
                    ? 'bg-[#d97706] text-white -mb-1 z-40 scale-105 shadow-xl'
                    : 'bg-[#0f172a] text-slate-200 hover:bg-[#1e293b] opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>0{index + 1} // {folder.title.split(' ')[0]}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stack Container: Folders stacked cleanly from top */}
        <div className="relative w-full max-w-3xl min-h-[580px] sm:min-h-[620px] drop-shadow-2xl">
          
          {FOLDERS_DATA.map((folder, index) => {
            const isActive = folder.id === activeFolderId;
            const zIndex = isActive ? 40 : 10 + (FOLDERS_DATA.length - index);

            // Folders behind peek out cleanly from the TOP
            const topOffset = isActive ? 0 : (index - activeIndex) * 12;

            return (
              <div
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                style={{
                  zIndex: zIndex,
                  top: `${topOffset}px`,
                  transform: isActive 
                    ? 'scale(1)' 
                    : `translateY(${(index - activeIndex) * 8}px) scale(0.98)`
                }}
                className={`absolute w-full transition-all duration-500 ease-out cursor-pointer ${
                  isActive ? 'shadow-2xl relative z-40' : 'opacity-95 hover:opacity-100'
                }`}
              >
                {/* Real 3D Manila Folder Image Asset */}
                <div className="relative w-full">
                  <img
                    src={manilaFolderImg}
                    alt={`Manila Folder - ${folder.title}`}
                    className="w-full h-auto object-contain block pointer-events-none"
                  />

                  {/* Overlaid Paperclip Cream Tag (Top Left) */}
                  <div className="absolute top-[3.2%] left-[16.5%] w-[32%] sm:w-[36%] h-[7%] flex flex-col justify-center px-2 pointer-events-none">
                    <span className="font-serif-title italic font-bold text-xs sm:text-lg text-amber-950 truncate leading-none">
                      {folder.title.toLowerCase()}
                    </span>
                    <span className="font-mono text-[8px] sm:text-[10px] font-bold text-amber-900/70 truncate uppercase">
                      {folder.subtitle}
                    </span>
                  </div>

                  {/* Inner Folder Body (Active Front View) */}
                  {isActive && (
                    <div className="absolute top-[14%] left-[13%] right-[16%] bottom-[6%] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between custom-scrollbar animate-fadeIn">
                      
                      <div>
                        {/* Folder Header */}
                        <div className="border-b border-amber-900/20 pb-3 mb-4 flex items-center justify-between">
                          <div>
                            <h2 className="font-serif-title italic text-2xl sm:text-4xl text-amber-950 font-bold tracking-tight">
                              {folder.title.toLowerCase()}
                            </h2>
                            <p className="font-sans text-xs text-amber-900/90 font-medium">
                              {folder.tagline}
                            </p>
                          </div>

                          <span className="font-mono text-[10px] font-extrabold text-amber-950 px-2.5 py-1 rounded bg-amber-900/10 uppercase">
                            0{index + 1} // {folder.id.toUpperCase()}
                          </span>
                        </div>

                        {/* Projects Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {folder.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProject(item);
                              }}
                              className="group p-3.5 rounded-xl bg-amber-100/75 hover:bg-amber-100 border border-amber-900/15 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                  <h3 className="font-sans font-extrabold text-xs sm:text-sm text-amber-950 tracking-tight">
                                    {item.title}
                                  </h3>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-900 opacity-60 group-hover:opacity-100 shrink-0" />
                                </div>
                                <p className="font-mono text-[10px] text-amber-900/80 mb-2 line-clamp-2 leading-tight">
                                  {item.summary}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 border-t border-amber-900/10 font-mono text-[9px]">
                                <span className="font-bold text-amber-950 truncate">
                                  ⚡ {item.metrics.split('•')[0]}
                                </span>
                                <span className="font-extrabold text-amber-900 underline uppercase shrink-0">
                                  ► {item.actionType}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Stamp */}
                      <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between font-mono text-[9px] text-amber-900/70">
                        <span>MANILA FILE NO: 0{index + 1}</span>
                        <span>CURATED BY ISHANT CHAUHAN</span>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            );
          })}

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
