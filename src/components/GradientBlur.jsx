import React, { useMemo } from 'react';

/**
 * GradientBlur Component
 * Implements Apple-style progressive optical gradient backdrop blur.
 * Blends blur from 0.5px to 64px across an edge or container without hard boundaries.
 */
export default function GradientBlur({
  direction = 'bottom',
  size = 60,
  className = '',
  style = {}
}) {
  const containerStyle = useMemo(() => {
    const s = { ...style };
    if (direction === 'top') {
      s.top = 0;
      s.left = 0;
      s.right = 0;
      s.height = `${size}px`;
      s['--mask-dir'] = 'to top';
    } else if (direction === 'bottom') {
      s.bottom = 0;
      s.left = 0;
      s.right = 0;
      s.height = `${size}px`;
      s['--mask-dir'] = 'to bottom';
    } else if (direction === 'left') {
      s.top = 0;
      s.bottom = 0;
      s.left = 0;
      s.width = `${size}px`;
      s['--mask-dir'] = 'to left';
    } else if (direction === 'right') {
      s.top = 0;
      s.bottom = 0;
      s.right = 0;
      s.width = `${size}px`;
      s['--mask-dir'] = 'to right';
    }
    return s;
  }, [direction, size, style]);

  return (
    <div
      aria-hidden="true"
      className={`gradient-blur-container pointer-events-none absolute select-none ${className}`}
      style={containerStyle}
    >
      <div className="gb-layer gb-layer-0" />
      <div className="gb-layer gb-layer-1" />
      <div className="gb-layer gb-layer-2" />
      <div className="gb-layer gb-layer-3" />
      <div className="gb-layer gb-layer-4" />
      <div className="gb-layer gb-layer-5" />
      <div className="gb-layer gb-layer-6" />
      <div className="gb-layer gb-layer-7" />
    </div>
  );
}
