import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  Gift,
  Link2,
  Info,
  RefreshCw,
  Trophy,
  Zap,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Shield,
  Award,
  Clock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  BadgeCheck,
  Radio,
  HelpCircle,
  Target,
  Database,
  Pencil,
  Wallet,
  PlayCircle,
  Calendar,
  Gamepad2,
} from "lucide-react";
import { UserState, PROFILE_BACKGROUNDS } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface HomeTabProps {
  user: UserState;
  onSwap: (gqhAmount: number, tonReceived: number) => void;
  onOpenWalletModal: () => void;
  onPayCustomTask?: (tonAmount: string) => Promise<void>;
  onPaySignature?: () => Promise<void>;
  tonPrice: number;
  onUpdateTqhBalance?: (newAmount: number) => void;
  onUpdatePreferences?: (haptic: boolean, sound: boolean) => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
  profileBgIndex?: number;
}

import { TaskCenterModal } from "./TaskCenterModal";

// Global utility to fetch league details
export function getLeague(gqh: number) {
  if (gqh < 150) {
    return {
      name: "Bronze League",
      emoji: "🪙",
      min: 0,
      max: 150,
      tapPower: 1,
      color: "from-amber-700 via-amber-600 to-amber-800",
      textColor: "text-amber-400",
      perk: "+1 GQH Per Coin Tap",
      badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    };
  }
  if (gqh < 500) {
    return {
      name: "Silver League",
      emoji: "🥈",
      min: 150,
      max: 500,
      tapPower: 2,
      color: "from-slate-400 via-slate-300 to-slate-500",
      textColor: "text-slate-300",
      perk: "+2 GQH Per Coin Tap",
      badge: "bg-slate-400/10 border-slate-400/20 text-slate-300",
    };
  }
  if (gqh < 1500) {
    return {
      name: "Gold League",
      emoji: "🥇",
      min: 500,
      max: 1500,
      tapPower: 3,
      color: "from-yellow-500 via-amber-400 to-yellow-600",
      textColor: "text-yellow-400",
      perk: "+3 GQH Per Coin Tap",
      badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    };
  }
  if (gqh < 4000) {
    return {
      name: "Platinum League",
      emoji: "💎",
      min: 1500,
      max: 4000,
      tapPower: 4,
      color: "from-sky-500 via-blue-400 to-indigo-600",
      textColor: "text-sky-400",
      perk: "+4 GQH Per Coin Tap",
      badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    };
  }
  return {
    name: "Diamond League",
    emoji: "👑",
    min: 4000,
    max: 100000,
    tapPower: 5,
    color: "from-fuchsia-600 via-purple-500 to-indigo-700",
    textColor: "text-purple-400",
    perk: "+5 GQH Per Coin Tap",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };
}

