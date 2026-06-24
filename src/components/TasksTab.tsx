import React, { useEffect, useState } from "react";
import {
  Calendar,
  PlayCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { UserState } from "../types";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

interface CustomTask {
  id: string;
  title: string;
  description: string;
  link: string;
  maxClicks: number;
  currentClicks: number;
  status: "pending" | "approved";
  createdAt: number;
}

interface TasksTabProps {
  user: UserState;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onJoinTelegram: () => void;
  onTelegramDailyShare: () => void;
  adCooldownLeft: number;
}

export default function TasksTab({
  user,
  onClaimDaily,
  onWatchAd,
  onJoinTelegram,
  onTelegramDailyShare,
  adCooldownLeft,
}: TasksTabProps) {
  const [dailyCountdownStr, setDailyCountdownStr] = useState("");
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [completedCustomTasks, setCompletedCustomTasks] = useState<string[]>(
    [],
  );
  const [completedPartnerTasks, setCompletedPartnerTasks] = useState<string[]>(
    [],
  );

  const [telegramShareCount, setTelegramShareCount] = useState<number>(0);
  const [lastTelegramShareAt, setLastTelegramShareAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sharesDate = localStorage.getItem("gqh_last_tg_share_date");

    if (sharesDate === todayStr) {
      setTelegramShareCount(
        parseInt(localStorage.getItem("gqh_tg_share_count") || "0"),
      );
      setLastTelegramShareAt(localStorage.getItem("gqh_last_tg_share_at"));
    } else {
      setTelegramShareCount(0);
      setLastTelegramShareAt(null);
    }
  }, []);

  const handleShareClick = () => {
    const refLink = `https://t.me/TonQashBot?startapp=ref_${user.telegramId || user.username.toLowerCase().replace(/\s+/g, "_")}`;
    const text = "Join me on TonQash and earn real GRAM!";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }

    setTimeout(() => {
      const todayStr = new Date().toISOString().split("T")[0];
      const nowStr = new Date().toISOString();

      let currentCount = telegramShareCount;
      if (localStorage.getItem("gqh_last_tg_share_date") !== todayStr) {
        currentCount = 0;
      }

      const nextCount = Math.min(currentCount + 1, 4);
      setTelegramShareCount(nextCount);
      setLastTelegramShareAt(nowStr);

      localStorage.setItem("gqh_last_tg_share_date", todayStr);
      localStorage.setItem("gqh_tg_share_count", nextCount.toString());
      localStorage.setItem("gqh_last_tg_share_at", nowStr);

      if (nextCount === 4 && currentCount < 4) {
        onTelegramDailyShare();
      }
    }, 1000);
  };

  useEffect(() => {
    // 1. Fetch custom tasks from DB
    const q = query(
      collection(db, "customTasks"),
      where("status", "==", "approved"),
    );
    const unsubscribeTasks = onSnapshot(
      q,
      (snapshot) => {
        const fetched: CustomTask[] = [];
        snapshot.forEach((d) =>
          fetched.push({ id: d.id, ...d.data() } as CustomTask),
        );
        const validFetched = fetched.filter((t) => t.currentClicks < t.maxClicks);
        setCustomTasks(validFetched);
      },
      (error) => {
        console.error("Tasks fetch error:", error);
      },
    );

    // 2. Fetch completed partner tasks from local
    const completedPartner = localStorage.getItem(
      "gqh_completed_partner_tasks",
    );
    if (completedPartner) {
      setCompletedPartnerTasks(JSON.parse(completedPartner));
    }

    return () => unsubscribeTasks();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = collection(db, `users/${auth.currentUser.uid}/completedTasks`);
    const unsubscribeCompleted = onSnapshot(
      q,
      (snapshot) => {
        const completed: string[] = [];
        snapshot.forEach((d) => completed.push(d.id));
        setCompletedCustomTasks(completed);
      },
      (error) => {
        console.error("Completed tasks fetch error:", error);
      },
    );

    return () => unsubscribeCompleted();
  }, []);

  const handleCompleteCustomTask = async (taskId: string) => {
    if (completedCustomTasks.includes(taskId) || !auth.currentUser) return;

    try {
      // Optimistically update local array so button transitions immediately
      setCompletedCustomTasks((prev) => [...prev, taskId]);

      // Write to Firebase
      await setDoc(
        doc(db, `users/${auth.currentUser.uid}/completedTasks`, taskId),
        {
          completedAt: Date.now(),
        },
      );

      await updateDoc(doc(db, "customTasks", taskId), {
        currentClicks: increment(1),
      });
      // A full backend would also credit tokens here
    } catch (e) {
      console.error("Failed to complete custom task", e);
    }
  };

  const handleCompletePartnerTask = (taskId: string) => {
    const updated = [...completedPartnerTasks, taskId];
    setCompletedPartnerTasks(updated);
    localStorage.setItem(
      "gqh_completed_partner_tasks",
      JSON.stringify(updated),
    );
    // simulate earning locally
  };

  // Daily Check-in Countdown helper
  useEffect(() => {
    if (!user.dailyClaimedAt) return;

    const interval = setInterval(() => {
      const lastClaim = new Date(user.dailyClaimedAt!).getTime();
      const nextClaim = lastClaim + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextClaim - now;

      if (diff <= 0) {
        setDailyCountdownStr("");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setDailyCountdownStr(
          `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.dailyClaimedAt]);

  const isDailyClaimed = !!dailyCountdownStr;

  return (
    <div className="space-y-4">
      <div className="text-start py-1.5">
        <h2 className="text-xl font-black text-white tracking-tight">
          Earning Tasks
        </h2>
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
              <h3 className="font-extrabold text-slate-100 text-sm">
                Daily Check-in
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Settle minor GRAM gas fee to claim your daily allocation of 200
                GQH. Refreshed daily.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +200 GQH
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
              <span className="text-[10px] text-slate-500 font-mono">
                {dailyCountdownStr}
              </span>
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
              <h3 className="font-extrabold text-slate-100 text-sm">
                Watch Educational Ad
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Watch a fast 15-second high-yield digital ad to claim 40 GQH.
                Repeatable hourly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +40 GQH
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

      {/* 4. Daily Telegram Share Task Card */}
      <div className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-blue-550/20 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 shrink-0">
              <Send className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">
                Daily Telegram Share
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Share inside Telegram 4 times daily to claim 200 GQH!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full">
              +200 GQH
            </span>
            <span className="text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              {telegramShareCount}/4 Shares
            </span>
          </div>

          {telegramShareCount >= 4 ? (
            <span className="text-[10px] text-green-500 font-bold bg-green-500/15 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-500/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <button
              onClick={handleShareClick}
              className="bg-blue-600 hover:bg-blue-700 py-2 px-3.5 rounded-lg text-[11px] font-extrabold text-white shadow-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              Share Now
            </button>
          )}
        </div>
      </div>

      {/* 5. App / Partner Tasks */}
      <div className="pt-4 mt-4 border-t border-slate-800 space-y-4">
        <div className="text-start">
          <h2 className="text-lg font-black text-white tracking-tight">
            App Tasks
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Explore our partner apps & games to earn more! (+100 GQH EACH)
          </p>
        </div>

        {[
          {
            id: "cattea_ai",
            title: "Cattea AI Trade App",
            link: "https://t.me/CatteaAIbot/tradeapp?startapp=8E28EV",
            desc: "Join right away and explore!",
          },
          {
            id: "tverse_galaxy",
            title: "TVerse Galaxy",
            link: "https://t.me/TVerse?startapp=galaxy-0003fa679a0002987ae30000a948eb",
            desc: "Join right away and explore!",
          },
          {
            id: "partner-gorilla",
            title: "Play GorillaCaseBot",
            link: "https://t.me/GorillaCaseBot/app?startapp=r_1368899842",
            desc: "Join GorillaCaseBot and discover amazing rewards!",
          },
          {
            id: "partner-rolls",
            title: "Play RollsGameBot",
            link: "https://t.me/rollsgame_bot/app?startapp=ref_CTqRaJiPLK",
            desc: "Roll the dice and win big with RollsGameBot!",
          },
          {
            id: "partner-gamee",
            title: "Play Gamee",
            link: "https://t.me/gamee/start?startapp=eyJyZWYiOjEzNjg4OTk4NDJ9",
            desc: "Play exciting games on Gamee!",
          },
        ].map((task) => {
          const isCompleted = completedPartnerTasks.includes(task.id);
          return (
            <div
              key={task.id}
              className="bg-gradient-to-br from-[#0e163d]/50 via-[#070b1e]/50 to-[#0b102c]/50 border border-purple-550/20 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20 shrink-0">
                    <PlayCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-sm">
                      {task.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {task.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    +100 GQH
                  </span>
                </div>

                {isCompleted ? (
                  <span className="text-[10px] text-green-500 font-bold bg-green-500/15 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-500/15 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : (
                  <a
                    href={task.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCompletePartnerTask(task.id)}
                    className="bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg text-[11px] font-extrabold text-white shadow-lg active:scale-95 transition-transform text-center inline-block"
                  >
                    Play
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Custom User Added Tasks */}
      {customTasks.length > 0 && (
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-4">
          <div className="text-start">
            <h2 className="text-lg font-black text-white tracking-tight">
              Community Tasks
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tasks created by the community.
            </p>
          </div>

          {customTasks.map((task) => {
            const isCompleted = completedCustomTasks.includes(task.id);
            return (
              <div
                key={task.id}
                className="bg-gradient-to-br from-[#0e163d]/30 via-[#070b1e]/30 to-[#0b102c]/30 border border-slate-700/50 p-4 rounded-2xl relative overflow-hidden space-y-3.5 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <ExternalLink className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-sm">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      +10 GQH
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="text-[10px] text-green-500 font-bold bg-green-500/15 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-500/15">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  ) : (
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleCompleteCustomTask(task.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 py-2 px-4 rounded-lg text-[11px] font-extrabold text-white shadow-lg transition-transform active:scale-95 text-center"
                    >
                      Complete
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
