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
import { cn } from "@/lib/utils";
import ProfileAvatar from "./ProfileAvatar";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";

interface UserProfile {
  name: string;
  avatar: string;
  income: number;
}

interface Profiles {
  A: UserProfile;
  B: UserProfile;
}

const CATEGORIES: { value: Category; label: string; icon: any }[] = [
  { value: "Groceries", label: "Groceries", icon: require("lucide-react").ShoppingBag },
  { value: "Rent", label: "Rent", icon: require("lucide-react").Home },
  { value: "Utilities", label: "Utilities", icon: require("lucide-react").Zap },
  { value: "Fun", label: "Fun", icon: require("lucide-react").Gamepad2 },
  { value: "Other", label: "Other", icon: require("lucide-react").Coffee },
];

interface ExpenseFormProps {
  description: string;
  setDescription: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  paidBy: Partner;
  setPaidBy: (value: Partner) => void;
  splitType: SplitType;
  setSplitType: (value: SplitType) => void;
  category: Category;
  setCategory: (value: Category) => void;
  customSplitA: number;
  setCustomSplitA: (value: number) => void;
  profiles: Profiles;
  currency: string;
  onSubmit: () => void;
  editingExpenseId: string | null;
}

export default function ExpenseForm({
  description,
  setDescription,
  amount,
  setAmount,
  paidBy,
  setPaidBy,
  splitType,
  setSplitType,
  category,
  setCategory,
  customSplitA,
  setCustomSplitA,
  profiles,
  currency,
  onSubmit,
  editingExpenseId,
}: ExpenseFormProps) {
  return (
    <Card className="border-0 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden dark:bg-slate-900">
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500" />
      <CardHeader>
        <CardTitle className="font-heading text-2xl text-slate-900 dark:text-white">
          {editingExpenseId ? "Edit Expense" : "Add New Expense"}
        </CardTitle>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {currency}
              </span>
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
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="dark:text-slate-200 dark:focus:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-slate-500 dark:text-slate-400" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="dark:text-slate-300">Who Paid?</Label>
          <Tabs value={paidBy} onValueChange={(v) => setPaidBy(v as Partner)} className="w-full">
            <TabsList className="w-full h-14 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <TabsTrigger
                value="A"
                className="w-1/2 h-full rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <ProfileAvatar
                    avatarUrl={profiles.A.avatar}
                    name={profiles.A.name}
                    size={24}
                    className="rounded-full object-cover"
                  />
                  {profiles.A.name}
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="B"
                className="w-1/2 h-full rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-sm transition-all dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <ProfileAvatar
                    avatarUrl={profiles.B.avatar}
                    name={profiles.B.name}
                    size={24}
                    className="rounded-full object-cover"
                  />
                  {profiles.B.name}
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="dark:text-slate-300">Split Method</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["50/50", "income", "custom"] as SplitType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSplitType(type)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all border px-1",
                  splitType === type
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {type === "custom" ? "Custom %" : type === "income" ? "By Income" : "50/50"}
              </button>
            ))}
          </div>
          {splitType === "income" && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
              Based on income:{" "}
              {Math.round((profiles.A.income / (profiles.A.income + profiles.B.income)) * 100)}% /{" "}
              {Math.round((profiles.B.income / (profiles.A.income + profiles.B.income)) * 100)}%
            </div>
          )}
          {splitType === "custom" && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {profiles.A.name}
                </span>
                <span className="font-medium text-pink-600 dark:text-pink-400">
                  {profiles.B.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={customSplitA}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setCustomSplitA(val);
                    }}
                    className="h-10 text-center pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                <div className="text-slate-400 font-medium text-sm">vs</div>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={100 - customSplitA}
                    disabled
                    className="h-10 text-center pr-6 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-indigo-500 transition-all duration-300"
                  style={{ width: `${customSplitA}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={onSubmit}
          className="w-full h-14 text-lg rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/20 mt-4"
        >
          {editingExpenseId ? "Update Expense" : "Add Expense"}
        </Button>
      </CardContent>
    </Card>
  );
}
