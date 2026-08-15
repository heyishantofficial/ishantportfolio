import React, { useState } from 'react';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, Globe, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';
import manilaFolderImg from '../assets/manila-folder.png';

export default function MultiManilaFolders({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState('vibecoded-apps');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFolderClick = (id) => {
    if (activeFolderId === id && isExpanded) {
      setIsExpanded(false);
    } else {
      setActiveFolderId(id);
      setIsExpanded(true);
    }
  };

  const activeFolder = FOLDERS_DATA.find(f => f.id === activeFolderId) || FOLDERS_DATA[0];

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

      {/* Main Stage Header */}
      <div className="w-full max-w-3xl text-center my-4 select-none relative z-10">
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-[#111111] tracking-tight leading-none mb-2">
          the full offering
        </h1>
        <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#333333]">
          CURATED BY {PROFILE_INFO.handle.toUpperCase()} • CLICK A FOLDER TO OPEN
        </p>
      </div>

      {/* ==========================================================================
          STACK OF MULTIPLE PHYSICAL 3D MANILA FOLDERS (ONE FOR EACH CATEGORY)
          ========================================================================== */}
      <div className="w-full max-w-4xl my-auto relative z-10 flex flex-col items-center py-6">
        
        <div className="relative w-full max-w-3xl min-h-[600px] flex flex-col items-center justify-center">
          
          {FOLDERS_DATA.map((folder, index) => {
            const isActive = folder.id === activeFolderId;
            const isUnfolded = isActive && isExpanded;

            // Offset each folder vertically in the 3D stack
            const stackOffset = index * 40; // 0px, 40px, 80px, 120px, 160px
            const zIndex = isUnfolded ? 50 : isActive ? 40 : 10 + index;

            return (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                style={{
                  top: isUnfolded ? '0px' : `${stackOffset}px`,
                  zIndex: zIndex,
                  transform: isUnfolded 
                    ? 'translateY(-20px) scale(1.02)' 
                    : isActive 
                      ? 'translateY(-10px) scale(1.01)' 
                      : 'translateY(0px) scale(1)'
                }}
                className={`absolute w-full transition-all duration-500 ease-out cursor-pointer drop-shadow-2xl ${
                  isUnfolded ? 'relative mb-12' : 'hover:-translate-y-4'
                }`}
              >
                {/* Real 3D Manila Folder Image Asset Frame */}
                <div className="relative w-full">
                  <img
                    src={manilaFolderImg}
                    alt={`Manila Folder - ${folder.title}`}
                    className="w-full h-auto object-contain block pointer-events-none"
                  />

                  {/* Overlaid Paperclip Cream Tag (Top Left) */}
                  <div className="absolute top-[3.2%] left-[16.5%] w-[26%] sm:w-[28%] h-[6%] flex items-center px-2 pointer-events-none">
                    <span className="font-mono text-[9px] sm:text-xs font-bold text-slate-900 tracking-wider truncate uppercase">
                      0{index + 1} // {folder.title}
                    </span>
                  </div>

                  {/* Overlaid Green Folder Tab Badge (Right Side) */}
                  <div className="absolute top-[18%] right-[1%] w-[12%] sm:w-[14%] h-[20%] flex items-center justify-center px-1 pointer-events-none">
                    <div className="bg-[#0e7490] text-white px-2 py-1 rounded-md font-mono text-[9px] sm:text-[11px] font-extrabold uppercase tracking-tight text-center shadow-sm w-full truncate">
                      {folder.title.split(' ')[0]}
                    </div>
                  </div>

                  {/* Inner Folder Body Content Overlay */}
                  <div className="absolute top-[14%] left-[13%] right-[16%] bottom-[6%] overflow-y-auto p-4 sm:p-8 flex flex-col justify-between custom-scrollbar">
                    
                    <div>
                      {/* Folder Title & Subtitle */}
                      <div className="border-b border-amber-900/20 pb-3 mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="font-serif-title italic text-2xl sm:text-4xl text-amber-950 font-bold tracking-tight">
                            {folder.title.toLowerCase()}
                          </h2>
                          <p className="font-sans text-xs text-amber-900/90 font-medium">
                            {folder.subtitle}
                          </p>
                        </div>

                        {/* Expand / Close Indicator */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-950 px-2 py-1 rounded bg-amber-900/10 uppercase">
                            {isUnfolded ? 'OPEN' : 'CLICK TO OPEN'}
                          </span>
                          {isUnfolded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(false);
                              }}
                              className="p-1 rounded-full bg-amber-900/20 hover:bg-amber-900/30 text-amber-950 transition-colors"
                              title="Collapse folder"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items Preview / Full Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {folder.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProject(item);
                            }}
                            className="group p-3.5 rounded-xl bg-amber-100/70 hover:bg-amber-100/95 border border-amber-900/15 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
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

                    {/* Bottom Folder Stamp */}
                    <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between font-mono text-[9px] text-amber-900/70">
                      <span>FILE NO: 0{index + 1} / {folder.id.toUpperCase()}</span>
                      <span>CURATED BY ISHANT CHAUHAN</span>
                    </div>

                  </div>

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
