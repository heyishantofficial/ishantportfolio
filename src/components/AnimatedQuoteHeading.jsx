import React, { useEffect, useRef, useState, useCallback } from "react";

const WORDS = ["I", "believe", "the", "best", "ideas", "usually", "start", "as", "weird", "ones."];
const RADIUS = 140;

export default function AnimatedQuoteHeading() {
  const [animProgress, setAnimProgress] = useState(0);
  const containerRef = useRef(null);
  const charRefs = useRef([]);
  const rectsCache = useRef([]);
  const mousePosRef = useRef({ x: null, y: null });
  const rafIdRef = useRef(null);
  const isHoveredRef = useRef(false);

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

  // Measure and cache character centers once on mount / resize (zero layout thrashing during mousemove)
  const updateRectsCache = useCallback(() => {
    rectsCache.current = charRefs.current.map((el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2
      };
    });
  }, []);

  useEffect(() => {
    // Initial measure after layout settles
    const timer = setTimeout(updateRectsCache, 100);
    window.addEventListener('resize', updateRectsCache);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRectsCache);
    };
  }, [updateRectsCache]);

  // Direct RAF animation loop — mutates element style directly without React re-render overhead
  const runPhysicsTick = useCallback(() => {
    const mouse = mousePosRef.current;
    const rects = rectsCache.current;
    const els = charRefs.current;
    const hasMouse = mouse.x !== null && mouse.y !== null && isHoveredRef.current;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const pos = rects[i];
      if (!el) continue;

      if (!hasMouse || !pos) {
        // Reset to rest state
        el.style.transform = 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)';
        el.style.textShadow = '0 2px 14px rgba(0,0,0,0.6)';
        continue;
      }

      const dx = mouse.x - pos.cx;
      const dy = mouse.y - pos.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < RADIUS) {
        const p = 1 - dist / RADIUS;
        const force = Math.pow(p, 1.2);
        const dirX = dist > 0 ? -dx / dist : 0;
        const dirY = dist > 0 ? -dy / dist : 0;

        const moveX = dirX * force * 20;
        const moveY = dirY * force * 20 - force * 6;
        const scale = 1 + force * 0.35;
        const rotate = dirX * force * 15;
        const glowColor = `rgba(255, 255, 255, ${0.9 * force})`;

        el.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`;
        el.style.textShadow = `0 0 ${16 * force}px ${glowColor}, 0 0 ${32 * force}px ${glowColor}`;
      } else {
        el.style.transform = 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)';
        el.style.textShadow = '0 2px 14px rgba(0,0,0,0.6)';
      }
    }
  }, []);

  const queueTick = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      runPhysicsTick();
    });
  }, [runPhysicsTick]);

  const handlePointerMove = (e) => {
    isHoveredRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    queueTick();
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    mousePosRef.current = { x: null, y: null };
    queueTick();
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      isHoveredRef.current = true;
      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      queueTick();
    }
  };

  const handleTouchEnd = () => {
    isHoveredRef.current = false;
    mousePosRef.current = { x: null, y: null };
    queueTick();
  };

  // Blur & Opacity calculation for the one-time morph entrance
  const blurVal = Math.max(0, (1 - animProgress) * 12);
  const opacityVal = Math.pow(animProgress, 0.5);

  let flatCharIndex = 0;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="text-center max-w-5xl w-full px-2 mb-2 select-none relative z-10 flex flex-col items-center justify-center font-montserrat"
      style={{
        filter: `blur(${blurVal.toFixed(1)}px)`,
        opacity: opacityVal
      }}
    >
      <h1 className="leading-snug sm:leading-tight flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3.5 gap-y-2 max-w-4xl">
        {WORDS.map((word, wIdx) => (
          <span key={`w-${wIdx}`} className="inline-flex whitespace-nowrap">
            {word.split('').map((char, cIdx) => {
              const curIdx = flatCharIndex++;
              return (
                <span
                  key={`c-${wIdx}-${cIdx}`}
                  ref={(el) => { charRefs.current[curIdx] = el; }}
                  style={{
                    transform: 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)',
                    textShadow: '0 2px 14px rgba(0,0,0,0.6)',
                    color: '#FFFFFF'
                  }}
                  className="inline-block select-none font-montserrat font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-lg tracking-tight will-change-transform"
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
    </div>
  );
}
