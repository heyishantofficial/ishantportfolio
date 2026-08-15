import React from 'react';

export default function AdrienMascot({ isOpen, onToggle }) {
  return (
    <div 
      onClick={onToggle}
      className="group relative flex flex-col sm:flex-row items-center gap-4 cursor-pointer select-none transition-transform duration-300 hover:scale-105"
      title="Click to toggle vault"
    >
      {/* Hand-drawn Illustrated Mascot Head (Adrien Lamy Style) */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-white">
          {/* Hair / Head Outline */}
          <path
            d="M 50 140 C 30 110 30 60 70 40 C 110 20 160 30 170 70 C 180 110 160 150 120 170 C 80 180 50 160 50 140 Z"
            fill="#111216"
            stroke="white"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Face Area */}
          <path
            d="M 70 65 C 100 55 145 65 150 95 C 155 125 130 155 95 150 C 70 145 60 110 70 65 Z"
            fill="white"
            stroke="#111216"
            strokeWidth="5"
          />
          {/* Eyes */}
          <circle cx="95" cy="95" r="7" fill="#111216" />
          <circle cx="125" cy="95" r="7" fill="#111216" />
          
          {/* Big Cheerful Teeth Smile (Adrien Signature) */}
          <path
            d="M 85 120 Q 110 145 135 120 Z"
            fill="white"
            stroke="#111216"
            strokeWidth="4"
          />
          <line x1="95" y1="120" x2="95" y2="132" stroke="#111216" strokeWidth="3" />
          <line x1="105" y1="120" x2="105" y2="135" stroke="#111216" strokeWidth="3" />
          <line x1="115" y1="120" x2="115" y2="135" stroke="#111216" strokeWidth="3" />
          <line x1="125" y1="120" x2="125" y2="130" stroke="#111216" strokeWidth="3" />
        </svg>

        {/* Pulse Aura */}
        <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Hand holding the Chalkboard Sign */}
      <div className="flex items-center gap-2">
        {/* Hand Graphic */}
        <div className="w-8 h-10 border-4 border-white bg-[#111216] rounded-lg hidden sm:block" />

        {/* The Chalkboard Sign */}
        <div className="px-5 py-3 rounded-2xl bg-white text-[#111216] border-4 border-[#111216] font-mono font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-2xl flex items-center gap-2 group-hover:bg-yellow-300 transition-colors">
          <span className="text-xl">{isOpen ? '✕' : '►'}</span>
          <span>{isOpen ? 'CLOSE' : 'WORK VAULT'}</span>
        </div>
      </div>
    </div>
  );
}
