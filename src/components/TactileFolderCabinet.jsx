import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TactileFolderCabinet({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState(null); // null = overview stack, or folder id
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const selectedFolder = FOLDERS_DATA.find(f => f.id === activeFolderId);

  return (
    <div className="min-h-screen bg-[#DDECF8] text-[#1a1a1a] flex flex-col items-center justify-between p-4 sm:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Background Watercolor Paper Texture */}
      <div className="paper-texture" />

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 relative z-10">
        <span className="font-serif-title italic text-2xl font-bold text-slate-900">
          ishant chauhan
        </span>

        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-sm"
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

      {/* Main Container Stage */}
      <div className="w-full max-w-3xl flex flex-col items-center my-auto relative z-10">
        
        {/* Editorial Serif Header (Matching Reference Image 1:1) */}
        <div className="text-center mb-8 select-none">
          <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-2">
            the full offering
          </h1>
          <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333]">
            CURATED BY {PROFILE_INFO.handle.toUpperCase()}
          </p>
        </div>

        {/* ==========================================================================
            EXACT 1:1 STACKED OVERLAPPING FOLDERS (MATCHING USER'S ATTACHED PHOTO)
            ========================================================================== */}
        <div className="w-full max-w-xl bg-[#E2EEF8] rounded-3xl p-2 sm:p-4 shadow-2xl border border-slate-900/10 relative overflow-hidden">
          
          {activeFolderId === null ? (
            /* OVERLAPPING FOLDER STACK VIEW (EXACT STAGGERED TABS MATCHING ATTACHED PHOTO) */
            <div className="relative w-full aspect-[4/4.5] sm:aspect-[4/4.2] flex flex-col justify-end overflow-hidden rounded-2xl border border-black/10 shadow-inner bg-[#E2EEF8]">
              
              {/* -------------------------------------------------------------
                  LAYER 1 (TOP/BACK): YELLOW FELT FOLDER ("CONTENT SYSTEMS")
                  ------------------------------------------------------------- */}
              <div 
                onClick={() => setActiveFolderId('content-systems')}
                className="group absolute inset-x-0 top-0 h-[88%] bg-[#D4CA55] rounded-t-3xl p-6 cursor-pointer shadow-md transition-transform hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="paper-texture" />
                {/* Raised Curved Tab Top Left */}
                <div className="absolute -top-7 left-6 px-6 py-2 bg-[#D4CA55] rounded-t-2xl border-t border-x border-black/10 font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 group-hover:bg-[#e0d65e] transition-colors z-20">
                  <span>CONTENT SYSTEMS</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="font-mono text-xs font-bold text-slate-900/80 uppercase relative z-10 pt-2">
                  01 // MEDIA ENGINES & DISTRIBUTION
                </div>
              </div>

              {/* -------------------------------------------------------------
                  LAYER 2 (MIDDLE-BACK): MAUVE PINK FOLDER ("VIBECODED APPS")
                  ------------------------------------------------------------- */}
              <div 
                onClick={() => setActiveFolderId('vibecoded-apps')}
                className="group absolute inset-x-0 top-[20%] h-[78%] bg-[#DCA3B7] rounded-t-3xl p-6 cursor-pointer shadow-lg transition-transform hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="paper-texture" />
                {/* Raised Curved Tab Top Right */}
                <div className="absolute -top-7 right-8 px-6 py-2 bg-[#DCA3B7] rounded-t-2xl border-t border-x border-black/10 font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 group-hover:bg-[#e7b0c3] transition-colors z-20">
                  <span>VIBECODED APPS</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </div>

              {/* -------------------------------------------------------------
                  LAYER 3 (MIDDLE): PASTEL PINK FOLDER ("BRAND STORYTELLING")
                  ------------------------------------------------------------- */}
              <div 
                onClick={() => setActiveFolderId('brand-storytelling')}
                className="group absolute inset-x-0 top-[38%] h-[60%] bg-[#F2C8D6] rounded-t-3xl p-6 cursor-pointer shadow-xl transition-transform hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="paper-texture" />
                {/* Raised Curved Tab Middle Left */}
                <div className="absolute -top-7 left-10 px-6 py-2 bg-[#F2C8D6] rounded-t-2xl border-t border-x border-black/10 font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 group-hover:bg-[#f8d4e0] transition-colors z-20">
                  <span>BRAND STORYTELLING</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </div>

              {/* -------------------------------------------------------------
                  LAYER 4 (FOREGROUND): DEEP CRIMSON RED FOLDER ("THE STACK")
                  ------------------------------------------------------------- */}
              <div 
                onClick={() => setActiveFolderId('the-stack')}
                className="group absolute inset-x-0 top-[54%] h-[46%] bg-[#B82424] text-white rounded-t-3xl p-6 cursor-pointer shadow-2xl transition-transform hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="paper-texture" />
                {/* Raised Curved Tab Middle Right */}
                <div className="absolute -top-7 right-12 px-7 py-2 bg-[#B82424] text-white rounded-t-2xl border-t border-x border-black/20 font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 group-hover:bg-[#cb2929] transition-colors z-20">
                  <span>THE STACK</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                </div>
                <div className="font-mono text-xs font-bold text-white/80 uppercase relative z-10">
                  AI MODELS & INFRASTRUCTURE
                </div>
              </div>

              {/* -------------------------------------------------------------
                  LAYER 5 (BASE BOTTOM): YELLOW FELT FOLDER ("ABOUT & CONTACT")
                  ------------------------------------------------------------- */}
              <div className="relative h-[22%] bg-[#D4CA55] rounded-b-2xl p-4 flex items-center justify-center z-30 shadow-inner overflow-hidden">
                <div className="paper-texture" />
                
                {/* Center Inverted Notch Tab (Matching Photo) */}
                <div 
                  onClick={() => setActiveFolderId('about-contact')}
                  className="group px-8 py-2.5 rounded-xl bg-slate-900 font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white cursor-pointer hover:bg-white hover:text-slate-900 transition-colors flex items-center gap-2 relative z-10 shadow-lg"
                >
                  <span>ABOUT & CONTACT</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ) : (
            /* EXPANDED FOLDER VIEW (WHEN USER CLICKS ANY FOLDER TAB) */
            <div 
              style={{ backgroundColor: selectedFolder.bgColor, color: selectedFolder.textColor }}
              className="relative w-full rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 animate-fadeIn min-h-[480px] flex flex-col justify-between overflow-hidden"
            >
              <div className="paper-texture" />

              <div className="relative z-10">
                {/* Close / Back to Deck Button */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-current/15">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 opacity-70" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-80">
                      // FOLDER FILE UNFOLDED
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveFolderId(null)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/10 hover:bg-black/20 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    <span>CLOSE FOLDER</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="font-serif-title italic text-4xl sm:text-5xl mb-2">
                  {selectedFolder.title.toLowerCase()}
                </h2>
                <p className="font-sans text-sm opacity-90 mb-8 max-w-lg">
                  {selectedFolder.tagline}
                </p>

                {/* Items List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedFolder.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectProject(item)}
                      className="p-5 rounded-xl bg-white/10 hover:bg-white/20 border border-current/15 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-sans font-extrabold text-base sm:text-lg">
                            {item.title}
                          </h3>
                          <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70" />
                        </div>
                        <p className="font-mono text-[11px] opacity-80 mb-3 line-clamp-2">
                          {item.summary}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-extrabold underline uppercase">
                        ► {item.actionType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600 relative z-10">
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
