import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playArcadeSound } from '../arcadeAudio';
import { RotateCcw, Play, Pause, Trophy, Coins } from 'lucide-react';

const CANVAS_WIDTH = 460;
const CANVAS_HEIGHT = 280;
const GRAVITY = 0.55;

export default function MarioGame({ isMuted, volume, onBackToMenu, externalInput }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('arcade_mario_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'paused' | 'gameover' | 'victory'

  const stateRef = useRef({
    cameraX: 0,
    mario: {
      x: 50,
      y: 190,
      vx: 0,
      vy: 0,
      w: 18,
      h: 26,
      grounded: true,
      facing: 'right',
      runFrame: 0,
      isDying: false
    },
    keys: { left: false, right: false, jump: false, run: false },
    blocks: [],
    coins: [],
    goombas: [],
    flagpole: { x: 1800, y: 50, h: 180, reached: false, flagY: 60 },
    castle: { x: 1860, y: 130 },
    levelWidth: 2050,
    score: 0,
    coinCount: 0,
    lives: 3
  });

  const initLevel = useCallback(() => {
    const s = stateRef.current;
    s.cameraX = 0;
    s.mario = {
      x: 60,
      y: 180,
      vx: 0,
      vy: 0,
      w: 18,
      h: 26,
      grounded: true,
      facing: 'right',
      runFrame: 0,
      isDying: false
    };

    // Construct level blocks
    const blocks = [];
    // Floor
    blocks.push({ x: 0, y: 230, w: 700, h: 50, type: 'ground' });
    blocks.push({ x: 740, y: 230, w: 550, h: 50, type: 'ground' }); // pit between 700-740
    blocks.push({ x: 1340, y: 230, w: 750, h: 50, type: 'ground' }); // pit between 1290-1340

    // Pipes
    blocks.push({ x: 260, y: 190, w: 36, h: 40, type: 'pipe' });
    blocks.push({ x: 440, y: 170, w: 36, h: 60, type: 'pipe' });
    blocks.push({ x: 620, y: 150, w: 36, h: 80, type: 'pipe' });
    blocks.push({ x: 1100, y: 170, w: 36, h: 60, type: 'pipe' });
    blocks.push({ x: 1550, y: 190, w: 36, h: 40, type: 'pipe' });

    // Question & Brick Blocks
    const qBlocks = [
      { x: 180, y: 150, type: 'question', content: 'coin', hit: false, bumpY: 0 },
      { x: 340, y: 150, type: 'brick', hit: false, bumpY: 0 },
      { x: 362, y: 150, type: 'question', content: 'coin', hit: false, bumpY: 0 },
      { x: 384, y: 150, type: 'brick', hit: false, bumpY: 0 },
      { x: 406, y: 150, type: 'question', content: 'coin', hit: false, bumpY: 0 },
      { x: 384, y: 80, type: 'question', content: 'coin', hit: false, bumpY: 0 },

      { x: 860, y: 150, type: 'question', content: 'coin', hit: false, bumpY: 0 },
      { x: 920, y: 150, type: 'brick', hit: false, bumpY: 0 },
      { x: 942, y: 150, type: 'brick', hit: false, bumpY: 0 },
      { x: 980, y: 80, type: 'brick', hit: false, bumpY: 0 },
      { x: 1002, y: 80, type: 'brick', hit: false, bumpY: 0 },
      { x: 1024, y: 80, type: 'question', content: 'coin', hit: false, bumpY: 0 },

      // Staircase near flagpole
      { x: 1680, y: 210, type: 'stair', w: 20, h: 20 },
      { x: 1700, y: 190, type: 'stair', w: 20, h: 40 },
      { x: 1720, y: 170, type: 'stair', w: 20, h: 60 },
      { x: 1740, y: 150, type: 'stair', w: 20, h: 80 },
    ];
    s.blocks = [...blocks, ...qBlocks];

    // Goombas
    s.goombas = [
      { x: 320, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 },
      { x: 520, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 },
      { x: 570, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 },
      { x: 800, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 },
      { x: 1180, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 },
      { x: 1450, y: 212, w: 18, h: 18, vx: -0.8, squashed: false, squashTimer: 0 }
    ];

    s.coins = [];
    s.flagpole.reached = false;
    s.flagpole.flagY = 60;
  }, []);

  const startNewGame = useCallback(() => {
    stateRef.current.score = 0;
    stateRef.current.coinCount = 0;
    stateRef.current.lives = 3;
    setScore(0);
    setCoins(0);
    setLives(3);
    initLevel();
    setGameState('playing');
    playArcadeSound('game_start', { isMuted, volume });
  }, [initLevel, isMuted, volume]);

  const jump = useCallback(() => {
    const m = stateRef.current.mario;
    if (m.grounded && !m.isDying) {
      m.vy = -10.8;
      m.grounded = false;
      playArcadeSound('mario_jump', { isMuted, volume });
    }
  }, [isMuted, volume]);

  // Virtual Gamepad & Keyboard Input Handling
  useEffect(() => {
    const keys = stateRef.current.keys;
    if (!externalInput) return;

    if (externalInput === 'LEFT') { keys.left = true; keys.right = false; }
    else if (externalInput === 'RIGHT') { keys.right = true; keys.left = false; }
    else if (externalInput === 'RELEASE_DIR') { keys.left = false; keys.right = false; }
    else if (externalInput === 'A' || externalInput === 'UP') { jump(); }
    else if (externalInput === 'B') { keys.run = true; }
    else if (externalInput === 'RELEASE_ACTION') { keys.run = false; }
    else if (externalInput === 'START') {
      if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
        startNewGame();
      } else if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }
  }, [externalInput, jump, gameState, startNewGame]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const keys = stateRef.current.keys;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        keys.left = true;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keys.right = true;
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
          startNewGame();
        } else {
          jump();
        }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keys.run = true;
      }
    };

    const onKeyUp = (e) => {
      const keys = stateRef.current.keys;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [jump, gameState, startNewGame]);

  // Main Platformer Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const update = () => {
      const s = stateRef.current;
      if (gameState !== 'playing') return;

      const m = s.mario;

      if (!m.isDying && !s.flagpole.reached) {
        // Horizontal acceleration
        const maxSpeed = s.keys.run ? 4.2 : 2.8;
        const accel = 0.35;
        const friction = 0.78;

        if (s.keys.left) {
          m.vx = Math.max(-maxSpeed, m.vx - accel);
          m.facing = 'left';
          m.runFrame += 0.2;
        } else if (s.keys.right) {
          m.vx = Math.min(maxSpeed, m.vx + accel);
          m.facing = 'right';
          m.runFrame += 0.2;
        } else {
          m.vx *= friction;
          if (Math.abs(m.vx) < 0.1) m.vx = 0;
        }

        // Apply Gravity
        m.vy += GRAVITY;
        if (m.vy > 10) m.vy = 10;

        // Move horizontally and check block collisions
        m.x += m.vx;
        if (m.x < s.cameraX) m.x = s.cameraX;

        s.blocks.forEach(b => {
          const bw = b.w || 20;
          const bh = b.h || 20;
          if (
            m.x < b.x + bw &&
            m.x + m.w > b.x &&
            m.y < b.y + bh &&
            m.y + m.h > b.y
          ) {
            if (m.vx > 0) m.x = b.x - m.w;
            else if (m.vx < 0) m.x = b.x + bw;
            m.vx = 0;
          }
        });

        // Move vertically and check block collisions
        m.y += m.vy;
        m.grounded = false;

        s.blocks.forEach(b => {
          const bw = b.w || 20;
          const bh = b.h || 20;
          if (
            m.x < b.x + bw &&
            m.x + m.w > b.x &&
            m.y < b.y + bh &&
            m.y + m.h > b.y
          ) {
            if (m.vy > 0) {
              // Landed on top
              m.y = b.y - m.h;
              m.vy = 0;
              m.grounded = true;
            } else if (m.vy < 0) {
              // Hit block from below!
              m.y = b.y + bh;
              m.vy = 1;

              if (b.type === 'question' && !b.hit) {
                b.hit = true;
                b.bumpY = -8;
                s.score += 200;
                s.coinCount++;
                setScore(s.score);
                setCoins(s.coinCount);

                // Spawn bouncing coin
                s.coins.push({
                  x: b.x + 4,
                  y: b.y - 10,
                  vy: -6,
                  life: 25
                });
                playArcadeSound('mario_coin', { isMuted, volume });
              } else if (b.type === 'brick') {
                b.bumpY = -6;
                playArcadeSound('mario_bump', { isMuted, volume });
              }
            }
          }
        });

        // Camera follow
        if (m.x - s.cameraX > CANVAS_WIDTH * 0.45) {
          s.cameraX = m.x - CANVAS_WIDTH * 0.45;
        }

        // Pit Fall Check
        if (m.y > CANVAS_HEIGHT + 20) {
          m.isDying = true;
          s.lives--;
          setLives(s.lives);
          playArcadeSound('pacman_death', { isMuted, volume });
          if (s.lives <= 0) {
            setGameState('gameover');
            playArcadeSound('game_over', { isMuted, volume });
          } else {
            setTimeout(() => initLevel(), 800);
          }
        }

        // Flagpole victory check
        if (m.x + m.w >= s.flagpole.x && !s.flagpole.reached) {
          s.flagpole.reached = true;
          s.score += 1000;
          setScore(s.score);
          playArcadeSound('mario_win', { isMuted, volume });
          setTimeout(() => setGameState('victory'), 2200);
        }
      }

      // Flagpole animation
      if (s.flagpole.reached && s.flagpole.flagY < s.flagpole.y + s.flagpole.h - 20) {
        s.flagpole.flagY += 2.5;
        s.mario.y = Math.min(230 - s.mario.h, s.mario.y + 2.5);
      }

      // Smooth Block Bumps
      s.blocks.forEach(b => {
        if (b.bumpY < 0) b.bumpY += 1.2;
        if (b.bumpY > 0) b.bumpY = 0;
      });

      // Update Bouncing Coins
      s.coins.forEach((c, idx) => {
        c.y += c.vy;
        c.vy += 0.4;
        c.life--;
        if (c.life <= 0) s.coins.splice(idx, 1);
      });

      // Update Goombas
      s.goombas.forEach(g => {
        if (g.squashed) {
          g.squashTimer++;
          return;
        }

        g.x += g.vx;

        // Turn around at obstacles or edge
        s.blocks.forEach(b => {
          const bw = b.w || 20;
          const bh = b.h || 20;
          if (
            g.x < b.x + bw &&
            g.x + g.w > b.x &&
            g.y < b.y + bh &&
            g.y + g.h > b.y
          ) {
            g.vx = -g.vx;
          }
        });

        // Mario & Goomba Collision
        if (!m.isDying && !s.flagpole.reached) {
          if (
            m.x < g.x + g.w &&
            m.x + m.w > g.x &&
            m.y < g.y + g.h &&
            m.y + m.h > g.y
          ) {
            if (m.vy > 0 && m.y + m.h - m.vy <= g.y + 6) {
              // Stomped on Goomba!
              g.squashed = true;
              m.vy = -7.5; // Bounce
              s.score += 100;
              setScore(s.score);
              playArcadeSound('mario_stomp', { isMuted, volume });
            } else {
              // Mario hit by Goomba
              m.isDying = true;
              s.lives--;
              setLives(s.lives);
              playArcadeSound('pacman_death', { isMuted, volume });
              if (s.lives <= 0) {
                setGameState('gameover');
                playArcadeSound('game_over', { isMuted, volume });
              } else {
                setTimeout(() => initLevel(), 800);
              }
            }
          }
        }
      });

      // Update High Score
      if (s.score > highScore) {
        setHighScore(s.score);
        localStorage.setItem('arcade_mario_highscore', s.score.toString());
      }
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#60a5fa');
      skyGrad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Clouds & Hills in background
      for (let i = 0; i < 8; i++) {
        const cloudX = i * 280 + 40;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(cloudX, 50, 16, 0, Math.PI * 2);
        ctx.arc(cloudX + 18, 44, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 38, 50, 16, 0, Math.PI * 2);
        ctx.fill();

        // Green Bush / Hill
        const bushX = i * 360 + 100;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(bushX, 230, 24, Math.PI, 0);
        ctx.arc(bushX + 24, 230, 32, Math.PI, 0);
        ctx.arc(bushX + 48, 230, 24, Math.PI, 0);
        ctx.fill();
      }

      // Draw Blocks
      s.blocks.forEach(b => {
        const bw = b.w || 20;
        const bh = b.h || 20;
        const by = b.y + (b.bumpY || 0);

        if (b.type === 'ground') {
          ctx.fillStyle = '#c2410c';
          ctx.fillRect(b.x, by, bw, bh);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(b.x, by, bw, 6);
        } else if (b.type === 'pipe') {
          // Green Warp Pipe
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(b.x, by, bw, bh);
          ctx.fillRect(b.x - 2, by, bw + 4, 12);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(b.x + 2, by, 4, bh);
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(b.x - 2, by, bw + 4, 12);
          ctx.strokeRect(b.x, by + 12, bw, bh - 12);
        } else if (b.type === 'question') {
          if (b.hit) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(b.x, by, bw, bh);
            ctx.strokeStyle = '#451a03';
            ctx.strokeRect(b.x, by, bw, bh);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(b.x, by, bw, bh);
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(b.x, by, bw, bh);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('?', b.x + bw / 2, by + bh / 2 + 5);
          }
        } else if (b.type === 'brick') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(b.x, by, bw, bh);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(b.x, by, bw, bh);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(b.x, by + 9, bw, 2);
          ctx.fillRect(b.x + 9, by, 2, 9);
          ctx.fillRect(b.x + 5, by + 11, 2, 9);
        } else if (b.type === 'stair') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(b.x, by, bw, bh);
          ctx.strokeStyle = '#451a03';
          ctx.strokeRect(b.x, by, bw, bh);
        }
      });

      // Draw Flagpole & Castle
      const fp = s.flagpole;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(fp.x, fp.y, 4, fp.h);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(fp.x + 2, fp.y, 6, 0, Math.PI * 2);
      ctx.fill();
      // Flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(fp.x + 4, fp.flagY);
      ctx.lineTo(fp.x + 24, fp.flagY + 10);
      ctx.lineTo(fp.x + 4, fp.flagY + 20);
      ctx.closePath();
      ctx.fill();

      // Castle
      const c = s.castle;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(c.x, c.y, 80, 100);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 30, c.y + 60, 20, 40); // Door
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(c.x + 38, c.y - 12, 4, 14); // Castle flag

      // Draw Goombas
      s.goombas.forEach(g => {
        if (g.squashed && g.squashTimer > 25) return;
        ctx.fillStyle = '#78350f';
        if (g.squashed) {
          ctx.fillRect(g.x, g.y + 12, g.w, 6);
        } else {
          ctx.beginPath();
          ctx.arc(g.x + g.w / 2, g.y + 8, 8, Math.PI, 0);
          ctx.lineTo(g.x + g.w, g.y + g.h);
          ctx.lineTo(g.x, g.y + g.h);
          ctx.closePath();
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(g.x + 3, g.y + 6, 3, 5);
          ctx.fillRect(g.x + 11, g.y + 6, 3, 5);
          ctx.fillStyle = '#000000';
          ctx.fillRect(g.x + 4, g.y + 7, 2, 4);
          ctx.fillRect(g.x + 12, g.y + 7, 2, 4);
        }
      });

      // Draw Bouncing Coins
      s.coins.forEach(coin => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(coin.x + 6, coin.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();
      });

      // Draw Mario Sprite
      const m = s.mario;
      ctx.save();
      ctx.translate(m.x, m.y);
      if (m.facing === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-m.w, 0);
      }

      // Red Cap & Shirt
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, 2, 14, 6); // Hat
      ctx.fillRect(2, 10, 14, 8); // Shirt

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(4, 5, 10, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(10, 7, 4, 3); // Mustache

      // Blue Overalls
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(4, 15, 10, 8);

      // Brown Boots & Run Animation
      ctx.fillStyle = '#78350f';
      if (!m.grounded) {
        // Jump pose
        ctx.fillRect(0, 20, 6, 5);
        ctx.fillRect(12, 22, 6, 4);
      } else {
        const frame = Math.floor(m.runFrame) % 2;
        if (frame === 0) {
          ctx.fillRect(2, 22, 5, 4);
          ctx.fillRect(11, 22, 5, 4);
        } else {
          ctx.fillRect(0, 22, 6, 4);
          ctx.fillRect(12, 22, 6, 4);
        }
      }
      ctx.restore();

      ctx.restore();

      // Game Over / Victory Overlay
      if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER MARIO', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText('Press SPACE to Jump / Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
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
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Score: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      } else if (gameState === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Final Score: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, isMuted, volume, initLevel, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-5 w-full h-full select-none font-sans">
      {/* Top Stats Bar */}
      <div className="flex items-center justify-between w-full max-w-[460px] mb-2 px-3 py-2 bg-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-medium">MARIO:</span>
          <span className="text-red-400 font-bold text-sm tracking-wider">{score}</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-yellow-400 font-bold">
          <Coins className="w-3.5 h-3.5" />
          <span>×{coins}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400 font-medium">HIGH:</span>
          <span className="text-white font-bold text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1">LIVES:</span>
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-red-500 border border-red-300" />
          ))}
        </div>
      </div>

      {/* Main Canvas Screen */}
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
      <div className="flex items-center justify-between w-full max-w-[460px] mt-3 px-2 text-xs">
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
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-md"
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
