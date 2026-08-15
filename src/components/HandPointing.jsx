import React from 'react';
import pointingHandImg from '../assets/pointing-hand.png';

export default function HandPointing({ onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer select-none transition-transform hover:scale-105"
      title="Click to pull work vault"
    >
      {/* Stick figure asking ? PULL? */}
      <div className="flex flex-col items-center mb-2 text-white font-handwritten text-xl font-bold">
        <span>?</span>
        <svg width="28" height="40" viewBox="0 0 30 45" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="15" cy="10" r="6" />
          <line x1="15" y1="16" x2="15" y2="30" />
          <line x1="15" y1="20" x2="5" y2="28" />
          <line x1="15" y1="20" x2="25" y2="28" />
          <line x1="15" y1="30" x2="8" y2="42" />
          <line x1="15" y1="30" x2="22" y2="42" />
        </svg>
        <span className="text-sm uppercase tracking-wider mt-1">PULL?</span>
      </div>

      {/* Real Hand Pointing Graphic from Adrien Lamy */}
      <img
        src={pointingHandImg}
        alt="Point Hand Trigger"
        className="w-24 sm:w-32 h-auto drop-shadow-xl filter invert"
      />
    </div>
  );
}
