import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FOLDERS_DATA } from '../data/foldersData';
import { ArrowUpRight, X } from 'lucide-react';
import customIshantFolderImg from '../assets/ishant-folder-custom.png';

export default function OfficeCoutureFolder({ onSelectProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const vibecodedFolder = FOLDERS_DATA[0];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center relative select-none font-sans py-2">
      
      {/* 3D Sky Blue Folder Stage Component */}
      <div className="relative flex flex-col items-center group">
        
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-[260px] sm:w-[340px] cursor-pointer apple-pressable"
        >
          <img
            src={customIshantFolderImg}
            alt="Ishant Chauhan inside Sky Blue Folder"
            className="w-full h-auto object-contain block relative z-20 drop-shadow-2xl pointer-events-none transition-transform duration-500 group-hover:-translate-y-1.5"
          />
        </div>

        {/* Folder Label */}
        <div 
          className="mt-2 flex items-center gap-2 select-none cursor-pointer apple-pressable px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-sm" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Vibecoded Apps Suite
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
            ({vibecodedFolder.items.length})
          </span>
        </div>

      </div>

      {/* Unfolded Folder Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl mt-4 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl relative z-30 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                  // VIBECODED SUITE
                </span>
                <h2 className="font-sans font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                  Vibecoded Apps Suite
                </h2>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {vibecodedFolder.tagline}
            </p>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vibecodedFolder.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProject(item)}
                  className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                      ⚡ {item.metrics.split('•')[0]}
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase shrink-0">
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
  );
}
