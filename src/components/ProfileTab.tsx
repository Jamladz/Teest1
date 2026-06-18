import React, { useState } from 'react';
import { Copy, Check, Send, AlertTriangle, History, ArrowDownToLine, Users, Share2, Volume2, Sparkles, Pencil, X, CheckCircle2 } from 'lucide-react';
import { UserState, ActivityLog } from '../types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileTabProps {
  user: UserState;
  onOpenWithdrawalModal: () => void;
  logs: ActivityLog[];
  tonPrice: number;
  onUpdatePreferences?: (haptic: boolean, sound: boolean) => void;
  onClaimReferralBonus: () => void;
  profileBgIndex?: number;
  onUpdateProfileBg?: (index: number) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfileTab({ 
  user, 
  onOpenWithdrawalModal, 
  logs, 
  tonPrice, 
  onUpdatePreferences, 
  onClaimReferralBonus,
  profileBgIndex = 0,
  onUpdateProfileBg,
  onShowToast
}: ProfileTabProps) {
  const [copied, setCopied] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const { t, i18n } = useTranslation();

  // Generate unique link
  const refLink = `https://t.me/GramQashBot?start=ref_${user.username.toLowerCase().replace(/\s+/g, '_')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEnoughForWithdrawal = user.tonBalance >= 5.0;

  const canClaimReferral = !user.dailyReferralClaimedAt || new Date().getTime() - new Date(user.dailyReferralClaimedAt).getTime() > 86400000;

  const PROFILE_BACKGROUNDS = [
    null,
    "https://i.suar.me/2zOW9/l",
    "https://i.suar.me/Lpozo/l",
    "https://i.suar.me/8zo1y/l",
    "https://i.suar.me/jv05v/l"
  ];
  
  const handleSelectBg = (index: number) => {
    if (onUpdateProfileBg) onUpdateProfileBg(index);
    setShowBgModal(false);
    if (onShowToast) onShowToast('Background updated', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Profile Box */}
      <div className="flex flex-col items-center text-center space-y-2.5 bg-[#1c1c1e] border border-slate-800 p-4 rounded-2xl relative overflow-hidden shadow-sm">
        {/* Background Image Layer */}
        {PROFILE_BACKGROUNDS[profileBgIndex] && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0"
            style={{ backgroundImage: `url(${PROFILE_BACKGROUNDS[profileBgIndex]})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent z-0" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-xl pointer-events-none z-0" />

        <div className="relative z-10">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-550 via-indigo-650 to-purple-800 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-inner">
              <span className="text-white font-black text-xl uppercase drop-shadow-sm">
                {user.username.slice(0, 2)}
              </span>
            </div>
            <button 
              onClick={() => setShowBgModal(true)}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-20"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse z-20" />
        </div>

        <div className="space-y-0.5 relative z-10">
          <h3 className="font-extrabold text-base text-slate-100 drop-shadow-sm">{user.username}</h3>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide">
            {user.walletAddress ? (
              <span className="text-blue-500 font-bold">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
            ) : (
              <span className="text-slate-500 font-semibold italic">Wallet disconnected</span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Micro Stats Block Row */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-[#0c1233]/70 border border-slate-800 p-3 rounded-xl text-center space-y-0.5 shadow">
          <p className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">Ton Balance</p>
          <p className="text-lg font-black text-slate-100">{user.tonBalance.toFixed(3)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">~${(user.tonBalance * tonPrice).toFixed(1)}</p>
        </div>

        <div className="bg-[#0e163b]/70 border border-indigo-500/15 p-3 rounded-xl text-center space-y-0.5 shadow">
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">GQH Balance</p>
          <p className="text-lg font-black text-indigo-400">{(user.gqhBalance).toFixed(1)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">~${(user.gqhBalance * 0.0001 * tonPrice).toFixed(1)}</p>
        </div>
      </div>

      {/* 3. Withdraw GRAM Terminal Section */}
      <div className="bg-gradient-to-br from-[#0c1233]/70 via-[#070b1e]/60 to-[#0e163b]/50 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-1.5 leading-none">
          <ArrowDownToLine className="w-4 h-4 text-green-500 animate-bounce" />
          Withdrawal Portal
        </h4>

        <p className="text-[11px] text-slate-400 leading-normal">
          Settle your earned Gramcoin (GRAM (ton)) directly to custody wallets. Instant blockchain processing.
        </p>

        {/* Warning Badge */}
        <div className="bg-red-500/10 border border-red-500/15 px-3 py-2.5 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-extrabold text-red-300 leading-none">Withdrawal Limit</p>
            <p className="text-[10px] text-red-400 leading-normal mt-0.5">
              Minimum allowed size is <strong className="font-extrabold text-slate-200">5 GRAM</strong> (~${(5 * tonPrice).toFixed(0)} USD).
            </p>
          </div>
        </div>

        {!user.walletAddress ? (
          <div className="bg-[#1a110a]/50 text-center py-2.5 rounded-xl border border-dashed border-amber-500/20">
            <p className="text-[11px] text-amber-500 font-bold">Please connect wallet before continuing.</p>
          </div>
        ) : (
          <button
            onClick={onOpenWithdrawalModal}
            disabled={!hasEnoughForWithdrawal}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 transition cursor-pointer"
          >
            {hasEnoughForWithdrawal ? 'Withdraw GRAM Now' : `Need ${ (5 - user.tonBalance > 0 ? (5 - user.tonBalance) : 0).toFixed(2) } more GRAM (ton)`}
          </button>
        )}
      </div>

      {/* 4. Referral Program Section */}
      <div className="bg-gradient-to-br from-[#120a2e]/60 via-[#070b1e]/60 to-[#100a2e]/65 border border-purple-500/15 p-4 rounded-2xl space-y-3.5 shadow-xl">
        <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-1.5 leading-none">
          <Users className="w-4 h-4 text-purple-400 animate-pulse" />
          Referral Bonus
        </h4>

        <p className="text-[11px] text-slate-400 leading-normal">
          Share invitations and grab <strong className="text-purple-400 font-bold">10%</strong> royalties on reward accomplishments your active invitees grab!
        </p>

        <div className="py-1">
          <button
            onClick={canClaimReferral ? onClaimReferralBonus : undefined}
            disabled={!canClaimReferral}
            className={`w-full py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2
              ${canClaimReferral 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse hover:scale-[1.02] cursor-pointer' 
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            {canClaimReferral ? 'Claim Daily GQH Bonus (Up to 120 GQH)' : 'Bonus Claimed Today'}
          </button>
        </div>

        {/* Input Copy Link */}
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase font-bold text-slate-450 px-0.5">Your Referral Link</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-950/60 border border-purple-500/15 px-3 py-2 rounded-xl text-[10px] text-purple-200 overflow-hidden text-ellipsis whitespace-nowrap self-center font-mono">
              {refLink}
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-500/25 transition active:scale-95"
              aria-label="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <p className="text-[9px] text-green-500 font-bold text-center animate-pulse">
              ✓ Referral link copied! Share with friends.
            </p>
          )}
        </div>
      </div>

      {/* App Preferences Settings Card */}
      <div className="bg-gradient-to-br from-[#0a0f28]/60 via-[#070b1e]/60 to-[#0a0f28]/60 border border-slate-800 p-4 rounded-2xl space-y-3.5 shadow-xl">
        <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-1.5 leading-none">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          {t('app_preferences')}
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-350 font-semibold">{t('language')}</span>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-slate-800 text-slate-200 text-[10px] p-1 rounded px-2"
            >
              <option value="en">{t('english')}</option>
              <option value="ar">{t('arabic')}</option>
              <option value="ru">{t('russian')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-350 font-semibold">Micro Pop SFX Synth</span>
            </div>
            <button
              onClick={() => onUpdatePreferences?.(user.hapticEnabled !== false, !(user.soundEnabled !== false))}
              className={`px-3 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                user.soundEnabled !== false ? 'bg-blue-500/10 text-blue-400 border border-slate-800' : 'bg-slate-800 text-slate-550 border border-transparent'
              }`}
            >
              {user.soundEnabled !== false ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">⚡</span>
              <span className="text-[11px] text-slate-350 font-semibold">Simulated Tactile Haptic</span>
            </div>
            <button
              onClick={() => onUpdatePreferences?.(!(user.hapticEnabled !== false), user.soundEnabled !== false)}
              className={`px-3 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                user.hapticEnabled !== false ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' : 'bg-slate-800 text-slate-550 border border-transparent'
              }`}
            >
              {user.hapticEnabled !== false ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Logs */}
      <div className="bg-[#0b0e24]/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="border-b border-slate-800 px-4 py-2.5 flex items-center gap-1.5 bg-slate-800/20">
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Recent Activity</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 space-y-1.5">
            <History className="w-6 h-6 mx-auto opacity-30" />
            <p className="text-[11px]">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40 max-h-48 overflow-y-auto styled-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="p-3 flex items-center justify-between hover:bg-slate-800/5 transition">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-extrabold text-slate-200">{log.title}</p>
                  <p className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>

                <div className="text-right space-y-0.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    log.token === 'GRAM (ton)' ? 'text-blue-400 bg-blue-500/10' : 'text-indigo-400 bg-indigo-500/10'
                  }`}>
                    {log.amount} {log.token}
                  </span>
                  <p className="text-[8px] text-emerald-450 uppercase font-black tracking-wider leading-none mt-0.5">{log.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Background Selection Modal */}
      <AnimatePresence>
        {showBgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c1e] w-full max-w-sm rounded-[24px] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-extrabold text-white text-lg">Profile Frame Theme</h3>
                <button 
                  onClick={() => setShowBgModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 pb-8">
                {PROFILE_BACKGROUNDS.map((bg, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectBg(index)}
                    className={`relative w-full h-24 rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                      profileBgIndex === index 
                        ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02]' 
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {bg ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bg})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-[#1c1c1e] to-slate-800" />
                    )}

                    {profileBgIndex === index && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    
                    {!bg && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">Default</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
