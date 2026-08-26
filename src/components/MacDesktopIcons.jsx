import React, { useState } from "react";
import { playMacClick } from "../utils/macAudioEngine";

export default function MacDesktopIcons({ onOpenApp, isMuted }) {
  const [selectedId, setSelectedId] = useState(null);

  const desktopShortcuts = [
    {
      id: "finder",
      name: "Projects Workspace",
      imgSrc: "/icons/Finder.png"
    },
    {
      id: "resume",
      name: "Resume & Bio.pdf",
      imgSrc: "/icons/Folder.png"
    },
    {
      id: "terminal",
      name: "Terminal.app",
      imgSrc: "/icons/Terminal.png"
    },
    {
      id: "creative",
      name: "Creative Studio",
      imgSrc: "/icons/Photos.png"
    },
    {
      id: "safari",
      name: "Safari Browser",
      imgSrc: "/icons/Safari.png"
    },
    {
      id: "notes",
      name: "Notes.app",
      imgSrc: "/icons/Notes.png"
    },
    {
      id: "mail",
      name: "Mail Contact",
      imgSrc: "/icons/Mail.png"
    },
    {
      id: "trash",
      name: "Trash Bin",
      imgSrc: "/icons/Bin.png"
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
      className="absolute top-12 left-6 bottom-20 flex flex-col flex-wrap gap-5 z-[10] select-none pointer-events-auto"
      onClick={() => setSelectedId(null)}
    >
      {desktopShortcuts.map((item) => {
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            onClick={(e) => { e.stopPropagation(); handleClick(item.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(item.id); }}
            className={`w-24 p-2 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isSelected 
                ? "bg-white/30 backdrop-blur-md ring-2 ring-white/60 shadow-lg scale-105" 
                : "hover:bg-white/10 hover:backdrop-blur-sm"
            }`}
          >
            {/* Real macOS Icon PNG */}
            <div className="w-14 h-14 relative flex items-center justify-center mb-1.5 transform hover:scale-105 transition-transform">
              <img
                src={item.imgSrc}
                alt={item.name}
                className="w-full h-full object-contain drop-shadow-xl select-none"
              />
            </div>

            {/* Label */}
            <span className="text-[11px] font-semibold text-white tracking-tight drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.9)] line-clamp-2 px-1">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
