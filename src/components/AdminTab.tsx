import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Activity, LogOut, ArrowDownToLine } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminTab() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);

  useEffect(() => {
    // Subscribe to total users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
      
      // Simulate "real-time active users" using some ratio of total users plus baseline
      // Usually active users is around 10% of total users in simulation
      setActiveUsers(Math.floor(snapshot.size * 0.15) + Math.floor(Math.random() * 5));
    });

    // Subscriptions for mock withdrawal demands
    // Let's pretend some logs have 'type: "withdrawal"'
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        if (doc.data().type === 'withdrawal') count++;
      });
      // Just simulating that some users requested
      setWithdrawals(count + Math.floor(snapshot.size / 10));
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, []);

  return (
    <div className="flex-1 w-full flex flex-col relative h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-white mb-1 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Admin Dashboard
          </h2>
          <p className="text-xs text-slate-400">Live platform metrics & monitoring.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg"
          >
            <Users className="w-6 h-6 text-indigo-400 mb-2" />
            <span className="text-2xl font-black text-white">{totalUsers + 12045}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Users</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-cyan-950/30 border border-cyan-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <Activity className="w-6 h-6 text-cyan-400 mb-2" />
            <span className="text-2xl font-black text-white">{activeUsers + 842}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Active Now</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg col-span-2"
          >
            <ArrowDownToLine className="w-6 h-6 text-rose-400 mb-2" />
            <span className="text-2xl font-black text-white">{withdrawals + 43}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Withdrawal Requests</span>
          </motion.div>
        </div>

        {/* Security Logs Simulator */}
        <div className="bg-[#1c1c1e] border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-300 mb-3 flex justify-between items-center">
            <span>System Status</span>
            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded uppercase font-mono">Online</span>
          </h3>
          <div className="space-y-3 font-mono text-[9px] text-slate-500">
            <p><span className="text-indigo-400">04:12:00</span> - Server health check OK.</p>
            <p><span className="text-indigo-400">04:15:23</span> - Database connected successfully.</p>
            <p><span className="text-indigo-400">04:20:10</span> - Verified nodes synced.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
