import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Shield, Play, RotateCcw, X, Trophy } from 'lucide-react';
import { UserState } from '../types';

interface DropBlastGameProps {
  user: UserState;
  onFinishGame: (score: number, rewardTqh: number) => void;
  onClose: () => void;
}

interface GameObject {
  x: number;
  y: number;
  type: 'coin' | 'freeze' | 'bomb' | 'star';
  size: number;
  speed: number;
  angle: number;
  spinSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

export default function DropBlastGame({ user, onFinishGame, onClose }: DropBlastGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sound Synth States
  const [muted, setMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('drop_blast_highscore') || '0', 10);
  });

  // Game Engine logic references
  const playerRef = useRef({ x: 0, size: 55, targetX: 0 });
  const objectsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isMovingLeft = useRef(false);
  const isMovingRight = useRef(false);
  const freezeActiveRef = useRef(false);
  const bombActiveRef = useRef(false);
  const freezeTimerRef = useRef(0);
  const bombTimerRef = useRef(0);

  // Keep references for dynamic event loops
  const requestRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound Synth Synthesizer
  const playSoundSynth = (type: 'coin' | 'freeze' | 'bomb' | 'star' | 'start' | 'gameover') => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'coin') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'star') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === 'freeze') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.41);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.61);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn('Audio failed to synthesize', e);
    }
  };

  // Resize canvas to Container size
  const setupCanvasSize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // Recenter player if uninitialized
      if (playerRef.current.x === 0) {
        playerRef.current.x = canvas.width / 2;
        playerRef.current.targetX = canvas.width / 2;
      }
    }
  };

  useEffect(() => {
    setupCanvasSize();
    window.addEventListener('resize', setupCanvasSize);
    return () => {
      window.removeEventListener('resize', setupCanvasSize);
    };
  }, []);

  const triggerParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particlesRef.current.push({
        x,
        y,
        color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 20,
      });
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setGameOver(false);
    setIsPlaying(true);
    objectsRef.current = [];
    particlesRef.current = [];
    freezeActiveRef.current = false;
    bombActiveRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current.x = canvas.width / 2;
      playerRef.current.targetX = canvas.width / 2;
    }

    playSoundSynth('start');

    // Timer Interval
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    playSoundSynth('gameover');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Save high score
    setScore((finalScore) => {
      if (finalScore > highScore) {
        localStorage.setItem('drop_blast_highscore', finalScore.toString());
        setHighScore(finalScore);
      }
      return finalScore;
    });
  };

  // Core Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frameId: number;

    const loop = () => {
      // 1. Clear background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simple grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Handle Freeze Timer Screen Overlay
      if (freezeActiveRef.current) {
        freezeTimerRef.current -= 0.016;
        if (freezeTimerRef.current <= 0) {
          freezeActiveRef.current = false;
        }
        ctx.fillStyle = 'rgba(30, 144, 255, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Handle Bomb Shake Screen Overlay
      if (bombActiveRef.current) {
        bombTimerRef.current -= 0.016;
        if (bombTimerRef.current <= 0) {
          bombActiveRef.current = false;
        }
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Spawn logic
      const spawnChance = freezeActiveRef.current ? 0.012 : 0.035;
      if (Math.random() < spawnChance && objectsRef.current.length < 15) {
        const types: GameObject['type'][] = ['coin', 'coin', 'coin', 'coin', 'coin', 'star', 'freeze', 'bomb', 'bomb'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        objectsRef.current.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -30,
          type: randomType,
          size: randomType === 'star' ? 18 : randomType === 'bomb' ? 22 : 16,
          speed: (Math.random() * 3 + 3) * (randomType === 'star' ? 1.4 : 1),
          angle: Math.random() * Math.PI,
          spinSpeed: (Math.random() - 0.5) * 0.1,
        });
      }

      // 3. Move Player
      const playerSpeed = 7;
      let targetX = playerRef.current.targetX;

      if (isMovingLeft.current) {
        targetX = Math.max(playerRef.current.size / 2, playerRef.current.x - playerSpeed);
        playerRef.current.targetX = targetX;
      }
      if (isMovingRight.current) {
        targetX = Math.min(canvas.width - playerRef.current.size / 2, playerRef.current.x + playerSpeed);
        playerRef.current.targetX = targetX;
      }

      // Smooth step player movement to targetX
      playerRef.current.x += (targetX - playerRef.current.x) * 0.35;

      // 4. Update and Draw Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life++;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow

        return p.life < p.maxLife;
      });

      // 5. Update and Draw Game Objects
      objectsRef.current = objectsRef.current.filter((obj) => {
        // Adjust speed based on freeze state
        const actualSpeed = freezeActiveRef.current ? obj.speed * 0.4 : obj.speed;
        obj.y += actualSpeed;
        obj.angle += obj.spinSpeed;

        // Draw object
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.angle);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        if (obj.type === 'coin') {
          // Inner Golden/Blue coin
          ctx.beginPath();
          ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(-2, -2, 1, 0, 0, obj.size);
          gradient.addColorStop(0, '#ffe066');
          gradient.addColorStop(0.3, '#f59e0b');
          gradient.addColorStop(1, '#d97706');
          ctx.fillStyle = gradient;
          ctx.shadowColor = '#ffe066';
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Standard letter icon
          ctx.rotate(-obj.angle); // Draw upright Q/T symbol
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Q', 0, 0);
        } else if (obj.type === 'star') {
          // Sparkling Diamond/Star
          ctx.beginPath();
          ctx.moveTo(0, -obj.size);
          ctx.lineTo(obj.size, 0);
          ctx.lineTo(0, obj.size);
          ctx.lineTo(-obj.size, 0);
          ctx.closePath();
          ctx.fillStyle = '#c7d2fe';
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 15;
          ctx.fill();

          ctx.rotate(-obj.angle);
          ctx.fillStyle = '#4f46e5';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', 0, 0);
        } else if (obj.type === 'freeze') {
          // Freeze Snowflake Icebox
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
          ctx.fill();

          // Blue center icon
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (obj.type === 'bomb') {
          // Hazard Spike/Bomb
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#b91c1c';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size - 4, 0, Math.PI * 2);
          ctx.fill();

          // Fuse
          ctx.beginPath();
          ctx.moveTo(0, -obj.size + 4);
          ctx.quadraticCurveTo(8, -obj.size - 4, 12, -obj.size + 2);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Spark
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(12, -obj.size + 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Check catch collision
        const playerY = canvas.height - 100;
        const distY = Math.abs(obj.y - playerY);
        const distX = Math.abs(obj.x - playerRef.current.x);

        if (distY < 20 && distX < playerRef.current.size / 2 + obj.size) {
          // Collided with player!
          if (obj.type === 'coin') {
            setScore((prev) => prev + 100);
            triggerParticles(obj.x, obj.y, '#f59e0b');
            playSoundSynth('coin');
          } else if (obj.type === 'star') {
            setScore((prev) => prev + 250);
            triggerParticles(obj.x, obj.y, '#818cf8', 18);
            playSoundSynth('star');
          } else if (obj.type === 'freeze') {
            freezeActiveRef.current = true;
            freezeTimerRef.current = 6; // 6 seconds freeze
            triggerParticles(obj.x, obj.y, '#38bdf8', 16);
            playSoundSynth('freeze');
          } else if (obj.type === 'bomb') {
            bombActiveRef.current = true;
            bombTimerRef.current = 0.4;
            playSoundSynth('bomb');
            // End the game instantly or minus plenty points
            setScore((prev) => Math.max(0, prev - 300));
            endGame();
          }
          return false; // remove object
        }

        // Missed object, remove if offscreen
        return obj.y < canvas.height + 30;
      });

      // 6. Draw Player (A Glassmorphism Basket / Catching Shield)
      const playerX = playerRef.current.x;
      const playerY = canvas.height - 100;
      const playerWidth = playerRef.current.size;

      // Outer glow of the shield
      ctx.shadowColor = freezeActiveRef.current ? '#38bdf8' : '#0078ff';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = freezeActiveRef.current ? 'rgba(56, 189, 248, 0.8)' : 'rgba(0, 120, 255, 0.8)';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.arc(playerX, playerY - 10, playerWidth / 2, 0, Math.PI, false); // curved basket
      ctx.stroke();

      // Filled basket
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.arc(playerX, playerY - 10, playerWidth / 2, 0, Math.PI, false);
      ctx.fill();

      // Top bar of the shield
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(playerX - playerWidth / 2, playerY - 10);
      ctx.lineTo(playerX + playerWidth / 2, playerY - 10);
      ctx.stroke();

      ctx.shadowBlur = 0; // reset

      // Draw standard GRAM or GQH logo decoration inside the basket
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHIELD', playerX, playerY + 5);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPlaying]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      playerRef.current.targetX = Math.max(
        playerRef.current.size / 2,
        Math.min(canvas.width - playerRef.current.size / 2, x)
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (canvas && e.buttons > 0) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      playerRef.current.targetX = Math.max(
        playerRef.current.size / 2,
        Math.min(canvas.width - playerRef.current.size / 2, x)
      );
    }
  };

  // Convert points to GQH
  const rewardTqh = Math.floor(score / 100);

  const confirmFinish = () => {
    onFinishGame(score, rewardTqh);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0f172a] text-slate-100 flex flex-col z-[2000] overflow-hidden"
    >
      {/* Game Headings/UI HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-[2001] px-2">
        <div className="flex gap-2">
          <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Score:</span>
            <span className="font-bold text-yellow-400 text-sm md:text-base">{score}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-slate-400">Time:</span>
            <span className={`font-mono font-bold text-sm ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMuted(!muted)}
            aria-label="Toggle mute"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-300 hover:text-white"
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close game"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Target Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-pointer touch-none"
      />

      {/* ON-SCREEN OVERLAYS AND MOVEMENT CONTROLLERS FOR TOUCH SCREENS */}
      {isPlaying && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 pointer-events-auto z-[2001]">
          <button
            onTouchStart={() => (isMovingLeft.current = true)}
            onTouchEnd={() => (isMovingLeft.current = false)}
            onMouseDown={() => (isMovingLeft.current = true)}
            onMouseUp={() => (isMovingLeft.current = false)}
            className="w-20 h-20 bg-slate-800/70 border border-slate-700/70 active:bg-slate-700/90 rounded-2xl flex items-center justify-center font-bold text-2xl select-none"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (isMovingRight.current = true)}
            onTouchEnd={() => (isMovingRight.current = false)}
            onMouseDown={() => (isMovingRight.current = true)}
            onMouseUp={() => (isMovingRight.current = false)}
            className="w-20 h-20 bg-slate-800/70 border border-slate-700/70 active:bg-slate-700/90 rounded-2xl flex items-center justify-center font-bold text-2xl select-none"
          >
            ▶
          </button>
        </div>
      )}

      {/* Start Screen Game Portal Overlay */}
      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 bg-[#0f172a]/95 flex flex-col items-center justify-center p-6 text-center z-[2005]">
          <div className="max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-10 h-10 text-white animate-bounce" />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                BB DROP BLAST
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Catch gold coins & crystal stars in your defensive shield, freeze time with snowflakes, and don't catch bombs!
              </p>
            </div>

            {/* Current stats */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">High Score</span>
                <span className="text-lg font-bold text-white mt-1">{highScore}</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <Shield className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">Multiplier</span>
                <span className="text-lg font-bold text-emerald-400 mt-1">1x GQH</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-left bg-slate-900/80 border border-slate-800 p-4 rounded-2xl w-full text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span>Coin: +100 Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-violet-400 rounded-full" />
                <span>Star: +250 Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-sky-400 rounded-full animate-pulse" />
                <span>Snowflake: Freeze fallings (slow down speed)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Bomb: Game Over! Lose -300 score</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:translate-y-0.5 transition"
            >
              <Play className="w-5 h-5" />
              Play &amp; Earn GQH
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 text-sm hover:text-white"
            >
              Return to Platform
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-[#0f172a]/97 flex flex-col items-center justify-center p-6 text-center z-[2005]">
          <div className="max-w-sm w-full bg-slate-900/90 border border-slate-800 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 tracking-wider">GAME OVER</h2>
            <p className="text-slate-400 text-sm -mt-3">You hit a bomb or ran out of time!</p>

            <div className="w-full space-y-3">
              <div className="bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Score:</span>
                <span className="text-lg font-bold text-white">{score}</span>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800/40 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm text-emerald-400 font-semibold">Earned Rewards:</span>
                <span className="text-lg font-bold text-emerald-400">+{rewardTqh} GQH</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Exchange Rate applied: Every 100 points = 1 GQH!
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-3.5 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>

              <button
                onClick={confirmFinish}
                className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-4 rounded-2xl font-bold"
              >
                Claim &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
