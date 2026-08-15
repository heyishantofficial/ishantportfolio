import React, { useState } from 'react';
import { FOLDERS_DATA } from '../data/foldersData';
import { ArrowUpRight, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FolderDeck({ onSelectProject }) {
  const [activeFolderId, setActiveFolderId] = useState('vibecoded-apps');

  // Re-order folders so active folder is on top
  const activeFolder = FOLDERS_DATA.find(f => f.id === activeFolderId) || FOLDERS_DATA[0];

  return (
    <section className="py-8 pb-32 px-4 sm:px-8 max-w-6xl mx-auto">
      
      {/* ==========================================================================
          OVERLAPPING FOLDER TABS BAR (Matching Attached Reference Image)
          ========================================================================== */}
      <div className="flex flex-wrap items-end gap-1.5 sm:gap-2 mb-0 relative z-20 pl-2 sm:pl-6">
        {FOLDERS_DATA.map((folder) => {
          const isActive = folder.id === activeFolderId;

          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              style={{
                backgroundColor: folder.bgColor,
                color: folder.tabTextColor
              }}
              className={`relative px-5 sm:px-7 py-3 sm:py-3.5 rounded-t-2xl font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-300 shadow-md border-t border-x border-black/10 cursor-pointer ${
                isActive
                  ? '-mb-1 z-30 scale-105 shadow-xl border-b-0'
                  : 'opacity-85 hover:opacity-100 hover:-translate-y-1 z-10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{folder.title}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* ==========================================================================
          MAIN ACTIVE FOLDER CARD BODY
          ========================================================================== */}
      <div
        style={{
          backgroundColor: activeFolder.bgColor,
          color: activeFolder.textColor
        }}
        className="relative z-20 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl border border-black/10 transition-all duration-500 min-h-[500px]"
      >
        {/* Folder Header */}
        <div className="border-b border-current/15 pb-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">
                // {activeFolder.subtitle}
              </span>
              <h2 className="font-serif-title italic text-4xl sm:text-6xl tracking-tight leading-tight">
                {activeFolder.title.toLowerCase()}
              </h2>
            </div>
            <p className="font-sans text-sm sm:text-base opacity-80 max-w-md">
              {activeFolder.tagline}
            </p>
          </div>
        </div>

        {/* Folder Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {activeFolder.items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProject(item)}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white/10 hover:bg-white/20 border border-current/15 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Title & Action */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-sans font-extrabold text-xl sm:text-2xl tracking-tight">
                    {item.title}
                  </h3>
                  <span className="p-2 rounded-full bg-white/20 group-hover:bg-white text-current group-hover:text-black transition-colors shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>

                <p className="font-mono text-xs font-bold opacity-80 mb-4">
                  {item.tagline}
                </p>

                <p className="font-sans text-sm opacity-90 leading-relaxed mb-6">
                  {item.summary}
                </p>
              </div>

              <div>
                {/* Metrics */}
                <div className="font-mono text-xs font-bold opacity-80 mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{item.metrics}</span>
                </div>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-black/10 font-mono text-[11px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
