import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playArcadeSound } from '../arcadeAudio';
import { RotateCcw, Play, Pause, Trophy, Heart } from 'lucide-react';

const TILE_SIZE = 20;
const COLS = 19;
const ROWS = 21;
const CANVAS_WIDTH = COLS * TILE_SIZE;
const CANVAS_HEIGHT = ROWS * TILE_SIZE;

// 1 = Wall, 2 = Dot, 3 = Power Pellet, 0 = Empty, 4 = Ghost Gate
const INITIAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export default function PacmanGame({ isMuted, volume, onBackToMenu, externalInput }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('arcade_pacman_highscore') || '0', 10);
  });
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'paused' | 'gameover' | 'victory'

  const stateRef = useRef({
    grid: INITIAL_MAP.map(r => [...r]),
    pacman: {
      x: 9 * TILE_SIZE + TILE_SIZE / 2,
      y: 16 * TILE_SIZE + TILE_SIZE / 2,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      speed: 2.2,
      mouth: 0.2,
      mouthSpeed: 0.04
    },
    ghosts: [
      { id: 'blinky', name: 'Blinky', color: '#ef4444', x: 9 * TILE_SIZE + 10, y: 8 * TILE_SIZE + 10, dirX: -1, dirY: 0, speed: 1.8, mode: 'chase', targetX: 0, targetY: 0 },
      { id: 'pinky', name: 'Pinky', color: '#f472b6', x: 9 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, dirX: 0, dirY: -1, speed: 1.7, mode: 'chase', targetX: 0, targetY: 0 },
      { id: 'inky', name: 'Inky', color: '#38bdf8', x: 8 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, dirX: 1, dirY: 0, speed: 1.6, mode: 'chase', targetX: 0, targetY: 0 },
      { id: 'clyde', name: 'Clyde', color: '#fb923c', x: 10 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, dirX: 0, dirY: -1, speed: 1.6, mode: 'scatter', targetX: 0, targetY: 0 }
    ],
    frightenedTimer: 0,
    ghostEatenCount: 0,
    dotsRemaining: 0,
    score: 0,
    lives: 3
  });

  // Count initial dots
  useEffect(() => {
    let count = 0;
    INITIAL_MAP.forEach(row => {
      row.forEach(cell => {
        if (cell === 2 || cell === 3) count++;
      });
    });
    stateRef.current.dotsRemaining = count;
  }, []);

  const resetPositions = useCallback(() => {
    const s = stateRef.current;
    s.pacman.x = 9 * TILE_SIZE + TILE_SIZE / 2;
    s.pacman.y = 16 * TILE_SIZE + TILE_SIZE / 2;
    s.pacman.dirX = 0;
    s.pacman.dirY = 0;
    s.pacman.nextDirX = 0;
    s.pacman.nextDirY = 0;

    s.ghosts[0].x = 9 * TILE_SIZE + 10;
    s.ghosts[0].y = 8 * TILE_SIZE + 10;
    s.ghosts[0].dirX = -1;
    s.ghosts[0].dirY = 0;

    s.ghosts[1].x = 9 * TILE_SIZE + 10;
    s.ghosts[1].y = 10 * TILE_SIZE + 10;
    s.ghosts[1].dirX = 0;
    s.ghosts[1].dirY = -1;

    s.ghosts[2].x = 8 * TILE_SIZE + 10;
    s.ghosts[2].y = 10 * TILE_SIZE + 10;
    s.ghosts[2].dirX = 1;
    s.ghosts[2].dirY = 0;

    s.ghosts[3].x = 10 * TILE_SIZE + 10;
    s.ghosts[3].y = 10 * TILE_SIZE + 10;
    s.ghosts[3].dirX = 0;
    s.ghosts[3].dirY = -1;

    s.ghosts.forEach(g => {
      g.mode = 'chase';
    });
    s.frightenedTimer = 0;
  }, []);

  const startNewGame = useCallback(() => {
    stateRef.current.grid = INITIAL_MAP.map(r => [...r]);
    stateRef.current.score = 0;
    stateRef.current.lives = 3;
    setScore(0);
    setLives(3);

    let count = 0;
    INITIAL_MAP.forEach(row => {
      row.forEach(cell => {
        if (cell === 2 || cell === 3) count++;
      });
    });
    stateRef.current.dotsRemaining = count;

    resetPositions();
    setGameState('playing');
    playArcadeSound('game_start', { isMuted, volume });
  }, [isMuted, volume, resetPositions]);

  // Handle Input (External virtual gamepad or keyboard)
  const handleDirection = useCallback((dx, dy) => {
    stateRef.current.pacman.nextDirX = dx;
    stateRef.current.pacman.nextDirY = dy;
    if (gameState === 'ready') {
      setGameState('playing');
    }
  }, [gameState]);

  useEffect(() => {
    if (!externalInput) return;
    if (externalInput === 'UP') handleDirection(0, -1);
    else if (externalInput === 'DOWN') handleDirection(0, 1);
    else if (externalInput === 'LEFT') handleDirection(-1, 0);
    else if (externalInput === 'RIGHT') handleDirection(1, 0);
    else if (externalInput === 'START' || externalInput === 'A') {
      if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
        startNewGame();
      } else if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }
  }, [externalInput, handleDirection, gameState, startNewGame]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleDirection(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleDirection(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleDirection(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleDirection(1, 0);
      } else if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
          startNewGame();
        } else {
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDirection, gameState, startNewGame]);

  // Game Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const isWall = (gridX, gridY) => {
      if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return false; // wrap-around tunnel
      return stateRef.current.grid[gridY][gridX] === 1;
    };

    const canMove = (x, y, dx, dy) => {
      const targetX = x + dx * TILE_SIZE * 0.55;
      const targetY = y + dy * TILE_SIZE * 0.55;
      const gX = Math.floor(targetX / TILE_SIZE);
      const gY = Math.floor(targetY / TILE_SIZE);
      return !isWall(gX, gY);
    };

    const update = () => {
      const s = stateRef.current;
      if (gameState !== 'playing') return;

      // 1. Pacman Movement & Turning
      const p = s.pacman;
      if (p.nextDirX !== 0 || p.nextDirY !== 0) {
        // Try turning if aligned with grid
        const currentGX = Math.floor(p.x / TILE_SIZE);
        const currentGY = Math.floor(p.y / TILE_SIZE);
        const centerX = currentGX * TILE_SIZE + TILE_SIZE / 2;
        const centerY = currentGY * TILE_SIZE + TILE_SIZE / 2;

        const distCenter = Math.hypot(p.x - centerX, p.y - centerY);
        if (distCenter < 5 && canMove(centerX, centerY, p.nextDirX, p.nextDirY)) {
          p.x = centerX;
          p.y = centerY;
          p.dirX = p.nextDirX;
          p.dirY = p.nextDirY;
          p.nextDirX = 0;
          p.nextDirY = 0;
        } else if (p.dirX === -p.nextDirX && p.dirY === -p.nextDirY) {
          // Instant 180 reverse
          p.dirX = p.nextDirX;
          p.dirY = p.nextDirY;
          p.nextDirX = 0;
          p.nextDirY = 0;
        }
      }

      if (canMove(p.x, p.y, p.dirX, p.dirY)) {
        p.x += p.dirX * p.speed;
        p.y += p.dirY * p.speed;

        // Tunnel warp
        if (p.x < 0) p.x = CANVAS_WIDTH - 2;
        else if (p.x >= CANVAS_WIDTH) p.x = 2;

        p.mouth += p.mouthSpeed;
        if (p.mouth > 0.45 || p.mouth < 0.05) p.mouthSpeed = -p.mouthSpeed;
      }

      // 2. Eat Dots & Pellets
      const pacTileX = Math.floor(p.x / TILE_SIZE);
      const pacTileY = Math.floor(p.y / TILE_SIZE);

      if (pacTileX >= 0 && pacTileX < COLS && pacTileY >= 0 && pacTileY < ROWS) {
        const cell = s.grid[pacTileY][pacTileX];
        if (cell === 2) {
          s.grid[pacTileY][pacTileX] = 0;
          s.score += 10;
          s.dotsRemaining--;
          setScore(s.score);
          if (s.score % 40 === 0) {
            playArcadeSound('pacman_chomp', { isMuted, volume });
          }
        } else if (cell === 3) {
          s.grid[pacTileY][pacTileX] = 0;
          s.score += 50;
          s.dotsRemaining--;
          s.frightenedTimer = 450; // ~7.5 seconds
          s.ghostEatenCount = 0;
          s.ghosts.forEach(g => {
            if (g.mode !== 'eaten') g.mode = 'frightened';
          });
          setScore(s.score);
          playArcadeSound('pacman_pellet', { isMuted, volume });
        }

        if (s.dotsRemaining <= 0) {
          setGameState('victory');
          playArcadeSound('mario_win', { isMuted, volume });
          return;
        }
      }

      // Update High Score
      if (s.score > highScore) {
        setHighScore(s.score);
        localStorage.setItem('arcade_pacman_highscore', s.score.toString());
      }

      // 3. Frightened Timer
      if (s.frightenedTimer > 0) {
        s.frightenedTimer--;
        if (s.frightenedTimer === 0) {
          s.ghosts.forEach(g => {
            if (g.mode === 'frightened') g.mode = 'chase';
          });
        }
      }

      // 4. Ghosts AI
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      s.ghosts.forEach((ghost, idx) => {
        // Ghost speed
        const currentSpeed = ghost.mode === 'frightened' ? 1.0 : (ghost.mode === 'eaten' ? 3.0 : ghost.speed);

        // Tunnel warp
        if (ghost.x < 0) ghost.x = CANVAS_WIDTH - 2;
        else if (ghost.x >= CANVAS_WIDTH) ghost.x = 2;

        const gTileX = Math.floor(ghost.x / TILE_SIZE);
        const gTileY = Math.floor(ghost.y / TILE_SIZE);
        const gCenterX = gTileX * TILE_SIZE + TILE_SIZE / 2;
        const gCenterY = gTileY * TILE_SIZE + TILE_SIZE / 2;

        const distCenter = Math.hypot(ghost.x - gCenterX, ghost.y - gCenterY);

        if (distCenter < 3) {
          // Reached junction, choose best direction
          const validDirs = directions.filter(d => {
            // Cannot reverse 180 directly unless dead end
            if (d.dx === -ghost.dirX && d.dy === -ghost.dirY) return false;
            const nextX = gTileX + d.dx;
            const nextY = gTileY + d.dy;
            if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return true;
            return s.grid[nextY][nextX] !== 1 && s.grid[nextY][nextX] !== 4;
          });

          if (validDirs.length > 0) {
            let chosen = validDirs[0];

            if (ghost.mode === 'frightened') {
              // Pick random direction
              chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
            } else if (ghost.mode === 'eaten') {
              // Target ghost house
              const targetX = 9 * TILE_SIZE;
              const targetY = 9 * TILE_SIZE;
              chosen = validDirs.reduce((best, d) => {
                const nx = (gTileX + d.dx) * TILE_SIZE;
                const ny = (gTileY + d.dy) * TILE_SIZE;
                const dist = Math.hypot(nx - targetX, ny - targetY);
                return dist < best.dist ? { dir: d, dist } : best;
              }, { dir: validDirs[0], dist: Infinity }).dir;

              if (Math.hypot(ghost.x - targetX, ghost.y - targetY) < 15) {
                ghost.mode = 'chase';
              }
            } else {
              // Target Pacman with slight variations
              let targetX = p.x;
              let targetY = p.y;
              if (idx === 1) { // Pinky ambush
                targetX += p.dirX * 4 * TILE_SIZE;
                targetY += p.dirY * 4 * TILE_SIZE;
              } else if (idx === 3) { // Clyde scatter if too close
                const dPac = Math.hypot(ghost.x - p.x, ghost.y - p.y);
                if (dPac < 120) {
                  targetX = 0;
                  targetY = CANVAS_HEIGHT;
                }
              }

              chosen = validDirs.reduce((best, d) => {
                const nx = (gTileX + d.dx) * TILE_SIZE;
                const ny = (gTileY + d.dy) * TILE_SIZE;
                const dist = Math.hypot(nx - targetX, ny - targetY);
                return dist < best.dist ? { dir: d, dist } : best;
              }, { dir: validDirs[0], dist: Infinity }).dir;
            }

            ghost.dirX = chosen.dx;
            ghost.dirY = chosen.dy;
          } else {
            // Reverse
            ghost.dirX = -ghost.dirX;
            ghost.dirY = -ghost.dirY;
          }
        }

        ghost.x += ghost.dirX * currentSpeed;
        ghost.y += ghost.dirY * currentSpeed;

        // 5. Collision with Pac-Man
        const distPac = Math.hypot(ghost.x - p.x, ghost.y - p.y);
        if (distPac < TILE_SIZE * 0.75) {
          if (ghost.mode === 'frightened') {
            // Eat ghost
            ghost.mode = 'eaten';
            s.ghostEatenCount++;
            const points = 200 * Math.pow(2, s.ghostEatenCount - 1);
            s.score += points;
            setScore(s.score);
            playArcadeSound('pacman_ghost', { isMuted, volume });
          } else if (ghost.mode === 'chase' || ghost.mode === 'scatter') {
            // Pac-Man dies
            s.lives--;
            setLives(s.lives);
            playArcadeSound('pacman_death', { isMuted, volume });

            if (s.lives <= 0) {
              setGameState('gameover');
              playArcadeSound('game_over', { isMuted, volume });
            } else {
              resetPositions();
            }
          }
        }
      });
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Walls & Pellets
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = s.grid[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (cell === 1) {
            // Retro blue neon wall
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (cell === 2) {
            // Regular Dot
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 3) {
            // Energizer Power Pellet (pulsing)
            const pulse = 4 + Math.sin(Date.now() / 150) * 1.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (cell === 4) {
            // Ghost Gate
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
          }
        }
      }

      // Draw Pac-Man
      const p = s.pacman;
      ctx.save();
      ctx.translate(p.x, p.y);

      let angle = 0;
      if (p.dirX === 1) angle = 0;
      else if (p.dirX === -1) angle = Math.PI;
      else if (p.dirY === -1) angle = -Math.PI / 2;
      else if (p.dirY === 1) angle = Math.PI / 2;

      ctx.rotate(angle);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      const mouth = Math.max(0.04, Math.min(0.48, p.mouth));
      ctx.arc(0, 0, TILE_SIZE / 2 - 1, mouth * Math.PI, (2 - mouth) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();

      // Draw Ghosts
      s.ghosts.forEach(ghost => {
        ctx.save();
        ctx.translate(ghost.x, ghost.y);

        const radius = TILE_SIZE / 2 - 1;

        if (ghost.mode === 'eaten') {
          // Only eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, -2, 3.5, 0, Math.PI * 2);
          ctx.arc(4, -2, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(-4 + ghost.dirX * 1.5, -2 + ghost.dirY * 1.5, 2, 0, Math.PI * 2);
          ctx.arc(4 + ghost.dirX * 1.5, -2 + ghost.dirY * 1.5, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ghost body
          let bodyColor = ghost.color;
          if (ghost.mode === 'frightened') {
            bodyColor = s.frightenedTimer < 120 && Math.floor(s.frightenedTimer / 10) % 2 === 0
              ? '#ffffff'
              : '#2563eb';
          }

          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.arc(0, -2, radius, Math.PI, 0, false);
          ctx.lineTo(radius, radius);
          // Wavy skirt
          ctx.lineTo(radius * 0.4, radius - 4);
          ctx.lineTo(0, radius);
          ctx.lineTo(-radius * 0.4, radius - 4);
          ctx.lineTo(-radius, radius);
          ctx.closePath();
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, -3, 3, 0, Math.PI * 2);
          ctx.arc(4, -3, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = ghost.mode === 'frightened' ? '#ff9090' : '#1e3a8a';
          ctx.beginPath();
          ctx.arc(-4 + ghost.dirX * 1.2, -3 + ghost.dirY * 1.2, 1.6, 0, Math.PI * 2);
          ctx.arc(4 + ghost.dirX * 1.2, -3 + ghost.dirY * 1.2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Overlay text if not playing
      if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('READY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press SPACE or Arrow Key to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '13px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Final Score: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      } else if (gameState === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '13px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`All Dots Cleared: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE for Next Round', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, isMuted, volume, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-5 w-full h-full select-none font-sans">
      {/* Top HUD */}
      <div className="flex items-center justify-between w-full max-w-[420px] mb-2 px-3 py-2 bg-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-medium">SCORE:</span>
          <span className="text-amber-400 font-bold text-sm tracking-wider">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400 font-medium">HIGH:</span>
          <span className="text-white font-bold text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1">LIVES:</span>
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-200" />
          ))}
        </div>
      </div>

      {/* Canvas Arcade Cabinet Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pixel-art block max-w-full h-auto"
          style={{ maxHeight: 'calc(74vh - 120px)' }}
        />
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
                if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
                  startNewGame();
                } else {
                  setGameState('playing');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md"
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
