import { useState, useEffect, useRef } from "react";
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
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Types ---
type Partner = "A" | "B";
type SplitType = "50/50" | "60/40" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";

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

interface UserProfile {
  name: string;
  avatar: string;
}

interface Profiles {
  A: UserProfile;
  B: UserProfile;
}

// --- Constants ---
const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: "Groceries", label: "Groceries", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
  { value: "Rent", label: "Rent", icon: HomeIcon, color: "bg-blue-100 text-blue-600" },
  { value: "Utilities", label: "Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
  { value: "Fun", label: "Fun", icon: Gamepad2, color: "bg-pink-100 text-pink-600" },
  { value: "Other", label: "Other", icon: Coffee, color: "bg-gray-100 text-gray-600" },
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

export default function Home() {
  // --- State ---
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [profiles, setProfiles] = useState<Profiles>(() => {
    const saved = localStorage.getItem("profiles");
    return saved ? JSON.parse(saved) : {
      A: { name: "Partner A", avatar: AVATARS[0] },
      B: { name: "Partner B", avatar: AVATARS[1] },
    };
  });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<Partner>("A");
  const [splitType, setSplitType] = useState<SplitType>("50/50");
  const [category, setCategory] = useState<Category>("Groceries");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("profiles", JSON.stringify(profiles));
  }, [profiles]);

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

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const updateProfile = (partner: Partner, field: keyof UserProfile, value: string) => {
    setProfiles(prev => ({
      ...prev,
      [partner]: { ...prev[partner], [field]: value }
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
          
          {/* --- Left Column: Expense List --- */}
          <div className="md:col-span-7 space-y-6">
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
    </div>
  );
}
