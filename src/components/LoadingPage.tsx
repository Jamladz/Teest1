import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoadingPage({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1.43; // 7000ms / 1.43 ~= 100%
      });
    }, 100);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05091c]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative p-6 bg-gradient-to-tr from-cyan-900/30 to-blue-900/30 rounded-3xl border border-cyan-500/20">
          <Shield className="w-16 h-16 text-cyan-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tighter">
          GramQash
        </h1>
        <div className="w-48 h-1.5 bg-blue-950 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-cyan-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Initializing ecosystem...
        </p>
      </motion.div>
    </motion.div>
  );
}
