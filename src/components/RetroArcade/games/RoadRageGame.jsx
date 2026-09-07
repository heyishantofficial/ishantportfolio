import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playArcadeSound } from '../arcadeAudio';
import { RotateCcw, Play, Pause, Trophy, Zap, Fuel, Gauge } from 'lucide-react';

const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 440;
const ROAD_LEFT = 50;
const ROAD_WIDTH = 280;
const LANE_WIDTH = ROAD_WIDTH / 4;

export default function RoadRageGame({ isMuted, volume, onBackToMenu, externalInput }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(120);
  const [fuel, setFuel] = useState(100);
  const [nitroCount, setNitroCount] = useState(2);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('arcade_roadrage_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'paused' | 'gameover'

  const stateRef = useRef({
    car: {
      x: ROAD_LEFT + ROAD_WIDTH / 2 - 14,
      y: 340,
      w: 28,
      h: 52,
      vx: 0,
      speed: 7, // 0 to 14
      turbo: false,
      turboTimer: 0
    },
    keys: { left: false, right: false, up: false, down: false },
    roadOffset: 0,
    traffic: [],
    items: [], // fuel, nitro, coin
    smokeParticles: [],
    shake: 0,
    fuel: 100,
    nitro: 2,
    score: 0,
    distance: 0,
    lastTrafficSpawn: 0,
    lastItemSpawn: 0
  });

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.car = {
      x: ROAD_LEFT + ROAD_WIDTH / 2 - 14,
      y: 340,
      w: 28,
      h: 52,
      vx: 0,
      speed: 7,
      turbo: false,
      turboTimer: 0
    };
    s.traffic = [];
    s.items = [];
    s.smokeParticles = [];
    s.fuel = 100;
    s.nitro = 2;
    s.score = 0;
    s.distance = 0;
    s.shake = 0;

    setScore(0);
    setFuel(100);
    setNitroCount(2);
    setSpeedKmh(120);
  }, []);

  const startNewGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    playArcadeSound('game_start', { isMuted, volume });
  }, [resetGame, isMuted, volume]);

  const triggerNitro = useCallback(() => {
    const s = stateRef.current;
    if (s.nitro > 0 && !s.car.turbo && gameState === 'playing') {
      s.nitro--;
      setNitroCount(s.nitro);
      s.car.turbo = true;
      s.car.turboTimer = 180; // 3 seconds
      s.car.speed = 14;
      s.shake = 12;
      playArcadeSound('car_turbo', { isMuted, volume });
    }
  }, [gameState, isMuted, volume]);

  // Input Handling
  useEffect(() => {
    const keys = stateRef.current.keys;
    if (!externalInput) return;

    if (externalInput === 'LEFT') { keys.left = true; keys.right = false; }
    else if (externalInput === 'RIGHT') { keys.right = true; keys.left = false; }
    else if (externalInput === 'UP') { keys.up = true; }
    else if (externalInput === 'DOWN') { keys.down = true; }
    else if (externalInput === 'RELEASE_DIR') {
      keys.left = false; keys.right = false; keys.up = false; keys.down = false;
    }
    else if (externalInput === 'A') { keys.up = true; }
    else if (externalInput === 'B') { triggerNitro(); }
    else if (externalInput === 'START') {
      if (gameState === 'ready' || gameState === 'gameover') {
        startNewGame();
      } else if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }
  }, [externalInput, triggerNitro, gameState, startNewGame]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const keys = stateRef.current.keys;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        keys.left = true;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keys.right = true;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        keys.up = true;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        keys.down = true;
      } else if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        if (gameState === 'ready' || gameState === 'gameover') {
          startNewGame();
        } else {
          triggerNitro();
        }
      }
    };

    const onKeyUp = (e) => {
      const keys = stateRef.current.keys;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      else if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
      else if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = false;
      else if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerNitro, gameState, startNewGame]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const spawnTraffic = () => {
      const s = stateRef.current;
      const lane = Math.floor(Math.random() * 4);
      const laneX = ROAD_LEFT + lane * LANE_WIDTH + (LANE_WIDTH - 28) / 2;

      // Don't spawn if another car is right there
      const tooClose = s.traffic.some(t => Math.abs(t.x - laneX) < 10 && t.y < 80);
      if (tooClose) return;

      const types = [
        { type: 'sedan', color: '#38bdf8', w: 26, h: 48, speed: 4 },
        { type: 'taxi', color: '#facc15', w: 26, h: 48, speed: 4.8 },
        { type: 'truck', color: '#10b981', w: 32, h: 72, speed: 3 },
        { type: 'police', color: '#1e293b', w: 26, h: 50, speed: 5.5, isPolice: true }
      ];

      const model = types[Math.floor(Math.random() * types.length)];
      s.traffic.push({
        ...model,
        x: laneX,
        y: -90
      });
    };

    const spawnItem = () => {
      const s = stateRef.current;
      const lane = Math.floor(Math.random() * 4);
      const laneX = ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;

      const types = ['fuel', 'nitro', 'coin'];
      const type = types[Math.floor(Math.random() * types.length)];

      s.items.push({
        type,
        x: laneX,
        y: -40,
        radius: 12
      });
    };

    const update = (timestamp) => {
      const s = stateRef.current;
      if (gameState !== 'playing') return;

      const c = s.car;

      // Turbo timer
      if (c.turbo) {
        c.turboTimer--;
        if (c.turboTimer <= 0) {
          c.turbo = false;
        }
      }

      // Acceleration & Braking
      if (s.keys.up && !c.turbo) {
        c.speed = Math.min(11, c.speed + 0.08);
      } else if (s.keys.down) {
        c.speed = Math.max(3.5, c.speed - 0.12);
      } else if (!c.turbo) {
        c.speed = Math.max(5.5, Math.min(8.5, c.speed + (7 - c.speed) * 0.03));
      }

      setSpeedKmh(Math.round(c.speed * 18));

      // Steering
      const steerSpeed = c.turbo ? 4.8 : 3.8;
      if (s.keys.left) {
        c.vx = -steerSpeed;
        if (Math.random() < 0.2) playArcadeSound('car_screech', { isMuted, volume });
      } else if (s.keys.right) {
        c.vx = steerSpeed;
        if (Math.random() < 0.2) playArcadeSound('car_screech', { isMuted, volume });
      } else {
        c.vx *= 0.6;
      }

      c.x += c.vx;

      // Clamp within road edges
      if (c.x < ROAD_LEFT + 4) {
        c.x = ROAD_LEFT + 4;
        c.speed = Math.max(4, c.speed - 0.2);
        s.shake = 5;
      } else if (c.x + c.w > ROAD_LEFT + ROAD_WIDTH - 4) {
        c.x = ROAD_LEFT + ROAD_WIDTH - 4 - c.w;
        c.speed = Math.max(4, c.speed - 0.2);
        s.shake = 5;
      }

      // Road Scrolling
      s.roadOffset = (s.roadOffset + c.speed) % 40;
      s.distance += Math.round(c.speed);

      // Fuel depletion
      s.fuel = Math.max(0, s.fuel - (c.turbo ? 0.06 : 0.03));
      setFuel(Math.round(s.fuel));

      if (s.fuel <= 0) {
        // Out of fuel
        setGameState('gameover');
        playArcadeSound('game_over', { isMuted, volume });
        return;
      }

      // Score accumulation
      s.score += Math.round(c.speed * (c.turbo ? 2.5 : 1));
      setScore(s.score);

      // Spawn traffic & items
      if (timestamp - s.lastTrafficSpawn > Math.max(600, 1800 - c.speed * 90)) {
        spawnTraffic();
        s.lastTrafficSpawn = timestamp;
      }
      if (timestamp - s.lastItemSpawn > 3200) {
        spawnItem();
        s.lastItemSpawn = timestamp;
      }

      // Update Traffic
      for (let i = s.traffic.length - 1; i >= 0; i--) {
        const t = s.traffic[i];
        t.y += c.speed - t.speed;

        // Collision Check with player
        if (
          c.x < t.x + t.w &&
          c.x + c.w > t.x &&
          c.y < t.y + t.h &&
          c.y + c.h > t.y
        ) {
          // CRASH!
          s.shake = 20;
          playArcadeSound('car_crash', { isMuted, volume });
          setGameState('gameover');
          return;
        }

        // Remove off-screen
        if (t.y > CANVAS_HEIGHT + 100 || t.y < -150) {
          s.traffic.splice(i, 1);
        }
      }

      // Update Collectible Items
      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i];
        it.y += c.speed;

        // Collision with player
        const dist = Math.hypot((c.x + c.w / 2) - it.x, (c.y + c.h / 2) - it.y);
        if (dist < it.radius + c.w / 2) {
          if (it.type === 'fuel') {
            s.fuel = Math.min(100, s.fuel + 35);
            s.score += 150;
            playArcadeSound('mario_coin', { isMuted, volume });
          } else if (it.type === 'nitro') {
            s.nitro = Math.min(3, s.nitro + 1);
            setNitroCount(s.nitro);
            s.score += 250;
            playArcadeSound('car_turbo', { isMuted, volume });
          } else if (it.type === 'coin') {
            s.score += 500;
            playArcadeSound('mario_coin', { isMuted, volume });
          }
          s.items.splice(i, 1);
          continue;
        }

        if (it.y > CANVAS_HEIGHT + 50) {
          s.items.splice(i, 1);
        }
      }

      // Smoke particles
      if (Math.random() < (c.turbo ? 0.8 : 0.25)) {
        s.smokeParticles.push({
          x: c.x + (Math.random() < 0.5 ? 4 : c.w - 4),
          y: c.y + c.h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 1,
          size: c.turbo ? 5 : 3,
          alpha: 0.7
        });
      }

      for (let i = s.smokeParticles.length - 1; i >= 0; i--) {
        const p = s.smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.2;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          s.smokeParticles.splice(i, 1);
        }
      }

      // Screen shake decay
      if (s.shake > 0) s.shake *= 0.85;

      // Update High Score
      if (s.score > highScore) {
        setHighScore(s.score);
        localStorage.setItem('arcade_roadrage_highscore', s.score.toString());
      }
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      if (s.shake > 0.5) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      // Grass roadside
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, ROAD_LEFT, CANVAS_HEIGHT);
      ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, 0, CANVAS_WIDTH - (ROAD_LEFT + ROAD_WIDTH), CANVAS_HEIGHT);

      // Asphalt road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

      // Red & White Rumble Strips
      const stripH = 20;
      for (let y = -40 + s.roadOffset; y < CANVAS_HEIGHT + 40; y += stripH) {
        const isRed = Math.floor(y / stripH) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
        ctx.fillRect(ROAD_LEFT - 6, y, 6, stripH);
        ctx.fillRect(ROAD_LEFT + ROAD_WIDTH, y, 6, stripH);
      }

      // White Dashed Lane Dividers
      ctx.fillStyle = '#f8fafc';
      const dashH = 24;
      const gapH = 20;
      for (let lane = 1; lane < 4; lane++) {
        const lx = ROAD_LEFT + lane * LANE_WIDTH;
        for (let y = -40 + s.roadOffset; y < CANVAS_HEIGHT + 40; y += dashH + gapH) {
          ctx.fillRect(lx - 2, y, 4, dashH);
        }
      }

      // Speed lines during Turbo
      if (s.car.turbo) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const sx = ROAD_LEFT + Math.random() * ROAD_WIDTH;
          const sy = Math.random() * CANVAS_HEIGHT;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy + 45);
          ctx.stroke();
        }
      }

      // Draw Collectibles
      s.items.forEach(it => {
        if (it.type === 'fuel') {
          // Fuel Canister
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(it.x - 8, it.y - 10, 16, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('GAS', it.x, it.y + 3);
        } else if (it.type === 'nitro') {
          // Blue Nitro bottle
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(it.x, it.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('N₂O', it.x, it.y + 3);
        } else if (it.type === 'coin') {
          // Gold coin
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(it.x, it.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.stroke();
        }
      });

      // Draw Smoke Particles
      s.smokeParticles.forEach(p => {
        ctx.fillStyle = s.car.turbo
          ? `rgba(56, 189, 248, ${p.alpha})`
          : `rgba(203, 213, 225, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Traffic Cars
      s.traffic.forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);

        // Wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2, 6, 4, 10);
        ctx.fillRect(t.w - 2, 6, 4, 10);
        ctx.fillRect(-2, t.h - 16, 4, 10);
        ctx.fillRect(t.w - 2, t.h - 16, 4, 10);

        // Body
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, t.w, t.h, 6);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(3, 10, t.w - 6, 8);
        ctx.fillRect(4, t.h - 14, t.w - 8, 6);

        // Police flashing light
        if (t.isPolice) {
          const flash = Math.floor(Date.now() / 120) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.fillRect(t.w / 2 - 4, 20, 8, 4);
        }

        ctx.restore();
      });

      // Draw Player Car (Red Turbo Sports Car)
      const c = s.car;
      ctx.save();
      ctx.translate(c.x, c.y);

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, 8, 4, 11);
      ctx.fillRect(c.w - 2, 8, 4, 11);
      ctx.fillRect(-2, c.h - 18, 4, 11);
      ctx.fillRect(c.w - 2, c.h - 18, 4, 11);

      // Red Car Body with spoiler
      ctx.fillStyle = c.turbo ? '#f97316' : '#dc2626';
      ctx.beginPath();
      ctx.roundRect(0, 0, c.w, c.h, 7);
      ctx.fill();

      // Racing Stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.w / 2 - 3, 0, 2, c.h);
      ctx.fillRect(c.w / 2 + 1, 0, 2, c.h);

      // Front & Rear Glass
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(3, 12, c.w - 6, 10);
      ctx.fillRect(4, c.h - 16, c.w - 8, 8);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(2, 1, 6, 3);
      ctx.fillRect(c.w - 8, 1, 6, 3);

      // Tail lights
      ctx.fillStyle = '#f87171';
      ctx.fillRect(2, c.h - 3, 6, 3);
      ctx.fillRect(c.w - 8, c.h - 3, 6, 3);

      ctx.restore();

      ctx.restore();

      // Overlays
      if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ROAD RAGE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press SPACE to Race!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Arrow Keys / WASD to Steer', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
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
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '13px monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Score: ${s.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Press SPACE to Race Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }
    };

    const loop = (timestamp) => {
      update(timestamp);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, isMuted, volume, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-5 w-full h-full select-none font-sans">
      {/* Top Stats Bar */}
      <div className="flex items-center justify-between w-full max-w-[380px] mb-2 px-3 py-2 bg-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-medium">SCORE:</span>
          <span className="text-orange-400 font-bold text-sm tracking-wider">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400 font-medium">HIGH:</span>
          <span className="text-white font-bold text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-cyan-400 font-bold">
          <Gauge className="w-3.5 h-3.5" />
          <span>{speedKmh} km/h</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-yellow-400 font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>×{nitroCount}</span>
        </div>

        <div className="flex items-center gap-1 font-mono">
          <Fuel className="w-3.5 h-3.5 text-red-400" />
          <div className="w-12 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${fuel < 25 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
              style={{ width: `${fuel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Canvas Highway Container */}
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
      <div className="flex items-center justify-between w-full max-w-[380px] mt-3 px-2 text-xs">
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
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 shadow-md"
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
