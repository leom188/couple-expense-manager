import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Home as HomeIcon, 
  Zap, 
  Coffee, 
  Gamepad2,
  ArrowRightLeft,
  Settings,
  User,
  X,
  Upload,
  BarChart3,
  PieChart,
  Repeat,
  Calendar as CalendarIcon,
  Bell,
  Edit2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --- Types ---
type Partner = "A" | "B";
type SplitType = "50/50" | "60/40" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";
type Frequency = "Monthly" | "Weekly";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  customSplitA?: number; // Percentage for Partner A
  category: Category;
  date: string;
}

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  category: Category;
  frequency: Frequency;
  nextDueDate: string;
}

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

interface UserProfile {
  name: string;
  avatar: string;
}

interface Profiles {
  A: UserProfile;
  B: UserProfile;
}

type Budgets = Record<Category, number>;

// --- Constants ---
const CATEGORIES: { value: Category; label: string; icon: any; color: string; hex: string }[] = [
  { value: "Groceries", label: "Groceries", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600", hex: "#10b981" },
  { value: "Rent", label: "Rent", icon: HomeIcon, color: "bg-blue-100 text-blue-600", hex: "#3b82f6" },
  { value: "Utilities", label: "Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-600", hex: "#eab308" },
  { value: "Fun", label: "Fun", icon: Gamepad2, color: "bg-pink-100 text-pink-600", hex: "#ec4899" },
  { value: "Other", label: "Other", icon: Coffee, color: "bg-gray-100 text-gray-600", hex: "#6b7280" },
];

const AVATARS = [
  "/images/avatar-1.png",
  "/images/avatar-2.png",
  "/images/avatar-3.png",
  "/images/avatar-4.png",
];

// --- Helper Components ---

const CategoryIcon = ({ category }: { category: Category }) => {
  const cat = CATEGORIES.find((c) => c.value === category) || CATEGORIES[4];
  const Icon = cat.icon;
  return (
    <div className={cn("p-2 rounded-xl", cat.color)}>
      <Icon size={18} />
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm">
        <p className="font-medium text-slate-900 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  // --- State ---
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    const saved = localStorage.getItem("recurringExpenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [profiles, setProfiles] = useState<Profiles>(() => {
    const saved = localStorage.getItem("profiles");
    return saved ? JSON.parse(saved) : {
      A: { name: "Partner A", avatar: AVATARS[0] },
      B: { name: "Partner B", avatar: AVATARS[1] },
    };
  });

  const [budgets, setBudgets] = useState<Budgets>(() => {
    const saved = localStorage.getItem("budgets");
    return saved ? JSON.parse(saved) : {
      Groceries: 0,
      Rent: 0,
      Utilities: 0,
      Fun: 0,
      Other: 0
    };
  });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<Partner>("A");
  const [splitType, setSplitType] = useState<SplitType>("50/50");
  const [category, setCategory] = useState<Category>("Groceries");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Recurring form state
  const [recDescription, setRecDescription] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFrequency, setRecFrequency] = useState<Frequency>("Monthly");
  const [recCategory, setRecCategory] = useState<Category>("Rent");
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Check for due recurring expenses on load
  useEffect(() => {
    const checkRecurring = () => {
      const now = new Date();
      let newExpenses: Expense[] = [];
      let newNotifications: Notification[] = [];
      let updatedRecurring = [...recurringExpenses];
      let hasUpdates = false;

      updatedRecurring = updatedRecurring.map(rec => {
        const dueDate = new Date(rec.nextDueDate);
        if (dueDate <= now) {
          hasUpdates = true;
          // Add expense
          newExpenses.push({
            id: crypto.randomUUID(),
            description: rec.description,
            amount: rec.amount,
            paidBy: rec.paidBy,
            splitType: rec.splitType,
            category: rec.category,
            date: new Date().toISOString(),
          });

          // Add notification
          newNotifications.push({
            id: crypto.randomUUID(),
            message: `Auto-added recurring expense: ${rec.description} ($${rec.amount})`,
            date: new Date().toISOString(),
            read: false
          });

          // Update next due date
          const nextDate = new Date(dueDate);
          if (rec.frequency === "Monthly") {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else {
            nextDate.setDate(nextDate.getDate() + 7);
          }
          return { ...rec, nextDueDate: nextDate.toISOString() };
        }
        return rec;
      });

      if (hasUpdates) {
        setExpenses(prev => [...newExpenses, ...prev]);
        setRecurringExpenses(updatedRecurring);
        setNotifications(prev => [...newNotifications, ...prev]);
        toast.success(`Added ${newExpenses.length} recurring expense(s)`);
      }
    };

    checkRecurring();
  }, [recurringExpenses]);

  // --- Logic ---
  const addExpense = () => {
    if (!description || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      paidBy,
      splitType,
      category,
      date: new Date().toISOString(),
    };

    setExpenses([newExpense, ...expenses]);
    setDescription("");
    setAmount("");
    setIsFormOpen(false);
    toast.success("Expense added successfully");
  };

  const addOrUpdateRecurringExpense = () => {
    if (!recDescription || !recAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingRecId) {
      // Update existing
      setRecurringExpenses(prev => prev.map(rec => 
        rec.id === editingRecId ? {
          ...rec,
          description: recDescription,
          amount: parseFloat(recAmount),
          category: recCategory,
          frequency: recFrequency
        } : rec
      ));
      setEditingRecId(null);
      toast.success("Recurring expense updated");
    } else {
      // Add new
      const newRec: RecurringExpense = {
        id: crypto.randomUUID(),
        description: recDescription,
        amount: parseFloat(recAmount),
        paidBy: "A", // Default
        splitType: "50/50", // Default
        category: recCategory,
        frequency: recFrequency,
        nextDueDate: new Date().toISOString(), // Due immediately
      };
      setRecurringExpenses([...recurringExpenses, newRec]);
      toast.success("Recurring expense set up");
    }

    setRecDescription("");
    setRecAmount("");
  };

  const startEditingRecurring = (rec: RecurringExpense) => {
    setEditingRecId(rec.id);
    setRecDescription(rec.description);
    setRecAmount(rec.amount.toString());
    setRecCategory(rec.category);
    setRecFrequency(rec.frequency);
  };

  const cancelEditingRecurring = () => {
    setEditingRecId(null);
    setRecDescription("");
    setRecAmount("");
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(recurringExpenses.filter(r => r.id !== id));
    if (editingRecId === id) cancelEditingRecurring();
    toast.success("Recurring expense removed");
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateProfile = (partner: Partner, field: keyof UserProfile, value: string) => {
    setProfiles(prev => ({
      ...prev,
      [partner]: { ...prev[partner], [field]: value }
    }));
  };

  const updateBudget = (category: Category, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBudgets(prev => ({
      ...prev,
      [category]: numValue
    }));
  };

  const handleFileUpload = (partner: Partner, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateProfile(partner, "avatar", base64String);
      toast.success("Avatar updated successfully");
    };
    reader.readAsDataURL(file);
  };

  const calculateSettlement = () => {
    let balance = 0; // Positive means A is owed, Negative means B is owed

    expenses.forEach((expense) => {
      const amount = expense.amount;
      let shareA = 0;

      if (expense.splitType === "50/50") shareA = amount * 0.5;
      else if (expense.splitType === "60/40") shareA = amount * 0.6;
      // Add custom logic here if needed

      const shareB = amount - shareA;

      if (expense.paidBy === "A") {
        balance += shareB; // B owes A their share
      } else {
        balance -= shareA; // A owes B their share
      }
    });

    return balance;
  };

  const balance = calculateSettlement();
  const settlementText =
    balance === 0
      ? "All settled up!"
      : balance > 0
      ? `${profiles.B.name} owes ${profiles.A.name}`
      : `${profiles.A.name} owes ${profiles.B.name}`;
  
  const settlementAmount = Math.abs(balance).toFixed(2);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = CATEGORIES.map(cat => ({
      name: cat.label,
      amount: 0,
      color: cat.hex
    }));

    expenses.forEach(expense => {
      const categoryIndex = data.findIndex(d => d.name === expense.category);
      if (categoryIndex !== -1) {
        data[categoryIndex].amount += expense.amount;
      }
    });

    return data.filter(d => d.amount > 0);
  }, [expenses]);

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    const progress: Record<Category, { spent: number; limit: number; percentage: number }> = {
      Groceries: { spent: 0, limit: 0, percentage: 0 },
      Rent: { spent: 0, limit: 0, percentage: 0 },
      Utilities: { spent: 0, limit: 0, percentage: 0 },
      Fun: { spent: 0, limit: 0, percentage: 0 },
      Other: { spent: 0, limit: 0, percentage: 0 },
    };

    expenses.forEach(expense => {
      if (progress[expense.category]) {
        progress[expense.category].spent += expense.amount;
      }
    });

    Object.keys(progress).forEach((key) => {
      const cat = key as Category;
      progress[cat].limit = budgets[cat];
      if (budgets[cat] > 0) {
        progress[cat].percentage = Math.min((progress[cat].spent / budgets[cat]) * 100, 100);
      }
    });

    return progress;
  }, [expenses, budgets]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24 md:pb-0">
      
      {/* --- Header / Hero --- */}
      <header className="relative overflow-hidden bg-white border-b border-slate-100 pt-12 pb-16 px-6 md:px-12">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">
              Shared<span className="text-indigo-600">Wallet</span>
            </h1>
            <p className="text-slate-500 text-lg">Simplify your couple finances.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-12 w-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50 relative"
                  onClick={markNotificationsRead}
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-slate-100" align="end">
                <div className="p-4 border-b border-slate-100 font-medium">Notifications</div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(n => (
                        <div key={n.id} className={cn("p-4 text-sm", !n.read && "bg-indigo-50/50")}>
                          <p className="text-slate-800">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Calendar Button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50"
              onClick={() => setIsCalendarOpen(true)}
            >
              <CalendarIcon className="h-5 w-5 text-slate-600" />
            </Button>

            {/* Recurring Button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50"
              onClick={() => setIsRecurringOpen(true)}
            >
              <Repeat className="h-5 w-5 text-slate-600" />
            </Button>

            {/* Budget Button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50"
              onClick={() => setIsBudgetOpen(true)}
            >
              <PieChart className="h-5 w-5 text-slate-600" />
            </Button>

            {/* Settings Button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-slate-50"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-5 w-5 text-slate-600" />
            </Button>

            {/* Settlement Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 w-full md:w-auto min-w-[300px]"
            >
              <div className="flex items-center gap-3 mb-2 text-slate-500 text-sm font-medium uppercase tracking-wider">
                <ArrowRightLeft size={16} />
                Settlement Status
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-heading font-light text-slate-900">
                  ${settlementAmount}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                {settlementText}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* --- Left Column: Expense List & Chart --- */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Chart Section */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <BarChart3 size={20} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-slate-800">Spending by Category</h2>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Budget Progress Section */}
            {Object.values(budgets).some(b => b > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                    <PieChart size={20} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-slate-800">Budget Progress</h2>
                </div>
                
                {CATEGORIES.map(cat => {
                  const data = budgetProgress[cat.value];
                  if (data.limit === 0) return null;
                  
                  const isOverBudget = data.spent > data.limit;
                  
                  return (
                    <div key={cat.value} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <cat.icon size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-700">{cat.label}</span>
                        </div>
                        <span className={cn("font-medium", isOverBudget ? "text-red-500" : "text-slate-500")}>
                          ${data.spent.toFixed(0)} / ${data.limit}
                        </span>
                      </div>
                      <Progress 
                        value={data.percentage} 
                        className="h-2 bg-slate-100" 
                        indicatorClassName={cn(
                          isOverBudget ? "bg-red-500" : cat.color.split(" ")[0].replace("bg-", "bg-")
                        )}
                      />
                    </div>
                  );
                })}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-slate-800">Recent Transactions</h2>
              <span className="text-sm text-slate-400">{expenses.length} entries</span>
            </div>

            {expenses.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm"
              >
                <div className="w-48 h-48 mx-auto mb-6 relative">
                   <img src="/images/empty-state.png" alt="No expenses" className="w-full h-full object-contain opacity-90" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">No expenses yet</h3>
                <p className="text-slate-500">Add your first shared expense to get started.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {expenses.map((expense) => (
                    <motion.div
                      key={expense.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <CategoryIcon category={expense.category} />
                        <div>
                          <h4 className="font-medium text-slate-900">{expense.description}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <img 
                                src={profiles[expense.paidBy].avatar} 
                                alt={profiles[expense.paidBy].name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className={expense.paidBy === 'A' ? "text-indigo-600 font-medium" : "text-pink-600 font-medium"}>
                                Paid by {profiles[expense.paidBy].name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="font-heading font-semibold text-lg text-slate-900">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <button 
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* --- Right Column: Add Expense Form (Desktop Sticky) --- */}
          <div className="hidden md:block md:col-span-5">
            <div className="sticky top-8">
              <Card className="border-0 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500" />
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Add New Expense</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      placeholder="e.g. Weekly Groceries" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-12 pl-8 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-heading text-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <cat.icon size={16} className="text-slate-500" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>Who Paid?</Label>
                    <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)} className="w-full">
                      <TabsList className="w-full h-14 p-1 bg-slate-100 rounded-full">
                        <TabsTrigger value="A" className="w-1/2 h-full rounded-full data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                          <div className="flex items-center gap-2">
                            <img src={profiles.A.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                            {profiles.A.name}
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="B" className="w-1/2 h-full rounded-full data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">
                          <div className="flex items-center gap-2">
                            <img src={profiles.B.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                            {profiles.B.name}
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>Split Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["50/50", "60/40", "custom"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSplitType(type as SplitType)}
                          className={cn(
                            "h-10 rounded-lg text-sm font-medium transition-all border",
                            splitType === type 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {type === "custom" ? "Custom" : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={addExpense}
                    className="w-full h-14 text-lg rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 mt-4"
                  >
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* --- Mobile Floating Action Button --- */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center"
        >
          <Plus size={32} />
        </Button>
      </div>

      {/* --- Mobile Form Modal --- */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-heading font-bold mb-6">New Expense</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="What was it?" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Who Paid?</Label>
                  <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)} className="w-full">
                    <TabsList className="w-full h-14 bg-slate-100 rounded-full">
                      <TabsTrigger value="A" className="w-1/2 h-full rounded-full">
                        <div className="flex items-center gap-2">
                          <img src={profiles.A.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                          {profiles.A.name}
                        </div>
                      </TabsTrigger>
                      <TabsTrigger value="B" className="w-1/2 h-full rounded-full">
                        <div className="flex items-center gap-2">
                          <img src={profiles.B.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                          {profiles.B.name}
                        </div>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Button 
                  onClick={addExpense}
                  className="w-full h-14 text-lg rounded-2xl bg-indigo-600 text-white mt-4"
                >
                  Save Expense
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Settings Modal --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Partner A Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-indigo-600 flex items-center gap-2">
                <User size={18} /> Partner A
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="name-a">Name</Label>
                <Input
                  id="name-a"
                  value={profiles.A.name}
                  onChange={(e) => updateProfile("A", "name", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => updateProfile("A", "avatar", avatar)}
                      className={cn(
                        "relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0",
                        profiles.A.avatar === avatar ? "border-indigo-600 scale-110" : "border-transparent hover:border-slate-200"
                      )}
                    >
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRefA.current?.click()}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-indigo-400 flex items-center justify-center bg-slate-50 shrink-0 transition-colors"
                  >
                    <Upload size={16} className="text-slate-400" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRefA} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload("A", e)}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Partner B Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-pink-600 flex items-center gap-2">
                <User size={18} /> Partner B
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="name-b">Name</Label>
                <Input
                  id="name-b"
                  value={profiles.B.name}
                  onChange={(e) => updateProfile("B", "name", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => updateProfile("B", "avatar", avatar)}
                      className={cn(
                        "relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0",
                        profiles.B.avatar === avatar ? "border-pink-600 scale-110" : "border-transparent hover:border-slate-200"
                      )}
                    >
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRefB.current?.click()}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-pink-400 flex items-center justify-center bg-slate-50 shrink-0 transition-colors"
                  >
                    <Upload size={16} className="text-slate-400" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRefB} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload("B", e)}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Budget Modal --- */}
      <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Monthly Budgets</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500 mb-2">Set monthly spending limits for each category.</p>
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`budget-${cat.value}`} className="col-span-2 flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", cat.color)}>
                    <cat.icon size={14} />
                  </div>
                  {cat.label}
                </Label>
                <div className="col-span-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <Input
                    id={`budget-${cat.value}`}
                    type="number"
                    value={budgets[cat.value] || ""}
                    onChange={(e) => updateBudget(cat.value, e.target.value)}
                    className="pl-7 h-9 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Recurring Expenses Modal --- */}
      <Dialog open={isRecurringOpen} onOpenChange={(open) => {
        setIsRecurringOpen(open);
        if (!open) cancelEditingRecurring();
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Recurring Expenses</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Add/Edit Form */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-medium text-slate-900">
                {editingRecId ? "Edit Recurring Expense" : "Add New Recurring"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  placeholder="Description" 
                  value={recDescription}
                  onChange={(e) => setRecDescription(e.target.value)}
                  className="bg-white"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="pl-7 bg-white"
                  />
                </div>
                <Select value={recCategory} onValueChange={(v: Category) => setRecCategory(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={recFrequency} onValueChange={(v: Frequency) => setRecFrequency(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {editingRecId && (
                  <Button onClick={cancelEditingRecurring} variant="outline" className="flex-1">Cancel</Button>
                )}
                <Button onClick={addOrUpdateRecurringExpense} className="flex-1 bg-slate-900 text-white">
                  {editingRecId ? "Update" : "Add Recurring"}
                </Button>
              </div>
            </div>

            {/* List Existing */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900">Active Recurring</h3>
              {recurringExpenses.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No recurring expenses set up.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {recurringExpenses.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={rec.category} />
                        <div>
                          <p className="font-medium text-slate-900">{rec.description}</p>
                          <p className="text-xs text-slate-500">{rec.frequency} • ${rec.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditingRecurring(rec)} className="p-2 text-slate-300 hover:text-indigo-600">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteRecurring(rec.id)} className="p-2 text-slate-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Calendar Modal --- */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Upcoming Bills</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              modifiers={{
                bill: recurringExpenses.map(r => new Date(r.nextDueDate))
              }}
              modifiersStyles={{
                bill: { fontWeight: 'bold', color: '#4f46e5', textDecoration: 'underline' }
              }}
              className="rounded-xl border border-slate-100 shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-slate-500">Next 30 Days</h4>
            {recurringExpenses
              .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
              .slice(0, 3)
              .map(rec => (
                <div key={rec.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                  <span>{rec.description}</span>
                  <span className="text-slate-500">{new Date(rec.nextDueDate).toLocaleDateString()}</span>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
