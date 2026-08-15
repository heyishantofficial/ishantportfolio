import React from 'react';
import { X, Sparkles, FolderGit2, Mail, ExternalLink, ArrowRight } from 'lucide-react';
import { PROJECTS_DATA, PROFILE_INFO } from '../data/projectsData';

export default function SlideDrawer({ isOpen, onClose, onSelectProject }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#0d0f14] border-l border-white/10 shadow-2xl p-8 overflow-y-auto flex flex-col justify-between">
          
          <div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff007a] flex items-center justify-center text-black font-mono font-bold text-xs">
                  🪢
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white">THE WORK VAULT</h2>
                  <p className="font-mono text-xs text-[#a0a5b5]">Slide-Out Archive (Adrien Lamy Style)</p>
                </div>
              </div>

              {/* Close Button Sign */}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e222d] border border-white/10 text-white font-mono text-xs font-bold hover:bg-[#ff007a] hover:text-black transition-colors"
              >
                <span>CLOSE</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Bio Statement */}
            <div className="p-6 rounded-2xl bg-[#141720] border border-white/5 mb-8">
              <h3 className="font-display font-bold text-lg text-white mb-2">
                ISHANT CHAUHAN
              </h3>
              <p className="font-body text-xs text-[#a0a5b5] leading-relaxed mb-4">
                {PROFILE_INFO.tagline}
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-[#00f0ff]">
                <span>{PROFILE_INFO.status}</span>
              </div>
            </div>

            {/* Quick Project Feed */}
            <div className="mb-8">
              <h4 className="font-mono text-xs font-bold text-[#a0a5b5] uppercase tracking-wider mb-4">
                // VAULT INDEX ({PROJECTS_DATA.length} ITEMS)
              </h4>

              <div className="space-y-3">
                {PROJECTS_DATA.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onSelectProject(item);
                    }}
                    className="group p-4 rounded-xl bg-[#12141a] border border-white/5 hover:border-[#00f0ff]/40 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#62687a]">0{i + 1}</span>
                      <div>
                        <h5 className="font-display font-bold text-sm text-white group-hover:text-[#00f0ff] transition-colors">
                          {item.title}
                        </h5>
                        <span className="font-mono text-[10px] text-[#a0a5b5]">
                          {item.category.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs text-[#e5f935] flex items-center gap-1">
                      <span>► VIEW</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer Contact */}
          <div className="pt-6 border-t border-white/10">
            <a
              href={`mailto:${PROFILE_INFO.email}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff007a] to-[#00f0ff] text-black font-mono text-sm font-bold shadow-lg shadow-[#ff007a]/20 hover:scale-[1.02] transition-transform"
            >
              <Mail className="w-4 h-4" />
              <span>LET'S BUILD TOGETHER</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
