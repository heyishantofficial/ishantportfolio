import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Tv, Volume2, VolumeX, Maximize2, Minimize2, Gamepad2,
  Trophy, Sparkles, X, Minus
} from 'lucide-react';
import PacmanGame from './games/PacmanGame';
import TetrisGame from './games/TetrisGame';
import MarioGame from './games/MarioGame';
import RoadRageGame from './games/RoadRageGame';
import './retroArcade.css';

const MENU_BAR_H = 28;
const DOCK_GUARD = 76;

export default function RetroArcadeApp({ 
  onClose, 
  isMuted = false, 
  onToggleMute, 
  volume = 30 
}) {
  const [activeGame, setActiveGame] = useState(null); // null (hub) | 'pacman' | 'tetris' | 'mario' | 'roadrage'
  const [isCrtEnabled, setIsCrtEnabled] = useState(true);
  const [showVirtualPad, setShowVirtualPad] = useState(false);
  const [virtualInput, setVirtualInput] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Window dragging & positioning
  const [pos, setPos] = useState({
    x: Math.max(16, (typeof window !== 'undefined' ? (window.innerWidth - 760) / 2 : 80)),
    y: Math.max(40, (typeof window !== 'undefined' ? (window.innerHeight - 660) / 2 : 60))
  });
  const [size] = useState({
    w: 760,
    h: 660
  });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Read high scores from localStorage for lobby cards
  const [highScores, setHighScores] = useState({
    pacman: 0,
    tetris: 0,
    mario: 0,
    roadrage: 0
  });

  const refreshHighScores = useCallback(() => {
    if (typeof window === 'undefined') return;
    setHighScores({
      pacman: parseInt(localStorage.getItem('arcade_pacman_highscore') || '0', 10),
      tetris: parseInt(localStorage.getItem('arcade_tetris_highscore') || '0', 10),
      mario: parseInt(localStorage.getItem('arcade_mario_highscore') || '0', 10),
      roadrage: parseInt(localStorage.getItem('arcade_roadrage_highscore') || '0', 10)
    });
  }, []);

  useEffect(() => {
    refreshHighScores();
  }, [activeGame, refreshHighScores]);

  // Window drag handlers
  const handlePointerDown = (e) => {
    if (e.target.closest('[data-no-drag]')) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging.current || isMaximized) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragOffset.current.x));
      const newY = Math.max(MENU_BAR_H, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isMaximized, pos.x, pos.y]);

  const toggleMaximize = () => {
    setIsMaximized(prev => !prev);
  };

  const triggerPadInput = (action) => {
    setVirtualInput(action);
    setTimeout(() => setVirtualInput(null), 80);
  };

  const gamesCatalog = [
    {
      id: 'pacman',
      title: 'Pac-Man',
      genre: 'Classic Arcade Maze',
      year: '1980',
      icon: '/icons/Pacman.png',
      tag: 'ARCADE LEGEND',
      tagColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      description: 'Navigate the labyrinth, eat dots & power energizers, and turn the tables on Blinky, Pinky, Inky & Clyde.',
      controls: 'Arrows / WASD to Steer · Space to Start / Pause'
    },
    {
      id: 'tetris',
      title: 'Tetris',
      genre: 'Falling Block Puzzle',
      year: '1984',
      icon: '/icons/Tetris.png',
      tag: 'ULTIMATE PUZZLE',
      tagColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      description: 'Stack falling tetrominoes, rotate with wall kicks, perform hard drops, and trigger 4-line Tetris clears.',
      controls: 'Left/Right to Move · Up to Rotate · Space for Hard Drop · C to Hold'
    },
    {
      id: 'mario',
      title: 'Super Mario',
      genre: 'NES 2D Platformer',
      year: '1985',
      icon: '/icons/Mario.png',
      tag: 'PLATFORMER HERO',
      tagColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'Run through the Mushroom Kingdom, bounce question blocks for coins, squash Goombas, and reach the flagpole.',
      controls: 'Left/Right to Run · Space / Up to Jump · Shift to Dash'
    },
    {
      id: 'roadrage',
      title: 'Road Rage',
      genre: 'Retro Highway Racer',
      year: '1988',
      icon: '/icons/RoadRage.png',
      tag: 'HIGHWAY ACTION',
      tagColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'Speed down the multi-lane highway, weave past heavy traffic, collect fuel & nitro canisters, and avoid crashing.',
      controls: 'Left/Right to Steer · Up/Down to Accelerate · Space for Nitro Turbo'
    }
  ];

  const windowStyle = isMaximized
    ? {
        top: MENU_BAR_H,
        left: 8,
        width: 'calc(100% - 16px)',
        height: `calc(100% - ${MENU_BAR_H + DOCK_GUARD}px)`,
        zIndex: 250
      }
    : {
        top: pos.y,
        left: pos.x,
        width: size.w,
        height: size.h,
        maxWidth: '96vw',
        maxHeight: `calc(100vh - ${MENU_BAR_H + DOCK_GUARD}px)`,
        zIndex: 250
      };

  return (
    <div
      style={windowStyle}
      className="fixed flex flex-col rounded-3xl overflow-hidden bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.65)] select-none text-slate-100 font-sans transition-all duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Optional CRT Scanlines Filter Overlay */}
      {isCrtEnabled && <div className="arcade-crt-overlay arcade-crt-flicker pointer-events-none" />}

      {/* macOS Sequoia Style Titlebar */}
      <header
        onPointerDown={handlePointerDown}
        onDoubleClick={toggleMaximize}
        className="h-11 px-4 flex items-center justify-between border-b border-white/10 bg-slate-900/60 backdrop-blur-xl shrink-0 cursor-grab active:cursor-grabbing relative z-50"
      >
        {/* macOS Traffic Light Buttons */}
        <div className="flex items-center gap-2" data-no-drag>
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] text-black/60 group"
            title="Close Arcade"
          >
            <X className="w-2 h-2 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={() => {
              if (activeGame) setActiveGame(null);
              else onClose();
            }}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] text-black/60 group"
            title={activeGame ? "Return to Menu" : "Minimize"}
          >
            <Minus className="w-2 h-2 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={toggleMaximize}
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] text-black/60 group"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 className="w-2 h-2 opacity-0 group-hover:opacity-100" /> : <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100" />}
          </button>
        </div>

        {/* Center Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <img src="/icons/Games.png" alt="Arcade" className="w-4 h-4 object-contain" />
          <span>{activeGame ? `Retro Arcade · ${gamesCatalog.find(g => g.id === activeGame)?.title}` : "Retro Arcade"}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
            8-BIT
          </span>
        </div>

        {/* Right Tools Toolbar */}
        <div className="flex items-center gap-1.5" data-no-drag>
          {/* CRT Filter Toggle */}
          <button
            onClick={() => setIsCrtEnabled(!isCrtEnabled)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
              isCrtEnabled 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono hidden sm:inline">CRT</span>
          </button>

          {/* Virtual Gamepad Toggle */}
          {activeGame && (
            <button
              onClick={() => setShowVirtualPad(!showVirtualPad)}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                showVirtualPad 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle On-Screen Virtual Controller"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden sm:inline">PAD</span>
            </button>
          )}

          {/* Sound Toggle */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          )}
        </div>
      </header>

      {/* Main App Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto arcade-scrollbar relative z-30 flex flex-col bg-slate-950">
        {!activeGame ? (
          // ==================== LOBBY HUB ====================
          <div className="p-4 sm:p-7 max-w-4xl mx-auto w-full flex flex-col justify-between">
            {/* Header Showcase Banner */}
            <div className="relative rounded-3xl overflow-hidden p-5 sm:p-6 mb-6 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900/60 border border-white/15 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/20 shadow-xl shrink-0">
                  <img src="/icons/Games.png" alt="Arcade" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      CABINET READY
                    </span>
                    <span className="text-xs text-slate-400 font-mono">4 RETRO CLASSICS</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Retro Arcade <Sparkles className="w-5 h-5 text-amber-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Play hand-crafted 8-bit & 16-bit arcade masterpieces directly inside IshantOS. Powered by Web Audio synthesizers & crisp canvas engines.
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gamesCatalog.map((game) => {
                const bestScore = highScores[game.id] || 0;
                return (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className="group relative rounded-2xl p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/30 backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.015] hover:-translate-y-0.5"
                  >
                    {/* Top Row: Icon, Title, Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/5 p-1.5 border border-white/15 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                            <img src={game.icon} alt={game.title} className="w-full h-full object-contain drop-shadow" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {game.title}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {game.genre} ({game.year})
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${game.tagColor}`}>
                          {game.tag}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Bottom Row: Controls & High Score */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span>RECORD:</span>
                        <span className="text-white font-bold">{bestScore}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGame(game.id);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md border border-white/20 active:scale-95 transition-all"
                      >
                        Play Now →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Keyboard Hint */}
            <div className="mt-5 p-3 rounded-xl bg-slate-900/40 border border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>Full Keyboard Support: Arrow Keys / WASD for Direction · Space for Action · On-Screen D-pad available anytime</span>
            </div>
          </div>
        ) : (
          // ==================== ACTIVE GAME CABINET ====================
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
            {activeGame === 'pacman' && (
              <PacmanGame 
                isMuted={isMuted} 
                volume={volume} 
                onBackToMenu={() => setActiveGame(null)}
                externalInput={virtualInput}
              />
            )}
            {activeGame === 'tetris' && (
              <TetrisGame 
                isMuted={isMuted} 
                volume={volume} 
                onBackToMenu={() => setActiveGame(null)}
                externalInput={virtualInput}
              />
            )}
            {activeGame === 'mario' && (
              <MarioGame 
                isMuted={isMuted} 
                volume={volume} 
                onBackToMenu={() => setActiveGame(null)}
                externalInput={virtualInput}
              />
            )}
            {activeGame === 'roadrage' && (
              <RoadRageGame 
                isMuted={isMuted} 
                volume={volume} 
                onBackToMenu={() => setActiveGame(null)}
                externalInput={virtualInput}
              />
            )}
          </div>
        )}
      </div>

      {/* On-Screen Virtual Gamepad Bar (when enabled) */}
      {activeGame && showVirtualPad && (
        <div className="p-3 bg-slate-900/90 border-t border-white/15 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 relative z-40">
          {/* D-Pad Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onPointerDown={() => triggerPadInput('LEFT')}
              onPointerUp={() => triggerPadInput('RELEASE_DIR')}
              className="arcade-dpad-btn"
            >
              ◀
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                onPointerDown={() => triggerPadInput('UP')}
                className="arcade-dpad-btn"
              >
                ▲
              </button>
              <button
                onPointerDown={() => triggerPadInput('DOWN')}
                className="arcade-dpad-btn"
              >
                ▼
              </button>
            </div>
            <button
              onPointerDown={() => triggerPadInput('RIGHT')}
              onPointerUp={() => triggerPadInput('RELEASE_DIR')}
              className="arcade-dpad-btn"
            >
              ▶
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onPointerDown={() => triggerPadInput('B')}
              onPointerUp={() => triggerPadInput('RELEASE_ACTION')}
              className="arcade-action-btn bg-gradient-to-b from-amber-500 to-amber-600 text-white"
            >
              <span>B</span>
              <span className="text-[8px] font-normal opacity-70">
                {activeGame === 'tetris' ? 'DROP' : (activeGame === 'roadrage' ? 'NITRO' : 'RUN')}
              </span>
            </button>

            <button
              onPointerDown={() => triggerPadInput('A')}
              className="arcade-action-btn bg-gradient-to-b from-red-500 to-red-600 text-white"
            >
              <span>A</span>
              <span className="text-[8px] font-normal opacity-70">
                {activeGame === 'tetris' ? 'ROT' : (activeGame === 'mario' ? 'JUMP' : 'ACCEL')}
              </span>
            </button>

            {activeGame === 'tetris' && (
              <button
                onPointerDown={() => triggerPadInput('TURBO')}
                className="arcade-action-btn bg-gradient-to-b from-purple-500 to-purple-600 text-white"
              >
                <span>H</span>
                <span className="text-[8px] font-normal opacity-70">HOLD</span>
              </button>
            )}

            <button
              onClick={() => triggerPadInput('START')}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-white/20 text-[10px] font-bold text-slate-300 active:scale-95"
            >
              START
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
