import React, { useState } from 'react';
import { 
  Folder, FileText, Terminal, Layers, Sparkles, Mail, Trash2, Globe, Music
} from 'lucide-react';
import { playMacClick } from '../utils/macAudioEngine';

export default function MacDesktopIcons({ onOpenApp, isMuted }) {
  const [selectedId, setSelectedId] = useState(null);

  const desktopShortcuts = [
    {
      id: 'finder',
      name: 'Projects Workspace',
      icon: Folder,
      iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-600',
      badge: 'FILES'
    },
    {
      id: 'resume',
      name: 'Resume & Bio.pdf',
      icon: FileText,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-600',
      badge: 'PDF'
    },
    {
      id: 'terminal',
      name: 'Terminal.app',
      icon: Terminal,
      iconBg: 'bg-gradient-to-tr from-slate-800 to-slate-950',
      badge: 'SHELL'
    },
    {
      id: 'creative',
      name: 'Creative Studio',
      icon: Layers,
      iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-700',
      badge: 'SUITE'
    },
    {
      id: 'safari',
      name: 'Safari Browser',
      icon: Globe,
      iconBg: 'bg-gradient-to-tr from-sky-500 to-blue-600',
      badge: 'WEB'
    },
    {
      id: 'notes',
      name: 'Scratchpad.note',
      icon: FileText,
      iconBg: 'bg-gradient-to-tr from-yellow-400 to-amber-500',
      badge: 'NOTE'
    },
    {
      id: 'mail',
      name: 'Mail Contact',
      icon: Mail,
      iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600',
      badge: 'CONTACT'
    },
    {
      id: "ipod",
      name: "iPod Classic.app",
      icon: Music,
      iconBg: "bg-gradient-to-tr from-pink-500 via-rose-500 to-slate-700",
      badge: "IPOD"
    },
    {
      id: 'trash',
      name: 'Trash Bin',
      icon: Trash2,
      iconBg: 'bg-gradient-to-tr from-slate-400 to-slate-600',
      badge: 'BIN'
    }
  ];

  const handleClick = (id) => {
    playMacClick(isMuted);
    setSelectedId(id);
  };

  const handleDoubleClick = (id) => {
    playMacClick(isMuted);
    onOpenApp(id);
  };

  return (
    <div 
      className="absolute top-12 left-6 bottom-20 flex flex-col flex-wrap gap-4 z-[10] select-none pointer-events-auto"
      onClick={() => setSelectedId(null)}
    >
      {desktopShortcuts.map((item) => {
        const IconComp = item.icon;
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            onClick={(e) => { e.stopPropagation(); handleClick(item.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(item.id); }}
            className={`w-24 p-2 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isSelected 
                ? 'bg-blue-500/30 backdrop-blur-md ring-2 ring-blue-400' 
                : 'hover:bg-white/10 hover:backdrop-blur-sm'
            }`}
          >
            {/* Desktop Icon 3D Glass Badge */}
            <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center text-white shadow-lg mb-1.5 transform hover:scale-105 transition-transform`}>
              <IconComp className="w-6 h-6 drop-shadow" />
            </div>

            {/* Label */}
            <span className="text-[11px] font-semibold text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] line-clamp-2 px-1">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
