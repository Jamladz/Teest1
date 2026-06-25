import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserState, ActivityLog } from '../types';

import { signInAnonymously } from 'firebase/auth';

// Initial states fallback logic
const getInitialUser = (): UserState => {
  let username = 'Telegram User';
  let firstName = '';
  let lastName = '';
  let avatar = 'https://i.imgur.com/LKjClrQ.png';
  let telegramId: number | null = null;

  try {
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
      username = tgUser.username || tgUser.first_name || 'Telegram User';
      firstName = tgUser.first_name || '';
      lastName = tgUser.last_name || '';
      telegramId = tgUser.id;
      // avatar could be dynamically loaded if we had the file, but keep fallback
    }
  } catch (e) {}

  return {
    username,
    firstName,
    lastName,
    telegramId,
    avatar,
    tonBalance: 0.05,
    gqhBalance: 50.0,
    walletAddress: null,
    referralCount: 0,
    referralEarnings: 0,
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
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous auth failed:", error);
    });

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
            let referredBy = null;
            try {
              const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
              if (initData?.start_param && initData.start_param.startsWith("ref_")) {
                referredBy = initData.start_param.replace("ref_", "");
              }
            } catch(e) {}
            
            const newUserDoc = { ...user, referredBy, createdAt: Date.now() };
            // Sanitize undefined fields
            const sanitizeObject = (obj: any) => {
              return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
            };
            await setDoc(ref, sanitizeObject(newUserDoc));
            setUser(newUserDoc);
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
  // Fetch real referral count
  useEffect(() => {
    if (!userId || !user.username) return;
    
    const fetchReferrals = async () => {
      try {
        const refId = user.telegramId ? String(user.telegramId) : user.username.toLowerCase().replace(/\s+/g, "_");
        const q = query(collection(db, "users"), where("referredBy", "==", refId));
        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        
        if (count !== user.referralCount) {
          setUser(prev => ({ ...prev, referralCount: count }));
        }
      } catch (err) {
        console.error("Failed to fetch referrals:", err);
      }
    };
    
    fetchReferrals();
  }, [userId, user.telegramId, user.username]);

  useEffect(() => {
    const updatedUser = { ...user, lastActiveAt: Date.now() };
    localStorage.setItem('gramqash_user_v1', JSON.stringify(updatedUser));
    if (userId) {
      const ref = doc(db, 'users', userId);
      // Sanitize undefined fields
      const sanitizeObject = (obj: any) => {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
      };
      
      setDoc(ref, sanitizeObject(updatedUser), { merge: true }).catch(err => console.error("Firebase write err:", err));
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
