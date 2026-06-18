import React, { useEffect, useState } from 'react';
import { Calendar, PlayCircle, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { UserState } from '../types';

interface TasksTabProps {
  user: UserState;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onJoinTelegram: () => void;
  adCooldownLeft: number;
}

export default function TasksTab({
  user,
  onClaimDaily,
  onWatchAd,
  onJoinTelegram,
  adCooldownLeft,
}: TasksTabProps) {
  const [dailyCountdownStr, setDailyCountdownStr] = useState('');

  // Daily Check-in Countdown helper
  useEffect(() => {
    if (!user.dailyClaimedAt) return;

    const interval = setInterval(() => {
      const lastClaim = new Date(user.dailyClaimedAt!).getTime();
      const nextClaim = lastClaim + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextClaim - now;

      if (diff <= 0) {
        setDailyCountdownStr('');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setDailyCountdownStr(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.dailyClaimedAt]);

  const isDailyClaimed = !!dailyCountdownStr;

  return (
    <div className="space-y-4">
      <div className="text-left py-1.5">
        <h2 className="text-xl font-black text-white tracking-tight">Earning Tasks</h2>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
          Earn GramQash tokens by doing quick tasks and checking in.
        </p>
      </div>

      {/* 1. Daily Check-in Task Card */}
      <div className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-blue-550/20 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Daily Check-in</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Settle minor GRAM gas fee to claim your daily allocation of 30 GQH. Refreshed daily.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +30 GQH
            </span>
            <span>Fee: 0.07 GRAM</span>
          </div>

          {!user.walletAddress ? (
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Need Wallet
            </span>
          ) : isDailyClaimed ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3 text-blue-400" />
                Claimed
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{dailyCountdownStr}</span>
            </div>
          ) : (
            <button
              onClick={onClaimDaily}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-2 px-3.5 rounded-lg text-[11px] font-extrabold text-white shadow-lg"
            >
              Claim (0.07 GRAM (ton))
            </button>
          )}
        </div>
      </div>

      {/* 2. Watch Ad Task Card */}
      <div className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-blue-550/20 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-indigo-500/15 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20 shrink-0">
              <PlayCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Watch Educational Ad</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Watch a fast 15-second high-yield digital ad to claim 10 GQH. Repeatable hourly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +10 GQH
            </span>
          </div>

          {adCooldownLeft > 0 ? (
            <span className="text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500 animate-pulse" />
              Cooldown: {adCooldownLeft}s
            </span>
          ) : (
            <button
              onClick={onWatchAd}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-2 px-3.5 rounded-lg text-[11px] font-extrabold text-white shadow-lg"
            >
              Watch Ad
            </button>
          )}
        </div>
      </div>

      {/* 3. Join Telegram Channel Task Card */}
      <div className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-blue-550/20 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-sky-500/15 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/20 shrink-0">
              <Send className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Join Official Channel</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Subscribe to our main updates and drop alert community! Claim 100 GQH instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +100 GQH
            </span>
          </div>

          {user.telegramJoined ? (
            <span className="text-[10px] text-green-500 font-bold bg-green-500/15 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-500/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <button
              onClick={onJoinTelegram}
              className="bg-sky-500 hover:bg-sky-600 py-2 px-3.5 rounded-lg text-[11px] font-extrabold text-white shadow-lg"
            >
              Join Channel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
