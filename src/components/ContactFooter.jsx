import React, { useState, useEffect } from 'react';
import { Mail, Copy, Check, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PROFILE_INFO } from '../data/projectsData';

export default function ContactFooter() {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROFILE_INFO.email);
    setCopied(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer id="contact" className="py-24 border-t border-white/10 bg-[#07080a] relative overflow-hidden">
      
      {/* Background Accent Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#ff007a]/10 via-[#00f0ff]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        
        {/* Massive Kinetic Hero Statement */}
        <div className="max-w-4xl mb-16">
          <span className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-widest block mb-4">
            // LET'S COLLABORATE & BUILD
          </span>

          <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-white leading-tight tracking-tight mb-8">
            NEED A KICKASS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#00f0ff] to-[#e5f935]">
              CONTENT SYSTEM OR APP?
            </span>
          </h2>

          <p className="font-body text-base sm:text-xl text-[#a0a5b5] max-w-2xl leading-relaxed mb-8">
            Whether you want to architect a multi-channel content machine, craft a viral brand story, or build a custom vibecoded tool — let's build something unforgettable.
          </p>

          {/* Large Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleCopy}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-mono text-sm font-bold tracking-wide transition-all duration-300 hover:bg-[#e5f935] hover:scale-105 active:scale-95 shadow-2xl"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-black" />
                  <span>COPIED EMAIL! LET'S TALK</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-black" />
                  <span>COPY EMAIL ({PROFILE_INFO.email})</span>
                  <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </>
              )}
            </button>

            <a
              href={`mailto:${PROFILE_INFO.email}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#141720] text-white border border-white/15 font-mono text-sm font-semibold hover:border-[#00f0ff] hover:bg-[#1a1d26] transition-all"
            >
              <span>SEND DIRECT MAIL</span>
              <ArrowUpRight className="w-4 h-4 text-[#00f0ff]" />
            </a>
          </div>
        </div>

        {/* Footer Meta Row */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 font-mono text-xs text-[#a0a5b5]">
          
          {/* Copyright & Location */}
          <div className="flex flex-wrap items-center gap-4">
            <span>© 2026 ISHANT CHAUHAN</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-white">
              <Globe className="w-3.5 h-3.5 text-[#10b981]" />
              <span>LOCAL TIME: {currentTime || '15:51'}</span>
            </span>
          </div>

          {/* Socials with Clean SVGs */}
          <div className="flex items-center gap-6">
            <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X / TWITTER</span>
            </a>
            <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              <span>LINKEDIN</span>
            </a>
            <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
              <span>GITHUB</span>
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}
