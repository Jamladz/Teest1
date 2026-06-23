import React, { useEffect, useState } from "react";
import { PlayCircle, Award, Users, Trophy } from "lucide-react";
import { UserState } from "../types";

interface GameTabProps {
  user: UserState;
  onLaunchGame: (gameId: "drop-blast" | "crypto-runner" | "card-match") => void;
}

export default function GameTab({ user, onLaunchGame }: GameTabProps) {
  // Retrieve high scores dynamically on render
  const [dropBlastHighScore, setDropBlastHighScore] = useState(0);
  const [cryptoRunnerHighScore, setCryptoRunnerHighScore] = useState(0);

  // Dynamic online users
  const [dbUsers, setDbUsers] = useState(148532);
  const [crUsers, setCrUsers] = useState(87421);
  const [cmUsers, setCmUsers] = useState(105432);

  useEffect(() => {
    setDropBlastHighScore(
      parseInt(localStorage.getItem("drop_blast_highscore") || "0", 10),
    );
    setCryptoRunnerHighScore(
      parseInt(localStorage.getItem("crypto_runner_highscore") || "0", 10),
    );

    // Initial random value between 35k and 200k
    setDbUsers(Math.floor(Math.random() * (200000 - 35000 + 1) + 35000));
    setCrUsers(Math.floor(Math.random() * (150000 - 35000 + 1) + 35000)); // slightly less maybe

    // Tokens Matcher requires 100k to 200k specifically based on instructions
    setCmUsers(Math.floor(Math.random() * (200000 - 100000 + 1) + 100000));

    const interval = setInterval(() => {
      setDbUsers((prev) =>
        Math.max(
          35000,
          Math.min(200000, prev + Math.floor(Math.random() * 201) - 80),
        ),
      );
      setCrUsers((prev) =>
        Math.max(
          35000,
          Math.min(200000, prev + Math.floor(Math.random() * 151) - 60),
        ),
      );
      setCmUsers((prev) =>
        Math.max(
          100000,
          Math.min(200000, prev + Math.floor(Math.random() * 301) - 130),
        ),
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-left py-1.5">
        <h2 className="text-xl font-black text-white tracking-tight">
          Game Arena
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
          Play interactive mini-games and earn direct GQH token rewards
          instantly!
        </p>
      </div>

      <div className="grid gap-4">
        {/* Game 1: BB Drop Blast */}
        <div className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-blue-550/20 rounded-2xl overflow-hidden shadow-xl relative group">
          <div className="absolute top-3 right-3 bg-sky-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-10 tracking-widest leading-none">
            Popular
          </div>

          {/* Styled Background Visual banner (Compressed style) */}
          <div className="h-24 bg-gradient-to-r from-[#0d163c] to-[#04060f] relative overflow-hidden flex items-center justify-center border-b border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent z-[1]" />
            <div className="absolute top-2 left-6 w-8 h-8 rounded-full border border-yellow-500/10 bg-yellow-500/5 animate-bounce flex items-center justify-center text-yellow-500/20 text-[10px] font-bold">
              TQ
            </div>
            <div className="absolute bottom-2 right-8 w-10 h-10 rounded-full border border-sky-500/10 bg-sky-500/5 animate-pulse flex items-center justify-center text-sky-500/20 text-xs font-bold">
              ★
            </div>

            {/* Title display */}
            <div className="text-center z-[2] px-4">
              <h3 className="text-lg font-black text-white tracking-tighter drop-shadow-md">
                BB DROP BLAST
              </h3>
              <p className="text-[9px] text-sky-400 font-mono tracking-wider font-bold uppercase">
                Catch Gold Coins
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-snug">
              Slide left or right to catch falling golden GramQash (TQ) coins
              and multiplier stars. Watch out for lethal bear-market bombs!
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/65 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5 text-blue-400/80" />
                <span>
                  Active:{" "}
                  <strong className="text-slate-200">
                    {dbUsers.toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-450">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>
                  HighScore:{" "}
                  <strong className="text-yellow-400">
                    {dropBlastHighScore}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
                +1 GQH / 100 pts
              </span>

              <button
                onClick={() => onLaunchGame("drop-blast")}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-bold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1 text-white shadow-lg"
              >
                <PlayCircle className="w-4 h-4" />
                Play Game
              </button>
            </div>
          </div>
        </div>

        {/* Game 2: Crypto Runner */}
        <div className="bg-gradient-to-br from-[#0c241e]/50 via-[#040c09]/50 to-[#0c1814]/50 border border-emerald-550/25 rounded-2xl overflow-hidden shadow-xl relative group">
          <div className="absolute top-3 right-3 bg-green-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-10 tracking-widest leading-none">
            New
          </div>

          {/* Styled Background Visual banner (Compressed style) */}
          <div className="h-24 bg-gradient-to-r from-[#032d20] to-[#010a08] relative overflow-hidden flex items-center justify-center border-b border-emerald-500/15">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent z-[1]" />
            <div className="absolute top-2 right-6 w-8 h-8 rounded-full border border-emerald-500/10 bg-green-500/5 animate-pulse flex items-center justify-center text-emerald-500/20 text-[10px] font-bold">
              $
            </div>
            <div className="absolute bottom-2 left-6 w-6 h-6 rounded-full border border-teal-500/15 bg-teal-500/5 animate-bounce flex items-center justify-center text-teal-400/25 text-[9px] font-bold">
              ₿
            </div>

            {/* Title display */}
            <div className="text-center z-[2] px-4">
              <h3 className="text-lg font-black text-white tracking-tighter drop-shadow-md">
                CRYPTO RUNNER
              </h3>
              <p className="text-[9px] text-emerald-450 font-mono tracking-wider font-bold uppercase">
                Endless Jump Scroller
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-snug">
              Navigate market candlestick obstacles! Jump over red candles and
              red barrier lines. Collect floating green cash bubbles to maximize
              points yield.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/15">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5 text-green-500/80" />
                <span>
                  Active:{" "}
                  <strong className="text-slate-200">
                    {crUsers.toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-450">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>
                  HighScore:{" "}
                  <strong className="text-yellow-400">
                    {cryptoRunnerHighScore}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
                +1 GQH / 350 pts
              </span>

              <button
                onClick={() => onLaunchGame("crypto-runner")}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-bold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1 text-white shadow-lg"
              >
                <PlayCircle className="w-4 h-4" />
                Play Game
              </button>
            </div>
          </div>
        </div>

        {/* Game 3: Token Matcher */}
        <div className="bg-gradient-to-br from-[#1c142c]/50 via-[#0a0712]/50 to-[#120e24]/50 border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl relative group">
          <div className="absolute top-3 right-3 bg-purple-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-10 tracking-widest leading-none">
            New
          </div>

          <div className="h-24 bg-gradient-to-r from-[#1a0f30] to-[#040108] relative overflow-hidden flex items-center justify-center border-b border-purple-500/15">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent z-[1]" />
            <div className="text-center z-[2] px-4">
              <h3 className="text-lg font-black text-white tracking-tighter drop-shadow-md">
                TOKEN MATCHER
              </h3>
              <p className="text-[9px] text-purple-400 font-mono tracking-wider font-bold uppercase">
                Stack & Match Cards
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-snug">
              Stack and match 3 identical token cards! Clear the board before
              your slots fill up. Earn rewards for every successful match
              triplet!
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/15">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5 text-purple-500/80" />
                <span>
                  Active:{" "}
                  <strong className="text-slate-200">
                    {cmUsers.toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-450">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>
                  Score: <strong className="text-yellow-400">High</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
                +1 GQH / Match
              </span>

              <button
                onClick={() => onLaunchGame("card-match")}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 font-bold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1 text-white shadow-lg"
              >
                <PlayCircle className="w-4 h-4" />
                Play Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
