import { useState } from "react";
import { toast } from "sonner";

type Partner = "A" | "B";
type SplitType = "50/50" | "income" | "custom";
type Category = "Groceries" | "Rent" | "Utilities" | "Fun" | "Other";

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

interface UseExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (id: string, expense: Partial<Expense>) => void;
}

export function useExpenseForm({ onAddExpense, onUpdateExpense }: UseExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<Partner>("A");
  const [splitType, setSplitType] = useState<SplitType>(() => {
    return (localStorage.getItem("defaultSplitType") as SplitType) || "50/50";
  });
  const [category, setCategory] = useState<Category>("Groceries");
  const [customSplitA, setCustomSplitA] = useState<number>(() => {
    return parseInt(localStorage.getItem("defaultCustomSplitA") || "50");
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaidBy("A");
    setSplitType((localStorage.getItem("defaultSplitType") as SplitType) || "50/50");
    setCategory("Groceries");
    setCustomSplitA(parseInt(localStorage.getItem("defaultCustomSplitA") || "50"));
    setEditingExpenseId(null);
  };

  const openForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const startEditing = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setPaidBy(expense.paidBy);
    setSplitType(expense.splitType);
    if (expense.splitType === "custom" && expense.customSplitA !== undefined) {
      setCustomSplitA(expense.customSplitA);
    }
    setCategory(expense.category);
    setIsFormOpen(true);
  };

  const submitForm = () => {
    if (!description || !amount) {
      if (navigator.vibrate) navigator.vibrate(200);
      toast.error("Please fill in all fields");
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);

    if (editingExpenseId) {
      // Update existing expense
      onUpdateExpense(editingExpenseId, {
        description,
        amount: parseFloat(amount),
        paidBy,
        splitType,
        customSplitA: splitType === "custom" ? customSplitA : undefined,
        category,
      });
      toast.success("Expense updated successfully");
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount),
        paidBy,
        splitType,
        customSplitA: splitType === "custom" ? customSplitA : undefined,
        category,
        date: new Date().toISOString(),
      };
      onAddExpense(newExpense);
      toast.success("Expense added successfully");
    }

    closeForm();
  };

  return {
    // Form state
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
    editingExpenseId,
    isFormOpen,
    
    // Form actions
    openForm,
    closeForm,
    startEditing,
    submitForm,
    resetForm,
  };
}
