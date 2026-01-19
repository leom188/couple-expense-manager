import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

type Partner = "A" | "B";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  category: Category;
  date: string;
}

interface UserProfile {
  name: string;
  avatar: string;
  income: number;
}

interface Profiles {
  A: UserProfile;
  B: UserProfile;
}

interface ExpenseListProps {
  expenses: Expense[];
  profiles: Profiles;
  currency: string;
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  CategoryIcon: React.ComponentType<{ category: Category }>;
}

export default function ExpenseList({
  expenses,
  profiles,
  currency,
  onDelete,
  onEdit,
  CategoryIcon,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="w-48 h-48 mx-auto mb-6 relative">
          <img
            src="/images/empty-state.png"
            alt="No expenses"
            className="w-full h-full object-contain opacity-90"
          />
        </div>
        <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">
          No expenses found
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Try adjusting your search or add a new expense.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {expenses.map((expense) => (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Swipe Background (Delete Action) */}
            <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-6">
              <Trash2 className="text-white" size={20} />
            </div>

            {/* Swipeable Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0.05 }}
              dragSnapToOrigin
              whileDrag={{ scale: 0.98 }}
              onDragEnd={(_, info) => {
                // Trigger delete if dragged far enough (more than 60px) or with enough velocity
                if (info.offset.x < -60 || info.velocity.x < -300) {
                  if (navigator.vibrate) navigator.vibrate(50);
                  onDelete(expense.id);
                }
              }}
              onClick={() => onEdit?.(expense)}
              className="relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between z-10 cursor-pointer"
              style={{ touchAction: "pan-y" }}
            >
              <div className="flex items-center gap-4">
                <CategoryIcon category={expense.category} />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {expense.description}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ProfileAvatar
                        avatarUrl={profiles[expense.paidBy].avatar}
                        name={profiles[expense.paidBy].name}
                        size={16}
                        className="rounded-full object-cover"
                      />
                      <span
                        className={
                          expense.paidBy === "A"
                            ? "text-indigo-600 dark:text-indigo-400 font-medium"
                            : "text-pink-600 dark:text-pink-400 font-medium"
                        }
                      >
                        Paid by {profiles[expense.paidBy].name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-heading font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {currency}
                  {expense.amount.toFixed(2)}
                </span>
                {/* Desktop Delete Button (Hidden on Mobile) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(expense.id);
                  }}
                  className="hidden md:block p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
