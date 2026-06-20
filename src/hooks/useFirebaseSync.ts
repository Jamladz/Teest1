import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserState, ActivityLog } from '../types';

// Initial states fallback logic
const getInitialUser = (): UserState => {
  let username = 'Telegram User';
  let avatar = 'https://i.imgur.com/LKjClrQ.png';

  try {
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
      username = tgUser.username || tgUser.first_name || 'Telegram User';
      // avatar could be dynamically loaded if we had the file, but keep fallback
    }
  } catch (e) {}

  return {
    username,
    avatar,
    tonBalance: 0.05,
    gqhBalance: 50.0,
    walletAddress: null,
    referralCount: 12,
    referralEarnings: 120,
    hasClaimedWelcomeBonus: false,
    telegramJoined: false,
    dailyClaimedAt: null,
    adCooldownSeconds: 0,
    hapticEnabled: true,
    soundEnabled: true,
    completedTasksCount: 0,
    watchedAdsCount: 0,
    dailyCheckInCount: 0,
    telegramTasksCount: 0,
    gamesPlayedCount: 0,
    airdropRegistered: false,
    miningEnergy: 1000,
    lastActiveAt: Date.now(),
    withdrawalCount: 0
  };
};

const INITIAL_USER: UserState = getInitialUser();

export function useFirebaseSync() {
  const [userId, setUserId] = useState<string | null>(null);
  
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('gramqash_user_v1');
    return saved ? { ...INITIAL_USER, ...JSON.parse(saved) } : INITIAL_USER;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('gramqash_logs_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [{
      id: 'initial_signup_1',
      type: 'bonus',
      title: 'Platform Onboarding Bonus',
      amount: '+50.0',
      token: 'GQH',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed'
    }];
  });

  // Track Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUserId(firebaseUser.uid);
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<UserState>;
          setUser(prev => ({ ...prev, ...data }));
        } else {
          // Initialize in DB
          try {
            await setDoc(ref, user);
          } catch(err) { console.error("Firebase init write failed:", err); }
        }
      } else {
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);

  // Sync back to Firebase on User changes (debounced or directly)
  // For safety and fast response, we sync local storage quickly and Firebase slightly deferred or immediately
  useEffect(() => {
    const updatedUser = { ...user, lastActiveAt: Date.now() };
    localStorage.setItem('gramqash_user_v1', JSON.stringify(updatedUser));
    if (userId) {
      const ref = doc(db, 'users', userId);
      setDoc(ref, updatedUser, { merge: true }).catch(err => console.error("Firebase write err:", err));
    }
  }, [user, userId]);

  useEffect(() => {
    localStorage.setItem('gramqash_logs_v1', JSON.stringify(logs));
  }, [logs]);

  // Optionally we could sync logs to a subcollection, 
  // but to keep previous logic intact we will just store logs in local storage 
  // or a serialized field, but logs are usually huge. Since it's a prototype:
  
  return { user, setUser, logs, setLogs };
}
