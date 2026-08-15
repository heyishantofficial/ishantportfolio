import React from 'react';
import ishantHeadImg from '../assets/ishant-head.png';

export default function MascotHead({ className = "w-56 h-56 sm:w-72 sm:h-72", onClick, isDragging }) {
  return (
    <div 
      onClick={onClick}
      className={`relative select-none cursor-grab active:cursor-grabbing transition-transform duration-150 ${
        isDragging ? 'scale-110 rotate-6' : 'hover:scale-105'
      } ${className}`}
    >
      <img
        src={ishantHeadImg}
        alt="Ishant Chauhan Custom Avatar"
        className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] pointer-events-none"
      />
    </div>
  );
}
