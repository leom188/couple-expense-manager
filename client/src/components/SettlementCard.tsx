import { motion } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";

interface SettlementCardProps {
  currency: string;
  settlementAmount: string;
  settlementText: string;
  variant?: "mobile" | "desktop";
}

export default function SettlementCard({
  currency,
  settlementAmount,
  settlementText,
  variant = "desktop",
}: SettlementCardProps) {
  const isMobile = variant === "mobile";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 ${
        isMobile ? "p-6" : "p-8 mb-8"
      }`}
    >
      <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
        <ArrowRightLeft size={16} />
        Settlement Status
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-heading font-light text-slate-900 dark:text-white ${
            isMobile ? "text-4xl" : "text-5xl"
          }`}
        >
          {currency}
          {settlementAmount}
        </span>
      </div>
      <div
        className={`inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ${
          isMobile ? "mt-2 px-3 py-1 text-sm" : "mt-4 px-4 py-1.5"
        }`}
      >
        {settlementText}
      </div>
    </motion.div>
  );
}
