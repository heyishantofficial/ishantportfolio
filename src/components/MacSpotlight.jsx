import React, { useState, useEffect } from 'react';
import { Search, Folder, Music, Terminal, FileText, Globe, Sparkles, ChevronRight, X } from 'lucide-react';
import { PROJECTS_DATA, PROFILE_INFO } from '../data/projectsData';
import { playSpotlightSound, playMacClick } from '../utils/macAudioEngine';

export default function MacSpotlight({ onClose, onLaunchApp, onSelectProject, isMuted }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    playSpotlightSound(isMuted);
  }, [isMuted]);

  const items = [
    { id: 'app-finder', title: 'Finder Workspace', type: 'app', action: () => onLaunchApp('finder'), icon: Folder },
    { id: 'app-terminal', title: 'Terminal Shell (zsh)', type: 'app', action: () => onLaunchApp('terminal'), icon: Terminal },
    { id: 'app-safari', title: 'Safari Web Browser', type: 'app', action: () => onLaunchApp('safari'), icon: Globe },
    { id: 'app-notes', title: 'Notes Scratchpad (Resume Workspace)', type: 'app', action: () => onLaunchApp('notes'), icon: FileText },
    { id: 'app-resume', title: 'Ishant Chauhan Resume & Bio.pdf', subtitle: 'Official Portfolio Resume Document', type: 'doc', action: () => onLaunchApp('notes'), icon: FileText },
    { id: "app-ipod", title: "iPod Classic Music Player", type: "app", action: () => onLaunchApp("ipod"), icon: Music },
    { id: 'app-system', title: 'About This Mac', type: 'app', action: () => onLaunchApp('system-info'), icon: Sparkles },
    ...PROJECTS_DATA.map(p => ({
      id: `proj-${p.id}`,
      title: p.title,
      subtitle: p.tagline,
      type: 'project',
      action: () => onSelectProject(p),
      icon: Sparkles
    }))
  ];

  const filtered = items.filter(i => 
    i.title.toLowerCase().includes(query.toLowerCase()) || 
    (i.subtitle && i.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        playMacClick(isMuted);
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] bg-black/40 backdrop-blur-md flex items-start justify-center pt-28 px-4" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white/80 dark:bg-slate-900/85 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/60 overflow-hidden text-slate-800 dark:text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-3.5 flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Spotlight Search (Type app name, project, or command...)" 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm font-medium focus:ring-0 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching items found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => { playMacClick(isMuted); item.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs truncate">{item.title}</div>
                      {item.subtitle && <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{item.subtitle}</div>}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                    {item.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