export default function HomeTab({
  user,
  onSwap,
  onOpenWalletModal,
  onPayCustomTask,
  onPaySignature,
  tonPrice,
  onUpdateTqhBalance,
  onUpdatePreferences,
  onShowToast,
  profileBgIndex = 0,
}: HomeTabProps) {
  const { t } = useTranslation();
  // Navigation active view inside Home: 'convert' or 'airdrop'
  const [homeSubTab, setHomeSubTab] = useState<"convert" | "airdrop">(
    "airdrop",
  );

  // Input conversion States
  const [gqhInput, setTqhInput] = useState("");
  const [swapError, setSwapError] = useState("");

  // Add task overlay
  const [showTaskCenterModal, setShowTaskCenterModal] = useState(false);

  // League details overlay bottom drawer
  const [showLeagueDrawer, setShowLeagueDrawer] = useState(false);
  const [drawerSubTab, setDrawerSubTab] = useState<"perks" | "leaderboard">(
    "perks",
  );

  // Live Airdrop Countdown States
  // target date: 60 days from 2026-06-22 -> 2026-08-21
  const [targetDate] = useState(() =>
    new Date("2026-08-21T00:00:00Z").getTime(),
  );
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(targetDate - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // Airdrop proof of signature simulator states
  const [airdropRegistered, setAirdropRegistered] = useState(() => {
    return localStorage.getItem("gramqash_airdrop_registered") === "true";
  });

  const [showAirdropCheckModal, setShowAirdropCheckModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerStep, setRegisterStep] = useState(0);
  const [registerLogs, setRegisterLogs] = useState<string[]>([]);

  // Interactive Airdrop simulator calculator states
  const [calcTqh, setCalcTqh] = useState(user.gqhBalance);
  const [calcInvites, setCalcInvites] = useState(user.referralCount);

  useEffect(() => {
    setCalcTqh(user.gqhBalance);
    setCalcInvites(user.referralCount);
  }, [user.gqhBalance, user.referralCount]);

  // Simulation sequence logs (Arabic with beautiful design accents)
  const simulationLogs = [
    "🔐 Initializing secure connection with authorized node validator...",
    "🛰️ Verifying account identity on GRAM Blockchain ledger...",
    "📝 Preparing snapshot hash code document...",
    "⚙️ Processing consensus algorithm on GramQash smart contract...",
    "💎 Broadcasting encrypted transaction and finalizing on-chain proof...",
    "🎉 Identity verified and AirDrop allocation successfully reserved!",
  ];

  const handleStartVerification = async () => {
    if (
      user.airdropSignatureStatus === "under_review" ||
      user.airdropSignatureStatus === "verified"
    )
      return;

    if (!user.walletAddress) {
      if (onShowToast)
        onShowToast("Please connect your TON wallet first.", "error");
      onOpenWalletModal();
      return;
    }

    try {
      if (onPaySignature) {
        setIsRegistering(true);
        await onPaySignature();
      }
    } catch (e) {
      // payment failed or cancelled
    } finally {
      setIsRegistering(false);
    }
  };

  // Interactive Tap to Earn Mining States (kept for compatibility in underlying code)
  const [energy, setEnergy] = useState(() => {
    const savedEnergy = localStorage.getItem("gramqash_mining_energy");
    return savedEnergy ? parseInt(savedEnergy, 10) : 1000;
  });
  const [isCoinTapped, setIsCoinTapped] = useState(false);
  const [floatingTaps, setFloatingTaps] = useState<
    { id: number; x: number; y: number; amount: number }[]
  >([]);

  const league = getLeague(user.gqhBalance);
  const nextPowerText = getLeague(league.max).perk;

  // Sound Synth Synthesizer for high haptic clicks
  const playTapAudio = () => {
    if (user.soundEnabled === false) return; // supports false explicit check or undefined
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        120,
        audioCtx.currentTime + 0.04,
      );

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.04,
      );

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (_) {}
  };

  // Sound preferences defaults
  const handleTogglePreference = (type: "sound" | "haptic") => {
    const currentSound = user.soundEnabled !== false;
    const currentHaptic = user.hapticEnabled !== false;

    if (onUpdatePreferences) {
      if (type === "sound") {
        onUpdatePreferences(currentHaptic, !currentSound);
      } else {
        onUpdatePreferences(!currentHaptic, currentSound);
      }
    }
  };

  // Auto energy replenishment + persistence
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => {
        const next = Math.min(1000, prev + 3);
        localStorage.setItem("gramqash_mining_energy", next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle giant coin click / tap action
  const handleCoinTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) return;

    // Simulate haptic click
    if (
      user.hapticEnabled !== false &&
      window.navigator &&
      window.navigator.vibrate
    ) {
      try {
        window.navigator.vibrate(12);
      } catch (_) {}
    }

    playTapAudio();

    // Deduct energy
    const finalEnergy = energy - 1;
    setEnergy(finalEnergy);
    localStorage.setItem("gramqash_mining_energy", finalEnergy.toString());

    // Update global balance
    const tapAmount = league.tapPower;
    if (onUpdateTqhBalance) {
      onUpdateTqhBalance(user.gqhBalance + tapAmount);
    }

    // Capture tap position coordinates for floating numbers
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTap = {
      id: Date.now() + Math.random(),
      x,
      y,
      amount: tapAmount,
    };

    setFloatingTaps((prev) => [...prev, newTap]);

    // Bouncy scale trigger
    setIsCoinTapped(true);
    setTimeout(() => setIsCoinTapped(false), 90);
  };

  // Auto-remove floating values to free memory
  useEffect(() => {
    if (floatingTaps.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTaps((prev) => prev.slice(1));
    }, 700);
    return () => clearTimeout(timer);
  }, [floatingTaps]);

  // Rate calculations
  const RATE = 0.0001; // 1 GQH = 0.0001 GRAM (ton)
  const gqhNum = parseFloat(gqhInput) || 0;
  const tonOutput = (gqhNum * RATE).toFixed(4);
  const gqhInTon = user.gqhBalance * RATE;
  const totalInTon = user.tonBalance + gqhInTon;
  const totalInUsdValue = totalInTon * tonPrice;

  // Swapping validations
  const handleTqhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTqhInput(val);

    const num = parseFloat(val);
    if (!val) {
      setSwapError("");
    } else if (isNaN(num) || num <= 0) {
      setSwapError("Please enter a valid amount");
    } else if (num > user.gqhBalance) {
      setSwapError(`Insufficient GQH (Max: ${user.gqhBalance.toFixed(1)})`);
    } else {
      setSwapError("");
    }
  };

  const handleMax = () => {
    setTqhInput(user.gqhBalance.toString());
    setSwapError("");
  };

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paySum = parseFloat(gqhInput);
    if (isNaN(paySum) || paySum <= 0 || paySum > user.gqhBalance) return;
    const received = paySum * RATE;
    onSwap(paySum, received);
    setTqhInput("");
  };

  // Convert league progression to percent
  const leagueCapPercent = Math.min(
    100,
    Math.max(
      0,
      ((user.gqhBalance - league.min) / (league.max - league.min)) * 100,
    ),
  );

  return (
    <div className="space-y-4">
      {/* Dynamic Embedded In-file Styles for Floating Tap effects */}
      <style>{`
        @keyframes floatUpFadeOut {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-90px) scale(0.8) rotate(${Math.random() > 0.5 ? "10" : "-10"}deg);
            opacity: 0;
          }
        }
        .animate-float-earn {
          animation: floatUpFadeOut 0.65s cubic-bezier(0.25, 1, 0.50, 1) forwards;
        }
      `}</style>

      {/* 1. Header Profile & League badge section */}
      <div className="relative flex items-center justify-between bg-slate-900/50 border border-slate-700/50 p-3.5 rounded-2xl shadow-lg overflow-hidden">
        {/* Background Image Layer */}
        {PROFILE_BACKGROUNDS[profileBgIndex] ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
              style={{
                backgroundImage: `url(${PROFILE_BACKGROUNDS[profileBgIndex]})`,
              }}
            />
            {/* Dark gradient on the left to keep text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 z-0 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 z-0 pointer-events-none" />
        )}

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center border border-white/5 font-black text-white text-sm select-none uppercase tracking-wide">
              {user.username.slice(0, 2)}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 leading-none drop-shadow-sm">
              {user.username}
            </p>
            <button
              onClick={() => setShowLeagueDrawer(true)}
              className={`flex items-center gap-1 ${league.textColor} font-black text-[9px] uppercase tracking-wider mt-1 hover:brightness-110 active:scale-95 transition bg-slate-950/40 px-2 py-0.5 rounded-full border border-blue-900/35`}
            >
              <span>
                {league.emoji} {league.name.split(" ")[0]}
              </span>
              <span className="text-slate-500 font-bold">&gt;</span>
            </button>
          </div>
        </div>

        {/* Haptic / Sound fast preference triggers */}
        <div className="flex gap-1.5 bg-slate-950/30 p-1 rounded-xl border border-blue-900/10">
          <button
            onClick={() => handleTogglePreference("sound")}
            className={`p-1.5 rounded-lg transition ${
              user.soundEnabled !== false
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-600"
            }`}
            title="Toggle Pop Sound"
          >
            {user.soundEnabled !== false ? (
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => handleTogglePreference("haptic")}
            className={`p-1.5 rounded-lg transition text-xs font-black select-none ${
              user.hapticEnabled !== false
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-slate-600"
            }`}
            title="Toggle Sim Haptics"
          >
            {user.hapticEnabled !== false ? "HAP" : "OFF"}
          </button>
        </div>
      </div>

      {/* Task Creation Button */}
      <button
        onClick={() => setShowTaskCenterModal(true)}
        className="w-full bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm py-3 rounded-2xl border border-blue-500/30 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Target className="w-4 h-4" />
        Add Task
      </button>

      {/* 2. Total estimated balance card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1233]/70 via-[#070b1e]/60 to-[#0e163b]/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 text-center space-y-1.5 shadow-sm select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <span className="text-slate-400 font-medium text-[10px] tracking-widest uppercase">
          Total Estimated Yield
        </span>
        <h2 className="text-3.5xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <img
            src="https://i.suar.me/EpN7r/l"
            alt="GRAM (ton)"
            className="w-7 h-7 object-contain inline-block filter drop-shadow-sm animate-pulse"
          />
          <span>{totalInTon.toFixed(3)}</span>
        </h2>
        <p className="text-blue-300/80 text-xs font-bold leading-none">
          ~$
          {totalInUsdValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          USD
        </p>

        {/* Mini progress to next league cap */}
        <div className="pt-2 max-w-[240px] mx-auto space-y-1">
          <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-extrabold text-blue-400/70">
            <span>Leagues Progression</span>
            <span>{Math.floor(leagueCapPercent)}%</span>
          </div>
          <div className="w-full bg-slate-950/70 h-1.5 rounded-full border border-blue-950/40 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${league.color}`}
              style={{ width: `${leagueCapPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Sleek Capsule Segment Selector */}
      <div className="bg-slate-950/95 p-1 rounded-2xl flex border border-blue-950/60 shadow-inner">
        <button
          onClick={() => setHomeSubTab("airdrop")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            homeSubTab === "airdrop"
              ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-blue-500 border border-cyan-500/15 shadow-sm"
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          🎁 GramQash Airdrop
        </button>
        <button
          onClick={() => setHomeSubTab("convert")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            homeSubTab === "convert"
              ? "bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 border border-slate-800 shadow"
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          💎 Wallet &amp; Convert
        </button>
      </div>

      <AnimatePresence mode="wait">
        {homeSubTab === "airdrop" ? (
          /* ======================================= */
          /*            TAB: AIRDROP VIEW            */
          /* ======================================= */
          <motion.div
            key="airdrop-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col space-y-4"
          >
            {/* Live Campaign Status Badge Banner */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-[#030718] border border-cyan-500/15 rounded-2xl p-4 relative overflow-hidden shadow-lg select-none text-left">
              <div className="flex flex-col mb-1 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <h3 className="font-extrabold text-[#f1f5f9] text-base leading-snug flex items-center justify-start gap-1.5 flex-1">
                    Strategic AirDrop
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                  </h3>
                  <div className="flex w-fit items-center gap-1.5 bg-blue-500/15 border border-cyan-500/25 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest font-mono whitespace-nowrap">
                      Snapshot Active
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal font-medium mt-1">
                  Secure your verified allocation from GramQash reward pool
                  before the final snapshot (Snapshot Ledger).
                </p>
              </div>
            </div>

            {/* Countdown Clock Panel */}
            <div className="bg-[#1c1c1e]/95 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 font-extrabold pb-1 border-b border-blue-950/20">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Countdown to snapshot closure</span>
              </div>

              {timeLeft > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-800/15 border border-slate-800 p-2 rounded-xl">
                    <span className="block text-lg font-black text-white font-mono leading-none">
                      {String(
                        Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
                      ).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase text-slate-400 font-bold mt-1 block">
                      Days
                    </span>
                  </div>
                  <div className="bg-slate-800/15 border border-slate-800 p-2 rounded-xl">
                    <span className="block text-lg font-black text-white font-mono leading-none">
                      {String(
                        Math.floor(
                          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                        ),
                      ).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase text-slate-400 font-bold mt-1 block">
                      Hours
                    </span>
                  </div>
                  <div className="bg-slate-800/15 border border-slate-800 p-2 rounded-xl">
                    <span className="block text-lg font-black text-white font-mono leading-none">
                      {String(
                        Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
                      ).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase text-slate-400 font-bold mt-1 block">
                      Minutes
                    </span>
                  </div>
                  <div className="bg-slate-800/15 border border-slate-800 p-2 rounded-xl">
                    <span className="block text-lg font-black text-blue-500 font-mono leading-none animate-pulse">
                      {String(
                        Math.floor((timeLeft % (1000 * 60)) / 1000),
                      ).padStart(2, "0")}
                    </span>
                    <span className="text-[8px] uppercase text-slate-400 font-bold mt-1 block">
                      Seconds
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-black text-red-400">
                  🚨 AirDrop snapshot has been taken!
                </p>
              )}
            </div>

            {/* Global Pool Allocation Tracker */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-blue-500/90 font-mono font-bold">
                  {(() => {
                    const base = 3000000;
                    const diff = Math.max(
                      0,
                      Date.now() - new Date("2026-06-18T00:00:00Z").getTime(),
                    );
                    // random growth roughly 5 GRAM per second
                    const currentPool = base + Math.floor(diff / 200);
                    const formatted = new Intl.NumberFormat().format(
                      currentPool,
                    );
                    return `${formatted} GRAM / 12,000,000`;
                  })()}
                </span>
                <span className="font-extrabold text-slate-300">
                  Reward Pool Consumption
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-blue-950">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${(() => {
                      const base = 3000000;
                      const diff = Math.max(
                        0,
                        Date.now() - new Date("2026-06-18T00:00:00Z").getTime(),
                      );
                      const currentPool = base + Math.floor(diff / 200);
                      return Math.min(100, (currentPool / 12000000) * 100);
                    })()}%`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              </div>
              <p className="text-[9px] text-slate-500 text-center font-bold">
                Distributed{" "}
                <span className="text-blue-500">
                  {(() => {
                    const base = 3000000;
                    const diff = Math.max(
                      0,
                      Date.now() - new Date("2026-06-18T00:00:00Z").getTime(),
                    );
                    const currentPool = base + Math.floor(diff / 200);
                    return Math.min(
                      100,
                      (currentPool / 12000000) * 100,
                    ).toFixed(1);
                  })()}
                  %
                </span>{" "}
                of total rewards to active GramQash farmers
              </p>
            </div>

            {/* Interactive Live Airdrop Projection Calculator */}
            <div className="bg-gradient-to-b from-[#060a21] to-[#020512] border border-[#22d3ee]/15 p-4 rounded-3xl space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-950">
                <span className="text-[9px] bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded-md border border-cyan-500/15">
                  Eligibility Calculator
                </span>
                <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5 justify-start">
                  Forecast your strategic allocation
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </h4>
              </div>

              <p className="text-[10px] text-slate-300 leading-normal text-left">
                Test your reward growth! Adjust default expectation sliders to
                increase future GRAM allocation:
              </p>

              <div className="space-y-3">
                {/* GQH slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold">
                      Expected GQH balance:
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {calcTqh.toFixed(0)} GQH
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="5000000"
                    step="50"
                    value={calcTqh}
                    onChange={(e) => setCalcTqh(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                  />
                </div>

                {/* Invites slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold">
                      Expected invitees count:
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {calcInvites} Persons
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={calcInvites}
                    onChange={(e) =>
                      setCalcInvites(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Dynamic projections display boxes */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950/80 border border-blue-900/30 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] uppercase text-slate-500 font-bold block">
                    Estimated USD Value
                  </span>
                  <p className="text-xs font-black text-slate-200 font-mono mt-0.5 leading-none">
                    $
                    {(
                      (calcTqh * 0.0001 + calcInvites * 2.5) *
                      tonPrice
                    ).toFixed(1)}{" "}
                    USD
                  </p>
                </div>
                <div className="bg-gradient-to-tr from-[#0a1835]/80 to-slate-950/80 border border-cyan-500/15 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] uppercase text-blue-500/80 font-bold block">
                    Expected AirDrop allocation
                  </span>
                  <p className="text-xs font-black text-blue-500 font-mono mt-0.5 leading-none animate-pulse">
                    {(calcTqh * 0.0001 + calcInvites * 2.5).toFixed(2)} GRAM
                    (ton)
                  </p>
                </div>
              </div>

              {/* Quick action helper to drive conversions */}
              <div className="text-[8.5px] text-slate-400 leading-normal text-center bg-slate-950 p-1.5 rounded-xl border border-blue-950">
                🌱 Every{" "}
                <strong className="text-green-500 font-bold">1 GQH</strong>{" "}
                equals{" "}
                <strong className="text-slate-250 font-bold">
                  0.0001 GRAM
                </strong>
                . Every referral gives you{" "}
                <strong className="text-blue-500 font-bold">2.5 GRAM</strong>{" "}
                extra!
              </div>
            </div>

            {/* Interactive On-Chain Authorization Verification Card */}
            <div className="bg-gradient-to-br from-[#0e163d]/65 via-[#060b24]/90 to-[#0d163d]/65 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-start pb-1 gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-slate-800 text-blue-400 shrink-0">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-extrabold text-xs text-slate-100 leading-none">
                    Activity Proof & Financial Address
                  </h4>
                  <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
                    ON-CHAIN PROOF SIGNATURE
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-300 leading-relaxed text-left">
                Broadcast the digital signature document to secure your
                allocation on GRAM blockchain and officially authorize claim
                paths for public distribution.
              </p>

              {/* Progress Terminal log while signature process */}
              {isRegistering && (
                <div className="bg-slate-950/80 border border-blue-900/30 rounded-xl px-2.5 py-2 space-y-1.5 font-mono text-[8px] max-h-24 overflow-y-auto">
                  {registerLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-blue-500"
                    >
                      <span>{log}</span>
                      <span className="text-[7px] text-slate-500 font-bold">
                        [{(idx + 1) * 16}%]
                      </span>
                    </div>
                  ))}
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-blue-500 h-full animate-pulse"
                      style={{ width: `${(registerStep + 1) * 16.6}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Under Review if status is under_review */}
              {user.airdropSignatureStatus === "under_review" && (
                <div className="bg-amber-950/15 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between shadow-inner mt-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-500 leading-none">
                      Under Review
                    </p>
                    <p className="text-[9px] text-slate-350 mt-1">
                      Verification pending for <strong>{user.username}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Verified Certificate if registered */}
              {user.airdropSignatureStatus === "verified" && (
                <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between shadow-inner mt-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <BadgeCheck className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-green-500 leading-none">
                      Smart contract signature fully verified
                    </p>
                    <p className="text-[9px] text-slate-350 mt-1">
                      Authentication completed and entitlement registered
                    </p>
                  </div>
                </div>
              )}

              {user.airdropSignatureStatus !== "verified" &&
                user.airdropSignatureStatus !== "under_review" &&
                !isRegistering && (
                  <button
                    onClick={handleStartVerification}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-115 active:scale-98 transition text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/15 border border-cyan-500/20 mt-1 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-cyan-200 animate-pulse" />
                    {t(
                      "sign_airdrop_entitlement",
                      "Sign & Prove Airdrop Entitlement (0.5 TON)",
                    )}
                  </button>
                )}
            </div>

            {/* Checklist Eligibility Module */}
            <div className="bg-[#05091c]/70 border border-slate-800 rounded-2xl overflow-hidden shadow">
              <div className="border-b border-blue-950/40 px-3.5 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/20 select-none gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[10px] text-blue-500 uppercase tracking-widest">
                    {t("airdrop_status", "Airdrop Status")}
                  </span>
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" />
                    34560
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full order-first sm:order-none self-end sm:self-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <div className="divide-y divide-blue-950/40 px-1 font-sans">
                {/* Condition 1: Connected GRAM Wallet */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      Wallet Connected
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Total connection verifications.
                    </p>
                  </div>
                  {user.walletAddress ? (
                    <span className="text-green-500 font-black flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded">
                      {t("fulfilled", "Yes")}
                    </span>
                  ) : (
                    <span className="text-red-400 font-black flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded">
                      No
                    </span>
                  )}
                </div>

                {/* Condition 2: Total GQH Balance */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                      GQH Coins Amount
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Your total gathered holdings.
                    </p>
                  </div>
                  <span className="text-cyan-400 font-black flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {user.gqhBalance.toFixed(0)}
                  </span>
                </div>

                {/* Condition 3: Telegram Tasks */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Tasks Completed
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Participated social network campaigns.
                    </p>
                  </div>
                  <span className="text-blue-400 font-black flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded">
                    {user.telegramTasksCount || 0}
                  </span>
                </div>

                {/* Condition 4: Watched Ads */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                      Ads Watched
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Total advertisements completed.
                    </p>
                  </div>
                  <span className="text-amber-400 font-black flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded">
                    {user.watchedAdsCount || 0}
                  </span>
                </div>

                {/* Condition 5: Daily Check-ins */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Daily Logins
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Daily streaks and interactions.
                    </p>
                  </div>
                  <span className="text-purple-400 font-black flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded">
                    {user.dailyCheckInCount || 0}
                  </span>
                </div>

                {/* Condition 6: Games Played */}
                <div className="py-2.5 px-2 flex flex-row items-center justify-between text-xs">
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />
                      Games Played
                    </p>
                    <p className="text-[9px] text-slate-400 ml-5 border-l border-slate-700 pl-2">
                      Total sessions of mini-games.
                    </p>
                  </div>
                  <span className="text-emerald-400 font-black flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {user.gamesPlayedCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* CREATIVE FEATURE 1: Sleek Diagnostic Blockchain GAS FUEL Tank Status Indicator */}
            <div className="bg-gradient-to-r from-[#03071b] to-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md sm:text-left text-right font-sans">
              <div className="flex flex-row-reverse sm:flex-row justify-between items-center pb-2 border-b border-blue-950/40">
                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-md border border-indigo-500/15 font-mono uppercase">
                  SAFETY AUDIT
                </span>
                <h4 className="font-extrabold text-xs text-slate-200">
                  {t("gas_fuel_tank", "Network Gas Fuel Tank")}
                </h4>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-blue-950 flex flex-col items-center justify-center relative shadow-inner shrink-0 overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-[#06b6d4]/40 transition-all duration-300"
                    style={{
                      height: `${Math.min((user.tonBalance / 0.05) * 100, 100)}%`,
                    }}
                  />
                  <div className="relative text-white font-black font-mono text-[10px] drop-shadow-sm leading-none">
                    {Math.round(Math.min((user.tonBalance / 0.05) * 100, 100))}%
                  </div>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-200">
                    {user.tonBalance >= 0.05 ? (
                      <span className="text-green-500 flex items-center justify-start gap-1 font-black">
                        Smart contract gas fuel is safe for immediate
                        distribution 🚀
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center justify-start gap-1 font-black">
                        Network gas balance is low ⚠️ (0.05 GRAM required)
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    The connected wallet requires minor virtual gas fuel to
                    process and broadcast the collected contract bundles to{" "}
                    {user.walletAddress
                      ? "your active address"
                      : "your personal account"}
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* CREATIVE FEATURE 2: Interactive Dynamic Airdrop Vesting Scheduler Card */}
            <div className="bg-gradient-to-b from-[#0a1030]/85 to-[#04081b] border border-cyan-500/15 rounded-3xl p-4 space-y-3.5 shadow-xl sm:text-left text-right font-sans">
              <div className="flex flex-row-reverse sm:flex-row justify-between items-center pb-2 border-b border-blue-950/40">
                <span className="text-[9px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/15 font-mono">
                  VESTING FLOW
                </span>
                <h4 className="font-extrabold text-xs text-slate-100">
                  {t(
                    "airdrop_release_schedule",
                    "Airdrop Token Release Schedule",
                  )}
                </h4>
              </div>

              <p className="text-[10px] text-slate-300 leading-normal">
                {t(
                  "airdrop_release_desc",
                  "To protect token price and economy from massive dumps, your {{amount}} GRAM allocation is gradually released:",
                ).replace(
                  "{{amount}}",
                  (calcTqh * 0.0001 + calcInvites * 2.5).toFixed(2),
                )}
              </p>

              <div className="grid grid-cols-3 gap-2 py-1 select-none">
                {/* Milestone 1 */}
                <div className="bg-slate-950/90 border border-emerald-500/20 p-2 rounded-xl text-center flex flex-col justify-between space-y-1 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded-bl-lg leading-none">
                    {t("unlocked", "Unlocked")}
                  </div>
                  <span className="text-[8px] font-extrabold text-slate-400 block pt-2.5">
                    {t("tge_date", "Direct TGE Phase")}
                  </span>
                  <p className="text-[11px] font-black font-mono text-cyan-300">
                    {((calcTqh * 0.0001 + calcInvites * 2.5) * 0.4).toFixed(2)}{" "}
                    GRAM (ton)
                  </p>
                  <span className="text-[7.5px] font-bold text-green-500 mt-1 block tracking-wider bg-green-500/5 py-0.5 rounded">
                    {t("tge_40_percent", "40% at snapshot")}
                  </span>
                </div>

                {/* Milestone 2 */}
                <div className="bg-slate-950/50 border border-blue-950 p-2 rounded-xl text-center flex flex-col justify-between space-y-1 shadow-sm">
                  <span className="text-[8px] font-extrabold text-slate-500 block">
                    {t("after_30_days", "After 30 Days")}
                  </span>
                  <p className="text-[11px] font-black font-mono text-slate-400">
                    {((calcTqh * 0.0001 + calcInvites * 2.5) * 0.3).toFixed(2)}{" "}
                    GRAM (ton)
                  </p>
                  <span className="text-[7.5px] font-bold text-slate-550 mt-1 block tracking-wider bg-slate-900 px-1 py-0.5 rounded">
                    {t("locked_30_percent", "30% Locked")}
                  </span>
                </div>

                {/* Milestone 3 */}
                <div className="bg-slate-950/50 border border-blue-950 p-2 rounded-xl text-center flex flex-col justify-between space-y-1 shadow-sm">
                  <span className="text-[8px] font-extrabold text-slate-500 block">
                    {t("after_60_days", "After 60 Days")}
                  </span>
                  <p className="text-[11px] font-black font-mono text-slate-400">
                    {((calcTqh * 0.0001 + calcInvites * 2.5) * 0.3).toFixed(2)}{" "}
                    GRAM (ton)
                  </p>
                  <span className="text-[7.5px] font-bold text-slate-550 mt-1 block tracking-wider bg-slate-900 px-1 py-0.5 rounded">
                    {t("locked_30_percent", "30% Locked")}
                  </span>
                </div>
              </div>

              {/* Security advice disclaimer */}
              <div className="text-[8px] text-slate-500 bg-slate-950/40 p-2 rounded-xl border border-blue-950/40 leading-normal text-center font-semibold">
                {t(
                  "airdrop_security_note",
                  "🛡️ Reward distribution relies on digital snapshot and your wallet signature. Never disconnect your wallet to avoid allocation loss.",
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ======================================= */
          /*            TAB: CONVERTER ASSETS        */
          /* ======================================= */
          <motion.div
            key="convert-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Interactive Bonuses Info Box */}
            <div className="bg-gradient-to-r from-[#010822]/90 to-[#0e163d]/50 border border-slate-800 rounded-xl p-3 text-xs space-y-2 shadow-sm select-none">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
                  <Gift className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-200 text-[11px] leading-none">
                    Starter Reward Claimed!
                  </p>
                  <p className="text-slate-450 text-[10px] mt-0.5">
                    Welcome bonus added +50 GQH to portfolio.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-green-500/15 text-green-500 shrink-0">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-slate-200 text-[11px] leading-none">
                    Wallet Connection Reward
                  </p>
                  <p className="text-slate-450 text-[10px] mt-0.5">
                    {user.walletAddress ? (
                      <span className="text-green-500 font-bold">
                        ✓ Gained +0.5 GRAM Bonus
                      </span>
                    ) : (
                      <>
                        Connect wallet to unlock{" "}
                        <span className="text-green-500 font-extrabold">
                          +0.5 GRAM
                        </span>{" "}
                        instantly.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tokens list */}
            <div className="bg-[#0b0f24]/70 border border-slate-800 rounded-2xl overflow-hidden shadow">
              <div className="border-b border-slate-900/40 px-3.5 py-2 flex justify-between items-center bg-slate-800/20 select-none">
                <span className="font-extrabold text-[10px] text-blue-400 uppercase tracking-widest">
                  Liquid Assets
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  1 GRAM = ${tonPrice}
                </span>
              </div>

              <div className="divide-y divide-blue-950/40">
                {/* GRAM Icon Block */}
                <div className="px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-500/5 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-slate-800 overflow-hidden shadow shrink-0">
                      <img
                        src="https://i.suar.me/EpN7r/l"
                        alt="Gramcoin"
                        className="w-full h-full object-cover scale-[1.05]"
                      />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-200 text-xs">
                        Gramcoin
                      </p>
                      <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase">
                        GRAM (ton)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-slate-100 text-xs">
                      {user.tonBalance.toFixed(3)}
                    </p>
                    <p className="text-[10px] text-blue-300 font-medium">
                      ${(user.tonBalance * tonPrice).toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* GQH Icon Block */}
                <div className="px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-500/5 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/15 shadow shrink-0">
                      <span className="text-indigo-400 font-black text-sm tracking-tighter">
                        TQ
                      </span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-200 text-xs">
                        GramQash
                      </p>
                      <span className="text-[9px] text-indigo-400/80 font-black tracking-wider uppercase">
                        GQH
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-indigo-400 text-xs">
                      {user.gqhBalance.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      ${(gqhInTon * tonPrice).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core swap logic */}
            <div className="bg-[#0b0e24]/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-lg">
              <h3 className="font-extrabold text-xs text-blue-450 flex items-center gap-1.5 leading-none">
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                CONVERT GQH TO GRAM COINS
              </h3>

              <form onSubmit={handleSwapSubmit} className="space-y-3">
                <div className="relative">
                  <label className="text-[8px] text-blue-400/80 font-black absolute left-3 top-1.5 uppercase tracking-widest">
                    You Pay
                  </label>
                  <input
                    type="number"
                    value={gqhInput}
                    onChange={handleTqhChange}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full bg-slate-950/60 border border-blue-900/40 rounded-xl px-3 pt-4.5 pb-1.5 text-sm font-bold text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                  />
                  <div className="absolute right-2.5 top-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleMax}
                      className="text-[8px] text-blue-500 font-black bg-blue-500/10 hover:bg-cyan-550/15 px-1.5 py-0.5 rounded transition"
                    >
                      MAX
                    </button>
                    <span className="text-[9px] font-black text-indigo-400 font-mono">
                      GQH
                    </span>
                  </div>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-blue-500 text-white rounded-full p-1 shadow-md shadow-blue-500/20">
                    <RefreshCw
                      className="w-3 h-3 animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-[8px] text-slate-500 font-black absolute left-3 top-1.5 uppercase tracking-widest">
                    Receive (Estimated)
                  </label>
                  <input
                    type="text"
                    value={tonOutput}
                    disabled
                    placeholder="0.0000"
                    className="w-full bg-slate-950/30 border border-blue-950/30 rounded-xl px-3 pt-4.5 pb-1.5 text-sm font-bold text-slate-400 cursor-not-allowed font-mono"
                  />
                  <span className="absolute right-3.5 top-3.5 text-[9px] font-black text-blue-500 font-mono">
                    GRAM (ton)
                  </span>
                </div>

                {swapError && (
                  <p className="text-[10px] text-red-400 font-bold px-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {swapError}
                  </p>
                )}

                <div className="flex justify-between text-[11px] text-slate-400 px-1 font-medium">
                  <span>Exchange Standard Rate</span>
                  <span>1 GQH = 0.0001 GRAM</span>
                </div>

                <button
                  type="submit"
                  disabled={
                    !!swapError || !gqhInput || parseFloat(gqhInput) <= 0
                  }
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-indigo-700 hover:brightness-110 text-white font-black rounded-xl text-xs shadow-md disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 transition"
                >
                  Convert Assets Instantly
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 pb-4">
        <button
          onClick={() => {
            if (onShowToast) {
              onShowToast("Coming Soon ✨", "info");
            }
          }}
          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-115 active:scale-95 transition-all text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-pulse cursor-pointer border border-indigo-400/30"
        >
          <Target className="w-5 h-5 text-indigo-200" />
          {t("airdrop_check_btn", "Airdrop Check")}
        </button>
      </div>

      {/* ======================================= */}
      {/*              TASK CENTER MODAL            */}
      {/* ======================================= */}
      <AnimatePresence>
        {showTaskCenterModal && (
          <TaskCenterModal
            onClose={() => setShowTaskCenterModal(false)}
            onShowToast={onShowToast || (() => {})}
            onOpenWalletModal={onOpenWalletModal}
            onPayCustomTask={onPayCustomTask || (async () => {})}
          />
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/*   REPLICATED LEAGUE & LEADERBOARD SHEET   */}
      {/* ======================================= */}
      <AnimatePresence>
        {showLeagueDrawer && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center select-none bg-slate-950/85">
            {/* Click outside backdrop safety */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeagueDrawer(false)}
              className="absolute inset-0 cursor-pointer"
            />

            {/* Smart Drawer content panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-w-md w-full relative z-10 space-y-4 max-h-[85vh] overflow-y-auto flex flex-col"
            >
              {/* Close top drag handle decoration */}
              <div className="flex justify-center -mt-2">
                <div
                  onClick={() => setShowLeagueDrawer(false)}
                  className="w-12 h-1 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700"
                />
              </div>

              {/* Header Box */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{league.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-sm leading-tight">
                      Leagues Competitions
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Level: {league.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeagueDrawer(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Progress Level metrics */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl space-y-1 text-center">
                <span className="text-[9px] uppercase tracking-widest text-slate-550 font-black">
                  Your Current League Stand
                </span>
                <h4 className={`text-lg font-black ${league.textColor}`}>
                  {league.emoji} {league.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold">
                  {user.gqhBalance.toFixed(0)} GQH{" "}
                  <span className="text-slate-700">/</span> {league.max} GQH max
                </p>

                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${league.color}`}
                    style={{ width: `${leagueCapPercent}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-normal mt-1 text-left px-1">
                  💡 Perk unlocked:{" "}
                  <strong className="text-slate-350">{league.perk}</strong>!
                  Next league tier perk unlocks{" "}
                  <strong className="text-slate-350">{nextPowerText}</strong>.
                </p>
              </div>

              {/* Selector tabs for leagues info / leaderboard ranking */}
              <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-850/60">
                <button
                  onClick={() => setDrawerSubTab("perks")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                    drawerSubTab === "perks"
                      ? "bg-slate-800 text-blue-400"
                      : "text-slate-550 hover:text-slate-400"
                  }`}
                >
                  🛡️ League Perks
                </button>
                <button
                  onClick={() => setDrawerSubTab("leaderboard")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                    drawerSubTab === "leaderboard"
                      ? "bg-slate-800 text-blue-400"
                      : "text-slate-550 hover:text-slate-400"
                  }`}
                >
                  🏆 Global Top 8
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {drawerSubTab === "perks" ? (
                  /* Perks guide lists */
                  <div className="space-y-2 pb-2">
                    {[
                      {
                        l: "Bronze League",
                        min: "0 - 150",
                        val: "+1 GQH Power",
                        em: "🪙",
                        c: "text-amber-500",
                        isCur: user.gqhBalance < 150,
                      },
                      {
                        l: "Silver League",
                        min: "150 - 500",
                        val: "+2 GQH Power",
                        em: "🥈",
                        c: "text-slate-300",
                        isCur: user.gqhBalance >= 150 && user.gqhBalance < 500,
                      },
                      {
                        l: "Gold League",
                        min: "500 - 1500",
                        val: "+3 GQH Power",
                        em: "🥇",
                        c: "text-yellow-405",
                        isCur: user.gqhBalance >= 500 && user.gqhBalance < 1500,
                      },
                      {
                        l: "Platinum League",
                        min: "1500 - 4000",
                        val: "+4 GQH Power",
                        em: "💎",
                        c: "text-sky-400",
                        isCur:
                          user.gqhBalance >= 1500 && user.gqhBalance < 4000,
                      },
                      {
                        l: "Diamond League",
                        min: "4000+",
                        val: "+5 GQH Power",
                        em: "👑",
                        c: "text-purple-400",
                        isCur: user.gqhBalance >= 4000,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          row.isCur
                            ? "bg-slate-800/40 border-slate-800"
                            : "bg-slate-950/20 border-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{row.em}</span>
                          <div>
                            <p
                              className={`font-black ${row.isCur ? "text-blue-400" : "text-slate-200"}`}
                            >
                              {row.l}{" "}
                              {row.isCur && (
                                <span className="text-[8px] bg-blue-500/15 uppercase px-1.5 py-0.2 rounded font-black tracking-wide">
                                  Current
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-500 font-bold">
                              Requirement: {row.min} GQH
                            </span>
                          </div>
                        </div>

                        <span
                          className={`font-black text-right ${row.isCur ? "text-green-500" : "text-slate-400"}`}
                        >
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Global competition Leaderboard lists */
                  <div className="space-y-2 pb-2">
                    {[
                      {
                        r: 1,
                        u: "@CryptoWhale_AR_بوت",
                        l: "Diamond",
                        v: "4,512,910",
                        em: "👑",
                      },
                      {
                        r: 2,
                        u: "@Sarah_Airdrops",
                        l: "Diamond",
                        v: "2,818,450",
                        em: "💎",
                      },
                      {
                        r: 3,
                        u: "@Ahmed_Ton_Bot_1",
                        l: "Diamond",
                        v: "1,907,200",
                        em: "💎",
                      },
                      {
                        r: 4,
                        u: "@Alexandros_GQH",
                        l: "Gold",
                        v: "1,450,111",
                        em: "🥇",
                      },
                      {
                        r: 5,
                        u: "@محمد_تليجرام",
                        l: "Gold",
                        v: "915,000",
                        em: "🥇",
                      },
                      {
                        r: 6,
                        u: "@Bot_Hunter_EN",
                        l: "Silver",
                        v: "542,000",
                        em: "🥈",
                      },
                      {
                        r: 7,
                        u: "@علي_عسكر",
                        l: "Silver",
                        v: "320,010",
                        em: "🥈",
                      },
                      {
                        r: 301245,
                        u: "You",
                        l: league.name.split(" ")[0],
                        v: user.gqhBalance.toFixed(0),
                        em: league.emoji,
                      },
                    ].map((cont, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                          cont.u === "You"
                            ? "bg-blue-500/10 border-slate-800"
                            : "bg-slate-950/20 border-slate-800/40 hover:bg-slate-850/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${
                              cont.r === 1
                                ? "bg-yellow-500/10 text-yellow-400"
                                : cont.r === 2
                                  ? "bg-slate-400/15 text-slate-300"
                                  : cont.r === 3
                                    ? "bg-amber-700/15 text-amber-500"
                                    : "text-slate-500"
                            }`}
                          >
                            {cont.r}
                          </span>
                          <div>
                            <p
                              className={`font-black ${cont.u === "You" ? "text-blue-400" : "text-slate-200"}`}
                            >
                              {cont.u}{" "}
                              {cont.u === "You" && (
                                <span className="text-[8px] bg-blue-500/15 uppercase px-1 py-0.2 rounded font-black tracking-wide">
                                  Me
                                </span>
                              )}
                            </p>
                            <span className="text-[9px] text-slate-500 font-bold">
                              League: {cont.l} {cont.em}
                            </span>
                          </div>
                        </div>

                        <span className="font-extrabold text-slate-100 font-mono">
                          {cont.v} GQH
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/*        AIRDROP PROGRESS MODAL           */}
      {/* ======================================= */}
      <AnimatePresence>
        {showAirdropCheckModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center select-none bg-slate-950/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAirdropCheckModal(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-[#0b0f24] border-t border-indigo-500/20 rounded-t-3xl pt-2 pb-6 px-4 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] flex flex-col h-[75vh]"
            >
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-400" />
                  {t("airdrop_progress_title", "Airdrop Progress")}
                </h3>
                <button
                  onClick={() => setShowAirdropCheckModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 transition hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1. GQH Balance Progress */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2.5 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">
                      {t("min_balance_50k", "Minimum Balance (50k GQH)")}
                    </span>
                    <span className="text-sm font-black font-mono text-blue-400">
                      {Math.min((user.gqhBalance / 50000) * 100, 100).toFixed(
                        1,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((user.gqhBalance / 50000) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    {user.gqhBalance.toFixed(0)} / 50,000
                  </p>
                </div>

                {/* 2. Daily Check-in Progress */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2.5 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">
                      {t("daily_checkin_progress", "Daily Check-ins")}
                    </span>
                    <span className="text-sm font-black font-mono text-purple-400">
                      {Math.min(
                        ((user.dailyCheckInCount || 0) / 20) * 100,
                        100,
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((user.dailyCheckInCount || 0) / 20) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    {user.dailyCheckInCount || 0} / 20 {t("days", "Days")}
                  </p>
                </div>

                {/* 3. Ads Watched Progress */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2.5 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">
                      {t("ads_watched_progress", "Ads Watched")}
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {Math.min(
                        ((user.watchedAdsCount || 0) / 200) * 100,
                        100,
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((user.watchedAdsCount || 0) / 200) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-green-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    {user.watchedAdsCount || 0} / 200 {t("ads", "Ads")}
                  </p>
                </div>

                {/* 4. Telegram Channels Joined */}
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl shadow-inner space-y-2">
                  <div className="flex flex-row-reverse sm:flex-row justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">
                      {t("telegram_joined_progress", "Telegram Channels")}
                    </span>
                    <span className="text-xs font-black font-mono text-amber-400">
                      {Math.min(
                        ((user.telegramTasksCount || 0) / 20) * 100,
                        100,
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((user.telegramTasksCount || 0) / 20) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-amber-600 to-yellow-400"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 sm:text-left text-right">
                    {user.telegramTasksCount || 0} / 20{" "}
                    {t("channels_bots", "Channels/Bots")}
                  </p>
                </div>

                {/* 5. Wallet Connected */}
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl shadow-inner flex flex-row-reverse sm:flex-row justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">
                    {t("wallet_connected", "Wallet Connected (TON Connect)")}
                  </span>
                  {user.walletAddress ? (
                    <span className="text-[10px] text-green-500 font-extrabold bg-green-500/10 px-2 py-0.5 rounded">
                      {t("completed_100", "Completed 100%")}
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-400 font-extrabold bg-red-500/10 px-2 py-0.5 rounded">
                      {t("incomplete_0", "Incomplete 0%")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
