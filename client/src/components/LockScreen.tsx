import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Delete } from "lucide-react";
import { useSecurity } from "@/contexts/SecurityContext";
import { cn } from "@/lib/utils";

export default function LockScreen() {
  const { isLocked, unlock } = useSecurity();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
      const isValid = unlock(input);
      if (isValid) {
        setSuccess(true);
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        setError(true);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        setTimeout(() => {
          setInput("");
          setError(false);
        }, 500);
      }
    }
  }, [input, unlock]);

  if (!isLocked && !success) return null;

  const handleNumClick = (num: number) => {
    if (input.length < 4) {
      if (navigator.vibrate) navigator.vibrate(10);
      setInput(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <AnimatePresence>
      {(isLocked || success) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center w-full max-w-xs"
          >
            <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100 dark:border-slate-800">
              {success ? (
                <Unlock className="w-8 h-8 text-emerald-500" />
              ) : (
                <Lock className="w-8 h-8 text-indigo-500" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {success ? "Unlocked" : "Enter PIN"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
              Enter your 4-digit PIN to access SharedWallet
            </p>

            {/* PIN Dots */}
            <div className="flex gap-4 mb-12">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: input.length > i ? 1.2 : 1,
                    backgroundColor: input.length > i 
                      ? (error ? "#ef4444" : success ? "#10b981" : "#6366f1") 
                      : "transparent"
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors duration-200",
                    error ? "border-red-500" : success ? "border-emerald-500" : "border-indigo-500 dark:border-indigo-400",
                    input.length > i ? "bg-indigo-500 dark:bg-indigo-400" : "bg-transparent"
                  )}
                />
              ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num)}
                  className="w-16 h-16 rounded-full text-2xl font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus:outline-none active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Empty slot */}
              <button
                onClick={() => handleNumClick(0)}
                className="w-16 h-16 rounded-full text-2xl font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus:outline-none active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-16 h-16 rounded-full text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus:outline-none active:scale-95"
              >
                <Delete size={24} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
