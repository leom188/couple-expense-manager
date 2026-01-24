import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Gas" | "Pet" | "Health" | "Other";
type Budgets = Record<Category, number>;

interface BudgetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: Budgets;
  onUpdateBudget: (category: Category, value: string) => void;
  currency: string;
  categories: Array<{
    value: Category;
    label: string;
    icon: any;
    color: string;
  }>;
}

export function BudgetManager({
  open,
  onOpenChange,
  budgets,
  onUpdateBudget,
  currency,
  categories,
}: BudgetManagerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl dark:text-white">Monthly Budgets</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Set monthly spending limits for each category.
          </p>
          {categories.map((cat) => (
            <div key={cat.value} className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor={`budget-${cat.value}`}
                className="col-span-2 flex items-center gap-2 dark:text-slate-300"
              >
                <div className={cn("p-1.5 rounded-lg", cat.color)}>
                  <cat.icon size={14} />
                </div>
                {cat.label}
              </Label>
              <div className="col-span-2 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {currency}
                </span>
                <Input
                  id={`budget-${cat.value}`}
                  type="number"
                  value={budgets[cat.value] || ""}
                  onChange={(e) => onUpdateBudget(cat.value, e.target.value)}
                  className="pl-7 h-9 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
