import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { PROFILE_INFO } from '../data/foldersData';

export default function Footer() {
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

  return (
    <footer className="py-12 border-t border-slate-900/5 bg-[#eaf2f8] text-slate-600 font-mono text-xs">
      <div className="max-w-6xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Copyright */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">© 2026 ISHANT CHAUHAN</span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>LOCAL TIME: {currentTime || '16:20'}</span>
          </span>
        </div>

        {/* Right: Social Links */}
        <div className="flex items-center gap-6 font-bold text-slate-800">
          <a href={PROFILE_INFO.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
            X / TWITTER
          </a>
          <a href={PROFILE_INFO.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
            LINKEDIN
          </a>
          <a href={PROFILE_INFO.socials.github} target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
            GITHUB
          </a>
        </div>

      </div>
    </footer>
  );
}
