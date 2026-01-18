import { useState, useEffect } from "react";
import { toast } from "sonner";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";
type Frequency = "Monthly" | "Weekly";

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  category: Category;
  frequency: Frequency;
  nextDueDate: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: Partner;
  splitType: SplitType;
  customSplitA?: number;
  category: Category;
  date: string;
}

interface UseRecurringExpensesProps {
  recurringExpenses: RecurringExpense[];
  setRecurringExpenses: React.Dispatch<React.SetStateAction<RecurringExpense[]>>;
  onAddExpense: (expense: Expense) => void;
  currency: string;
}

export function useRecurringExpenses({
  recurringExpenses,
  setRecurringExpenses,
  onAddExpense,
  currency,
}: UseRecurringExpensesProps) {
  const [recDescription, setRecDescription] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFrequency, setRecFrequency] = useState<Frequency>("Monthly");
  const [recCategory, setRecCategory] = useState<Category>("Rent");
  const [editingRecId, setEditingRecId] = useState<string | null>(null);

  // Check for due recurring expenses
  useEffect(() => {
    const checkRecurring = () => {
      const now = new Date();
      let newExpenses: Expense[] = [];
      let updatedRecurring = [...recurringExpenses];
      let hasUpdates = false;

      updatedRecurring = updatedRecurring.map((rec) => {
        const dueDate = new Date(rec.nextDueDate);
        if (dueDate <= now) {
          hasUpdates = true;
          // Add expense
          const newExpense: Expense = {
            id: crypto.randomUUID(),
            description: rec.description,
            amount: rec.amount,
            paidBy: rec.paidBy,
            splitType: rec.splitType,
            category: rec.category,
            date: new Date().toISOString(),
          };
          newExpenses.push(newExpense);

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
        newExpenses.forEach((expense) => onAddExpense(expense));
        setRecurringExpenses(updatedRecurring);
        toast.success(`Added ${newExpenses.length} recurring expense(s)`);
      }
    };

    checkRecurring();
  }, [recurringExpenses, onAddExpense, setRecurringExpenses, currency]);

  const addOrUpdateRecurringExpense = () => {
    if (!recDescription || !recAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingRecId) {
      // Update existing
      setRecurringExpenses((prev) =>
        prev.map((rec) =>
          rec.id === editingRecId
            ? {
                ...rec,
                description: recDescription,
                amount: parseFloat(recAmount),
                category: recCategory,
                frequency: recFrequency,
              }
            : rec
        )
      );
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
      setRecurringExpenses((prev) => [...prev, newRec]);
      toast.success("Recurring expense set up");
    }

    resetForm();
  };

  const startEditing = (rec: RecurringExpense) => {
    setEditingRecId(rec.id);
    setRecDescription(rec.description);
    setRecAmount(rec.amount.toString());
    setRecCategory(rec.category);
    setRecFrequency(rec.frequency);
  };

  const cancelEditing = () => {
    setEditingRecId(null);
    resetForm();
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
    if (editingRecId === id) cancelEditing();
    toast.success("Recurring expense removed");
  };

  const resetForm = () => {
    setRecDescription("");
    setRecAmount("");
    setRecFrequency("Monthly");
    setRecCategory("Rent");
  };

  return {
    // Form state
    recDescription,
    setRecDescription,
    recAmount,
    setRecAmount,
    recFrequency,
    setRecFrequency,
    recCategory,
    setRecCategory,
    editingRecId,

    // Actions
    addOrUpdateRecurringExpense,
    startEditing,
    cancelEditing,
    deleteRecurring,
    resetForm,
  };
}
