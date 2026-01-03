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
  Check,
  Moon,
  Sun,
  Download,
  Search,
  Menu,
  LayoutDashboard,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/contexts/ThemeContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { Lock } from "lucide-react";

// --- Types ---
type Partner = "A" | "B";
type SplitType = "50/50" | "60/40" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";
type Frequency = "Monthly" | "Weekly";
type TabView = "home" | "insights" | "planning" | "menu";

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
  { value: "Groceries", label: "Groceries", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", hex: "#10b981" },
  { value: "Rent", label: "Rent", icon: HomeIcon, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", hex: "#3b82f6" },
  { value: "Utilities", label: "Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400", hex: "#eab308" },
  { value: "Fun", label: "Fun", icon: Gamepad2, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400", hex: "#ec4899" },
  { value: "Other", label: "Other", icon: Coffee, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", hex: "#6b7280" },
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
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700 shadow-lg rounded-xl text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { hasPin, setPin, removePin } = useSecurity();
  const [pinInput, setPinInput] = useState("");
  
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabView>("home");
  
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
      if (navigator.vibrate) navigator.vibrate(200); // Error vibration
      toast.error("Please fill in all fields");
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50); // Success vibration

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
    if (navigator.vibrate) navigator.vibrate(50);
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

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount", "Paid By", "Split Type"];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      `"${e.description}"`, // Quote description to handle commas
      e.category,
      e.amount.toFixed(2),
      profiles[e.paidBy].name,
      e.splitType
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported to CSV");
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

  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    const lowerQuery = searchQuery.toLowerCase();
    return expenses.filter(e => 
      e.description.toLowerCase().includes(lowerQuery) || 
      e.category.toLowerCase().includes(lowerQuery) ||
      e.amount.toString().includes(lowerQuery)
    );
  }, [expenses, searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24 md:pb-0 transition-colors duration-300">
      
      {/* --- Header / Hero --- */}
      <header className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-8 pb-8 px-6 md:px-12 transition-colors duration-300">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-pink-50 dark:bg-pink-900/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shared<span className="text-indigo-600 dark:text-indigo-400">Wallet</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full relative"
                  onClick={markNotificationsRead}
                >
                  <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900" align="end">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">Notifications</div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {notifications.map(n => (
                        <div key={n.id} className={cn("p-4 text-sm", !n.read && "bg-indigo-50/50 dark:bg-indigo-900/20")}>
                          <p className="text-slate-800 dark:text-slate-200">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Desktop Only Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 relative z-20">
        
        {/* --- Mobile Tab Content --- */}
        <div className="md:hidden">
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Settlement Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                  <ArrowRightLeft size={16} />
                  Settlement Status
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading font-light text-slate-900 dark:text-white">
                    ${settlementAmount}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                  {settlementText}
                </div>
              </motion.div>

              {/* Search & List */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search expenses..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  />
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No expenses found</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-20">
                    <AnimatePresence>
                      {filteredExpenses.map((expense) => (
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
                                deleteExpense(expense.id);
                              }
                            }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between z-10"
                            style={{ touchAction: "pan-y" }}
                          >
                            <div className="flex items-center gap-4">
                              <CategoryIcon category={expense.category} />
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">{expense.description}</h4>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {new Date(expense.date).toLocaleDateString()} • {profiles[expense.paidBy].name}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                ${expense.amount.toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="space-y-6 pb-20">
              <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Insights</h2>
              
              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-medium mb-4 dark:text-white">Spending by Category</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budgets */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium dark:text-white">Budget Progress</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsBudgetOpen(true)} className="text-indigo-600">Edit</Button>
                </div>
                {CATEGORIES.map(cat => {
                  const data = budgetProgress[cat.value];
                  if (data.limit === 0) return null;
                  return (
                    <div key={cat.value} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">{cat.label}</span>
                        <span className="text-slate-500">${data.spent.toFixed(0)} / ${data.limit}</span>
                      </div>
                      <Progress value={data.percentage} className="h-2" indicatorClassName={cat.color.split(" ")[0].replace("bg-", "bg-")} />
                    </div>
                  );
                })}
                {Object.values(budgets).every(b => b === 0) && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No budgets set. Tap Edit to start.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "planning" && (
            <div className="space-y-6 pb-20">
              <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Planning</h2>
              
              {/* Calendar Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <Calendar
                  mode="single"
                  selected={new Date()}
                  modifiers={{ bill: recurringExpenses.map(r => new Date(r.nextDueDate)) }}
                  modifiersStyles={{ bill: { fontWeight: 'bold', color: '#4f46e5', textDecoration: 'underline' } }}
                  className="rounded-xl w-full flex justify-center"
                />
              </div>

              {/* Recurring List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium dark:text-white">Recurring Expenses</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsRecurringOpen(true)} className="text-indigo-600">Manage</Button>
                </div>
                {recurringExpenses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No recurring bills set up.</p>
                ) : (
                  <div className="space-y-3">
                    {recurringExpenses.slice(0, 3).map(rec => (
                      <div key={rec.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", rec.paidBy === 'A' ? "bg-indigo-500" : "bg-pink-500")} />
                          <span className="dark:text-slate-200">{rec.description}</span>
                        </div>
                        <span className="text-slate-500">{new Date(rec.nextDueDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="space-y-4 pb-20">
              <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-6">Menu</h2>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-14 text-lg rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="mr-3" /> Profile Settings
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-14 text-lg rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="mr-3" /> : <Moon className="mr-3" />} 
                {theme === 'dark' ? "Light Mode" : "Dark Mode"}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-14 text-lg rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                onClick={exportToCSV}
              >
                <Download className="mr-3" /> Export Data
              </Button>
            </div>
          )}
        </div>

        {/* --- Desktop Layout (Unchanged) --- */}
        <div className="hidden md:grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-7 space-y-6">
            {/* Settlement Card Desktop */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-8"
            >
              <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                <ArrowRightLeft size={16} />
                Settlement Status
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-heading font-light text-slate-900 dark:text-white">
                  ${settlementAmount}
                </span>
              </div>
              <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                {settlementText}
              </div>
            </motion.div>

            {/* Chart Section */}
            {chartData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <BarChart3 size={20} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-slate-800 dark:text-slate-200">Spending by Category</h2>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Budget Progress Section */}
            {Object.values(budgets).some(b => b > 0) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400">
                    <PieChart size={20} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-slate-800 dark:text-slate-200">Budget Progress</h2>
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
                          <span className="font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                        </div>
                        <span className={cn("font-medium", isOverBudget ? "text-red-500" : "text-slate-500 dark:text-slate-400")}>
                          ${data.spent.toFixed(0)} / ${data.limit}
                        </span>
                      </div>
                      <Progress 
                        value={data.percentage} 
                        className="h-2 bg-slate-100 dark:bg-slate-800" 
                        indicatorClassName={cn(isOverBudget ? "bg-red-500" : cat.color.split(" ")[0].replace("bg-", "bg-"))}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-slate-800 dark:text-slate-200">Recent Transactions</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={exportToCSV} className="text-slate-500 hover:text-indigo-600">
                  <Download size={16} className="mr-2" /> Export
                </Button>
                <span className="text-sm text-slate-400">{filteredExpenses.length} entries</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search expenses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-indigo-500"
              />
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-48 h-48 mx-auto mb-6 relative">
                   <img src="/images/empty-state.png" alt="No expenses" className="w-full h-full object-contain opacity-90" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">No expenses found</h3>
                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or add a new expense.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredExpenses.map((expense) => (
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
                            deleteExpense(expense.id);
                          }
                        }}
                        className="relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between z-10"
                        style={{ touchAction: "pan-y" }}
                      >
                        <div className="flex items-center gap-4">
                          <CategoryIcon category={expense.category} />
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">{expense.description}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{new Date(expense.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <img 
                                  src={profiles[expense.paidBy].avatar} 
                                  alt={profiles[expense.paidBy].name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className={expense.paidBy === 'A' ? "text-indigo-600 dark:text-indigo-400 font-medium" : "text-pink-600 dark:text-pink-400 font-medium"}>
                                  Paid by {profiles[expense.paidBy].name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="font-heading font-semibold text-lg text-slate-900 dark:text-slate-100">
                            ${expense.amount.toFixed(2)}
                          </span>
                          {/* Desktop Delete Button (Hidden on Mobile) */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExpense(expense.id);
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
            )}
          </div>

          {/* Right Column: Add Expense Form (Desktop Sticky) */}
          <div className="col-span-5">
            <div className="sticky top-8 space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl dark:bg-slate-800 dark:text-white" onClick={() => setIsCalendarOpen(true)}>
                  <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl dark:bg-slate-800 dark:text-white" onClick={() => setIsRecurringOpen(true)}>
                  <Repeat className="mr-2 h-4 w-4" /> Recurring
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl dark:bg-slate-800 dark:text-white" onClick={() => setIsBudgetOpen(true)}>
                  <PieChart className="mr-2 h-4 w-4" /> Budget
                </Button>
              </div>

              <Card className="border-0 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden dark:bg-slate-900">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500" />
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-slate-900 dark:text-white">Add New Expense</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Description</Label>
                    <Input 
                      placeholder="e.g. Weekly Groceries" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-all dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-12 pl-8 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-all font-heading text-lg dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Category</Label>
                      <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="dark:text-slate-200 dark:focus:bg-slate-800">
                              <div className="flex items-center gap-2">
                                <cat.icon size={16} className="text-slate-500 dark:text-slate-400" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="dark:text-slate-300">Who Paid?</Label>
                    <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)} className="w-full">
                      <TabsList className="w-full h-14 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <TabsTrigger value="A" className="w-1/2 h-full rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <img src={profiles.A.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                            {profiles.A.name}
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="B" className="w-1/2 h-full rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-sm transition-all dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <img src={profiles.B.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                            {profiles.B.name}
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="dark:text-slate-300">Split Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["50/50", "60/40", "custom"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSplitType(type as SplitType)}
                          className={cn(
                            "h-10 rounded-lg text-sm font-medium transition-all border",
                            splitType === type 
                              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" 
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                          )}
                        >
                          {type === "custom" ? "Custom" : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={addExpense}
                    className="w-full h-14 text-lg rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/20 mt-4"
                  >
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => {
              setActiveTab("home");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={cn("flex flex-col items-center gap-1 w-16", activeTab === "home" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
          >
            <HomeIcon size={24} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab("insights");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={cn("flex flex-col items-center gap-1 w-16", activeTab === "insights" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
          >
            <BarChart3 size={24} strokeWidth={activeTab === "insights" ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Insights</span>
          </button>
          
          {/* Floating Add Button */}
          <div className="relative -top-6">
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center"
            >
              <Plus size={28} />
            </Button>
          </div>

          <button 
            onClick={() => {
              setActiveTab("planning");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={cn("flex flex-col items-center gap-1 w-16", activeTab === "planning" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
          >
            <CalendarIcon size={24} strokeWidth={activeTab === "planning" ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Plan</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab("menu");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={cn("flex flex-col items-center gap-1 w-16", activeTab === "menu" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
          >
            <Menu size={24} strokeWidth={activeTab === "menu" ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
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
              className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-heading font-bold mb-6 dark:text-white">New Expense</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Description</Label>
                  <Input 
                    placeholder="What was it?" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Amount</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Category</Label>
                    <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="dark:text-slate-200 dark:focus:bg-slate-800">{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="dark:text-slate-300">Who Paid?</Label>
                  <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)} className="w-full">
                    <TabsList className="w-full h-14 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <TabsTrigger value="A" className="w-1/2 h-full rounded-full dark:text-slate-400 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                        <div className="flex items-center gap-2">
                          <img src={profiles.A.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                          {profiles.A.name}
                        </div>
                      </TabsTrigger>
                      <TabsTrigger value="B" className="w-1/2 h-full rounded-full dark:text-slate-400 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
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
        <DialogContent className="sm:max-w-[425px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl dark:text-white">Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* App Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={18} /> App Settings
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    {theme === 'dark' ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Appearance</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  Toggle
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <Lock size={20} className={hasPin ? "text-emerald-500" : "text-slate-400"} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">App Lock</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {hasPin ? 'PIN Enabled' : 'Secure your app'}
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={hasPin ? "outline" : "default"} size="sm">
                      {hasPin ? "Change" : "Enable"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{hasPin ? "Manage App Lock" : "Set App PIN"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Enter 4-digit PIN</Label>
                        <Input 
                          type="password" 
                          maxLength={4} 
                          placeholder="0000" 
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                          className="text-center text-2xl tracking-widest"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        {hasPin && (
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              removePin();
                              setPinInput("");
                              toast.success("App Lock disabled");
                            }}
                          >
                            Disable
                          </Button>
                        )}
                        <Button 
                          onClick={() => {
                            if (pinInput.length === 4) {
                              setPin(pinInput);
                              setPinInput("");
                              toast.success(hasPin ? "PIN updated" : "App Lock enabled");
                            } else {
                              toast.error("PIN must be 4 digits");
                            }
                          }}
                        >
                          Save PIN
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock size={18} /> Security
              </h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">App Lock</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {hasPin ? "PIN is enabled" : "Secure your data with a PIN"}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={hasPin ? "outline" : "default"} size="sm">
                      {hasPin ? "Change" : "Enable"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{hasPin ? "Manage App Lock" : "Set App PIN"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Enter 4-digit PIN</Label>
                        <Input 
                          type="password" 
                          maxLength={4} 
                          placeholder="0000" 
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                          className="text-center text-2xl tracking-widest"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        {hasPin && (
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              removePin();
                              setPinInput("");
                            }}
                          >
                            Disable
                          </Button>
                        )}
                        <Button 
                          onClick={() => {
                            if (pinInput.length === 4) {
                              setPin(pinInput);
                              setPinInput("");
                            } else {
                              toast.error("PIN must be 4 digits");
                            }
                          }}
                        >
                          Save PIN
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Partner A Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <User size={18} /> Partner A
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="name-a" className="dark:text-slate-300">Name</Label>
                <Input
                  id="name-a"
                  value={profiles.A.name}
                  onChange={(e) => updateProfile("A", "name", e.target.value)}
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Avatar</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => updateProfile("A", "avatar", avatar)}
                      className={cn(
                        "relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0",
                        profiles.A.avatar === avatar ? "border-indigo-600 scale-110" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRefA.current?.click()}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0 transition-colors"
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

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Partner B Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-pink-600 dark:text-pink-400 flex items-center gap-2">
                <User size={18} /> Partner B
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="name-b" className="dark:text-slate-300">Name</Label>
                <Input
                  id="name-b"
                  value={profiles.B.name}
                  onChange={(e) => updateProfile("B", "name", e.target.value)}
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Avatar</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => updateProfile("B", "avatar", avatar)}
                      className={cn(
                        "relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0",
                        profiles.B.avatar === avatar ? "border-pink-600 scale-110" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRefB.current?.click()}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-pink-400 flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0 transition-colors"
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
        <DialogContent className="sm:max-w-[425px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl dark:text-white">Monthly Budgets</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Set monthly spending limits for each category.</p>
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`budget-${cat.value}`} className="col-span-2 flex items-center gap-2 dark:text-slate-300">
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
                    className="pl-7 h-9 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
        <DialogContent className="sm:max-w-[500px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl dark:text-white">Recurring Expenses</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Add/Edit Form */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <h3 className="font-medium text-slate-900 dark:text-white">
                {editingRecId ? "Edit Recurring Expense" : "Add New Recurring"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  placeholder="Description" 
                  value={recDescription}
                  onChange={(e) => setRecDescription(e.target.value)}
                  className="bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="pl-7 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  />
                </div>
                <Select value={recCategory} onValueChange={(v: Category) => setRecCategory(v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="dark:text-slate-200 dark:focus:bg-slate-700">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={recFrequency} onValueChange={(v: Frequency) => setRecFrequency(v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectItem value="Monthly" className="dark:text-slate-200 dark:focus:bg-slate-700">Monthly</SelectItem>
                    <SelectItem value="Weekly" className="dark:text-slate-200 dark:focus:bg-slate-700">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {editingRecId && (
                  <Button onClick={cancelEditingRecurring} variant="outline" className="flex-1 dark:border-slate-600 dark:text-slate-300">Cancel</Button>
                )}
                <Button onClick={addOrUpdateRecurringExpense} className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white">
                  {editingRecId ? "Update" : "Add Recurring"}
                </Button>
              </div>
            </div>

            {/* List Existing */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900 dark:text-white">Active Recurring</h3>
              {recurringExpenses.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No recurring expenses set up.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {recurringExpenses.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={rec.category} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{rec.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{rec.frequency} • ${rec.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditingRecurring(rec)} className="p-2 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteRecurring(rec.id)} className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400">
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
        <DialogContent className="sm:max-w-[400px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl dark:text-white">Upcoming Bills</DialogTitle>
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
              className="rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-slate-500 dark:text-slate-400">Next 30 Days</h4>
            {recurringExpenses
              .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
              .slice(0, 3)
              .map(rec => (
                <div key={rec.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="dark:text-slate-200">{rec.description}</span>
                  <span className="text-slate-500 dark:text-slate-400">{new Date(rec.nextDueDate).toLocaleDateString()}</span>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
