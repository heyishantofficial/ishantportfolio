import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, ArrowDownRight, Terminal, Flame } from 'lucide-react';
import { PROFILE_INFO } from '../data/projectsData';

const PILLS = [
  { id: 'p1', text: '⚡ Content Systems', color: '#00f0ff', bg: 'rgba(0,240,255,0.12)' },
  { id: 'p2', text: '🔥 Brand Storytelling', color: '#ff007a', bg: 'rgba(255,0,122,0.12)' },
  { id: 'p3', text: '🚀 Vibecoded Apps', color: '#e5f935', bg: 'rgba(229,249,53,0.15)' },
  { id: 'p4', text: '📈 Personal Branding', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'p5', text: '🤖 AI Workflows', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
];

const QUOTES = [
  "Building content systems that scale organically.",
  "Vibecoding daily apps in hours, not weeks.",
  "Turning raw ideas into viral brand stories.",
  "Architecting high-conversion media pipelines."
];

export default function HeroCanvas({ onOpenDrawer, onFilterCategory }) {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [mascotMood, setMascotMood] = useState('NORMAL'); // 'NORMAL' | 'BOUNCY' | 'SURPRISED'
  const [pillPositions, setPillPositions] = useState(() => 
    PILLS.map((p, i) => ({
      ...p,
      x: 40 + i * 180,
      y: 80 + (i % 2) * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      isDragging: false
    }))
  );

  const containerRef = useRef(null);
  const dragPillRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Rotate quotes every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Simple drag mechanics for interactive canvas pills
  const handleMouseDown = (pillId, e) => {
    e.preventDefault();
    dragPillRef.current = pillId;
    const pill = pillPositions.find(p => p.id === pillId);
    if (!pill) return;
    offsetRef.current = {
      x: e.clientX - pill.x,
      y: e.clientY - pill.y
    };
    setPillPositions(prev => prev.map(p => p.id === pillId ? { ...p, isDragging: true } : p));
  };

  const handleMouseMove = (e) => {
    if (!dragPillRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width - 160, e.clientX - rect.left - offsetRef.current.x));
    const newY = Math.max(10, Math.min(rect.height - 50, e.clientY - rect.top - offsetRef.current.y));

    setPillPositions(prev =>
      prev.map(p => p.id === dragPillRef.current ? { ...p, x: newX, y: newY } : p)
    );
  };

  const handleMouseUp = () => {
    if (dragPillRef.current) {
      dragPillRef.current = null;
      setPillPositions(prev => prev.map(p => ({ ...p, isDragging: false })));
    }
  };

  const handleTossPills = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPillPositions(prev =>
      prev.map((p, i) => ({
        ...p,
        x: Math.random() * (rect.width - 200) + 20,
        y: Math.random() * (rect.height - 100) + 20
      }))
    );
    setMascotMood('SURPRISED');
    setTimeout(() => setMascotMood('NORMAL'), 1500);
  };

  const handleMascotClick = () => {
    setMascotMood('BOUNCY');
    setTimeout(() => setMascotMood('NORMAL'), 1200);
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-[90vh] pt-28 pb-16 flex flex-col justify-between overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="container relative z-10">
        
        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141720] border border-white/10 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#e5f935] animate-ping" />
          <span className="font-mono text-xs text-[#a0a5b5]">
            {PROFILE_INFO.status}
          </span>
        </div>

        {/* Main Headline & Identity Statement */}
        <div className="max-w-4xl">
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl leading-[1.08] tracking-tight text-white mb-6">
            I AM A <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#00f0ff] to-[#e5f935]">BUILDER.</span>
          </h1>

          <p className="font-display text-lg sm:text-2xl text-[#a0a5b5] font-semibold leading-snug mb-8">
            I architect <span className="text-white underline decoration-[#00f0ff] decoration-2 underline-offset-4">content systems</span>, craft <span className="text-white underline decoration-[#ff007a] decoration-2 underline-offset-4">brand storytelling</span>, scale personal branding, & <span className="text-[#e5f935] font-mono">vibecode apps</span> that solve daily life.
          </p>

          {/* Quote Ticker (Tactile Terminal Box) */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#12141a]/90 border border-white/10 max-w-2xl backdrop-blur-md shadow-2xl mb-10">
            <Terminal className="w-5 h-5 text-[#00f0ff] shrink-0" />
            <div className="font-mono text-xs sm:text-sm text-[#f4f5f7] tracking-tight truncate">
              <span className="text-[#a0a5b5] mr-2">$</span>
              {QUOTES[activeQuoteIndex]}
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#f4f5f7] text-[#0a0b0e] font-mono text-sm font-bold tracking-wide transition-all duration-300 hover:bg-[#e5f935] hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
            >
              <span>EXPLORE WORK VAULT</span>
              <ArrowDownRight className="w-4 h-4" />
            </a>

            <button
              onClick={onOpenDrawer}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#141720] text-white border border-white/15 font-mono text-sm font-semibold transition-all duration-300 hover:border-[#00f0ff] hover:bg-[#1a1d26] active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#ff007a]" />
              <span>SLIDE-OUT VAULT (ADRIEN STYLE)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Tactile Stage / Draggable Playground */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[260px] sm:h-[300px] mt-12 border-y border-white/5 bg-gradient-to-b from-transparent via-[#12141a]/30 to-transparent overflow-hidden"
      >
        <div className="absolute top-3 left-6 z-10 flex items-center gap-2 font-mono text-[11px] text-[#62687a] uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-[#ff007a]" />
          <span>Interactive Builder Canvas — Drag Pills Below:</span>
        </div>

        {/* Physics Reset Button */}
        <button
          onClick={handleTossPills}
          className="absolute top-3 right-6 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141720] border border-white/10 font-mono text-[11px] text-[#a0a5b5] hover:text-white transition-colors"
          title="Randomize pill physics position"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Toss Pills 🎲</span>
        </button>

        {/* Mascot / Builder Core (Adrien Lamy Style Interactive Head) */}
        <div
          onClick={handleMascotClick}
          className={`absolute right-12 bottom-6 z-20 cursor-pointer select-none transition-transform duration-300 ${
            mascotMood === 'BOUNCY' ? 'scale-125 rotate-12' : mascotMood === 'SURPRISED' ? 'scale-110 -rotate-12' : 'hover:scale-105'
          }`}
          title="Click the Builder Mascot!"
        >
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#ff007a] via-[#00f0ff] to-[#e5f935] p-1 shadow-2xl shadow-[#00f0ff]/20">
            <div className="w-full h-full bg-[#0d0f14] rounded-full flex flex-col items-center justify-center p-3 text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#00f0ff] animate-ping" />
                <span className="w-3 h-3 rounded-full bg-[#ff007a] animate-pulse" />
              </div>
              <span className="font-display font-extrabold text-xs text-white tracking-wider">
                VIBECODER
              </span>
              <span className="font-mono text-[9px] text-[#e5f935] mt-0.5">
                {mascotMood === 'BOUNCY' ? '⚡ BUILDING!' : mascotMood === 'SURPRISED' ? '🤯 WHOA!' : '● CLICK ME'}
              </span>
            </div>
          </div>
        </div>

        {/* Draggable Capability Pills */}
        {pillPositions.map((pill) => (
          <div
            key={pill.id}
            onMouseDown={(e) => handleMouseDown(pill.id, e)}
            style={{
              transform: `translate3d(${pill.x}px, ${pill.y}px, 0)`,
              backgroundColor: pill.bg,
              borderColor: pill.color,
              color: pill.color
            }}
            className={`absolute top-0 left-0 px-4 py-2 rounded-full border border-opacity-40 font-mono text-xs sm:text-sm font-bold tracking-wide select-none cursor-grab active:cursor-grabbing backdrop-blur-md transition-shadow duration-200 ${
              pill.isDragging ? 'scale-110 shadow-2xl shadow-[#00f0ff]/30 z-30' : 'hover:scale-105 z-10'
            }`}
          >
            {pill.text}
          </div>
        ))}
      </div>
    </section>
  );
}
