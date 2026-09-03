import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GradientBlur from '../components/GradientBlur';

const MENU_BAR_H = 28;   // windows must not slide under the menu bar
const DOCK_GUARD = 72;   // ...or under the dock
const MIN_W = 320;
const MIN_H = 220;

/**
 * The chrome every IshantOS window shares: traffic lights, a draggable
 * titlebar, a resize corner, focus-on-click and z-ordering.
 *
 * On phones the whole thing becomes a full-height sheet — dragging a 900px
 * window around a 390px viewport is not an experience worth shipping.
 */
export default function OSWindow({
  win,
  isActive,
  isCompact,
  title,
  subtitle,
  icon,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  onMove,
  onResize,
  toolbar,
  children,
  bodyClassName = ''
}) {
  const reduceMotion = useReducedMotion();
  const dragState = useRef(null);
  const resizeState = useRef(null);
  const frameRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const clampX = (x, w) => Math.min(Math.max(x, -w + 120), window.innerWidth - 120);
  const clampY = (y) => Math.min(Math.max(y, MENU_BAR_H), window.innerHeight - 60);

  const handleTitlePointerDown = (e) => {
    if (isCompact || win.maximized) return;
    if (e.target.closest('[data-no-drag]')) return;
    onFocus();
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: win.x, originY: win.y };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = useCallback((e) => {
    if (dragState.current) {
      const { startX, startY, originX, originY } = dragState.current;
      onMove(clampX(originX + e.clientX - startX, win.w), clampY(originY + e.clientY - startY));
    } else if (resizeState.current) {
      const { startX, startY, originW, originH } = resizeState.current;
      onResize(
        Math.max(MIN_W, Math.min(originW + e.clientX - startX, window.innerWidth - 24)),
        Math.max(MIN_H, Math.min(originH + e.clientY - startY, window.innerHeight - DOCK_GUARD))
      );
    }
  }, [onMove, onResize, win.w]);

  const endGesture = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
    setDragging(false);
  }, []);

  // Listening on window (rather than the titlebar) keeps the drag alive when
  // the pointer outruns the element.
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endGesture);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endGesture);
    };
  }, [handlePointerMove, endGesture]);

  const handleResizePointerDown = (e) => {
    if (isCompact || win.maximized) return;
    e.stopPropagation();
    onFocus();
    resizeState.current = { startX: e.clientX, startY: e.clientY, originW: win.w, originH: win.h };
  };

  const geometry = isCompact
    ? { top: MENU_BAR_H, left: 0, width: '100%', height: `calc(100% - ${MENU_BAR_H + DOCK_GUARD}px)` }
    : win.maximized
      ? { top: MENU_BAR_H, left: 8, width: 'calc(100% - 16px)', height: `calc(100% - ${MENU_BAR_H + DOCK_GUARD}px)` }
      : { top: win.y, left: win.x, width: win.w, height: win.h };

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, scale: 0.94, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
        transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }
      };

  return (
    <motion.section
      ref={frameRef}
      {...motionProps}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      style={{ ...geometry, zIndex: 200 + win.z }}
      onMouseDown={onFocus}
      onContextMenu={(e) => e.stopPropagation()}
      className={`os-window fixed flex flex-col overflow-hidden rounded-xl ${
        isActive ? 'os-window-active' : 'os-window-idle'
      } ${dragging ? 'select-none cursor-grabbing' : ''}`}
    >
      {/* Progressive optical edge blurs */}
      <GradientBlur direction="top" size={28} />
      <GradientBlur direction="bottom" size={24} />

      {/* Titlebar with specular top highlight */}
      <header
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={() => !isCompact && onToggleMaximize()}
        className={`shrink-0 h-11 px-3 flex items-center gap-3 border-b border-black/[0.08] dark:border-white/[0.08] border-t border-white/60 dark:border-white/10 bg-[var(--mac-glass-titlebar)]/50 ${
          isCompact || win.maximized ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="mac-traffic-lights shrink-0" data-no-drag>
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="mac-traffic-btn mac-traffic-close group"
          >
            <span className="mac-traffic-glyph">✕</span>
          </button>
          <button
            onClick={onMinimize}
            aria-label={`Minimize ${title}`}
            className="mac-traffic-btn mac-traffic-minimize group"
          >
            <span className="mac-traffic-glyph">−</span>
          </button>
          <button
            onClick={onToggleMaximize}
            aria-label={`${win.maximized ? 'Restore' : 'Maximize'} ${title}`}
            className="mac-traffic-btn mac-traffic-maximize group"
          >
            <span className="mac-traffic-glyph">⤢</span>
          </button>
        </div>

        {toolbar ? (
          <div className="flex-1 min-w-0 flex items-center gap-3" data-no-drag>{toolbar}</div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center justify-center gap-2 pr-14">
            {icon}
            <span className="text-[13px] font-semibold truncate text-slate-800 dark:text-slate-100">{title}</span>
            {subtitle && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">{subtitle}</span>
            )}
          </div>
        )}
      </header>

      <div className={`flex-1 min-h-0 overflow-hidden ${bodyClassName}`}>{children}</div>

      {/* Resize corner */}
      {!isCompact && !win.maximized && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          aria-hidden="true"
        />
      )}
    </motion.section>
  );
}
