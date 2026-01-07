import { useState, useEffect, useMemo } from "react";
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
  Settings,
  X,
  Search,
  Copy,
  UserPlus,
  LogOut,
  ShoppingBag,
  Home as HomeIcon,
  Zap,
  Gamepad2,
  Fuel,
  PawPrint,
  Heart,
  Coffee,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLocation } from "wouter";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { AvatarPicker } from "@/components/AvatarPicker";
import { parseAvatarUrl } from "@/components/DiceBearAvatar";
import { trpc } from "@/lib/trpc";

// --- Types ---
type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Gas" | "Pet" | "Health" | "Other";

// --- Constants ---
const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: "Groceries", label: "Groceries", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
  { value: "Rent", label: "Rent", icon: HomeIcon, color: "bg-blue-100 text-blue-600" },
  { value: "Utilities", label: "Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
  { value: "Fun", label: "Fun", icon: Gamepad2, color: "bg-pink-100 text-pink-600" },
  { value: "Gas", label: "Gas", icon: Fuel, color: "bg-orange-100 text-orange-600" },
  { value: "Pet", label: "Pet", icon: PawPrint, color: "bg-amber-100 text-amber-600" },
  { value: "Health", label: "Health", icon: Heart, color: "bg-red-100 text-red-600" },
  { value: "Other", label: "Other", icon: Coffee, color: "bg-gray-100 text-gray-600" },
];

