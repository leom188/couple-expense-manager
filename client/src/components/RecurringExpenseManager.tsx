import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2 } from "lucide-react";

type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Gas" | "Pet" | "Health" | "Other";
type Frequency = "Monthly" | "Weekly";
type SplitType = "50/50" | "income" | "custom";

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: "A" | "B";
  splitType: SplitType;
  category: Category;
  frequency: Frequency;
  nextDueDate: string;
}

interface RecurringExpenseManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpenses: RecurringExpense[];
  editingRecId: string | null;
  recDescription: string;
  setRecDescription: (value: string) => void;
  recAmount: string;
  setRecAmount: (value: string) => void;
  recCategory: Category;
  setRecCategory: (value: Category) => void;
  recFrequency: Frequency;
  setRecFrequency: (value: Frequency) => void;
  onAdd: () => void;
  onEdit: (rec: RecurringExpense) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  currency: string;
  categories: Array<{
    value: Category;
    label: string;
    icon: any;
    color: string;
  }>;
  CategoryIcon: React.ComponentType<{ category: Category }>;
}

export function RecurringExpenseManager({
  open,
  onOpenChange,
  recurringExpenses,
  editingRecId,
  recDescription,
  setRecDescription,
  recAmount,
  setRecAmount,
  recCategory,
  setRecCategory,
  recFrequency,
  setRecFrequency,
  onAdd,
  onEdit,
  onDelete,
  onCancelEdit,
  currency,
  categories,
  CategoryIcon,
}: RecurringExpenseManagerProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) onCancelEdit();
      }}
    >
      <DialogContent className="sm:max-w-[500px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl dark:text-white">
            Recurring Expenses
          </DialogTitle>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {currency}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="pl-7 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                />
              </div>
              <Select value={recCategory} onValueChange={(v: Category) => setRecCategory(v)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  {categories.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="dark:text-slate-200 dark:focus:bg-slate-700"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={recFrequency} onValueChange={(v: Frequency) => setRecFrequency(v)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  <SelectItem value="Monthly" className="dark:text-slate-200 dark:focus:bg-slate-700">
                    Monthly
                  </SelectItem>
                  <SelectItem value="Weekly" className="dark:text-slate-200 dark:focus:bg-slate-700">
                    Weekly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {editingRecId && (
                <Button
                  onClick={onCancelEdit}
                  variant="outline"
                  className="flex-1 dark:border-slate-600 dark:text-slate-300"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={onAdd}
                className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white"
              >
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
                {recurringExpenses.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={rec.category} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{rec.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {rec.frequency} • {currency}{rec.amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(rec)}
                        className="p-2 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(rec.id)}
                        className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                      >
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
  );
}
