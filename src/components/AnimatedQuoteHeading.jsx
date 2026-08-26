import React, { useEffect, useRef, useState } from "react";

// Mouse-reactive letter component for individual letter physics
function InteractiveChar({ char, isYellowScript, mousePos }) {
  const charRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
    textShadow: 'none',
    color: isYellowScript ? '#EAB308' : '#FFFFFF'
  });

  useEffect(() => {
    if (!mousePos.x || !mousePos.y || !charRef.current) {
      setStyle({
        transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
        textShadow: isYellowScript ? '0 2px 12px rgba(234,179,8,0.5)' : '0 2px 14px rgba(0,0,0,0.6)',
        color: isYellowScript ? '#EAB308' : '#FFFFFF'
      });
      return;
    }

    const rect = charRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mousePos.x - cx;
    const dy = mousePos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 140;

    if (dist < radius) {
      const p = 1 - dist / radius;
      const force = Math.pow(p, 1.2);
      const dirX = dist > 0 ? -dx / dist : 0;
      const dirY = dist > 0 ? -dy / dist : 0;

      const moveX = dirX * force * 20;
      const moveY = dirY * force * 20 - force * 6;
      const scale = 1 + force * 0.35;
      const rotate = dirX * force * 15;

      const glowColor = isYellowScript 
        ? `rgba(250, 204, 21, ${0.9 * force})` 
        : `rgba(255, 255, 255, ${0.85 * force})`;

      setStyle({
        transform: `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`,
        textShadow: `0 0 ${14 * force}px ${glowColor}, 0 0 ${28 * force}px ${glowColor}`,
        color: isYellowScript ? '#FFEE58' : '#FFFFFF'
      });
    } else {
      setStyle({
        transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
        textShadow: isYellowScript ? '0 2px 12px rgba(234,179,8,0.5)' : '0 2px 14px rgba(0,0,0,0.6)',
        color: isYellowScript ? '#EAB308' : '#FFFFFF'
      });
    }
  }, [mousePos, isYellowScript]);

  if (char === ' ') {
    return <span className="inline-block w-2 sm:w-3.5">&nbsp;</span>;
  }

  return (
    <span
      ref={charRef}
      style={style}
      className={`inline-block select-none transition-transform duration-100 ease-out ${
        isYellowScript 
          ? 'font-script text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide text-yellow-400 drop-shadow-md' 
          : 'font-serif-title italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white drop-shadow-lg'
      }`}
    >
      {char}
    </span>
  );
}

export default function AnimatedQuoteHeading() {
  const [mousePos, setMousePos] = useState({ x: null, y: null });
  const [animProgress, setAnimProgress] = useState(0);
  const containerRef = useRef(null);

  // Single-pass morphing liquid entrance effect (plays once on mount)
  useEffect(() => {
    let start = null;
    const duration = 1400; // 1.4s morph entrance

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: null, y: null });
  };

  // Blur & Opacity calculation for the one-time morph entrance
  const blurVal = Math.max(0, (1 - animProgress) * 12);
  const opacityVal = Math.pow(animProgress, 0.5);

  const part1 = "I believe the best ideas usually start as".split('');
  const part2 = "weird ones.".split('');

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="text-center max-w-5xl w-full px-2 mb-4 select-none relative z-10 flex flex-col items-center justify-center"
      style={{
        filter: `blur(${blurVal.toFixed(1)}px)`,
        opacity: opacityVal
      }}
    >
      <h1 className="leading-tight sm:leading-snug flex flex-wrap items-center justify-center gap-y-1">
        {/* White Serif Part */}
        <span className="inline-flex flex-wrap justify-center mr-2">
          {part1.map((char, index) => (
            <InteractiveChar
              key={`p1-${index}`}
              char={char}
              isYellowScript={false}
              mousePos={mousePos}
            />
          ))}
        </span>

        {/* Bright Yellow Cursive Script Part */}
        <span className="inline-flex justify-center">
          {part2.map((char, index) => (
            <InteractiveChar
              key={`p2-${index}`}
              char={char}
              isYellowScript={true}
              mousePos={mousePos}
            />
          ))}
        </span>
      </h1>
    </div>
  );
}
