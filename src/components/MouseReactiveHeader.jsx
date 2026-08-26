import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Unlock, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import blissBgImg from '../assets/bliss-bg.jpg';
import { MorphingText } from './MorphingText';

const QUOTES = [
  "I believe the best ideas usually start as weird ones.",
  "Building content systems that scale organically.",
  "Vibecoding daily apps in hours, not weeks.",
  "Turning raw ideas into viral brand stories.",
  "Architecting high-conversion media pipelines."
];

// Individual Mouse-Reactive Character Component (for interactive character physics mode)
function ReactiveChar({ char, isYellowScript, mousePos, containerRef }) {
  const charRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState({
    transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
    textShadow: 'none',
    color: isYellowScript ? '#EAB308' : '#FFFFFF',
    filter: 'none'
  });

  useEffect(() => {
    if (!mousePos.x || !mousePos.y || !charRef.current || !containerRef.current) {
      setTransformStyle({
        transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
        textShadow: 'none',
        color: isYellowScript ? '#EAB308' : '#FFFFFF',
        filter: 'none'
      });
      return;
    }

    const rect = charRef.current.getBoundingClientRect();
    const charCenterX = rect.left + rect.width / 2;
    const charCenterY = rect.top + rect.height / 2;

    const dx = mousePos.x - charCenterX;
    const dy = mousePos.y - charCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const radius = 160;

    if (dist < radius) {
      const p = 1 - dist / radius;
      const force = Math.pow(p, 1.2);

      const dirX = dist > 0 ? -dx / dist : 0;
      const dirY = dist > 0 ? -dy / dist : 0;

      const moveX = dirX * force * 24;
      const moveY = dirY * force * 24 - force * 8;

      const scale = 1 + force * 0.42;
      const rotate = dirX * force * 20;

      const glowColor = isYellowScript 
        ? `rgba(250, 204, 21, ${0.9 * force})` 
        : `rgba(255, 255, 255, ${0.85 * force})`;
      const textShadow = `0 0 ${12 * force}px ${glowColor}, 0 0 ${24 * force}px ${glowColor}`;

      setTransformStyle({
        transform: `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`,
        textShadow: textShadow,
        color: isYellowScript ? '#FFEE58' : '#FFFFFF',
        filter: `brightness(${1 + force * 0.3})`
      });
    } else {
      setTransformStyle({
        transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
        textShadow: isYellowScript ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.4)',
        color: isYellowScript ? '#EAB308' : '#FFFFFF',
        filter: 'none'
      });
    }
  }, [mousePos, isYellowScript, containerRef]);

  if (char === ' ') {
    return <span className="inline-block w-3 sm:w-4">&nbsp;</span>;
  }

  return (
    <span
      ref={charRef}
      style={transformStyle}
      className={`reactive-char inline-block cursor-default select-none transition-transform duration-100 ease-out ${
        isYellowScript 
          ? 'font-script text-4xl sm:text-6xl md:text-7xl font-bold tracking-wide text-yellow-400 drop-shadow-md' 
          : 'font-serif-title italic text-3xl sm:text-5xl md:text-6xl font-normal text-white drop-shadow-lg'
      }`}
    >
      {char}
    </span>
  );
}

