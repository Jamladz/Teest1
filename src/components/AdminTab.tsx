import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Activity, LogOut, ArrowDownToLine, CheckCircle2, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomPromotedTask } from './TaskCenterModal';

export default function AdminTab() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);
  const [customTasks, setCustomTasks] = useState<CustomPromotedTask[]>([]);

  const fetchTasks = () => {
    const existingStr = localStorage.getItem('gqh_custom_tasks');
    if (existingStr) {
      setCustomTasks(JSON.parse(existingStr));
    }
  };

  useEffect(() => {
    // Subscribe to total users to get real metrics
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
      
      let active = 0;
      let withdrawRequests = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Count users active in the last 24 hours (86400000ms = 24h)
        if (data.lastActiveAt && (Date.now() - data.lastActiveAt < 86400000)) {
          active++;
        }
        
        if (data.withdrawalCount && data.withdrawalCount > 0) {
          withdrawRequests += data.withdrawalCount;
        }
      });
      
      setActiveUsers(active);
      setWithdrawals(withdrawRequests);
    });

    fetchTasks();
    const handleUpdate = () => fetchTasks();
    window.addEventListener('gqh_tasks_updated', handleUpdate);

    return () => {
      unsubUsers();
      window.removeEventListener('gqh_tasks_updated', handleUpdate);
    };
  }, []);

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'approved' | 'rejected') => {
    const updated = customTasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus as any }; // status could be extended to 'rejected'
      }
      return t;
    });
    setCustomTasks(updated);
    localStorage.setItem('gqh_custom_tasks', JSON.stringify(updated));
    window.dispatchEvent(new Event('gqh_tasks_updated'));
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = customTasks.filter(t => t.id !== taskId);
    setCustomTasks(updated);
    localStorage.setItem('gqh_custom_tasks', JSON.stringify(updated));
    window.dispatchEvent(new Event('gqh_tasks_updated'));
  };

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
            <span className="text-2xl font-black text-white">{totalUsers}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Users</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-cyan-950/30 border border-cyan-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <Activity className="w-6 h-6 text-cyan-400 mb-2" />
            <span className="text-2xl font-black text-white">{activeUsers}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Active Now</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-2xl flex flex-col items-center text-center shadow-lg col-span-2"
          >
            <ArrowDownToLine className="w-6 h-6 text-rose-400 mb-2" />
            <span className="text-2xl font-black text-white">{withdrawals}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Withdrawal Requests</span>
          </motion.div>
        </div>

        {/* Custom Tasks Admin Review Section */}
        <div className="bg-[#1c1c1e] border border-slate-800 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex justify-between items-center">
            <span>Community Tasks Review</span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              {customTasks.length} Total
            </span>
          </h3>
          
          <div className="space-y-3">
            {customTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No community tasks submitted yet.</p>
            ) : (
              customTasks.map(task => (
                <div key={task.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white text-xs font-bold leading-tight">{task.title}</h4>
                      <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline mt-0.5 flex items-center gap-1">
                        {task.link.slice(0, 30)}... <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      task.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      task.status === 'rejected' as any ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-slate-400">
                    Clicks Paid: <strong className="text-white">{task.clicksCount}</strong>
                  </div>
                  
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/50">
                    {task.status !== 'approved' && (
                      <button 
                        onClick={() => handleUpdateTaskStatus(task.id, 'approved')}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-[10px] font-bold flex flex-row justify-center items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {task.status !== ('rejected' as any) && (
                      <button 
                        onClick={() => handleUpdateTaskStatus(task.id, 'rejected')}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-1.5 rounded-lg text-[10px] font-bold flex flex-row justify-center items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-1.5 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
