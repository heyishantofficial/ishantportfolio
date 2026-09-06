import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playArcadeSound } from '../arcadeAudio';
import { RotateCcw, Play, Pause, Trophy, ArrowDown } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const CANVAS_WIDTH = COLS * BLOCK_SIZE;
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE;

const SHAPES = {
  I: {
    color: '#06b6d4', // Cyan
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  O: {
    color: '#eab308', // Yellow
    matrix: [
      [1, 1],
      [1, 1]
    ]
  },
  T: {
    color: '#a855f7', // Purple
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  S: {
    color: '#22c55e', // Green
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]
  },
  Z: {
    color: '#ef4444', // Red
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  },
  J: {
    color: '#3b82f6', // Blue
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  L: {
    color: '#f97316', // Orange
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  }
};

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const getRandomPiece = () => {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    matrix: SHAPES[type].matrix.map(row => [...row]),
    color: SHAPES[type].color,
    x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type].matrix[0].length / 2),
    y: 0
  };
};

export default function TetrisGame({ isMuted, volume, onBackToMenu, externalInput }) {
  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);
  const holdCanvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('arcade_tetris_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'paused' | 'gameover'

  const stateRef = useRef({
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    currentPiece: null,
    nextPiece: getRandomPiece(),
    holdPiece: null,
    canHold: true,
    dropInterval: 800,
    lastDropTime: 0,
    score: 0,
    lines: 0,
    level: 1
  });

  const checkCollision = (matrix, offsetX, offsetY, board) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX] !== null) return true;
        }
      }
    }
    return false;
  };

  const rotateMatrix = (matrix) => {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  const spawnNextPiece = useCallback(() => {
    const s = stateRef.current;
    const piece = s.nextPiece;
    piece.x = Math.floor(COLS / 2) - Math.ceil(piece.matrix[0].length / 2);
    piece.y = 0;

    if (checkCollision(piece.matrix, piece.x, piece.y, s.board)) {
      // Game Over
      setGameState('gameover');
      playArcadeSound('game_over', { isMuted, volume });
      return;
    }

    s.currentPiece = piece;
    s.nextPiece = getRandomPiece();
    s.canHold = true;
  }, [isMuted, volume]);

  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    const { matrix, x, y, color } = s.currentPiece;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const by = y + r;
          const bx = x + c;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            s.board[by][bx] = color;
          }
        }
      }
    }

    // Check line clears
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (s.board[r].every(cell => cell !== null)) {
        s.board.splice(r, 1);
        s.board.unshift(Array(COLS).fill(null));
        cleared++;
        r++; // check same row again
      }
    }

    if (cleared > 0) {
      s.lines += cleared;
      setLines(s.lines);

      // Score bonus
      const pointsTable = [0, 100, 300, 500, 800];
      const addedScore = (pointsTable[cleared] || 100) * s.level;
      s.score += addedScore;
      setScore(s.score);

      // Level progression
      const newLevel = Math.floor(s.lines / 10) + 1;
      if (newLevel !== s.level) {
        s.level = newLevel;
        setLevel(newLevel);
        s.dropInterval = Math.max(120, 800 - (newLevel - 1) * 70);
      }

      if (cleared === 4) {
        playArcadeSound('tetris_fanfare', { isMuted, volume });
      } else {
        playArcadeSound('tetris_clear', { isMuted, volume });
      }

      // Update High Score
      if (s.score > highScore) {
        setHighScore(s.score);
        localStorage.setItem('arcade_tetris_highscore', s.score.toString());
      }
    } else {
      playArcadeSound('tetris_drop', { isMuted, volume });
    }

    spawnNextPiece();
  }, [highScore, isMuted, volume, spawnNextPiece]);

  const drop = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || gameState !== 'playing') return;

    if (!checkCollision(s.currentPiece.matrix, s.currentPiece.x, s.currentPiece.y + 1, s.board)) {
      s.currentPiece.y++;
    } else {
      lockPiece();
    }
  }, [gameState, lockPiece]);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || gameState !== 'playing') return;

    let dropDistance = 0;
    while (!checkCollision(s.currentPiece.matrix, s.currentPiece.x, s.currentPiece.y + 1, s.board)) {
      s.currentPiece.y++;
      dropDistance++;
    }
    s.score += dropDistance * 2;
    setScore(s.score);
    lockPiece();
  }, [gameState, lockPiece]);

  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || gameState !== 'playing') return;
    if (!checkCollision(s.currentPiece.matrix, s.currentPiece.x - 1, s.currentPiece.y, s.board)) {
      s.currentPiece.x--;
      playArcadeSound('tetris_move', { isMuted, volume });
    }
  }, [gameState, isMuted, volume]);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || gameState !== 'playing') return;
    if (!checkCollision(s.currentPiece.matrix, s.currentPiece.x + 1, s.currentPiece.y, s.board)) {
      s.currentPiece.x++;
      playArcadeSound('tetris_move', { isMuted, volume });
    }
  }, [gameState, isMuted, volume]);

  const rotate = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || gameState !== 'playing') return;
    const rotated = rotateMatrix(s.currentPiece.matrix);

    // Wall kick attempts: center, left, right, up
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(rotated, s.currentPiece.x + kick, s.currentPiece.y, s.board)) {
        s.currentPiece.matrix = rotated;
        s.currentPiece.x += kick;
        playArcadeSound('tetris_rotate', { isMuted, volume });
        return;
      }
    }
  }, [gameState, isMuted, volume]);

  const hold = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || !s.canHold || gameState !== 'playing') return;

    const currentType = s.currentPiece.type;
    if (!s.holdPiece) {
      s.holdPiece = {
        type: currentType,
        matrix: SHAPES[currentType].matrix.map(row => [...row]),
        color: SHAPES[currentType].color
      };
      spawnNextPiece();
    } else {
      const tempType = s.holdPiece.type;
      s.holdPiece = {
        type: currentType,
        matrix: SHAPES[currentType].matrix.map(row => [...row]),
        color: SHAPES[currentType].color
      };
      s.currentPiece = {
        type: tempType,
        matrix: SHAPES[tempType].matrix.map(row => [...row]),
        color: SHAPES[tempType].color,
        x: Math.floor(COLS / 2) - Math.ceil(SHAPES[tempType].matrix[0].length / 2),
        y: 0
      };
    }
    s.canHold = false;
    playArcadeSound('tetris_rotate', { isMuted, volume });
  }, [gameState, spawnNextPiece, isMuted, volume]);

  const startNewGame = useCallback(() => {
    const s = stateRef.current;
    s.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    s.score = 0;
    s.lines = 0;
    s.level = 1;
    s.dropInterval = 800;
    s.holdPiece = null;
    s.canHold = true;
    s.nextPiece = getRandomPiece();

    setScore(0);
    setLines(0);
    setLevel(1);
    spawnNextPiece();
    setGameState('playing');
    playArcadeSound('game_start', { isMuted, volume });
  }, [spawnNextPiece, isMuted, volume]);

  // External Controls Handler (Virtual Gamepad)
  useEffect(() => {
    if (!externalInput) return;
    if (externalInput === 'LEFT') moveLeft();
    else if (externalInput === 'RIGHT') moveRight();
    else if (externalInput === 'UP') rotate();
    else if (externalInput === 'DOWN') drop();
    else if (externalInput === 'A') rotate();
    else if (externalInput === 'B') hardDrop();
    else if (externalInput === 'TURBO') hold();
    else if (externalInput === 'START') {
      if (gameState === 'ready' || gameState === 'gameover') {
        startNewGame();
      } else if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }
  }, [externalInput, moveLeft, moveRight, rotate, drop, hardDrop, hold, gameState, startNewGame]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        moveLeft();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        moveRight();
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        rotate();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        drop();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'ready' || gameState === 'gameover') {
          startNewGame();
        } else if (gameState === 'playing') {
          hardDrop();
        }
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        hold();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveLeft, moveRight, rotate, drop, hardDrop, hold, gameState, startNewGame]);

  // Game Render & Drop Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const drawMiniPiece = (miniCanvas, piece) => {
      if (!miniCanvas || !piece) return;
      const mctx = miniCanvas.getContext('2d');
      mctx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
      mctx.fillStyle = '#0f172a';
      mctx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

      const matrix = piece.matrix;
      const size = 16;
      const offsetX = (miniCanvas.width - matrix[0].length * size) / 2;
      const offsetY = (miniCanvas.height - matrix.length * size) / 2;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            mctx.fillStyle = piece.color;
            mctx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2);
            mctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            mctx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, 2);
          }
        }
      }
    };

    const render = (timestamp) => {
      const s = stateRef.current;

      // Drop timer
      if (gameState === 'playing' && timestamp - s.lastDropTime > s.dropInterval) {
        drop();
        s.lastDropTime = timestamp;
      }

      // Draw Main Board
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK_SIZE, 0);
        ctx.lineTo(c * BLOCK_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw locked board blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = s.board[r][c];
          if (color) {
            const x = c * BLOCK_SIZE;
            const y = r * BLOCK_SIZE;
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            // Specular block highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 3);
            ctx.fillRect(x + 1, y + 1, 3, BLOCK_SIZE - 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x + 1, y + BLOCK_SIZE - 3, BLOCK_SIZE - 2, 2);
          }
        }
      }

      // Draw Ghost Piece Projection
      if (s.currentPiece && gameState === 'playing') {
        let ghostY = s.currentPiece.y;
        while (!checkCollision(s.currentPiece.matrix, s.currentPiece.x, ghostY + 1, s.board)) {
          ghostY++;
        }

        const matrix = s.currentPiece.matrix;
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
              const gx = (s.currentPiece.x + c) * BLOCK_SIZE;
              const gy = (ghostY + r) * BLOCK_SIZE;
              ctx.strokeStyle = s.currentPiece.color;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            }
          }
        }

        // Draw Active Falling Piece
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
              const px = (s.currentPiece.x + c) * BLOCK_SIZE;
              const py = (s.currentPiece.y + r) * BLOCK_SIZE;
              ctx.fillStyle = s.currentPiece.color;
              ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, 3);
              ctx.fillRect(px + 1, py + 1, 3, BLOCK_SIZE - 2);
            }
          }
        }
      }

      // Draw Side previews
      drawMiniPiece(nextCanvasRef.current, s.nextPiece);
      drawMiniPiece(holdCanvasRef.current, s.holdPiece);

      // Overlays
      if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TETRIS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE to Play', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '13px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Score: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press SPACE to Try Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, drop]);

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-5 w-full h-full select-none font-sans">
      {/* Top Stats Bar */}
      <div className="flex items-center justify-between w-full max-w-[420px] mb-2 px-3 py-2 bg-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-medium">SCORE:</span>
          <span className="text-cyan-400 font-bold text-sm tracking-wider">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400 font-medium">HIGH:</span>
          <span className="text-white font-bold text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div>
            <span className="text-slate-400 mr-1">LVL:</span>
            <span className="text-amber-400 font-bold">{level}</span>
          </div>
          <div>
            <span className="text-slate-400 mr-1">LINES:</span>
            <span className="text-emerald-400 font-bold">{lines}</span>
          </div>
        </div>
      </div>

      {/* Main Play Area with Side Panels */}
      <div className="flex items-start justify-center gap-3 w-full max-w-[420px]">
        {/* Left Side: Hold Box */}
        <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">HOLD (C)</span>
          <canvas
            ref={holdCanvasRef}
            width={70}
            height={70}
            className="rounded-xl border border-slate-700/60 bg-slate-950"
          />
        </div>

        {/* Center: Main Tetris Well */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] bg-black shrink-0">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="pixel-art block"
            style={{ maxHeight: 'calc(74vh - 120px)' }}
          />
        </div>

        {/* Right Side: Next Box */}
        <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">NEXT</span>
          <canvas
            ref={nextCanvasRef}
            width={70}
            height={70}
            className="rounded-xl border border-slate-700/60 bg-slate-950"
          />
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="flex items-center justify-between w-full max-w-[420px] mt-3 px-2 text-xs">
        <button
          onClick={onBackToMenu}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold transition-colors"
        >
          ← Games Menu
        </button>

        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <button
              onClick={() => setGameState('paused')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-white/10"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : (
            <button
              onClick={() => {
                if (gameState === 'ready' || gameState === 'gameover') {
                  startNewGame();
                } else {
                  setGameState('playing');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Play className="w-3.5 h-3.5" /> {gameState === 'paused' ? 'Resume' : 'Play'}
            </button>
          )}

          <button
            onClick={startNewGame}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
