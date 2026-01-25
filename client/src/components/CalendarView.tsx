import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

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

interface CalendarViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpenses: RecurringExpense[];
}

export function CalendarView({ open, onOpenChange, recurringExpenses }: CalendarViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