export default function MouseReactiveHeader({ onUnlock }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: null, y: null });
  const [userName, setUserName] = useState('');
  const [effectMode, setEffectMode] = useState('MORPH'); // 'MORPH' | 'CHARACTER_PHYSICS'
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: null, y: null });
  };

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    
    // STRICT UNLOCK RULE: Must enter at least one character in the input field
    if (!userName || userName.trim() === '') {
      setErrorMsg('⚠️ Please enter your name first to unlock!');
      setIsShaking(true);
      if (inputRef.current) inputRef.current.focus();
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setErrorMsg('');
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 }
    });
    if (onUnlock) onUnlock(userName.trim());
  };

  const part1 = "I believe the best ideas usually start as".split('');
  const part2 = "weird ones.".split('');

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[560px] sm:min-h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between p-6 sm:p-12 text-white border border-white/20 select-none transition-all"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.5)), url(${blissBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%'
      }}
    >
      {/* Background Interactive Pointer Light Aura */}
      {mousePos.x && mousePos.y && containerRef.current && (
        <div
          className="pointer-events-none absolute w-[340px] h-[340px] rounded-full blur-3xl opacity-35 transition-opacity duration-300 z-0"
          style={{
            left: `${mousePos.x - (containerRef.current.getBoundingClientRect().left + 170)}px`,
            top: `${mousePos.y - (containerRef.current.getBoundingClientRect().top + 170)}px`,
            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.7) 0%, rgba(56, 189, 248, 0.35) 50%, transparent 80%)'
          }}
        />
      )}

      {/* Top Bar Indicator */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 font-mono text-xs text-sky-100/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/40 backdrop-blur-md border border-white/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Login Screen Gate</span>
          </div>

          <button
            onClick={() => setEffectMode(prev => prev === 'MORPH' ? 'CHARACTER_PHYSICS' : 'MORPH')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-white/20 backdrop-blur-md hover:bg-sky-900/80 transition-all cursor-pointer font-semibold text-amber-300"
            title="Toggle between SVG Morphing & 3D Character Physics"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{effectMode === 'MORPH' ? 'Mode: Liquid Morph' : 'Mode: 3D Mouse Physics'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/50 border border-amber-400/40 backdrop-blur-md text-amber-300">
          <Lock className="w-3.5 h-3.5 text-amber-300" />
          <span>Locked — Name Required</span>
        </div>
      </div>

      {/* Center Hero Quote with Morphing Text Effect */}
      <div className="w-full max-w-4xl text-center my-auto z-10 flex flex-col items-center justify-center py-4">
        
        {effectMode === 'MORPH' ? (
          /* User's Morphing Text Effect Component */
          <div className="w-full mb-6 py-2">
            <MorphingText 
              texts={QUOTES} 
              className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-serif-title italic"
            />
          </div>
        ) : (
          /* Interactive Character Physics Headline */
          <h1 className="leading-tight sm:leading-snug mb-6 flex flex-wrap items-center justify-center gap-y-2">
            <span className="inline-flex flex-wrap justify-center mr-2">
              {part1.map((char, index) => (
                <ReactiveChar
                  key={`p1-${index}`}
                  char={char}
                  isYellowScript={false}
                  mousePos={mousePos}
                  containerRef={containerRef}
                />
              ))}
            </span>

            <span className="inline-flex justify-center">
              {part2.map((char, index) => (
                <ReactiveChar
                  key={`p2-${index}`}
                  char={char}
                  isYellowScript={true}
                  mousePos={mousePos}
                  containerRef={containerRef}
                />
              ))}
            </span>
          </h1>
        )}

        {/* Subtitle ("Enter your name to log in") */}
        <p className="font-sans text-sm sm:text-base text-sky-100 font-medium tracking-wide mb-6 drop-shadow-md">
          Enter your name to log in
        </p>

        {/* Interactive Login Input Field */}
        <form onSubmit={handleUnlock} className="w-full max-w-md mb-3 relative">
          <div className={`relative flex items-center transition-all ${isShaking ? 'animate-shake' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter Your Name..."
              className={`w-full bg-sky-950/60 hover:bg-sky-900/70 focus:bg-sky-900/80 text-white placeholder-sky-200/70 border ${
                errorMsg ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-sky-300/40'
              } rounded-full px-6 py-3.5 pr-14 text-sm font-sans outline-none focus:ring-2 focus:ring-amber-400/80 transition-all backdrop-blur-md shadow-lg`}
            />
            <button
              type="submit"
              className="absolute right-2 p-2 rounded-full bg-amber-400/40 hover:bg-amber-400/60 text-white transition-all active:scale-90 cursor-pointer border border-white/20"
              title="Submit & Unlock"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Error Feedback Message if attempted to unlock without entering name */}
        {errorMsg && (
          <p className="font-mono text-xs text-amber-300 font-bold mb-3 animate-fadeIn">
            {errorMsg}
          </p>
        )}

        {/* Click to Unlock Button */}
        <button
          type="button"
          onClick={handleUnlock}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-900/60 hover:bg-sky-800/90 text-sky-100 border border-sky-300/40 font-mono text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl backdrop-blur-md cursor-pointer"
        >
          <span>Click to Unlock</span>
          <span className="text-amber-300 transition-transform group-hover:scale-125">🔒</span>
        </button>

      </div>

      {/* Bottom Hint Footer */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 font-mono text-[11px] text-sky-200/80">
        <span className="hidden sm:inline">🔒 Type name & click unlock to enter</span>
        <span className="ml-auto flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Vibecode Security Gate</span>
        </span>
      </div>

    </div>
  );
}
