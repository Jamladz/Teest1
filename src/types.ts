export interface UserState {
  username: string;
  avatar: string;
  tonBalance: number;
  gqhBalance: number;
  walletAddress: string | null;
  referralCount: number;
  referralEarnings: number;
  hasClaimedWelcomeBonus: boolean;
  telegramJoined: boolean;
  dailyClaimedAt: string | null; // ISO string of last claim
  adCooldownSeconds: number;
  hapticEnabled?: boolean;
  soundEnabled?: boolean;
  completedTasksCount: number;
  watchedAdsCount: number;
  dailyCheckInCount?: number;
  telegramTasksCount?: number;
  gamesPlayedCount?: number;
  dailyReferralClaimedAt?: string | null;
  airdropRegistered?: boolean;
  miningEnergy?: number;
  profileBgIndex?: number;
}

export interface ActivityLog {
  id: string;
  type: 'bonus' | 'swap' | 'task' | 'game' | 'withdraw';
  title: string;
  amount: string;
  token: 'GRAM (ton)' | 'GQH';
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface GameData {
  id: string;
  name: string;
  badge: string;
  image: string;
  rewardText: string;
  description: string;
  playersCount: number;
  highScore: number;
  enabled: boolean;
}
