import React, { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PROFILE_INFO } from '../data/foldersData';

export default function Navbar() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.1 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-5 px-6 sm:px-12 bg-[#eaf2f8]/90 backdrop-blur-md border-b border-slate-900/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Name */}
        <a href="#top" className="font-serif-title text-2xl font-bold tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
          ishant chauhan
        </a>

        {/* Center: Curated Tag */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
          <span>CURATED BY {PROFILE_INFO.handle.toUpperCase()}</span>
        </div>

        {/* Right: Copy Email Button */}
        <button
          onClick={handleCopyEmail}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">COPIED EMAIL!</span>
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5 text-slate-300" />
              <span>{PROFILE_INFO.email}</span>
            </>
          )}
        </button>

      </div>
    </header>
  );
}
