import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Download, Maximize2, X 
} from 'lucide-react';

export default function IOSNotesApp({ onClose }) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownloadResume = () => {
    const link = document.createElement('a');
    link.href = '/resume.pdf';
    link.download = 'Ishant_Chauhan_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* 1. Sleek iOS Navigation Header */}
      <div className="w-full pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#121214]/90 backdrop-blur-md">
        
        {/* Left Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-amber-400 active:opacity-70 transition-opacity font-medium text-sm cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 -ml-1" />
          <span>Notes</span>
        </button>

        {/* Center Title */}
        <h1 className="font-semibold text-sm text-white tracking-tight text-center">
          Official Resume
        </h1>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadResume}
            className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-transform active:scale-95 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-16">
        <div className="space-y-3">
          
          {/* Action & Info Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-neutral-300 font-medium">Official Document (2027)</span>
            </div>
            <button
              onClick={() => setIsZoomed(true)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 active:opacity-75 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>
          </div>

          {/* Resume Image Card */}
          <div 
            onClick={() => setIsZoomed(true)}
            className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group cursor-pointer active:scale-[0.99] transition-transform"
          >
            <img
              src="/resume.jpg"
              alt="Ishant Chauhan Official Resume"
              className="w-full h-auto object-contain select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-lg">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tap to expand full document</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal for Fullscreen Resume */}
      <AnimatePresence>
        {isZoomed && (
          <div 
            className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-xl flex flex-col p-4 animate-fadeIn"
            onClick={() => setIsZoomed(false)}
          >
            <div className="flex items-center justify-between pb-3 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-neutral-300 font-semibold">Official Resume Document (2027)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadResume}
                  className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
              <img
                src="/resume.jpg"
                alt="Full Resume Preview"
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
