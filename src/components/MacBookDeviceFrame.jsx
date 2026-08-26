import React from 'react';

export default function MacBookDeviceFrame({ children, isHardwareFrame, onToggleFrameView }) {
  if (!isHardwareFrame) {
    return <div className="w-full min-h-screen relative">{children}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-6 font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* Outer MacBook Pro Display Lid Housing */}
      <div className="relative w-full max-w-6xl aspect-[16/10] max-h-[85vh] bg-[#0d0d0e] rounded-[24px] p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-700/50 flex flex-col justify-between overflow-hidden group">
        
        {/* Metallic Bezel Rim */}
        <div className="absolute inset-0 rounded-[24px] border-[2px] border-slate-400/20 pointer-events-none z-50"></div>

        {/* Display Glass Notch Bar at Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-4 bg-[#0d0d0e] rounded-b-xl z-50 flex items-center justify-center gap-2">
          {/* Camera Lens */}
          <div className="w-2 h-2 rounded-full bg-[#1b1b1f] ring-1 ring-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-900/80 animate-pulse" />
          </div>
          {/* Green Indicator LED */}
          <div className="w-1 h-1 rounded-full bg-emerald-500/80 shadow-[0_0_4px_#10b981]" />
        </div>

        {/* Inner Screen Canvas Container */}
        <div className="relative w-full h-full rounded-[16px] overflow-hidden bg-slate-900 border border-slate-800 flex flex-col shadow-inner">
          {children}
        </div>

      </div>

      {/* MacBook Keyboard & Trackpad Hinge Base */}
      <div className="relative w-full max-w-6xl h-10 sm:h-16 bg-gradient-to-b from-[#1a1a1c] via-[#242427] to-[#121214] rounded-b-[28px] border-t border-slate-600/40 shadow-2xl flex flex-col items-center justify-between p-1.5 sm:p-2">
        {/* Notch Opening Notch lip */}
        <div className="w-28 h-1.5 bg-[#0a0a0c] rounded-b-md shadow-inner"></div>

        {/* MacBook Pro Engraved Logo */}
        <span className="font-sans font-bold text-[10px] sm:text-xs tracking-[0.2em] text-slate-500 uppercase select-none opacity-60">
          MacBook Pro
        </span>

        {/* Minimal Touch Trackpad simulation */}
        <div className="w-48 sm:w-64 h-3 bg-[#171719] rounded-t-md border border-slate-700/40 shadow-inner"></div>
      </div>

    </div>
  );
}
