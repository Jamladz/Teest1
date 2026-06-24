import React, { useEffect, useRef, useState } from "react";
import {
  Volume2,
  VolumeX,
  TrendingUp,
  Play,
  RotateCcw,
  X,
  Trophy,
} from "lucide-react";
import { UserState } from "../types";

interface CryptoRunnerGameProps {
  user: UserState;
  onFinishGame: (score: number, rewardTqh: number) => void;
  onClose: () => void;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: "red_candle" | "barricade";
}

interface MarketCoin {
  x: number;
  y: number;
  size: number;
  collected: boolean;
}

export default function CryptoRunnerGame({
  user,
  onFinishGame,
  onClose,
}: CryptoRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [muted, setMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("crypto_runner_highscore") || "0", 10);
  });

  // Game physical environment stats
  const gameSpeed = useRef(5);
  const playerRef = useRef({
    y: 0,
    radius: 18,
    vy: 0,
    isJumping: false,
    rotation: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<MarketCoin[]>([]);
  const frameId = useRef<number | null>(null);
  const tickerRef = useRef<number>(0);

  const playJumpSound = () => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (_) {}
  };

  const playCoinSound = () => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch (_) {}
  };

  const playExplodeSound = () => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch (_) {}
  };

  // Resize
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = Math.min(containerRef.current.clientHeight, 500);
      playerRef.current.y = canvas.height - 100 - playerRef.current.radius;
    }
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, []);

  const jump = () => {
    if (!isPlaying) return;
    if (!playerRef.current.isJumping) {
      playerRef.current.vy = -11.5;
      playerRef.current.isJumping = true;
      playJumpSound();
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    gameSpeed.current = 4.5;
    obstaclesRef.current = [];
    coinsRef.current = [];
    tickerRef.current = 0;

    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current.y = canvas.height - 100 - playerRef.current.radius;
      playerRef.current.vy = 0;
      playerRef.current.isJumping = false;
      playerRef.current.rotation = 0;
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    playExplodeSound();

    setScore((finalVal) => {
      if (finalVal > highScore) {
        localStorage.setItem("crypto_runner_highscore", finalVal.toString());
        setHighScore(finalVal);
      }
      return finalVal;
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let localFrameId: number;
    const groundY = canvas.height - 100;
    const gravity = 0.5;

    const gameLoop = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Draw stylized floor patterns
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, groundY + 2, canvas.width, canvas.height - groundY);

      // Obstacle & Coin spawning logic
      tickerRef.current++;
      if (tickerRef.current % 130 === 0) {
        const types: Obstacle["type"][] = ["red_candle", "barricade"];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        obstaclesRef.current.push({
          x: canvas.width + 50,
          width: chosenType === "red_candle" ? 20 : 35,
          height: chosenType === "red_candle" ? 55 : 30,
          type: chosenType,
        });

        // Speed ramp up slightly
        gameSpeed.current = Math.min(9, gameSpeed.current + 0.08);
      }

      if (tickerRef.current % 80 === 0) {
        coinsRef.current.push({
          x: canvas.width + 50,
          y: groundY - 60 - Math.random() * 80,
          size: 10,
          collected: false,
        });
      }

      // Physics update player
      const player = playerRef.current;
      player.vy += gravity;
      player.y += player.vy;
      player.rotation += 0.05 * gameSpeed.current;

      if (player.y >= groundY - player.radius) {
        player.y = groundY - player.radius;
        player.vy = 0;
        player.isJumping = false;
      }

      // Draw Player Coin
      ctx.save();
      ctx.translate(50, player.y);
      ctx.rotate(player.rotation);

      // Golden outer layer
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 12;
      ctx.fill();

      // Inner details
      ctx.beginPath();
      ctx.arc(0, 0, player.radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = "#d97706";
      ctx.fill();

      // Coin currency symbol
      ctx.rotate(-player.rotation); // keep text vertical
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₿", 0, 0);

      ctx.restore();
      ctx.shadowBlur = 0; // reset

      // Obstacles loop
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        obs.x -= gameSpeed.current;

        // Draw obstacle
        ctx.save();
        ctx.translate(obs.x, groundY - obs.height / 2);
        if (obs.type === "red_candle") {
          // Downward trading chart candle
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 8;
          ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

          // Candle wicks
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -obs.height / 2 - 10);
          ctx.lineTo(0, obs.height / 2 + 10);
          ctx.stroke();
        } else {
          // Market Barrier block
          ctx.fillStyle = "#64748b";
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
          ctx.strokeRect(
            -obs.width / 2,
            -obs.height / 2,
            obs.width,
            obs.height,
          );

          // Danger stripes
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, -10);
          ctx.lineTo(10, 10);
          ctx.stroke();
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        // Collision box checks
        const pRadius = player.radius * 0.75;
        const pX = 50;
        const pY = player.y;

        const leftSide = obs.x - obs.width / 2;
        const rightSide = obs.x + obs.width / 2;
        const topSide = groundY - obs.height;

        // Roughly check circle overlaps box
        if (
          pX + pRadius > leftSide &&
          pX - pRadius < rightSide &&
          pY + pRadius > topSide
        ) {
          endGame();
        }

        return obs.x > -100;
      });

      // Coins loop
      coinsRef.current = coinsRef.current.filter((c) => {
        c.x -= gameSpeed.current;

        if (!c.collected) {
          // Draw coin
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 8;
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", c.x, c.y);
          ctx.shadowBlur = 0;

          // Check hit
          const deltaX = c.x - 50;
          const deltaY = c.y - player.y;
          const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          if (dist < player.radius + c.size) {
            c.collected = true;
            setScore((prev) => prev + 50);
            playCoinSound();
          }
        }

        return c.x > -50;
      });

      // Score incremental for survival
      setScore((prev) => prev + 1);

      localFrameId = requestAnimationFrame(gameLoop);
    };

    localFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(localFrameId);
  }, [isPlaying]);

  const earnedTqh = Math.floor(score / 350);

  const confirmFinish = () => {
    if (earnedTqh > 0 && (window as any).Adsgram) {
      const AdController = (window as any).Adsgram.init({
        blockId: "int-36110",
      });
      AdController.show()
        .then(() => {
          onFinishGame(score, earnedTqh);
        })
        .catch(() => {
          onFinishGame(score, earnedTqh);
        });
    } else {
      onFinishGame(score, earnedTqh);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-[#0f172a] text-slate-100 flex flex-col z-[2000] overflow-hidden justify-center items-center"
    >
      <div className="absolute top-4 start-4 end-4 flex items-center justify-between z-[2001] px-2">
        <div className="flex gap-2">
          <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Score:</span>
            <span className="font-bold text-emerald-400 text-sm md:text-base">
              {score}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-300 hover:text-white"
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="w-full relative flex flex-col items-center">
        {/* Invisible tapping pane */}
        <div
          onClick={jump}
          className="w-full h-[400px] border-y border-slate-800 relative bg-slate-950/20"
        >
          <canvas ref={canvasRef} className="w-full h-full" />
          {isPlaying && (
            <div className="absolute bottom-4 start-1/2 transform -translate-x-1/2 text-slate-500 font-mono text-xs animate-pulse pointer-events-none">
              TAP OR CLICK ANYWHERE ON GAME TO JUMP
            </div>
          )}
        </div>
      </div>

      {/* Start screen container */}
      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 bg-[#0f172a]/95 flex flex-col items-center justify-center p-6 text-center z-[2005]">
          <div className="max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-10 h-10 text-white animate-pulse" />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                CRYPTO RUNNER
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Jump over red charts and hazard structures! Collect dollar coins
                to boost your point multiplier.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">
                  High Score
                </span>
                <span className="text-lg font-bold text-white mt-1">
                  {highScore}
                </span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xs text-slate-400 uppercase">
                  Yield Status
                </span>
                <span className="text-lg font-bold text-emerald-400 mt-1">
                  High Volatility
                </span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-5 h-5" />
              Launch Runner
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

      {/* Game Over Container */}
      {gameOver && (
        <div className="absolute inset-0 bg-[#0f172a]/97 flex flex-col items-center justify-center p-6 text-center z-[2005]">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col items-center gap-6">
            <h2 className="text-2xl font-black text-rose-500 tracking-wider">
              MARKET CRASH
            </h2>
            <p className="text-slate-400 text-sm -mt-3">
              You hit an obstacle chart candle!
            </p>

            <div className="w-full space-y-3">
              <div className="bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm text-slate-400">Survival Score:</span>
                <span className="text-lg font-bold text-white">{score}</span>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800/40 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm text-emerald-400 font-semibold">
                  Earned Yield:
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  +{earnedTqh} GQH
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-3.5 px-4 rounded-1.5xl font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>

              <button
                onClick={confirmFinish}
                className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-4 rounded-1.5xl font-bold"
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
