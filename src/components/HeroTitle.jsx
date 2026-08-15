import React from 'react';
import { PROFILE_INFO } from '../data/foldersData';

export default function HeroTitle() {
  return (
    <section id="top" className="pt-32 pb-12 text-center select-none">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Main Editorial Serif Title (Matching Attached Reference Image) */}
        <h1 className="font-serif-title italic text-5xl sm:text-7xl lg:text-8xl text-slate-900 tracking-tight leading-none mb-3">
          the full offering
        </h1>

        {/* Subheader tracking */}
        <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">
          CURATED BY {PROFILE_INFO.handle.toUpperCase()}
        </p>

        {/* Identity Pill Line */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-slate-600 px-4 py-2 rounded-full bg-white/70 border border-slate-900/5 shadow-sm">
          <span>● CONTENT SYSTEMS</span>
          <span>•</span>
          <span>BRAND STORYTELLING</span>
          <span>•</span>
          <span>VIBECODED APPS</span>
        </div>

      </div>
    </section>
  );
}
