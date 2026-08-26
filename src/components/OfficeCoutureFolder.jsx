import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';
import { ArrowUpRight, Check, Mail, Sparkles, X, ChevronRight, Folder } from 'lucide-react';
import confetti from 'canvas-confetti';
import customIshantFolderImg from '../assets/ishant-folder-custom.png';

export default function OfficeCoutureFolder({ onSelectProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const vibecodedFolder = FOLDERS_DATA[0]; // VIBECODED APPS

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#1c1c1c] flex flex-col items-center justify-between p-6 sm:p-12 relative selection:bg-slate-900 selection:text-white font-sans">
      
      {/* Top Header Navigation — Translucent Floating Glass Chrome */}
      <header className="w-full max-w-5xl flex items-center justify-between py-3 px-6 rounded-full apple-glass-pill relative z-10 my-2">
        <div className="flex items-center gap-3">
          <span className="font-serif-title italic text-2xl font-bold text-slate-900 tracking-tight">
            ishant chauhan
          </span>
          <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200/80 font-bold uppercase tracking-wider text-slate-700">
            CREATOR & BUILDER
          </span>
        </div>

        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold transition-all hover:bg-slate-800 apple-pressable shadow-sm cursor-pointer"
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

      {/* Main Stage Title */}
      <div className="w-full max-w-4xl text-center my-6 select-none relative z-10">
        <h1 className="font-sans font-bold text-4xl sm:text-6xl text-[#182a4d] apple-display-heading mb-1">
          “The Vibecode Office”
        </h1>
        <p className="font-mono text-xs sm:text-sm font-medium text-[#476599] uppercase tracking-widest">
          FW 26 / BUILDER RE-ISSUES
        </p>
      </div>

      {/* ==========================================================================
          EXACT 1:1 REPLICATION OF "THE OFFICE COUTURE" WITH ISHANT'S FOLDER GRAPHIC
          ========================================================================== */}
      <div className="w-full max-w-2xl my-auto relative z-10 flex flex-col items-center py-6">
        
        {/* Single Folder Stage Component */}
        <div className="relative flex flex-col items-center group">
          
          {/* THE 3D SKY BLUE FOLDER CONTAINING ISHANT HIMSELF */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-[340px] sm:w-[460px] cursor-pointer apple-pressable"
          >
            {/* REAL USER IMAGE ASSET: ISHANT THINKING INSIDE SKY BLUE FOLDER */}
            <img
              src={customIshantFolderImg}
              alt="Ishant Chauhan inside Sky Blue Folder"
              className="w-full h-auto object-contain block relative z-20 drop-shadow-2xl pointer-events-none transition-transform duration-500 group-hover:-translate-y-2"
            />
          </div>

          {/* Label Below Folder */}
          <div 
            className="mt-6 flex items-center gap-2 select-none cursor-pointer apple-pressable p-2 rounded-xl" 
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-sans font-bold text-xl sm:text-2xl text-slate-800">
              Vibecoded Apps Suite
            </span>
            <span className="font-mono text-xs sm:text-sm text-slate-500 font-semibold">
              ({vibecodedFolder.items.length} Apps)
            </span>
          </div>

        </div>

        {/* UNFOLDED FOLDER CONTENT DRAWER (SPRING ANIMATED WITH FRAMER-MOTION) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl mt-10 p-6 sm:p-8 rounded-3xl apple-glass-panel text-slate-900 relative z-30"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    // FOLDER OPENED
                  </span>
                  <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 apple-display-heading">
                    Vibecoded Apps Suite
                  </h2>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 apple-pressable cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="font-sans text-sm text-slate-600 mb-6 leading-relaxed">
                {vibecodedFolder.tagline}
              </p>

              {/* Apps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vibecodedFolder.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProject(item)}
                    className="group p-5 rounded-2xl bg-white/80 hover:bg-white border border-sky-200/80 apple-pressable cursor-pointer shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-sans font-extrabold text-base text-slate-900">
                          {item.title}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="font-mono text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-mono text-xs">
                      <span className="font-bold text-slate-800">
                        ⚡ {item.metrics.split('•')[0]}
                      </span>
                      <span className="font-extrabold text-sky-700 group-hover:text-sky-900 underline uppercase">
                        ► {item.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-500">
        <span>© 2026 ISHANT CHAUHAN</span>
        <div className="flex items-center gap-6 font-bold text-slate-700 uppercase tracking-wider">
          <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-slate-900 apple-pressable">TWITTER</a>
          <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-slate-900 apple-pressable">LINKEDIN</a>
          <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-slate-900 apple-pressable">GITHUB</a>
        </div>
      </footer>

    </div>
  );
}
