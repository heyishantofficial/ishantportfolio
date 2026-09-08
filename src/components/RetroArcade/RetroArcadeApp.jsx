import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, VolumeX, Maximize2, Minimize2, Gamepad2,
  X, Minus
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
  const [showVirtualPad, setShowVirtualPad] = useState(false);
  const [virtualInput, setVirtualInput] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Window dragging & positioning
  const [pos, setPos] = useState({
    x: Math.max(16, (typeof window !== 'undefined' ? (window.innerWidth - 680) / 2 : 80)),
    y: Math.max(40, (typeof window !== 'undefined' ? (window.innerHeight - 560) / 2 : 60))
  });
  const [size] = useState({
    w: 680,
    h: 560
  });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Read high scores from localStorage
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
      genre: 'Arcade',
      year: '1980',
      icon: '/icons/Pacman.png'
    },
    {
      id: 'tetris',
      title: 'Tetris',
      genre: 'Puzzle',
      year: '1984',
      icon: '/icons/Tetris.png'
    },
    {
      id: 'mario',
      title: 'Super Mario',
      genre: 'Platformer',
      year: '1985',
      icon: '/icons/Mario.png'
    },
    {
      id: 'roadrage',
      title: 'Road Rage',
      genre: 'Racing',
      year: '1988',
      icon: '/icons/RoadRage.png'
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
      className="retro-arcade-app retro-arcade-window fixed flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden bg-white/70 dark:bg-slate-900/75 backdrop-blur-3xl border border-white/60 dark:border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.35)] select-none text-slate-800 dark:text-slate-100 font-sans transition-all duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* macOS Sequoia Style Titlebar */}
      <header
        onPointerDown={handlePointerDown}
        onDoubleClick={toggleMaximize}
        className="h-10 sm:h-11 px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl shrink-0 cursor-grab active:cursor-grabbing relative z-50"
      >
        {/* macOS Traffic Light Buttons */}
        <div className="flex items-center gap-2" data-no-drag>
          <button
            onClick={onClose}
            className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center text-[8px] font-black text-black/80 shadow-sm group cursor-pointer"
            title="Close Games"
            aria-label="Close Games"
          >
            <X className="w-2.5 h-2.5 opacity-80 group-hover:opacity-100" />
          </button>
          <button
            onClick={() => {
              if (activeGame) setActiveGame(null);
              else onClose();
            }}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] text-black/60 group cursor-pointer"
            title={activeGame ? "Back to Games" : "Minimize"}
          >
            <Minus className="w-2 h-2 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={toggleMaximize}
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] text-black/60 group cursor-pointer"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 className="w-2 h-2 opacity-0 group-hover:opacity-100" /> : <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100" />}
          </button>
        </div>

        {/* Center Title */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <img src="/icons/Games.png" alt="Games" className="w-4 h-4 object-contain drop-shadow-xs" />
          <span>{activeGame ? `Games · ${gamesCatalog.find(g => g.id === activeGame)?.title}` : "Games"}</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2" data-no-drag>
          {/* Virtual Gamepad Toggle (during active game) */}
          {activeGame && (
            <button
              onClick={() => setShowVirtualPad(!showVirtualPad)}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                showVirtualPad 
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title="Toggle Virtual Gamepad"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Toggle */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto arcade-scrollbar relative z-30 flex flex-col">
        {!activeGame ? (
          // ==================== CLEAN GAMES LOBBY ====================
          <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full flex flex-col justify-center flex-1">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Games
              </h2>
            </div>

            {/* 4 Clean Game Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gamesCatalog.map((game) => {
                const bestScore = highScores[game.id] || 0;
                return (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 backdrop-blur-xl transition-all duration-200 shadow-xs hover:shadow-md group cursor-pointer"
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/30 dark:bg-black/20 p-1.5 border border-white/40 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        <img src={game.icon} alt={game.title} className="w-full h-full object-contain drop-shadow" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {game.year} · {game.genre}
                        </p>
                        {bestScore > 0 && (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
                            Best: {bestScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGame(game.id);
                      }}
                      className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm hover:shadow active:scale-95 transition-all shrink-0 ml-3 cursor-pointer"
                    >
                      Play Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ==================== ACTIVE GAME ====================
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full bg-slate-950 p-2">
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

      {/* On-Screen Virtual Gamepad Bar (when toggled on) */}
      {activeGame && showVirtualPad && (
        <div className="p-3 bg-slate-900/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 relative z-40">
          {/* D-Pad */}
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