const CategoryIcon = ({ category }: { category: Category }) => {
  const cat = CATEGORIES.find((c) => c.value === category) || CATEGORIES[7];
  const Icon = cat.icon;
  return (
    <div className={cn("p-2 rounded-xl", cat.color)}>
      <Icon size={18} />
    </div>
  );
};

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { currentWorkspaceId, workspaces, isLoading: workspaceLoading, refetchWorkspaces } = useWorkspace();
  const [, navigate] = useLocation();

  // Redirect to setup if no workspace
  useEffect(() => {
    if (!workspaceLoading && workspaces.length === 0 && isAuthenticated) {
      navigate("/setup");
    }
  }, [workspaceLoading, workspaces, isAuthenticated, navigate]);

  // Get workspace details
  const { data: workspaceDetails } = trpc.workspace.get.useQuery(
    { workspaceId: currentWorkspaceId! },
    { enabled: !!currentWorkspaceId }
  );

  // Get expenses
  const { data: expenses = [], refetch: refetchExpenses } = trpc.expense.list.useQuery(
    { workspaceId: currentWorkspaceId! },
    { enabled: !!currentWorkspaceId, refetchInterval: 5000 } // Poll every 5 seconds for real-time sync
  );

  // Mutations
  const createExpenseMutation = trpc.expense.create.useMutation({
    onSuccess: () => {
      refetchExpenses();
      toast.success("Expense added!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteExpenseMutation = trpc.expense.delete.useMutation({
    onSuccess: () => {
      refetchExpenses();
      toast.success("Expense deleted!");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMemberMutation = trpc.workspace.updateMember.useMutation({
    onSuccess: () => {
      refetchWorkspaces();
      toast.success("Profile updated!");
    },
    onError: (error) => toast.error(error.message),
  });

  const createInvitationMutation = trpc.workspace.createInvitation.useMutation({
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/accept-invite?code=${data.inviteCode}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invitation link copied to clipboard!");
    },
    onError: (error) => toast.error(error.message),
  });

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<Partner>("A");
  const [splitType, setSplitType] = useState<SplitType>("50/50");
  const [category, setCategory] = useState<Category>("Groceries");
  const [customSplitA, setCustomSplitA] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaidBy("A");
    setSplitType("50/50");
    setCategory("Groceries");
    setCustomSplitA(50);
  };

  const handleAddExpense = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill in all fields");
      return;
    }

    createExpenseMutation.mutate({
      workspaceId: currentWorkspaceId!,
      description,
      amount: parseFloat(amount),
      paidBy,
      splitType,
      customSplitA: splitType === "custom" ? customSplitA : undefined,
      category,
      date: new Date(),
    });
  };

  const handleDeleteExpense = (expenseId: number) => {
    deleteExpenseMutation.mutate({ expenseId });
  };

  const handleInvitePartner = () => {
    if (!currentWorkspaceId) return;
    createInvitationMutation.mutate({ workspaceId: currentWorkspaceId });
  };

  const handleUpdateProfile = (avatar: string) => {
    if (!currentWorkspaceId) return;
    updateMemberMutation.mutate({
      workspaceId: currentWorkspaceId,
      avatar,
    });
    setShowAvatarPicker(false);
  };

  // Calculate settlement
  const settlement = useMemo(() => {
    if (!workspaceDetails) return { owedTo: null, amount: 0 };

    const members = workspaceDetails.members;
    const partnerA = members.find((m) => m.partner === "A");
    const partnerB = members.find((m) => m.partner === "B");

    if (!partnerA || !partnerB) return { owedTo: null, amount: 0 };

    let balanceA = 0; // Positive means A is owed, negative means A owes

    expenses.forEach((expense) => {
      const expenseAmount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      let splitA = 0.5;

      if (expense.splitType === "income") {
        const incomeA = typeof partnerA.income === 'string' ? parseFloat(partnerA.income) : partnerA.income;
        const incomeB = typeof partnerB.income === 'string' ? parseFloat(partnerB.income) : partnerB.income;
        const totalIncome = incomeA + incomeB;
        splitA = totalIncome > 0 ? incomeA / totalIncome : 0.5;
      } else if (expense.splitType === "custom" && expense.customSplitA) {
        splitA = expense.customSplitA / 100;
      }

      const amountA = expenseAmount * splitA;
      const amountB = expenseAmount * (1 - splitA);

      if (expense.paidBy === "A") {
        balanceA += amountB; // A paid, so B owes A
      } else {
        balanceA -= amountA; // B paid, so A owes B
      }
    });

    if (Math.abs(balanceA) < 0.01) {
      return { owedTo: null, amount: 0 };
    }

    return {
      owedTo: balanceA > 0 ? "A" : "B",
      amount: Math.abs(balanceA),
    };
  }, [expenses, workspaceDetails]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  // Show loading state
  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching workspace details
  if (!workspaceDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const members = workspaceDetails.members;
  const myMembership = workspaceDetails.myMembership;
  const partnerA = members.find((m) => m.partner === "A");
  const partnerB = members.find((m) => m.partner === "B");
  const currency = workspaceDetails.currency;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
          {workspaceDetails.name}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={20} />
          </Button>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Settlement Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 uppercase tracking-wide">Settlement Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">
                {currency}{settlement.amount.toFixed(2)}
              </div>
              {settlement.owedTo ? (
                <p className="text-slate-600">
                  {settlement.owedTo === myMembership.partner ? "You are owed" : "You owe"} this amount
                </p>
              ) : (
                <p className="text-emerald-600 font-medium">All settled up!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No expenses found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => {
                    const payer = members.find((m) => m.partner === expense.paidBy);
                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
                      >
                        <CategoryIcon category={expense.category} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{expense.description}</p>
                          <p className="text-sm text-slate-500">
                            Paid by {payer?.displayName} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {currency}{(typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">{expense.splitType}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 size={16} className="text-slate-400 hover:text-red-500" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g. Weekly Groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Who Paid?</Label>
              <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="A">{partnerA?.displayName || "Partner A"}</TabsTrigger>
                  <TabsTrigger value="B">{partnerB?.displayName || "Partner B"}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label>Split Method</Label>
              <div className="flex gap-2">
                <Button
                  variant={splitType === "50/50" ? "default" : "outline"}
                  onClick={() => setSplitType("50/50")}
                  className="flex-1"
                >
                  50/50
                </Button>
                <Button
                  variant={splitType === "income" ? "default" : "outline"}
                  onClick={() => setSplitType("income")}
                  className="flex-1"
                >
                  By Income
                </Button>
                <Button
                  variant={splitType === "custom" ? "default" : "outline"}
                  onClick={() => setSplitType("custom")}
                  className="flex-1"
                >
                  Custom %
                </Button>
              </div>
            </div>

            {splitType === "custom" && (
              <div>
                <Label>Partner A Split %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={customSplitA}
                  onChange={(e) => setCustomSplitA(parseInt(e.target.value) || 0)}
                />
              </div>
            )}

            <Button
              onClick={handleAddExpense}
              disabled={createExpenseMutation.isPending}
              className="w-full"
            >
              {createExpenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <ProfileAvatar avatarUrl={myMembership.avatar} name={myMembership.displayName} size={80} />
              <Button variant="outline" onClick={() => setShowAvatarPicker(true)}>
                Change Avatar
              </Button>
              <p className="font-medium">{myMembership.displayName}</p>
            </div>

            {members.length < 2 && (
              <div className="border-t pt-4">
                <Button
                  onClick={handleInvitePartner}
                  disabled={createInvitationMutation.isPending}
                  className="w-full"
                >
                  {createInvitationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Partner
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Invitation link will be copied to clipboard
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Picker */}
      {showAvatarPicker && (
        <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose Your Avatar</DialogTitle>
            </DialogHeader>
            <AvatarPicker
              currentSeed={(() => {
                const parsed = parseAvatarUrl(myMembership.avatar);
                return parsed.isDiceBear && parsed.seed ? parsed.seed : myMembership.displayName;
              })()}
              currentStyle={(() => {
                const parsed = parseAvatarUrl(myMembership.avatar);
                return parsed.isDiceBear && parsed.style ? parsed.style : "adventurer";
              })()}
              onSelect={handleUpdateProfile}
              partnerName={myMembership.displayName}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
