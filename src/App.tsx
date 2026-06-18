import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TonConnectUI, THEME } from '@tonconnect/ui';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import {
  Wallet,
  Zap,
  ArrowLeftRight,
  Calendar,
  PlayCircle,
  User,
  Gamepad2,
  Gift,
  HelpCircle,
  Loader2,
  X,
  CreditCard,
  History,
  TrendingUp,
  Award,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  QrCode,
  Radio,
  Smartphone
} from 'lucide-react';

import { UserState, ActivityLog } from './types';
import HomeTab from './components/HomeTab';
import TasksTab from './components/TasksTab';
import GameTab from './components/GameTab';
import ProfileTab from './components/ProfileTab';
import AdminTab from './components/AdminTab';
import DropBlastGame from './components/DropBlastGame';
import CryptoRunnerGame from './components/CryptoRunnerGame';
import CardMatchGame from './components/CardMatchGame';
import LoadingPage from './components/LoadingPage';
import { useTranslation } from 'react-i18next';

// Static config
const FALLBACK_TON_PRICE = 7.25;

export default function App() {
  const { t } = useTranslation();
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'games' | 'profile' | 'admin'>('home');
  const [showLoading, setShowLoading] = useState(true);
  
  // Real GRAM price
  const [tonPrice, setTonPrice] = useState(FALLBACK_TON_PRICE);

  // Profile Background State
  const [profileBgIndex, setProfileBgIndex] = useState(() => {
    return parseInt(localStorage.getItem('gramqash_profile_bg') || '0', 10);
  });

  const handleUpdateProfileBg = (index: number) => {
    setProfileBgIndex(index);
    localStorage.setItem('gramqash_profile_bg', index.toString());
  };

  // Fetch GRAM price on mount
  useEffect(() => {
    try {
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.ready();
        (window as any).Telegram.WebApp.expand();
      }
    } catch (e) {}
    
    async function fetchPrice() {
      try {
        const response = await fetch('/api/ton-price');
        if (response.ok) {
          const data = await response.json();
          if (data.price) {
            setTonPrice(data.price);
            return;
          }
        }
      } catch (err) {
        // Silent fallback
      }

      // Fallback for Cloudflare Pages purely static hosting
      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data["the-open-network"] && data["the-open-network"].usd) {
            setTonPrice(data["the-open-network"].usd);
          }
        }
      } catch (err) {
        console.error("Static fetch failed.", err);
      }
    }
    fetchPrice();
    // Poll every 2 minutes
    const interval = setInterval(fetchPrice, 120000);
    return () => clearInterval(interval);
  }, []);

  // Check and sync data with Firebase
  const { user, setUser, logs, setLogs } = useFirebaseSync();

  // Active playing game overlay state
  const [activeGame, setActiveGame] = useState<'drop-blast' | 'crypto-runner' | 'card-match' | null>(null);

  // Modals Visibility
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showZeroTonModal, setShowZeroTonModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeAdSim, setActiveAdSim] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  // Simulated ad watch values
  const [adCountdown, setAdCountdown] = useState(15);
  const [adCooldown, setAdCooldown] = useState(0);

  // Global Dynamic Status Notification (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto Dismiss Toast Effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Show welcome bonus modal if not claimed yet on start
  useEffect(() => {
    if (!user.hasClaimedWelcomeBonus) {
      setShowWelcomeModal(true);
    }
  }, [user.hasClaimedWelcomeBonus]);

  // Loading page timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // GRAM Connect 2.0 active reference
  const tonConnectUIRef = useRef<TonConnectUI | null>(null);

  useEffect(() => {
    try {
      const tonConnectUI = new TonConnectUI({
        manifestUrl: 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json',
      });

      tonConnectUI.uiOptions = {
        language: 'en',
        uiPreferences: {
          theme: THEME.DARK,
          borderRadius: 'm'
        }
      };

      tonConnectUIRef.current = tonConnectUI;

      // Subscribe to real-time wallet connection states
      const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
          const rawAddress = wallet.account.address;
          setUser((prev) => {
            const isFirstTime = !prev.walletAddress;
            const nextTon = isFirstTime ? prev.tonBalance + 0.5 : prev.tonBalance;
            
            if (isFirstTime) {
              setTimeout(() => {
                addLog('bonus', 'Onboarding Wallet Bonus', '+0.500', 'GRAM (ton)');
                triggerToast('Real GRAM wallet connected successfully! You received +0.5 GRAM (ton)', 'success');
              }, 200);
            }
            return {
              ...prev,
              walletAddress: rawAddress,
              tonBalance: nextTon
            };
          });
        } else {
          setUser((prev) => {
            if (prev.walletAddress) {
              setTimeout(() => {
                triggerToast('Wallet connection cancelled', 'info');
              }, 200);
            }
            return {
              ...prev,
              walletAddress: null
            };
          });
        }
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize GRAM Connect UI:', error);
    }
  }, []);

  // Cooldown countdown interval
  useEffect(() => {
    let adInterval: NodeJS.Timeout;
    if (adCooldown > 0) {
      adInterval = setInterval(() => {
        setAdCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(adInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(adInterval);
  }, [adCooldown]);
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Helper to add activity logs
  const addLog = (type: ActivityLog['type'], title: string, amount: string, token: 'GRAM (ton)' | 'GQH') => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      amount,
      token,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Welcome bonus handler
  const claimWelcomeBonus = () => {
    setUser((prev) => ({
      ...prev,
      gqhBalance: prev.gqhBalance + 50,
      hasClaimedWelcomeBonus: true
    }));
    addLog('bonus', 'Onboarding Welcome Reward', '+50.0', 'GQH');
    setShowWelcomeModal(false);
    triggerToast('Claimed 50 GQH Welcome Bonus!', 'success');
  };

  // Real GRAM Connect 2.0 trigger
  const handleOpenTonConnect = () => {
    if (!tonConnectUIRef.current) {
      triggerToast('TonConnect system is initializing and syncing...', 'info');
      return;
    }
    if (user.walletAddress) {
      // Real GRAM Connect Disconnect Call
      tonConnectUIRef.current.disconnect();
    } else {
      // Real GRAM Connect Connection Modal Call
      tonConnectUIRef.current.openModal();
    }
  };

  // Daily check-in simulation
  const handleInitiateDailyCheckin = () => {
    if (!user.walletAddress) {
      triggerToast('Please connect GRAM wallet to start tasks.', 'info');
      handleOpenTonConnect();
      return;
    }

    // Check gas GRAM (ton)
    if (user.tonBalance < 0.07) {
      setShowZeroTonModal(true);
      return;
    }

    setShowTransactionModal(true);
  };

  const handleConfirmDailyCheckin = () => {
    setShowTransactionModal(false);
    setShowProcessingModal(true);

    setTimeout(() => {
      setUser((prev) => ({
        ...prev,
        tonBalance: prev.tonBalance - 0.07,
        gqhBalance: prev.gqhBalance + 30,
        dailyClaimedAt: new Date().toISOString(),
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        dailyCheckInCount: (prev.dailyCheckInCount || 0) + 1
      }));

      addLog('task', 'Daily check-in Fee payment', '-0.070', 'GRAM (ton)');
      addLog('task', 'Daily check-in Allocation claimed', '+30.0', 'GQH');

      setShowProcessingModal(false);
      triggerToast('Claimed +30.0 GQH reward!', 'success');
    }, 2000);
  };

  // Watch simulated ad logic
  const handleStartWatchingAd = () => {
    if (adCooldown > 0) {
      triggerToast(`Ad is on cooldown. Try in ${adCooldown} seconds.`, 'error');
      return;
    }

    if ((window as any).Adsgram) {
      const AdController = (window as any).Adsgram.init({ blockId: "int-34560" });
      AdController.show()
        .then(() => {
          handleClaimAdReward();
        }).catch((err: any) => {
          console.error(err);
          triggerToast('Error or ad skipped.', 'error');
        });
    } else {
      // Fallback
      setAdCountdown(15);
      setActiveAdSim(true);
      const adInterval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(adInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleClaimAdReward = () => {
    setActiveAdSim(false);
    setUser((prev) => ({
      ...prev,
      gqhBalance: prev.gqhBalance + 10,
      watchedAdsCount: (prev.watchedAdsCount || 0) + 1,
      completedTasksCount: (prev.completedTasksCount || 0) + 1
    }));
    setAdCooldown(30); // 30 seconds cooldown
    addLog('task', 'Watched Promotional Ad', '+10.0', 'GQH');
    triggerToast('Earned +10 GQH from Watching Ad!', 'success');
  };

  // Convert/Swap operation
  const handleSwapTokens = (gqhPaid: number, tonGained: number) => {
    setUser((prev) => ({
      ...prev,
      gqhBalance: prev.gqhBalance - gqhPaid,
      tonBalance: prev.tonBalance + tonGained
    }));

    addLog('swap', 'Swapped GQH to GRAM liquidity', `-${gqhPaid.toFixed(1)}`, 'GQH');
    addLog('swap', 'GRAM (ton) Liquidity Credited', `+${tonGained.toFixed(4)}`, 'GRAM (ton)');

    triggerToast(`Converted ${gqhPaid.toFixed(0)} GQH to ${tonGained.toFixed(4)} GRAM (ton)`, 'success');
  };

  // Join Telegram Channel simulation
  const handleJoinTelegramTask = () => {
    // Open Telegram link in new browser page or tab safely
    window.open('https://t.me/explore_ai_studio', '_blank');

    setShowProcessingModal(true);
    setTimeout(() => {
      setUser((prev) => ({
        ...prev,
        telegramJoined: true,
        gqhBalance: prev.gqhBalance + 100,
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        telegramTasksCount: (prev.telegramTasksCount || 0) + 1
      }));

      addLog('task', 'Joined Official Channel Reward', '+100.0', 'GQH');
      setShowProcessingModal(false);
      triggerToast('Claimed +100 GQH Channel bonus!', 'success');
    }, 2500);
  };

  // Launch a game overlay
  const handleLaunchGame = (gameId: 'drop-blast' | 'crypto-runner' | 'card-match') => {
    setActiveGame(gameId);
  };

  // Earn rewards from games
  const handleFinishMiniGame = (score: number, rewardTqh: number) => {
    setActiveGame(null);
    setUser((prev) => ({
      ...prev,
      gamesPlayedCount: (prev.gamesPlayedCount || 0) + 1,
      gqhBalance: rewardTqh > 0 ? prev.gqhBalance + rewardTqh : prev.gqhBalance
    }));

    if (rewardTqh > 0) {
      addLog('game', `Game Yield: Score ${score}`, `+${rewardTqh.toFixed(1)}`, 'GQH');
      triggerToast(`Claimed +${rewardTqh} GQH game rewards!`, 'success');
    } else {
      triggerToast(`Finished game. No rewards claimed.`, 'info');
    }
  };

  // Withdrawal logic settlement request
  const handleConfirmWithdrawal = () => {
    setShowWithdrawalModal(false);
    setShowProcessingModal(true);

    setTimeout(() => {
      const amountWithdrawn = user.tonBalance - 0.005; // leave microgas

      setUser((prev) => ({
        ...prev,
        tonBalance: 0.005
      }));

      addLog('withdraw', 'GRAM (ton) payout settlement request', `-${amountWithdrawn.toFixed(3)}`, 'GRAM (ton)');
      setShowProcessingModal(false);
      triggerToast('Withdrawal successful! Processing to blockchain.', 'success');
    }, 2000);
  };

  // Update GQH balance handler (for Tap Mining and click boosts)
  const handleUpdateTqhBalance = (newAmount: number) => {
    setUser((prev) => ({ ...prev, gqhBalance: newAmount }));
  };

  // Update sound and haptic preferences
  const handleUpdatePreferences = (haptic: boolean, sound: boolean) => {
    setUser((prev) => ({
      ...prev,
      hapticEnabled: haptic,
      soundEnabled: sound
    }));
  };

  const handleClaimReferralBonus = () => {
    const reward = Math.floor(Math.random() * 120) + 1;
    setUser((prev) => ({
      ...prev,
      gqhBalance: prev.gqhBalance + reward,
      dailyReferralClaimedAt: new Date().toISOString()
    }));
    addLog('bonus', 'Daily Referral GQH Claim', `+${reward}.0`, 'GQH');
    triggerToast(`Claimed +${reward} GQH Bonus!`, 'success');
  };

  return (
    <>
      <AnimatePresence>
        {showLoading && <LoadingPage onComplete={() => setShowLoading(false)} />}
      </AnimatePresence>
      {!showLoading && (
        <div className="w-screen h-[100dvh] bg-black text-white font-sans overflow-hidden relative select-none flex flex-col mx-auto w-full md:max-w-md md:border-x border-slate-800">
        
        {/* Dynamic Slide Toast Banner inside phone frame */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-4 left-4 right-4 z-50 p-3.5 rounded-xl flex items-center justify-between border shadow-xl ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-555/30 text-emerald-350'
                  : toast.type === 'error'
                  ? 'bg-red-950/95 border-red-555/30 text-red-350'
                  : 'bg-indigo-950/95 border-indigo-555/30 text-indigo-350'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                <p className="text-xs font-bold leading-tight">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP NAVBAR HEADER within mockup frame */}
        <header className="border-b border-slate-900 bg-black/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between shrink-0 select-none z-10 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-[#070913] border border-slate-800">
              <img
                src="https://i.suar.me/EpN7r/l"
                alt="GRAM (ton)"
                className="w-full h-full object-cover scale-[1.05]"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                GramQash
                <span className="text-[9px] uppercase font-bold text-blue-400 bg-blue-500/15 px-1 py-0.2 rounded">
                  Beta
                </span>
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenTonConnect}
            className={`px-2.5 py-1.5 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition ${
              user.walletAddress
                ? 'bg-green-500/10 border border-emerald-500/20 text-green-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/10 hover:from-cyan-600 hover:to-blue-700'
            }`}
          >
            <Wallet className="w-3 h-3" />
            {user.walletAddress ? (
              <span>
                {user.walletAddress.slice(0, 5)}...{user.walletAddress.slice(-4)}
              </span>
            ) : (
              <span>{t('connect_wallet')}</span>
            )}
          </button>
        </header>

        {/* TABS VIEW CONTAINER (Scrolls internally) */}
        <main className="flex-1 overflow-y-auto styled-scrollbar px-4 py-3.5 pb-24 relative select-text">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'home' && (
                <HomeTab
                  user={user}
                  onSwap={handleSwapTokens}
                  onOpenWalletModal={handleOpenTonConnect}
                  tonPrice={tonPrice}
                  onUpdateTqhBalance={handleUpdateTqhBalance}
                  onUpdatePreferences={handleUpdatePreferences}
                  onShowToast={triggerToast}
                  profileBgIndex={profileBgIndex}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksTab
                  user={user}
                  onClaimDaily={handleInitiateDailyCheckin}
                  onWatchAd={handleStartWatchingAd}
                  onJoinTelegram={handleJoinTelegramTask}
                  adCooldownLeft={adCooldown}
                />
              )}

              {activeTab === 'games' && (
                <GameTab user={user} onLaunchGame={handleLaunchGame} />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  user={user}
                  onOpenWithdrawalModal={() => setShowWithdrawalModal(true)}
                  logs={logs}
                  tonPrice={tonPrice}
                  onUpdatePreferences={handleUpdatePreferences}
                  onClaimReferralBonus={handleClaimReferralBonus}
                  profileBgIndex={profileBgIndex}
                  onUpdateProfileBg={handleUpdateProfileBg}
                  onShowToast={triggerToast}
                />
              )}

              {activeTab === 'admin' && (
                <AdminTab />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* CORE ACTIVE GAME FULLSCREEN VIEWER OVERLAY (Absolute locked within frame) */}
        {activeGame === 'drop-blast' && (
          <DropBlastGame
            user={user}
            onFinishGame={handleFinishMiniGame}
            onClose={() => setActiveGame(null)}
          />
        )}

        {activeGame === 'crypto-runner' && (
          <CryptoRunnerGame
            user={user}
            onFinishGame={handleFinishMiniGame}
            onClose={() => setActiveGame(null)}
          />
        )}

        {activeGame === 'card-match' && (
          <CardMatchGame
            onCollect={(score) => {
              handleFinishMiniGame(score, Math.floor(score / 50));
              setActiveGame(null);
            }}
            onExit={() => setActiveGame(null)}
          />
        )}

        {/* BOTTOM FLOATING NAVIGATION BAR */}
        <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-slate-900 bg-[#1c1c1e]/95 backdrop-blur-xl px-2 py-4 pb-6 flex justify-around shrink-0 select-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'home'
                ? 'text-white bg-white/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">{t('home', 'Home')}</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'tasks'
                ? 'text-white bg-white/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">{t('tasks', 'Tasks')}</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'games'
                ? 'text-white bg-white/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">{t('games', 'Games')}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'profile'
                ? 'text-white bg-white/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">{t('profile', 'Profile')}</span>
          </button>

          {user.username === 'sekanedr_is' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-500 hover:text-indigo-300'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">Admin</span>
            </button>
          )}
        </nav>

      {/* ======================================= */}
      {/*            MODALS & OVERLAYS            */}
      {/* ======================================= */}

      {/* Real GRAM Connect manages modal overlays natively inside the browser context, no simulation DOM needed here */}

      {/* 2. Transaction Confirmation modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransactionModal(false)}
              className="absolute inset-0 bg-slate-950/70"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e]/95 border border-slate-800 rounded-3xl p-6 max-w-sm w-full relative z-10 space-y-5 shadow-2xl text-center backdrop-blur-md"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">Confirm TX payment</h3>
                <p className="text-xs text-slate-400">Gas fee and claim request allocation.</p>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Gas Amount Due</span>
                <span className="text-2xl font-black text-white">0.07 GRAM</span>
                <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-0.5 rounded-full">+30.0 GQH reward</span>
              </div>

              <div className="text-[10px] text-slate-500 space-y-1">
                <p>Transfer destination: <span className="font-mono text-slate-400">GramQash Allocator System</span></p>
                <p>Status: <span className="text-green-500 font-bold active">Available</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-705 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Reject
                </button>
                <button
                  onClick={handleConfirmDailyCheckin}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-white rounded-xl text-xs shadow-md shadow-blue-500/15"
                >
                  Pay Gas Fee
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Infinite Spinner Loader Blocking modal */}
      <AnimatePresence>
        {showProcessingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center space-y-4 relative z-10"
            >
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-slate-200">Writing Smart Contract Transaction Details...</p>
                <p className="text-xs text-slate-500 mt-1">Contacting GRAM RPC servers...</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Help Zero GRAM Modal */}
      <AnimatePresence>
        {showZeroTonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowZeroTonModal(false)}
              className="absolute inset-0 bg-slate-950/70"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e]/95 border border-slate-800 rounded-3xl p-6 max-w-sm w-full relative z-10 space-y-5 shadow-2xl backdrop-blur-md"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Out of GRAM Gas</h3>
                <p className="text-xs text-slate-400">
                  You need a minor amount of GRAM (at least 0.07 GRAM (ton)) to settle check-in fees on-chain.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl space-y-3.5 text-xs">
                <p className="font-bold text-slate-300">How to get GRAM gas:</p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                  <li>Convert GQHs into GRAM inside the home tab swapper!</li>
                  <li>Connect a fresh GRAM wallet to get our <strong className="text-green-500 font-bold">+0.5 GRAM</strong> gift!</li>
                  <li>Open Telegram Wallet bot and buy GRAM via P2P!</li>
                </ul>
              </div>

              <button
                onClick={() => setShowZeroTonModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-705 text-white font-bold rounded-xl text-xs transition"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Withdrawal Confirm Modal */}
      <AnimatePresence>
        {showWithdrawalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawalModal(false)}
              className="absolute inset-0 bg-slate-950/70"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c1c1e]/95 border border-slate-800 rounded-3xl p-6 max-w-sm w-full relative z-10 space-y-5 shadow-2xl text-center backdrop-blur-md"
            >
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-white">Confirm blockchain transfer</h3>
                <p className="text-xs text-slate-400">
                  You are settling your accumulated Gramcoin to your personal custody wallet address.
                </p>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2 flex flex-col items-center justify-center">
                <img
                  src="https://i.suar.me/EpN7r/l"
                  alt="GRAM (ton)"
                  className="w-11 h-11 object-contain filter drop-shadow-sm mb-1"
                />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Settling Value (Estimated)</span>
                <p className="text-3xl font-black text-green-500">{(user.tonBalance - 0.005).toFixed(3)} GRAM</p>
                <p className="text-xs text-slate-500">~${((user.tonBalance - 0.005) * tonPrice).toFixed(2)} USD</p>
              </div>

              <div className="text-left space-y-2 bg-slate-900 p-3.5 rounded-xl border border-slate-800/60 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Destination wallet</span>
                  <span className="font-mono text-indigo-400">
                     {user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Not Connected'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Miner Commission fee</span>
                  <span>0.005 GRAM</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-705 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWithdrawal}
                  className="flex-grow py-3 bg-green-500 hover:bg-emerald-600 font-bold text-white rounded-xl text-xs"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. High-Fidelity Onboarding Welcome Slide Wizard Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#1c1c1e]/95 border border-slate-800 rounded-[32px] p-6 max-w-sm w-full relative z-10 space-y-5 shadow-2xl text-center flex flex-col backdrop-blur-md"
            >
              {onboardingSlide === 0 && (
                <motion.div
                  key="slide0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-2"
                >
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-800 shadow">
                    <Zap className="w-7 h-7 text-blue-400 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white tracking-tight">1. Active Coin Mining</h3>
                    <p className="text-xs text-slate-400 leading-relaxed px-2">
                      Tap the giant 3D gold token inside the **Mine GQH Coins** page to farm raw assets! Your energy regenerates automatically over time.
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingSlide === 1 && (
                <motion.div
                  key="slide1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-2"
                >
                  <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow">
                    <Award className="w-7 h-7 text-indigo-400 animate-bounce" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white tracking-tight">2. Grow Leagues Tiers</h3>
                    <p className="text-xs text-slate-400 leading-relaxed px-2">
                      Build your balance to bypass locks and advance through **Bronze, Silver, Gold, Platinum, and Diamond** Leagues. Higher tiers unlock stronger tap powers!
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingSlide === 2 && (
                <motion.div
                  key="slide2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-2"
                >
                  <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow">
                    <ArrowLeftRight className="w-7 h-7 text-green-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white tracking-tight">3. Convert GQH to GRAM</h3>
                    <p className="text-xs text-slate-400 leading-relaxed px-2">
                      Swap your mined GQH assets into safe Gramcoin (GRAM (ton)) directly at standard rates inside the secure converter. Grab instant wallet custody payouts!
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingSlide === 3 && (
                <motion.div
                  key="slide3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-14 h-14 bg-gradient-to-tr from-yellow-405 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <Gift className="w-7 h-7 text-slate-950 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight">Welcome Gift Waiting!</h3>
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Thank you for starting. Collect our premium starter allowance balance instantly.
                    </p>
                  </div>

                  {/* Starter bonus Presentation block */}
                  <div className="bg-gradient-to-br from-blue-950/20 via-slate-950/40 to-indigo-950/25 p-4 rounded-2xl border border-slate-800 shadow-inner">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Onboarding Balance Premium</span>
                    <p className="text-3xl font-black text-blue-400 mt-1 tracking-tight">+50.0 GQH</p>
                  </div>
                </motion.div>
              )}

              {/* Navigation dots and control button */}
              <div className="space-y-4 pt-1">
                {/* Dots indicators */}
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map((dotIndex) => (
                    <span
                      key={dotIndex}
                      onClick={() => setOnboardingSlide(dotIndex)}
                      className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                        onboardingSlide === dotIndex ? 'w-4.5 bg-blue-500' : 'w-2 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {onboardingSlide < 3 ? (
                  <button
                    onClick={() => setOnboardingSlide((prev) => prev + 1)}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold rounded-2xl transition active:scale-98 text-xs cursor-pointer border border-slate-700/30"
                  >
                    Continue Overview
                  </button>
                ) : (
                  <button
                    onClick={claimWelcomeBonus}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition active:scale-98 text-xs cursor-pointer"
                  >
                    Claim +50 GQH Bonus
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/*        7. SIMULATED FULL-SCREEN AD      */}
      {/* ======================================= */}
      <AnimatePresence>
        {activeAdSim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col p-6 overflow-hidden"
          >
            {/* Top Bar with countdown */}
            <div className="flex justify-between items-center z-10">
              <span className="text-xs text-slate-500 font-mono font-bold tracking-brand">Educational Promo</span>
              <div className="bg-slate-900 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300">
                {adCountdown > 0 ? `Ad closes in ${adCountdown}s` : 'Ad complete!'}
              </div>
            </div>

            {/* Ad Graphic Board Mockup */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto relative px-4">
              <div className="absolute top-24 left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
              <div className="absolute bottom-24 right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-white font-black text-3xl">TQ</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white tracking-tight">AI Studio Applet</h3>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    Designed and built directly in Google AI Studio. Empowering agents to write polished, rapid, full-scale layouts instantly!
                  </p>
                </div>
              </div>

              {/* Beautiful Simulated visual progress bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((15 - adCountdown) / 15) * 100}%` }}
                />
              </div>

              <div className="text-xs text-slate-500">
                Support partners! Keep the community active and free with ads. We share royalties back to you.
              </div>
            </div>

            {/* Bottom Reward Action triggers */}
            <div className="space-y-3 z-10">
              {adCountdown > 0 ? (
                <div className="text-center text-xs text-slate-600 font-semibold mb-2 flex items-center justify-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Please watch full promo to redeem rewards...</span>
                </div>
              ) : (
                <button
                  onClick={handleClaimAdReward}
                  className="w-full py-4 bg-green-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:translate-y-0.5 transition"
                >
                  <Gift className="w-4.5 h-4.5" />
                  Claim 10 GQH &amp; Close Ad
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      )}
    </>
  );
}
