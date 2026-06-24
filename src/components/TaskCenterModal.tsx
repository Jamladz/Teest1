import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Target,
  X,
  CheckCircle2,
  ChevronRight,
  Link2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

interface TaskCenterModalProps {
  onClose: () => void;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
  onOpenWalletModal: () => void;
  onPayCustomTask: (tonAmount: string) => Promise<void>;
}

export interface CustomPromotedTask {
  id: string;
  title: string;
  description: string;
  link: string;
  maxClicks: number;
  currentClicks: number;
  status: "pending" | "approved";
  createdAt: number;
  creatorId: string;
}

export function TaskCenterModal({
  onClose,
  onShowToast,
  onOpenWalletModal,
  onPayCustomTask,
}: TaskCenterModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"add" | "my">("add");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [clicksCount, setClicksCount] = useState<number>(500);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [myTasks, setMyTasks] = useState<CustomPromotedTask[]>([]);
  const [isLoadingMyTasks, setIsLoadingMyTasks] = useState(false);

  // 1 click = 0.001 TON. Min 500 clicks = 0.5 TON.
  const requiredTon = (clicksCount * 0.001).toFixed(2);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchMyTasks = async () => {
    if (!auth.currentUser) return;
    setIsLoadingMyTasks(true);
    try {
      const q = query(
        collection(db, "customTasks"),
        where("creatorId", "==", auth.currentUser.uid),
      );
      const snapshot = await getDocs(q);
      const fetched: CustomPromotedTask[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as CustomPromotedTask);
      });
      // Sort local by date descending
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setMyTasks(fetched);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setIsLoadingMyTasks(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my") {
      fetchMyTasks();
    }
  }, [activeTab]);

  const handlePayAndSubmit = async () => {
    if (!taskTitle.trim() || !taskDescription.trim()) {
      onShowToast("Please provide a title and description.", "error");
      return;
    }
    if (!taskLink || !taskLink.startsWith("http")) {
      onShowToast("Please enter a valid link (http/https).", "error");
      return;
    }
    if (clicksCount < 500) {
      onShowToast("Minimum clicks amount is 500.", "error");
      return;
    }

    if (!auth.currentUser) {
      onShowToast("Authentication required.", "error");
      return;
    }

    setIsProcessingPayment(true);
    try {
      await onPayCustomTask(requiredTon);

      const newId = Date.now().toString();
      const newTask: CustomPromotedTask = {
        id: newId,
        title: taskTitle,
        description: taskDescription,
        link: taskLink,
        maxClicks: clicksCount,
        currentClicks: 0,
        status: "pending",
        createdAt: Date.now(),
        creatorId: auth.currentUser.uid,
      };

      await setDoc(doc(db, "customTasks", newId), {
        title: newTask.title,
        description: newTask.description,
        link: newTask.link,
        maxClicks: newTask.maxClicks,
        currentClicks: newTask.currentClicks,
        status: newTask.status,
        createdAt: newTask.createdAt,
        creatorId: newTask.creatorId,
      });

      setIsSubmitted(true);
      onShowToast(
        `Payment verified! Task submitted for admin review.`,
        "success",
      );
    } catch (e: any) {
      if (e?.message !== "Wallet not connected") {
        onShowToast("Payment failed or was cancelled.", "error");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderAddContent = () => {
    if (isSubmitted) {
      return (
        <motion.div
          key="submitted-state"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-emerald-500/20 p-6 rounded-2xl text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Payment Successful!
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your payment of <strong>{requiredTon} TON</strong> has been verified
            and your task is now submitted.
            <br />
            <br />
            An <strong>Admin will manually review</strong> and approve your task
            to appear in the community tab.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setActiveTab("my");
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              View My Tasks
            </button>
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl border border-slate-700 transition-colors"
            >
              Create Another Task
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="add-task"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="space-y-6"
      >
        <div className="bg-slate-900 p-5 rounded-2xl border border-blue-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
          <h3 className="text-lg font-black text-white mb-1">
            Create Ads / Task
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Drive traffic to your channel, group, bot or website instantly.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Join my awesome channel!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={40}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Short Description
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what users need to do..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Target Link (URL/Bot)
              </label>
              <div className="relative">
                <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={taskLink}
                  onChange={(e) => setTaskLink(e.target.value)}
                  placeholder="https://t.me/your_bot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 ps-10 pe-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Number of Clicks / Visitors
              </label>
              <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
                <span className="text-slate-500 text-xs ms-2">
                  {t("min_500", "Min 500")}
                </span>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={clicksCount}
                  onChange={(e) => setClicksCount(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
              </div>
              <div className="text-center mt-3">
                <span className="text-3xl font-black text-blue-400">
                  {clicksCount}
                </span>
                <span className="text-slate-500 text-xs ms-1 uppercase">
                  Clicks
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-950/30 p-4 rounded-xl border border-blue-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-300">
                Total Calculation
              </span>
              <span className="text-sm text-slate-400">0.001 TON / Click</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="font-extrabold text-white uppercase text-xs">
                Amount to Pay:
              </span>
              <span className="text-lg font-black text-emerald-400 flex items-center gap-1">
                {requiredTon}{" "}
                <span className="text-xs text-slate-500">TON</span>
              </span>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            Task requires admin approval. Payments handle securely.
          </div>

          <button
            onClick={handlePayAndSubmit}
            disabled={isProcessingPayment}
            className={`w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg border border-white/10 transition-all text-sm ${isProcessingPayment ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
          >
            {isProcessingPayment
              ? "Processing Transaction..."
              : `Confirm & Pay ${requiredTon} TON`}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[3000] bg-[#0c1222] flex flex-col font-sans text-white"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Task Center
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex bg-slate-900 p-2 mx-4 mt-6 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab("add")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "add" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          Add Task
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "my" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          My Tasks
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "add" ? (
            renderAddContent()
          ) : (
            <motion.div
              key="my-tasks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {(() => {
                if (isLoadingMyTasks) {
                  return (
                    <div className="flex justify-center p-8">
                      <span className="text-slate-500 font-bold text-sm">
                        Loading tasks...
                      </span>
                    </div>
                  );
                }

                if (myTasks.length === 0) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-lg">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <ExternalLink className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        No Active Tasks
                      </h3>
                      <p className="text-sm text-slate-400 mt-2">
                        You haven't created any promotional tasks yet. Add a
                        task to drive traffic!
                      </p>
                      <button
                        onClick={() => setActiveTab("add")}
                        className="mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-6 rounded-xl border border-slate-700 transition-colors"
                      >
                        Create New Task
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {task.title}
                            </h4>
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline mt-1 flex items-center gap-1"
                            >
                              {task.link}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              task.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {task.status === "pending"
                              ? "Pending Approval"
                              : "Active"}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              Total Volume:
                            </span>
                            <span className="text-sm font-black text-white">
                              {task.maxClicks}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              Clicks Remaining:
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                              {task.maxClicks - task.currentClicks}
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, (task.currentClicks / task.maxClicks) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
